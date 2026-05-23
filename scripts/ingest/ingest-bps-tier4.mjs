// Tier 4 ingest orchestrator — BPS Ñāṇamoli + Ireland books with
// multi-part structure (not the Tier 2 single-sutta-cy pattern).
//
//   BP502S — Mindfulness of Breathing (Ñāṇamoli). 1 canonical sutta
//            translation (MN 118) + 3 commentary-and-related-texts parts
//            + endnotes + author bio.
//   BP214S — The Udāna and the Itivuttaka (Ireland). Two short Khuddaka
//            books translated, with introduction. Adds Ireland as a
//            second translator for Ud and Iti passages.
//
// Each book is too distinctive to share the BP209-212 sutta-and-cy
// orchestrator. The Tier 4 books emit:
//
//   - Zero or more translations rows (aligned to canonical passage_ids
//     for the sutta-translation parts)
//   - One or more Library articles (the commentary-extract parts that
//     don't align cleanly to a single passage)
//   - Forewords / Preface combined into one introduction article
//
// Usage:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-bps-tier4.mjs --dry-run --book=BP502S
//   node ingest-bps-tier4.mjs --book=BP502S            # writes to DB
//   node ingest-bps-tier4.mjs                           # both books

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

import { parseBp502s } from './bps-bp502s.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const isDryRun = !!args['dry-run'];
const bookFilter = args.book;

// ─────────────────── Text utilities ───────────────────

function dehyphenate(text) {
  return text.replace(/[­‐‑-]\n([a-zāīūṅñṭḍṇḷṃ])/g, '$1');
}

function collapseWhitespace(text) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Drop-cap fix: BP PDFs typeset section openers like "INTRODUCTION"
// with a large first letter that PDF extraction renders as "I NTRODUCTION"
// (split with a space). Re-join when the leading letter is capital and
// the following all-caps token is 3+ letters — leaves normal words like
// "I think" / "A B" alone.
function fixDropCaps(text) {
  return text.replace(/(^|[\n>(])([A-Z]) ([A-Z]{3,})\b/g, '$1$2$3');
}

function cleanBody(text) {
  return fixDropCaps(collapseWhitespace(dehyphenate(text)));
}

function paragraphs(s) {
  return s.split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((p) => !/^[ivxlcdm]{1,5}$/i.test(p) && !/^\d{1,4}$/.test(p))
    .map((p) => `<p>${p}</p>`)
    .join('\n');
}

// Slim heading detection — strip "PART I", "Part I", or top-of-section
// caps headers off the start of body content. The "Namo tassa..." and
// "(Ānāpānasati Sutta—MN 118)" intro lines of Part I are kept.
function stripLeadingHeader(text, ...patterns) {
  let s = text.trim();
  for (const p of patterns) {
    const re = new RegExp(`^\\s*${p}\\s*\\n+`, '');
    s = s.replace(re, '');
  }
  return s.trim();
}

// ─────────────────── BP502S processing ───────────────────

function buildBp502sRows(parsed) {
  // Part I → MN 118 translations row.
  // Strip the heading lines "Part I / The Discourse on / (Ānāpānasati
  // Sutta—MN 118)" so the body starts with the actual sutta text.
  const partOneBody = cleanBody(
    stripLeadingHeader(
      parsed.partOne,
      'Namo tassa[^\\n]+',
      'Part I',
      'The Discourse on',
      'Mindfulness of Breathing',
      '\\(Ānāpānasati Sutta—MN 118\\)',
    ),
  );
  const suttaRow = {
    passage_id: 'mn118',
    language: 'en',
    translator: 'nanamoli',
    source: parsed.source,
    text: partOneBody,
    notes: null,
    copyright: parsed.copyright,
    license: parsed.license,
    source_url: parsed.sourceUrl,
    source_book: parsed.sourceBook,
  };

  // Forewords + Preface combined → one Library article.
  // Front matter has title/copyright/Contents/Abbreviations BEFORE
  // the actual Foreword section. Each landmark string appears
  // TWICE — once in the Contents ToC, once as the section's own
  // heading. We use lastIndexOf to land on the body occurrence.
  const front = parsed.front;
  const m1 = [...front.matchAll(/Translator['’]s Foreword to the\s*\n?\s*First Edition/g)];
  const m2 = [...front.matchAll(/Preface to the\s*\n?\s*Second Edition/g)];
  const tfStart = m1.length > 1 ? m1[m1.length - 1].index : (m1[0]?.index ?? -1);
  const prefaceStart = m2.length > 1 ? m2[m2.length - 1].index : (m2[0]?.index ?? -1);
  let foreword = '';
  let preface = '';
  if (tfStart >= 0) {
    const end = prefaceStart > tfStart ? prefaceStart : front.length;
    foreword = front.slice(tfStart, end);
  }
  if (prefaceStart >= 0) {
    preface = front.slice(prefaceStart);
  }
  const introArticleBody = [
    foreword ? `<h2>Translator's Foreword to the First Edition</h2>\n${paragraphs(cleanBody(foreword.replace(/^Translator['’]s Foreword to the\s*\n?\s*First Edition\s*/, '')))}` : '',
    preface ? `<h2>Preface to the Second Edition</h2>\n${paragraphs(cleanBody(preface.replace(/^Preface to the\s*\n?\s*Second Edition\s*/, '')))}` : '',
  ].filter(Boolean).join('\n\n');

  const introArticle = introArticleBody ? {
    slug: 'bps-bp502s-foreword',
    title: 'Forewords to Mindfulness of Breathing (Ñāṇamoli)',
    author: 'nanamoli-bps',
    category: 'author-essay',
    source: parsed.source,
    source_url: parsed.sourceUrl,
    body: introArticleBody,
    summary: null,
    tags: ['bps', 'nanamoli', 'anapanasati', 'introduction'],
    copyright: parsed.copyright,
    license: parsed.license,
    year: 1964,
  } : null;

  // Parts II + III + IV → three separate Library articles
  // (commentary extracts, Paṭisambhidāmagga translation, related sutta
  // passages). These don't align cleanly to a single canonical passage_id
  // and the source-of-truth alignment work is deferred.
  function partArticle(slug, title, sectionText, leadingHeaderPattern) {
    if (!sectionText) return null;
    const body = cleanBody(stripLeadingHeader(sectionText, ...leadingHeaderPattern));
    return {
      slug,
      title,
      author: 'nanamoli-bps',
      category: 'author-essay',
      source: parsed.source,
      source_url: parsed.sourceUrl,
      body: `<h2>${title}</h2>\n${paragraphs(body)}`,
      summary: null,
      tags: ['bps', 'nanamoli', 'anapanasati', 'commentary'],
      copyright: parsed.copyright,
      license: parsed.license,
      year: 1964,
    };
  }

  const partTwoArticle = partArticle(
    'bps-bp502s-vism-commentary',
    'Visuddhimagga Commentary on Mindfulness of Breathing',
    parsed.partTwo,
    ['Part II', '\\(From the Visuddhimagga[^\\)]*\\)'],
  );
  const partThreeArticle = partArticle(
    'bps-bp502s-patisambhidamagga-anapanakatha',
    'Paṭisambhidāmagga Section on Mindfulness of Breathing (Ānāpānakathā)',
    parsed.partThree,
    ['Part III', '\\(Path of Analysis\\)'],
  );
  const partFourArticle = partArticle(
    'bps-bp502s-other-suttas',
    'Passages from Other Suttas on Mindfulness of Breathing',
    parsed.partFour,
    ['Part IV', 'Passages from Other Suttas'],
  );

  const articles = [introArticle, partTwoArticle, partThreeArticle, partFourArticle].filter(Boolean);
  return { suttaRow, articles };
}

// ─────────────────── Book registry ───────────────────

const BOOKS = {
  BP502S: {
    parser: parseBp502s,
    build: buildBp502sRows,
  },
};

// ─────────────────── Per-book ingest ───────────────────

async function ingestBook(code, { sql, dryRun }) {
  console.log(`\n========== ${code} ==========`);
  const cfg = BOOKS[code];
  if (!cfg) throw new Error(`No registry entry for ${code}`);
  const parsed = await cfg.parser();
  console.log(`  pdfPages=${parsed.pdfPages}, license=${parsed.license}`);
  const built = cfg.build(parsed);

  console.log(`  built:`);
  if (built.suttaRow) {
    console.log(`    sutta translation: passage_id=${built.suttaRow.passage_id} (${built.suttaRow.text.length} chars)`);
  }
  console.log(`    articles: ${built.articles.length}`);
  for (const a of built.articles) console.log(`      - ${a.slug} (${a.body.length} chars body)`);

  if (dryRun) {
    const outDir = path.join(__dirname, '.cache', 'bps');
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${code.toLowerCase()}-proposed.json`);
    await fs.writeFile(outFile, JSON.stringify({
      code,
      sutta_translation: built.suttaRow,
      articles: built.articles,
    }, null, 2));
    console.log(`  → dry-run JSON: ${outFile}`);
    return;
  }

  if (!sql) throw new Error('DATABASE_URL not set; --dry-run was off');

  // Articles upsert
  for (const a of built.articles) {
    await sql`
      INSERT INTO articles (slug, title, author, category, source, source_url,
                            body, summary, tags, copyright, license, year)
      VALUES (${a.slug}, ${a.title}, ${a.author},
              ${a.category}, ${a.source}, ${a.source_url},
              ${a.body}, ${a.summary}, ${a.tags},
              ${a.copyright}, ${a.license}, ${a.year})
      ON CONFLICT (slug) DO UPDATE SET
        title=EXCLUDED.title, body=EXCLUDED.body, source_url=EXCLUDED.source_url,
        copyright=EXCLUDED.copyright, license=EXCLUDED.license, year=EXCLUDED.year
    `;
    console.log(`  ✓ article ${a.slug} upserted`);
  }

  // Sutta translation
  if (built.suttaRow) {
    const exists = await sql`SELECT id FROM passages WHERE id = ${built.suttaRow.passage_id} LIMIT 1`;
    if (exists.length === 0) {
      console.log(`  ⚠ skipped sutta translation: ${built.suttaRow.passage_id} not in passages`);
    } else {
      const r = built.suttaRow;
      await sql`
        INSERT INTO translations (passage_id, language, translator, source,
                                  text, notes, copyright, license, source_url, source_book)
        VALUES (${r.passage_id}, 'en', ${r.translator}, ${r.source},
                ${r.text}, ${r.notes}, ${r.copyright},
                ${r.license}, ${r.source_url}, ${r.source_book})
        ON CONFLICT (passage_id, translator, source) DO UPDATE SET
          text=EXCLUDED.text, notes=EXCLUDED.notes,
          copyright=EXCLUDED.copyright, license=EXCLUDED.license,
          source_url=EXCLUDED.source_url, source_book=EXCLUDED.source_book
      `;
      console.log(`  ✓ sutta translation aligned to ${r.passage_id} (${r.translator})`);
    }
  }
}

// ─────────────────── Main ───────────────────

async function main() {
  const codes = bookFilter ? [bookFilter.toUpperCase()] : Object.keys(BOOKS);
  for (const c of codes) {
    if (!BOOKS[c]) { console.error(`unknown book ${c}; available: ${Object.keys(BOOKS).join(', ')}`); process.exit(1); }
  }
  console.log(`books to process: ${codes.join(', ')}`);
  console.log(`mode: ${isDryRun ? 'dry-run (writes JSON only)' : 'LIVE (writes to DB)'}`);

  let sql = null;
  if (process.env.DATABASE_URL) {
    sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });
  } else if (!isDryRun) {
    console.error('DATABASE_URL not set. See header comment for usage.');
    process.exit(1);
  }
  for (const c of codes) await ingestBook(c, { sql, dryRun: isDryRun });
  if (sql) await sql.end();
}

await main();
