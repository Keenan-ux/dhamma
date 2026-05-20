// Ingest Access to Insight sutta translations into the translations
// table. Reads from the ATI offline edition at
// C:\Users\isaac\OneDrive\Desktop\pokemon\accesstoinsight\ati\.
//
// Coverage: DN, MN, SN, AN handled per-sutta cleanly. KN sub-collections
// (Dhammapada chapters, Itivuttaka ranges, Khuddakapāṭha ranges, etc.)
// are handled per-collection with best-effort rules; files that don't
// map cleanly land in unmapped.log for follow-up.
//
// License: CC BY-NC 4.0 (per ATI's site-wide policy). Each row carries
// translator, copyright (extracted from the file's F_sourceCopy div),
// license URL, and the canonical ATI source URL — required attribution
// rendered in the UI.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-ati.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ATI_ROOT = process.env.ATI_ROOT
  || 'C:/Users/isaac/OneDrive/Desktop/pokemon/accesstoinsight/ati';
const TIPITAKA = path.join(ATI_ROOT, 'tipitaka');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set'); process.exit(1);
}
if (!fs.existsSync(TIPITAKA)) {
  console.error(`missing ${TIPITAKA}`); process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

// ─────────────────────────── translator slugs ───────────────────────────

// ATI's 4-letter slugs → readable names. Source: lib/authors/ directory
// + the translators.html page. A few obscure slugs may slip through —
// they're logged and skipped rather than guessed at.
const TRANSLATOR_MAP = {
  than: 'thanissaro',
  wlsh: 'walshe',
  irel: 'ireland',
  olen: 'olendzki',
  budd: 'buddharakkhita',
  nypo: 'nyanaponika',
  nymo: 'nanamoli',
  piya: 'piyadassi',
  bodh: 'bodhi',
  nara: 'narada',
  soma: 'soma',
  nysa: 'nyanasatta',
  bpit: 'sister-uppalavanna',  // "Burma Pitaka" — by Sister Uppalavanna
  ntbb: 'nanamoli-bodhi',      // Ñāṇamoli & Bodhi joint translation
  horn: 'horner',
  hare: 'hare',
  amar: 'amaravati-sangha',
  niza: 'nizamis',
  hekh: 'hecker',
  vaji: 'vajira',
  kell: 'kelly',
  harv: 'harvey',
  soni: 'sonadhammo',
  ksw0: 'kandy',               // Kandy News-Wheel
};

const TRANSLATOR_DISPLAY = {
  thanissaro: 'Thanissaro Bhikkhu',
  walshe: 'Maurice Walshe',
  ireland: 'John D. Ireland',
  olendzki: 'Andrew Olendzki',
  buddharakkhita: 'Acharya Buddharakkhita',
  nyanaponika: 'Nyanaponika Thera',
  nanamoli: 'Ñāṇamoli Thera',
  piyadassi: 'Piyadassi Thera',
  bodhi: 'Bhikkhu Bodhi',
  narada: 'Nārada Thera',
  soma: 'Soma Thera',
  nyanasatta: 'Nyanasatta Thera',
  'sister-uppalavanna': 'Sister Uppalavanna',
  'nanamoli-bodhi': 'Ñāṇamoli & Bodhi',
  horner: 'I. B. Horner',
  hare: 'E. M. Hare',
  'amaravati-sangha': 'Amaravati Sangha',
  nizamis: 'Nizamis',
  hecker: 'Hellmuth Hecker',
  vajira: 'Sister Vajira',
  kelly: 'John Kelly',
  harvey: 'Peter Harvey',
  sonadhammo: 'Sonadhammo',
  kandy: 'Kandy News-Wheel',
};

// ─────────────────────────── ID mapping ───────────────────────────

// Given an ATI file's relative path inside tipitaka/, return either
// { passageId, translator, excerpt, notes } or null if no clean mapping.
function mapAtiPath(relPath) {
  // Normalize Windows paths
  const p = relPath.replace(/\\/g, '/');
  const parts = p.split('/');
  const file = parts.pop();
  const dir = parts[0]; // 'dn' | 'mn' | 'sn' | 'an' | 'kn' | ...

  // The translator slug is always the second-to-last token in the
  // dot-separated filename: e.g. "mn.010.than.html" → "than".
  const m = file.match(/^(.+)\.([a-z][a-z0-9]{3})\.html$/);
  if (!m) return null;
  const stem = m[1];
  const slug = m[2];
  const translator = TRANSLATOR_MAP[slug];
  if (!translator) return { unknownTranslator: slug, stem, file };

  // Excerpt marker — "x" suffix on the sutta number
  // (e.g. mn.021x.than.html for MN 21 excerpt)
  let excerpt = false;
  let core = stem;
  if (/x$/.test(stem)) {
    excerpt = true;
    core = stem.replace(/x$/, '');
  }

  // DN: "dn.NN" or "dn.NN.S" (segment) — segment 0 = whole sutta;
  // ranges like "dn.16.5-6" are partial coverage.
  if (dir === 'dn') {
    let mm = core.match(/^dn\.(\d+)\.(\d+(?:-\d+)?)$/);
    if (mm) {
      const sutta = parseInt(mm[1], 10);
      const seg = mm[2];
      const passageId = `dn${sutta}`;
      const notes = seg === '0' ? null : `ATI segment ${seg} of dn${sutta}`;
      return { passageId, translator, excerpt, notes };
    }
    mm = core.match(/^dn\.(\d+)$/);
    if (mm) return { passageId: `dn${parseInt(mm[1], 10)}`, translator, excerpt, notes: null };
    return null;
  }

  // MN: "mn.NNN" — flat. Some have segments like "mn.NN.0"
  // (we treat segment 0 as whole-sutta same as DN).
  if (dir === 'mn') {
    let mm = core.match(/^mn\.(\d+)\.(\d+(?:-\d+)?)$/);
    if (mm) {
      const sutta = parseInt(mm[1], 10);
      const seg = mm[2];
      const passageId = `mn${sutta}`;
      const notes = seg === '0' ? null : `ATI segment ${seg} of mn${sutta}`;
      return { passageId, translator, excerpt, notes };
    }
    mm = core.match(/^mn\.(\d+)$/);
    if (mm) return { passageId: `mn${parseInt(mm[1], 10)}`, translator, excerpt, notes: null };
    return null;
  }

  // SN: nested folder sn{XX}/snXX.YYY → our snX.Y. Strip leading zeros.
  if (dir === 'sn') {
    const mm = core.match(/^sn(\d+)\.(\d+)$/);
    if (mm) {
      const sec = parseInt(mm[1], 10);
      const sutta = parseInt(mm[2], 10);
      return { passageId: `sn${sec}.${sutta}`, translator, excerpt, notes: null };
    }
    return null;
  }

  // AN: nested folder an{XX}/anXX.YYY → our anX.Y. Strip leading zeros.
  if (dir === 'an') {
    const mm = core.match(/^an(\d+)\.(\d+)$/);
    if (mm) {
      const nip = parseInt(mm[1], 10);
      const sutta = parseInt(mm[2], 10);
      return { passageId: `an${nip}.${sutta}`, translator, excerpt, notes: null };
    }
    return null;
  }

  // KN sub-collections: per-collection rules.
  if (dir === 'kn') {
    const sub = parts[1];

    // Sutta Nipāta: "snp.S.NN" → snpS.N
    if (sub === 'snp') {
      const mm = core.match(/^snp\.(\d+)\.(\d+)$/);
      if (mm) {
        return { passageId: `snp${parseInt(mm[1], 10)}.${parseInt(mm[2], 10)}`, translator, excerpt, notes: null };
      }
    }
    // Udāna: "ud.N.NN" → udN.N
    if (sub === 'ud') {
      const mm = core.match(/^ud\.(\d+)\.(\d+)$/);
      if (mm) {
        return { passageId: `ud${parseInt(mm[1], 10)}.${parseInt(mm[2], 10)}`, translator, excerpt, notes: null };
      }
    }
    // Itivuttaka: "iti.N.NNN-NNN" → range, map to FIRST entry with note;
    //             "iti.NNN" → itiN
    if (sub === 'iti') {
      let mm = core.match(/^iti\.(\d+)\.(\d+)-(\d+)$/);
      if (mm) {
        const start = parseInt(mm[2], 10);
        const end = parseInt(mm[3], 10);
        return { passageId: `iti${start}`, translator, excerpt,
                 notes: `ATI range — covers iti${start}-iti${end}` };
      }
      mm = core.match(/^iti\.(\d+)$/);
      if (mm) return { passageId: `iti${parseInt(mm[1], 10)}`, translator, excerpt, notes: null };
    }
    // Dhammapada: chapters 1-26 → our verse-range IDs. Hand mapping.
    if (sub === 'dhp') {
      const mm = core.match(/^dhp\.(\d+)$/);
      if (mm) {
        const ch = parseInt(mm[1], 10);
        const dhpRange = DHP_CHAPTER_TO_RANGE[ch];
        if (dhpRange) return { passageId: dhpRange, translator, excerpt,
                                notes: `ATI chapter ${ch}` };
      }
    }
    // Theragāthā / Therīgāthā: "thag.NN.NN" → thagNN.N
    if (sub === 'thag' || sub === 'thig') {
      const mm = core.match(new RegExp(`^${sub}\\.(\\d+)\\.(\\d+)$`));
      if (mm) {
        return { passageId: `${sub}${parseInt(mm[1], 10)}.${parseInt(mm[2], 10)}`, translator, excerpt, notes: null };
      }
    }
    // Vimānavatthu / Petavatthu: "vv.NN.NN" / "pv.NN.NN" → vv/pv id
    if (sub === 'vv' || sub === 'pv') {
      const mm = core.match(new RegExp(`^${sub}\\.(\\d+)\\.(\\d+)$`));
      if (mm) {
        return { passageId: `${sub}${parseInt(mm[1], 10)}.${parseInt(mm[2], 10)}`, translator, excerpt, notes: null };
      }
    }
    // Khuddakapāṭha and others left as best-effort skip for now.
  }

  return null;
}

// Dhammapada chapter (1-26) → SC verse-range id we store. Hand-curated
// from the standard PTS chapter boundaries. Falls through if user's
// DB has a different chunking; in that case the dhp ingest is a no-op
// for unmapped chapters.
const DHP_CHAPTER_TO_RANGE = {
  1: 'dhp1-20',     2: 'dhp21-32',   3: 'dhp33-43',   4: 'dhp44-59',
  5: 'dhp60-75',    6: 'dhp76-89',   7: 'dhp90-99',   8: 'dhp100-115',
  9: 'dhp116-128', 10: 'dhp129-145',11: 'dhp146-156',12: 'dhp157-166',
 13: 'dhp167-178',14: 'dhp179-196', 15: 'dhp197-208',16: 'dhp209-220',
 17: 'dhp221-234',18: 'dhp235-255', 19: 'dhp256-272',20: 'dhp273-289',
 21: 'dhp290-305',22: 'dhp306-319', 23: 'dhp320-333',24: 'dhp334-359',
 25: 'dhp360-382',26: 'dhp383-423',
};

// ─────────────────────────── HTML extraction ───────────────────────────

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

// Pull the protected text chunk between the markers.
function extractTextChunk(html) {
  const start = html.indexOf("<div id='COPYRIGHTED_TEXT_CHUNK'>");
  if (start < 0) return null;
  // The closing marker is a div close with the matching comment
  const endMarker = "<!-- #COPYRIGHTED_TEXT_CHUNK (END OF COPYRIGHTED TEXT CHUNK) -->";
  const endIdx = html.indexOf(endMarker, start);
  if (endIdx < 0) return null;
  // Find the </div> immediately before endMarker
  const closingDiv = html.lastIndexOf("</div>", endIdx);
  return html.slice(start + "<div id='COPYRIGHTED_TEXT_CHUNK'>".length, closingDiv).trim();
}

// Pull the F_sourceCopy block ("&copy;1995 Thanissaro Bhikkhu.")
function extractCopyright(html) {
  const m = html.match(/<div id="F_sourceCopy">([\s\S]*?)<\/div>/);
  if (!m) return null;
  // Strip HTML tags, decode &copy;
  return m[1].replace(/<[^>]+>/g, '').replace(/&copy;/g, '©').trim() || null;
}

// Pull the canonical accesstoinsight.org URL from the citation block.
function extractSourceUrl(html) {
  const m = html.match(/href='(https?:\/\/www\.accesstoinsight\.org[^']+)'/);
  return m ? m[1] : null;
}

// Strip ATI's HTML down to sanitized inline-formatting content. We
// keep <p>, <br>, <b>, <i>, <em>, <strong>, <sup>, <sub>, <h4>, <hr>
// because they carry meaningful reading structure; we unwrap <a>,
// <span>, <div> because their attributes are layout/anchor noise; we
// strip <script>, <style>, and HTML comments outright. The frontend's
// sanitizeDictHtml re-validates the allowlist at render time.
const ALLOWED_TAGS = new Set(['p', 'br', 'b', 'i', 'em', 'strong', 'sup', 'sub', 'h4', 'hr', 'blockquote', 'ol', 'ul', 'li']);

function cleanText(html) {
  return String(html)
    // strip HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // strip script/style block content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Allowlist-based tag handling. For unrecognised tags we DROP the
    // tag but keep the inner text. We don't need a real DOM walk since
    // ATI's HTML is hand-authored and well-formed.
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (full, tag) => {
      tag = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      // Allowed tag: re-emit without attributes (anchors lose their id,
      // p loses its class, etc.). Self-closing for br/hr.
      const isOpen = !full.startsWith('</');
      if (!isOpen) return `</${tag}>`;
      if (tag === 'br' || tag === 'hr') return `<${tag} />`;
      return `<${tag}>`;
    })
    // Normalise the HTML entities ATI files use heavily
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    // collapse runs of whitespace but PRESERVE paragraph structure
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// ─────────────────────────── walk + ingest ───────────────────────────

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
}

const files = [];
walk(TIPITAKA, files);
console.log(`[ati] walked ${files.length} html files under ${TIPITAKA}`);

const t0 = Date.now();
let inserted = 0;
let unknownTr = 0;
let unmapped = 0;
let missingPassage = 0;
let missingChunk = 0;
const unmappedLog = [];

const BATCH = 100;
let batch = [];

async function flush() {
  if (batch.length === 0) return;
  await sql`
    INSERT INTO translations
      (passage_id, language, translator, source, text, copyright, license, source_url, notes, position)
    VALUES ${sql(batch.map((r) => [
      r.passage_id, 'en', r.translator, 'ati', r.text,
      r.copyright, 'cc-by-nc-4.0', r.source_url, r.notes, r.position,
    ]))}
    ON CONFLICT (passage_id, translator, source) DO UPDATE SET
      text       = EXCLUDED.text,
      copyright  = EXCLUDED.copyright,
      license    = EXCLUDED.license,
      source_url = EXCLUDED.source_url,
      notes      = EXCLUDED.notes,
      position   = EXCLUDED.position
  `;
  inserted += batch.length;
  batch = [];
}

// Pre-fetch the set of passage IDs in our DB to validate mappings
const existing = new Set(
  (await sql`SELECT id FROM passages`).map((r) => r.id)
);
console.log(`[ati] ${existing.size} passages in DB`);

for (const full of files) {
  // Skip the index pages and helper files (not translations)
  const base = path.basename(full).toLowerCase();
  if (base === 'index.html' || base.includes('index') || base === 'sutta.html'
      || base === 'translators.html' || base.endsWith('_index.html')) continue;

  const rel = path.relative(TIPITAKA, full);
  const mapped = mapAtiPath(rel);
  if (!mapped) { unmapped++; unmappedLog.push(rel); continue; }
  if (mapped.unknownTranslator) {
    unknownTr++;
    unmappedLog.push(`${rel}  [unknown translator slug "${mapped.unknownTranslator}"]`);
    continue;
  }
  if (!existing.has(mapped.passageId)) {
    missingPassage++;
    unmappedLog.push(`${rel}  [no passage "${mapped.passageId}" in DB]`);
    continue;
  }

  const html = readFile(full);
  const chunk = extractTextChunk(html);
  if (!chunk) {
    missingChunk++;
    unmappedLog.push(`${rel}  [no COPYRIGHTED_TEXT_CHUNK]`);
    continue;
  }

  const text = cleanText(chunk);
  if (text.length < 40) {
    unmappedLog.push(`${rel}  [chunk too short: ${text.length} chars]`);
    continue;
  }

  const copyright = extractCopyright(html);
  const source_url = extractSourceUrl(html)
    || `https://www.accesstoinsight.org/${rel.replace(/\\/g, '/')}`;
  const notes = [
    mapped.excerpt ? 'excerpt' : null,
    mapped.notes || null,
  ].filter(Boolean).join('; ') || null;

  batch.push({
    passage_id: mapped.passageId,
    translator: mapped.translator,
    text,
    copyright,
    source_url,
    notes,
    position: positionFor(mapped.translator),
  });

  if (batch.length >= BATCH) {
    await flush();
    process.stdout.write(`  inserted ${inserted}\r`);
  }
}
await flush();

// Curated ordering: Sujato → Thanissaro → Walshe → Bodhi → others.
function positionFor(translator) {
  return ({
    sujato: 0, thanissaro: 10, walshe: 20, bodhi: 25,
    nanamoli: 30, 'nanamoli-bodhi': 35, nyanaponika: 40,
    ireland: 50, soma: 60, piyadassi: 70, narada: 80,
    olendzki: 90, buddharakkhita: 95,
  }[translator] ?? 100);
}

// Persist unmapped report
const logPath = path.join(__dirname, 'ati-unmapped.log');
fs.writeFileSync(logPath, unmappedLog.join('\n') + '\n', 'utf8');

const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM translations`;
const [{ atiCount }] = await sql`SELECT COUNT(*)::int AS "atiCount" FROM translations WHERE source = 'ati'`;
console.log(`\n[ati] done in ${Math.round((Date.now() - t0)/1000)}s`);
console.log(`  inserted/updated:     ${inserted}`);
console.log(`  unknown translator:   ${unknownTr}`);
console.log(`  unmapped file shape:  ${unmapped}`);
console.log(`  passage not in DB:    ${missingPassage}`);
console.log(`  missing chunk:        ${missingChunk}`);
console.log(`  ati rows in DB:       ${atiCount}`);
console.log(`  total translations:   ${total}`);
console.log(`  unmapped log:         ${logPath}`);

await sql.end();
