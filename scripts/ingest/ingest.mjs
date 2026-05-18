// Ingest SuttaCentral bilara-data → BGE-M3 dense embeddings → Postgres.
//
// Pipeline:
//   1. Clone (or pull) bilara-data into ./.cache/bilara-data
//   2. For every Pali source file under root/pli/ms/sutta/, find its matching
//      English translation under translation/en/sujato/sutta/.
//   3. Concatenate segments, build a passage record.
//   4. Embed with BGE-M3 (Xenova/bge-m3 quantized ONNX, runs locally on CPU).
//   5. UPSERT into Postgres passages table.
//
// Usage (from C:\Dev\Dhamma):
//   1. Get the database password — runs once, prints to your terminal:
//        flyctl ssh console --app dhamma -C "printenv DATABASE_URL"
//      Copy the result; the password is the bit between "dhamma:" and "@".
//   2. Open a local proxy to dhamma-pg in a separate terminal:
//        flyctl proxy 5432 --app dhamma-pg
//   3. Run with the local proxy URL (replace PASSWORD with the value from step 1):
//        cd scripts/ingest
//        npm install
//        DATABASE_URL="postgres://dhamma:PASSWORD@localhost:5432/dhamma" node ingest.mjs --only=mn10
//      (`--only=mn10` runs a single sutta as smoke test before the full Tipiṭaka)
//      Drop the flag to ingest everything: `node ingest.mjs`

import { pipeline, env } from '@xenova/transformers';
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');
const BILARA_DIR = path.join(CACHE_DIR, 'bilara-data');
const BILARA_REPO = 'https://github.com/suttacentral/bilara-data.git';
const MODEL = 'Xenova/bge-m3';

env.cacheDir = path.join(CACHE_DIR, 'models');
env.allowRemoteModels = true;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. See the comment block at the top of ingest.mjs.');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

async function ensureBilara() {
  if (fs.existsSync(BILARA_DIR)) {
    // Pull is best-effort — if the local clone is in a weird state (multiple
    // branches, conflicting refs from prior parallel runs, no network), we
    // proceed with the existing on-disk data rather than aborting the whole
    // ingest run. The data changes rarely; staleness here is acceptable.
    try {
      console.log('[bilara] pulling latest…');
      execSync('git pull --ff-only', { cwd: BILARA_DIR, stdio: 'inherit' });
    } catch (err) {
      console.log(`[bilara] pull failed (${err.message.split('\n')[0]}); continuing with on-disk data`);
    }
    return;
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log('[bilara] cloning bilara-data (~300MB)…');
  execSync(`git clone --depth 1 ${BILARA_REPO} "${BILARA_DIR}"`, { stdio: 'inherit' });
}

// Walks pli/ms/{sutta,vinaya,abhidhamma}/ and returns a flat list of source
// file paths. Default behaviour walks all three baskets; pass --basket=NAME
// to restrict. The function name is kept for backwards-compat with the
// existing callers.
function findPaliSuttas(filter) {
  const baskets = filter?.basket
    ? [filter.basket]
    : ['sutta', 'vinaya', 'abhidhamma'];
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (name.endsWith('_root-pli-ms.json')) out.push(full);
    }
  }
  for (const basket of baskets) {
    const root = path.join(BILARA_DIR, 'root', 'pli', 'ms', basket);
    if (!fs.existsSync(root)) continue;
    walk(root);
  }
  if (out.length === 0) {
    throw new Error(`No Pali source files found in baskets [${baskets.join(', ')}] under ${BILARA_DIR} — does the clone look right?`);
  }
  if (filter?.canon) {
    // Accept nested paths like "sutta/kn/tha-ap" or just "kn/tha-ap" or "ds"
    // (Abhidhamma Dhammasaṅgaṇī). Normalize separators so the same arg works
    // on Windows and Unix.
    const wanted = filter.canon.replace(/\\/g, '/');
    return out.filter((p) => p.replace(/\\/g, '/').includes(`/${wanted}/`));
  }
  if (filter?.only) {
    return out.filter((p) => p.endsWith(`${filter.only}_root-pli-ms.json`));
  }
  return out;
}

// Given a pli source path, return the corresponding English (sujato) path.
function translationPath(paliPath) {
  return paliPath
    .replace(/root[\\/]pli[\\/]ms/, 'translation/en/sujato'.replace(/\//g, path.sep))
    .replace(/_root-pli-ms\.json$/, '_translation-en-sujato.json');
}

function loadSegments(p) {
  if (!fs.existsSync(p)) return null;
  const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Object.values(obj).join(' ').replace(/\s+/g, ' ').trim();
}

// Derive a stable id like "mn10" / "dn22" / "an1.1" / "tha-ap100" from the
// bilara filename. The `[a-z-]+` before the digit allows hyphenated canon
// prefixes (e.g. tha-ap, thi-ap for the Apadāna texts in Khuddaka Nikāya).
function parseId(filename) {
  const m = filename.match(/^([a-z][a-z-]*\d[\w\d.-]*)_root-pli-ms\.json$/);
  return m ? m[1] : null;
}

function deriveCanon(id) {
  const m = id.match(/^([a-z]+)/);
  return m ? m[1] : 'unknown';
}

function pgVectorLiteral(vec) {
  return `[${Array.from(vec).join(',')}]`;
}

async function ensureWorks() {
  // Minimal hierarchy for now. The Browse view's CORPUS tree gives a richer
  // structure; this writes just enough to satisfy the FK on passages.
  await sql`
    INSERT INTO traditions (slug, name, subtitle, display_order)
    VALUES
      ('theravada', 'Theravāda', 'Pali transmission', 1)
    ON CONFLICT (slug) DO NOTHING
  `;
  for (const [slug, name, parent] of [
    ['pli-tipitaka',   'Tipiṭaka',       null],
    ['pli-vinaya',     'Vinaya Piṭaka',  'pli-tipitaka'],
    ['pli-sutta',      'Sutta Piṭaka',   'pli-tipitaka'],
    ['pli-abhidhamma', 'Abhidhamma Piṭaka', 'pli-tipitaka'],
    ['pli-dn',         'Dīgha Nikāya',   'pli-sutta'],
    ['pli-mn',         'Majjhima Nikāya','pli-sutta'],
    ['pli-sn',         'Saṃyutta Nikāya','pli-sutta'],
    ['pli-an',         'Aṅguttara Nikāya','pli-sutta'],
    ['pli-kn',         'Khuddaka Nikāya','pli-sutta'],
  ]) {
    await sql`
      INSERT INTO works (slug, tradition_slug, parent_slug, name)
      VALUES (${slug}, 'theravada', ${parent}, ${name})
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}

function workSlugForCanon(canon) {
  const map = { dn: 'pli-dn', mn: 'pli-mn', sn: 'pli-sn', an: 'pli-an' };
  if (map[canon]) return map[canon];
  // Khuddaka (snp, dhp, ud, iti, …) all bucket under kn for now.
  return 'pli-kn';
}

// Path-based work-slug derivation. Robust across sutta sub-nikāyas, Vinaya,
// and Abhidhamma — doesn't rely on the canon prefix in the filename (which
// for Vinaya is just "pli" and tells us nothing about the sub-work).
function deriveWorkSlug(filePath) {
  const p = filePath.replace(/\\/g, '/');
  if (p.includes('/sutta/dn/')) return 'pli-dn';
  if (p.includes('/sutta/mn/')) return 'pli-mn';
  if (p.includes('/sutta/sn/')) return 'pli-sn';
  if (p.includes('/sutta/an/')) return 'pli-an';
  if (p.includes('/sutta/'))    return 'pli-kn';      // Khuddaka catchall
  if (p.includes('/vinaya/'))   return 'pli-vinaya';
  if (p.includes('/abhidhamma/')) return 'pli-abhidhamma';
  return 'pli-kn';  // safest fallback
}

async function main() {
  await ensureBilara();
  await ensureWorks();

  console.log(`[model] loading ${MODEL} (downloads on first run, cached locally)…`);
  const embedder = await pipeline('feature-extraction', MODEL, { quantized: true });
  console.log('[model] ready.');

  const filter = {};
  if (args.canon)  filter.canon  = args.canon;
  if (args.only)   filter.only   = args.only;
  if (args.basket) filter.basket = args.basket;

  const paliPaths = findPaliSuttas(filter);
  if (paliPaths.length === 0) {
    console.error('No suttas matched filter:', filter);
    process.exit(1);
  }
  console.log(`[ingest] ${paliPaths.length} sutta(s) to process`);

  let done = 0;
  let skipped = 0;
  const t0 = Date.now();

  for (const paliPath of paliPaths) {
    const base = path.basename(paliPath);
    const id = parseId(base);
    if (!id) { skipped++; continue; }
    const canon = deriveCanon(id);
    const workSlug = deriveWorkSlug(paliPath);
    const enPath = translationPath(paliPath);
    const original = loadSegments(paliPath);
    const translation = loadSegments(enPath);
    if (!original) { skipped++; continue; }

    const text = `${original}\n\n${translation || ''}`.slice(0, 8000);
    const out = await embedder(text, { pooling: 'mean', normalize: true });
    const vec = pgVectorLiteral(out.data);

    const citation = id.toUpperCase().replace(/^([A-Z]+)(\d)/, '$1 $2');
    await sql`
      INSERT INTO passages (id, work_slug, position, citation, title, canon, original_lang, original, translation, embedding)
      VALUES (${id}, ${workSlug}, NULL, ${citation}, NULL, 'Pali', 'pli', ${original}, ${translation || null}, ${vec})
      ON CONFLICT (id) DO UPDATE SET
        original = EXCLUDED.original,
        translation = EXCLUDED.translation,
        embedding = EXCLUDED.embedding
    `;

    done++;
    if (done % 20 === 0 || done === paliPaths.length) {
      const rate = (done / ((Date.now() - t0) / 1000)).toFixed(2);
      const eta = paliPaths.length > done
        ? `, ETA ${Math.round((paliPaths.length - done) / rate)}s`
        : '';
      console.log(`  ${done}/${paliPaths.length}  (${rate}/s${eta})`);
    }
  }

  const total = Math.round((Date.now() - t0) / 1000);
  console.log(`[done] ingested ${done}, skipped ${skipped}, ${total}s wall`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
