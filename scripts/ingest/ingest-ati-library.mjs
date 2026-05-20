// Ingest the non-sutta sections of the Access to Insight offline edition
// into the `articles` table.
//
// Source: C:\Users\isaac\OneDrive\Desktop\pokemon\accesstoinsight\ati\
// (CC BY-NC 4.0)
//
// Categories ingested:
//   lib/study/  → 'study-guide'
//   lib/authors/ → 'author-essay'
//   lib/thai/    → 'thai'
//   ptf/         → 'ptf'
//   noncanon/    → 'noncanon'
//   glossary.html → 'glossary'
//
// Each ATI HTML file starts with a [KEY]={value} metadata block as HTML
// comments. We extract AUTHOR, MY_TITLE, ATI_YEAR, LICENSE, then the
// content between <div id='COPYRIGHTED_TEXT_CHUNK'>...</div>. Body is
// HTML-sanitized to an allowlist (p, br, h2-6, b, i, em, strong, ul, ol,
// li, blockquote, a) before storage.
//
// Usage (with flyctl proxy 15432 → dhamma-pg):
//   cd scripts/ingest
//   DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
//     node ingest-ati-library.mjs

import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

const ATI_ROOT = 'C:/Users/isaac/OneDrive/Desktop/pokemon/accesstoinsight/ati';
const ATI_URL_BASE = 'https://accesstoinsight.org';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.');
  process.exit(1);
}

// Sources to walk. Each entry: { dir, category }.
const SOURCES = [
  { dir: 'lib/study',    category: 'study-guide' },
  { dir: 'lib/authors',  category: 'author-essay' },
  { dir: 'lib/thai',     category: 'thai' },
  { dir: 'ptf',          category: 'ptf' },
  { dir: 'noncanon',     category: 'noncanon' },
];

// Standalone files.
const STANDALONE = [
  { file: 'glossary.html',         category: 'glossary' },
  { file: 'index-similes.html',    category: 'index' },
  { file: 'index-names.html',      category: 'index' },
  { file: 'index-subject.html',    category: 'index' },
  { file: 'index-title.html',      category: 'index' },
  { file: 'index-number.html',     category: 'index' },
  { file: 'index-author.html',     category: 'index' },
  { file: 'index-sutta.html',      category: 'index' },
];

// Files to skip — non-content boilerplate.
const SKIP_NAMES = new Set([
  'index.html',          // directory landing pages — usually nav, not content
  '404.html',
  'faq.html',
  'help.html',
  'history.html',
  'devices.html',
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.html') && !SKIP_NAMES.has(name)) out.push(full);
  }
  return out;
}

// Pull a single [KEY]={value} pair out of the ATI metadata block.
function metaValue(html, key) {
  const re = new RegExp(`\\[${key}\\]=\\{([^}]*)\\}`);
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

// Pull the title from <title>...</title> as a fallback when MY_TITLE
// isn't set.
function htmlTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

// Crude HTML sanitizer — allowlist approach. Strips <script>, <style>,
// <link>, <img class="ad">, all `on*` attributes, all inline styles.
// Leaves the structural / typographic tags scholars expect (p, em, etc).
function sanitizeHtml(html) {
  let s = html;
  // Drop entire script/style blocks
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Drop HTML comments (often metadata noise inside the content chunk)
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // Strip onfoo attributes + javascript: URLs
  s = s.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/javascript\s*:/gi, '');
  // Strip inline style attributes — typography belongs to our own CSS
  s = s.replace(/\s+style\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/\s+style\s*=\s*'[^']*'/gi, '');
  // Remove tags we don't want at all — link, img (mostly icons), nav, etc
  s = s.replace(/<\/?(link|meta|img|nav|footer|header|aside|form|input|button|iframe|object|embed)\b[^>]*>/gi, '');
  // Collapse runs of whitespace
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// Extract the inner body content from the ATI COPYRIGHTED_TEXT_CHUNK
// wrapper. Falls back to the document <body> when the wrapper isn't
// present (rare).
function extractBody(html) {
  const m = html.match(/<div\s+id=['"]?COPYRIGHTED_TEXT_CHUNK['"]?>([\s\S]*?)<\/div>\s*<!--\s*#COPYRIGHTED_TEXT_CHUNK/i);
  if (m) return m[1];
  const bm = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bm ? bm[1] : '';
}

// Derive a slug from the file path relative to the ATI root.
// "lib/study/truths.html"     → "ati-study-truths"
// "lib/authors/bodhi/access_to_insight.html" → "ati-authors-bodhi-access_to_insight"
function deriveSlug(relPath, category) {
  const noExt = relPath.replace(/\.html$/i, '').replace(/\\/g, '/');
  const parts = noExt.split('/').filter(Boolean);
  return ['ati', ...parts].join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function deriveAuthor(filePath, metaAuthor) {
  if (metaAuthor) return metaAuthor;
  // Author pages live in lib/authors/<slug>/*.html — the slug is the author key
  const m = filePath.replace(/\\/g, '/').match(/lib\/authors\/([^/]+)\//);
  if (m) return m[1].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return null;
}

function deriveSourceUrl(filePath) {
  const rel = path.relative(ATI_ROOT, filePath).replace(/\\/g, '/');
  return `${ATI_URL_BASE}/${rel}`;
}

async function main() {
  const filesByCategory = new Map();
  for (const { dir, category } of SOURCES) {
    const full = path.join(ATI_ROOT, dir);
    if (!fs.existsSync(full)) {
      console.warn(`Skip ${dir} (missing)`);
      continue;
    }
    const found = walk(full);
    filesByCategory.set(category, found);
    console.log(`${category}: ${found.length} files`);
  }
  for (const { file, category } of STANDALONE) {
    const full = path.join(ATI_ROOT, file);
    if (fs.existsSync(full)) {
      filesByCategory.set(category, [full]);
      console.log(`${category}: 1 file`);
    }
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: false });

  // Wipe + repopulate. Same idempotency as parallels — table mirrors
  // the source files exactly.
  await sql`DELETE FROM articles WHERE source = 'ati'`;
  console.log('Cleared existing ATI articles');

  let inserted = 0;
  let skipped = 0;
  const records = [];

  for (const [category, files] of filesByCategory.entries()) {
    for (const filePath of files) {
      const html = fs.readFileSync(filePath, 'utf8');

      const myTitle  = metaValue(html, 'MY_TITLE');
      const author   = metaValue(html, 'AUTHOR');
      const yearStr  = metaValue(html, 'ATI_YEAR');
      const license  = metaValue(html, 'LICENSE') || 'CC-BY-NC';

      const title = myTitle || htmlTitle(html);
      if (!title) { skipped++; continue; }

      const bodyRaw = extractBody(html);
      if (!bodyRaw || bodyRaw.length < 200) { skipped++; continue; }
      const body = sanitizeHtml(bodyRaw);

      const relPath = path.relative(ATI_ROOT, filePath).replace(/\\/g, '/');
      const slug = deriveSlug(relPath, category);
      const finalAuthor = deriveAuthor(filePath, author);
      const year = parseInt(yearStr, 10) || null;

      records.push({
        slug,
        title,
        author: finalAuthor,
        category,
        source: 'ati',
        source_url: deriveSourceUrl(filePath),
        body,
        copyright: yearStr ? `© ${yearStr} ${finalAuthor || 'Access to Insight'}` : null,
        license: 'cc-by-nc-4.0',
        year,
        summary: null,
        tags: null,
      });
    }
  }

  console.log(`Parsed ${records.length} articles, skipped ${skipped}`);

  // Bulk insert. ON CONFLICT (slug) DO UPDATE so re-runs without a
  // prior DELETE still converge. Since we already wiped, we expect
  // every row to insert clean — the upsert is belt-and-braces.
  const BATCH = 200;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await sql`
      INSERT INTO articles ${sql(batch, 'slug', 'title', 'author', 'category', 'source', 'source_url', 'body', 'summary', 'tags', 'copyright', 'license', 'year')}
      ON CONFLICT (slug) DO UPDATE SET
        title      = EXCLUDED.title,
        author     = EXCLUDED.author,
        category   = EXCLUDED.category,
        source_url = EXCLUDED.source_url,
        body       = EXCLUDED.body,
        copyright  = EXCLUDED.copyright,
        license    = EXCLUDED.license,
        year       = EXCLUDED.year
    `;
    inserted += batch.length;
    if ((i / BATCH) % 5 === 0) console.log(`  inserted ${inserted} / ${records.length}`);
  }
  console.log(`Inserted ${inserted} rows`);

  // Smoke check by category.
  const counts = await sql`
    SELECT category, COUNT(*)::int AS n
    FROM articles
    WHERE source = 'ati'
    GROUP BY category
    ORDER BY n DESC
  `;
  console.log('\nBy category:');
  for (const r of counts) console.log(`  ${r.category.padEnd(14)} ${r.n}`);

  await sql.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
