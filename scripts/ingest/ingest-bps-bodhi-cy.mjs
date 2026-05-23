// Tier 2 ingest: Bhikkhu Bodhi's four BPS commentary translation books.
//
// Imports the per-book parser modules (bps-bp209s.mjs, bps-bp210s.mjs,
// bps-bp211s.mjs, bps-bp212s.mjs), turns each book's structured
// {front, partOne, partTwo, notes} output into proposed translations
// + articles rows, and either dry-runs to JSON or writes to the DB.
//
// Per-book parsers handle PDF read, diacritic normalization to IAST,
// page-header cleanup, and section-range splitting. This orchestrator
// handles:
//
//   - De-hyphenation across line breaks ("dwell-\ning" → "dwelling")
//   - Front-matter splitting (Preface + Introduction → Library article;
//     ToC + Abbreviations + Texts Used dropped as boilerplate)
//   - Part One sutta translation → one translations row aligned to
//     the canonical passage_id (dn1 / mn1 / dn15 / dn2)
//   - Part Two commentary translation → split by Bodhi's numbered
//     subsections, each one a TODO-aligned translations row keyed to
//     the fine CST aṭṭhakathā paragraph rows (placeholder until the
//     subdivision ingest lands)
//   - Notes section → {noteNumber: text} dict, surfaced on the
//     corresponding translations row via translations.notes once the
//     callout-to-passage mapping is wired
//
// Usage:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-bps-bodhi-cy.mjs --dry-run --book=BP210S
//   node ingest-bps-bodhi-cy.mjs --book=BP210S            # writes to DB
//   node ingest-bps-bodhi-cy.mjs                          # all four books

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

import { parseBp209s } from './bps-bp209s.mjs';
import { parseBp210s } from './bps-bp210s.mjs';
import { parseBp211s } from './bps-bp211s.mjs';
import { parseBp212s } from './bps-bp212s.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────── Args ───────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const isDryRun = !!args['dry-run'];
const bookFilter = args.book;          // 'BP209S' | 'BP210S' | etc.

// ─────────────────── Per-book registry ───────────────────
//
// Each entry maps a BPS catalogue number to its parser module + the
// canonical passage_id its sutta translation aligns to. The
// commentary-side passage_ids are fine CST rows (cst-*a.att-{target}_*)
// resolved at ingest time by the alignment helper below.
//
// extraArticles entries surface additional sections from the parsed
// output as standalone Library articles. BP209S has four — the three
// standalone essays (Parts Three-Five) and the Appendices, in
// addition to the main Preface+Introduction article that every book
// produces. The other three books have empty extraArticles arrays.

const BOOKS = [
  {
    code: 'BP209S',
    parser: parseBp209s,
    suttaPassageId: 'dn1',                            // Brahmajāla
    cstCommentaryPrefix: 'cst-s0101a.att-dn1_1',      // Brahmajāla cy lives in Sumaṅgalavilāsinī vol 1 sutta 1
    cstSubCommentaryPrefix: 'cst-s0101t.tik-dn1_1',
    introSlug: 'bps-bp209s-intro',
    introTitle: 'Introduction to The Discourse on the All-Embracing Net of Views',
    year: 1978,
    extraArticles: [
      { sectionKey: 'partThree', slug: 'bps-bp209s-exegetical-method',
        title: 'The Method of the Exegetical Treatises',
        heading: 'The Method of the Exegetical Treatises' },
      { sectionKey: 'partFour', slug: 'bps-bp209s-paramis',
        title: 'A Treatise on the Pāramīs',
        heading: 'A Treatise on the Pāramīs' },
      { sectionKey: 'partFive', slug: 'bps-bp209s-tathagata',
        title: 'The Meaning of the Word "Tathāgata"',
        heading: 'The Meaning of the Word "Tathāgata"' },
      { sectionKey: 'appendices', slug: 'bps-bp209s-appendices',
        title: 'Appendices to The All-Embracing Net of Views',
        heading: 'Appendices' },
    ],
  },
  {
    code: 'BP210S',
    parser: parseBp210s,
    suttaPassageId: 'mn1',                            // Mūlapariyāya
    cstCommentaryPrefix: 'cst-s0201a.att-mn1',
    cstSubCommentaryPrefix: 'cst-s0201t.tik-mn1',
    introSlug: 'bps-bp210s-intro',
    introTitle: 'Introduction to The Discourse on the Root of Existence',
    year: 1980,
    extraArticles: [],
  },
  {
    code: 'BP211S',
    parser: parseBp211s,
    suttaPassageId: 'dn15',                           // Mahānidāna
    cstCommentaryPrefix: 'cst-s0102a.att-dn15',       // DN cy vol 2 (Sumaṅgalavilāsinī cont.)
    cstSubCommentaryPrefix: 'cst-s0102t.tik-dn15',
    introSlug: 'bps-bp211s-intro',
    introTitle: 'Introduction to The Great Discourse on Causation',
    year: 1984,
    extraArticles: [],
  },
  {
    code: 'BP212S',
    parser: parseBp212s,
    suttaPassageId: 'dn2',                            // Sāmaññaphala
    cstCommentaryPrefix: 'cst-s0101a.att-dn1_2',      // DN cy vol 1, the 2nd sutta-section (Sāmaññaphalasuttavaṇṇanā)
    cstSubCommentaryPrefix: 'cst-s0101t.tik-dn1_2',
    introSlug: 'bps-bp212s-intro',
    introTitle: 'Introduction to The Discourse on the Fruits of Recluseship',
    year: 1989,
    extraArticles: [],
  },
];

// ─────────────────── Text utilities ───────────────────

// De-hyphenate words split across line breaks. PDF text extraction
// preserves the dash that the typesetter inserted at line end; we
// want the joined word. Conservative: only join when followed by a
// lowercase letter (so "Pali-/English" or "Dīgha-/Nikāya" stays
// hyphenated). Soft-hyphens (U+00AD) and various unicode hyphens
// handled too.
export function dehyphenate(text) {
  return text.replace(/[­‐‑-]\n([a-zāīūṅñṭḍṇḷṃ])/g, '$1');
}

// Collapse internal whitespace runs but preserve paragraph breaks
// (double-newline). Used for the translations.text body.
function collapseWhitespace(text) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Full cleanup pipeline for body text: de-hyphenate, collapse
// whitespace, normalize quote marks to plain ASCII.
function cleanBody(text) {
  let s = dehyphenate(text);
  s = collapseWhitespace(s);
  return s;
}

// ─────────────────── Front matter split ───────────────────
//
// BP210S front section contains, in order: title page, copyright,
// Contents (ToC), Translator's Preface, List of Abbreviations,
// Texts Used, Introduction. We pull the Preface + Introduction as
// the Library article body, and drop the rest.

function extractIntroductionAndPreface(frontText) {
  // Preface starts at the first "TRANSLATOR'S PREFACE" line. BPS PDFs
  // typeset apostrophes as the curly U+2019 ’; the regex allows both
  // straight ' and curly ’ so we don't miss the header.
  const prefaceStart = frontText.search(/TRANSLATOR[’']S PREFACE/);
  // Introduction starts at the first "INTRODUCTION" line that
  // appears AFTER the Preface — earlier "INTRODUCTION" mentions might
  // be in the ToC.
  let introStart = -1;
  if (prefaceStart >= 0) {
    introStart = frontText.indexOf('INTRODUCTION', prefaceStart + 100);
  } else {
    introStart = frontText.indexOf('INTRODUCTION');
  }
  // Preface ends at whichever boundary comes first: List of
  // Abbreviations, Texts Used, or the start of the Introduction. The
  // bibliography sections sit between Preface and Introduction in the
  // print layout; without trimming we'd include them as Preface text.
  function firstOf(text, from, ...patterns) {
    let best = -1;
    for (const p of patterns) {
      const idx = text.indexOf(p, from);
      if (idx >= 0 && (best < 0 || idx < best)) best = idx;
    }
    return best;
  }
  let prefaceEnd = -1;
  if (prefaceStart >= 0) {
    prefaceEnd = firstOf(
      frontText, prefaceStart + 100,
      'LIST OF ABBREVIATIONS',
      'TEXTS USED',
      'INTRODUCTION',
    );
  }
  const preface = prefaceStart >= 0 && prefaceEnd > prefaceStart
    ? frontText.slice(prefaceStart, prefaceEnd)
    : '';
  // Introduction goes to end of front section (which already excludes
  // Part One and beyond per the per-book parser's range definition).
  const introduction = introStart >= 0 ? frontText.slice(introStart) : '';
  // Strip the section's own ALL-CAPS heading off the body since the
  // article renderer adds its own <h2>; otherwise the body opens with
  // "TRANSLATOR'S PREFACE Correct understanding…" right after the h2.
  function stripLeadingHeader(s, headerRe) {
    return s.replace(new RegExp(`^\\s*${headerRe}\\s*`), '');
  }
  return {
    preface: cleanBody(stripLeadingHeader(preface, "TRANSLATOR[’']S PREFACE")),
    introduction: cleanBody(stripLeadingHeader(introduction, 'INTRODUCTION')),
  };
}

// ─────────────────── Part One: sutta translation ───────────────────
//
// Bodhi's Part One is the canonical sutta in English. For BP210S that's
// MN 1 (Mūlapariyāya). We emit ONE translations row aligned to the
// sutta's passage_id — the existing reader already supports per-card
// translator switching, so Bodhi appears alongside Sujato (where the
// SC translation exists).
//
// Future iteration: split into segments matching the SC bilara segment
// keys, for tighter alignment. That requires reading the segments
// JSONB and matching Bodhi's numbered sections to segment boundaries,
// which is non-trivial. Coarse pass first.

function buildSuttaTranslation(book, parsed) {
  // Strip the "PART ONE / SUTTA NAME / The Discourse..." centered
  // header at the top of partOne. The body's first natural section
  // marker is "1." (Bodhi's paragraph-1). Slice from there IFF the
  // "1." appears early (within ~5K chars) — finding "1." far into
  // the text means we're matching content from a different section
  // (e.g. Part Two's commentary numbering), not the sutta's true
  // opening. In that case the whole partOne text is kept as-is and
  // the per-book parser's section-range config is the place to fix
  // any boundary issue.
  const text = cleanBody(parsed.partOne);
  const firstSection = text.search(/^1\.\s+/m);
  const body = (firstSection >= 0 && firstSection < 5000)
    ? text.slice(firstSection)
    : text;
  return {
    passage_id: book.suttaPassageId,
    language: 'en',
    translator: parsed.translator,
    source: parsed.source,
    text: body,
    notes: null,
    copyright: parsed.copyright,
    license: parsed.license,
    source_url: parsed.sourceUrl,
    source_book: parsed.sourceBook,
  };
}

// ─────────────────── Part Two: commentary translation ───────────────────
//
// Bodhi's Part Two is organised as numbered subsections matching
// Buddhaghosa's exegetical sections. Each subsection contains
// alternating "Cy." (commentary) and "Sub. Cy." (sub-commentary)
// excerpts, plus translator's connecting prose.
//
// We split by the top-level numbered subsection ("1. Introductory
// Section", "2. The Section on Earth", ...) — those numbers come
// from Bodhi's ToC and re-appear inline in the Part Two text. Each
// subsection becomes one or more proposed translations rows; the
// passage_id is a TODO until the alignment helper resolves which
// fine CST aṭṭhakathā paragraph rows each subsection corresponds to.

function splitPartTwoSubsections(partTwoText) {
  // Strip the "PART TWO / THE COMMENTARIAL EXEGESIS..." header.
  const cleaned = cleanBody(partTwoText);
  const firstSubsection = cleaned.search(/^1\.\s+[A-ZĀ]/m);
  if (firstSubsection < 0) return [];
  const body = cleaned.slice(firstSubsection);

  // Subsection boundaries: lines that start with "N. CapitalisedTitle"
  // at a clean paragraph break. We split on those boundaries.
  const subsectionRe = /(?:^|\n)(\d{1,3})\.\s+([A-ZĀ][^\n]{4,80})\n/g;
  const subsections = [];
  let lastIdx = 0;
  let lastN = 0;
  let lastTitle = '';
  for (const m of body.matchAll(subsectionRe)) {
    const n = parseInt(m[1], 10);
    // Only accept monotonically increasing N to avoid false hits like
    // "10. Some inline reference" mid-paragraph.
    if (n !== lastN + 1) continue;
    if (lastN > 0) {
      subsections.push({
        n: lastN,
        title: lastTitle,
        text: body.slice(lastIdx, m.index).trim(),
      });
    }
    lastN = n;
    lastTitle = m[2].trim();
    lastIdx = m.index + m[0].length;
  }
  if (lastN > 0) {
    subsections.push({
      n: lastN,
      title: lastTitle,
      text: body.slice(lastIdx).trim(),
    });
  }
  return subsections;
}

// Proposed translations rows for the commentary side. Until the
// alignment helper is wired (morning, against fine CST rows), each
// Bodhi subsection emits ONE row with passage_id='<TODO>' so dry-run
// JSON shows the structure.
function buildCommentaryTranslations(book, parsed) {
  const subsections = splitPartTwoSubsections(parsed.partTwo);
  return subsections.map((s) => ({
    passage_id: `<TODO-align:${book.cstCommentaryPrefix}:subsection-${s.n}-${slugify(s.title)}>`,
    language: 'en',
    translator: parsed.translator,
    source: parsed.source,
    text: cleanBody(s.text),
    notes: null,
    copyright: parsed.copyright,
    license: parsed.license,
    source_url: parsed.sourceUrl,
    source_book: parsed.sourceBook,
    _bodhi_subsection: { n: s.n, title: s.title },
  }));
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/[āīūṅñṭḍṇḷṃ]/g, (c) => ({ā:'a',ī:'i',ū:'u',ṅ:'n',ñ:'n',ṭ:'t',ḍ:'d',ṇ:'n',ḷ:'l',ṃ:'m'}[c]||c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// ─────────────────── Notes (endnotes) ───────────────────
//
// Notes are formatted as a numbered list: "1. ...", "2. ...", etc.
// We parse them into a dict {1: "...", 2: "...", ...} so the body
// callouts can later be matched against the corresponding note text
// and surfaced on the translations.notes field.

function parseNotes(notesText) {
  const cleaned = cleanBody(notesText);
  const re = /(?:^|\n)(\d{1,4})\.\s+([\s\S]*?)(?=\n\d{1,4}\.\s+|\n*$)/g;
  const out = {};
  for (const m of cleaned.matchAll(re)) {
    const n = parseInt(m[1], 10);
    out[n] = m[2].replace(/\s+/g, ' ').trim();
  }
  return out;
}

// ─────────────────── Article (Preface + Introduction) ───────────────────

function buildArticle(book, parsed) {
  const { preface, introduction } = extractIntroductionAndPreface(parsed.front);
  // Render as paragraph-broken HTML — matches the article body shape
  // ATI articles use (block paragraphs separated by <p>).
  function paragraphs(s) {
    return s
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      // Drop fragments that are just a page number — roman or arabic,
      // sometimes left in by the page-header cleaner when it sat on
      // its own paragraph boundary.
      .filter((p) => !/^[ivxlcdm]{1,5}$/i.test(p) && !/^\d{1,4}$/.test(p))
      .map((p) => `<p>${p}</p>`)
      .join('\n');
  }
  const body = [
    preface ? `<h2>Translator's Preface</h2>\n${paragraphs(preface)}` : '',
    introduction ? `<h2>Introduction</h2>\n${paragraphs(introduction)}` : '',
  ].filter(Boolean).join('\n\n');

  return {
    slug: book.introSlug,
    title: book.introTitle,
    author: 'bodhi-bps',
    category: 'author-essay',
    source: parsed.source,
    source_url: parsed.sourceUrl,
    body,
    summary: null,
    tags: ['bps', 'bodhi', 'commentary', 'introduction'],
    copyright: parsed.copyright,
    license: parsed.license,
    year: book.year,
  };
}

// ─────────────────── Per-book ingest ───────────────────

// Build a standalone Library article from any text section. Used for
// BP209S's Parts Three / Four / Five / Appendices — each one is a
// self-contained essay rather than commentary on a specific sutta.
function buildExtraArticle(book, parsed, extra) {
  const raw = parsed[extra.sectionKey];
  if (!raw) return null;
  const cleaned = cleanBody(raw);
  function paragraphs(s) {
    return s.split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .filter((p) => !/^[ivxlcdm]{1,5}$/i.test(p) && !/^\d{1,4}$/.test(p))
      .map((p) => `<p>${p}</p>`)
      .join('\n');
  }
  return {
    slug: extra.slug,
    title: extra.title,
    author: 'bodhi-bps',
    category: 'author-essay',
    source: parsed.source,
    source_url: parsed.sourceUrl,
    body: `<h2>${extra.heading}</h2>\n${paragraphs(cleaned)}`,
    summary: null,
    tags: ['bps', 'bodhi', 'commentary', 'essay'],
    copyright: parsed.copyright,
    license: parsed.license,
    year: book.year,
  };
}

async function ingestBook(book, { sql, dryRun }) {
  console.log(`\n========== ${book.code} ==========`);
  const parsed = await book.parser();
  console.log(`  parsed sections: front=${parsed.front.length}, partOne=${parsed.partOne.length}, partTwo=${parsed.partTwo.length}, notes=${parsed.notes.length}`);

  const article = buildArticle(book, parsed);
  const suttaRow = buildSuttaTranslation(book, parsed);
  const commentaryRows = buildCommentaryTranslations(book, parsed);
  const noteMap = parseNotes(parsed.notes);
  const extraArticles = (book.extraArticles || [])
    .map((extra) => buildExtraArticle(book, parsed, extra))
    .filter(Boolean);

  console.log(`  built:`);
  console.log(`    article: ${article.slug} (${article.body.length} chars body)`);
  console.log(`    sutta translations row: passage_id=${suttaRow.passage_id}  text=${suttaRow.text.length} chars`);
  console.log(`    commentary translations rows: ${commentaryRows.length} (Bodhi subsections)`);
  console.log(`    endnotes parsed: ${Object.keys(noteMap).length}`);
  if (extraArticles.length) {
    console.log(`    extra articles: ${extraArticles.length}`);
    for (const a of extraArticles) console.log(`      - ${a.slug} (${a.body.length} chars)`);
  }

  if (dryRun) {
    const out = {
      code: book.code,
      article,
      sutta_translation: suttaRow,
      commentary_translations: commentaryRows,
      extra_articles: extraArticles,
      endnotes: noteMap,
      _alignment_status: 'commentary_passage_ids are <TODO> placeholders; alignment-to-fine-CST is wired in a follow-up pass once the cst-*a.att-*_p rows exist.',
    };
    const outDir = path.join(__dirname, '.cache', 'bps');
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${book.code.toLowerCase()}-proposed.json`);
    await fs.writeFile(outFile, JSON.stringify(out, null, 2));
    console.log(`  → dry-run JSON: ${outFile}`);
    return;
  }

  // Live mode — INSERT into DB. Commentary rows whose passage_id is
  // still a <TODO> placeholder are skipped (alignment helper hasn't
  // resolved them yet); they'd violate the FK to passages otherwise.
  if (!sql) throw new Error('--dry-run was off but DATABASE_URL not set');

  // Main article (Preface + Introduction) + any extra essay articles
  for (const a of [article, ...extraArticles]) {
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

  // Sutta translation — only if the passage actually exists
  const suttaExists = await sql`SELECT id FROM passages WHERE id = ${suttaRow.passage_id} LIMIT 1`;
  if (suttaExists.length === 0) {
    console.log(`  ⚠ skipped sutta translation: ${suttaRow.passage_id} not in passages`);
  } else {
    await sql`
      INSERT INTO translations (passage_id, language, translator, source,
                                text, notes, copyright, license, source_url, source_book)
      VALUES (${suttaRow.passage_id}, 'en', ${suttaRow.translator}, ${suttaRow.source},
              ${suttaRow.text}, ${suttaRow.notes}, ${suttaRow.copyright},
              ${suttaRow.license}, ${suttaRow.source_url}, ${suttaRow.source_book})
      ON CONFLICT (passage_id, translator, source) DO UPDATE SET
        text=EXCLUDED.text, notes=EXCLUDED.notes,
        copyright=EXCLUDED.copyright, license=EXCLUDED.license,
        source_url=EXCLUDED.source_url, source_book=EXCLUDED.source_book
    `;
    console.log(`  ✓ sutta translation aligned to ${suttaRow.passage_id}`);
  }

  // Commentary translations — skip <TODO> placeholders until the
  // alignment helper resolves real passage_ids.
  let placed = 0, skipped = 0;
  for (const row of commentaryRows) {
    if (row.passage_id.startsWith('<TODO')) { skipped++; continue; }
    const exists = await sql`SELECT id FROM passages WHERE id = ${row.passage_id} LIMIT 1`;
    if (exists.length === 0) { skipped++; continue; }
    await sql`
      INSERT INTO translations (passage_id, language, translator, source,
                                text, notes, copyright, license, source_url, source_book)
      VALUES (${row.passage_id}, 'en', ${row.translator}, ${row.source},
              ${row.text}, ${row.notes}, ${row.copyright},
              ${row.license}, ${row.source_url}, ${row.source_book})
      ON CONFLICT (passage_id, translator, source) DO UPDATE SET
        text=EXCLUDED.text, notes=EXCLUDED.notes
    `;
    placed++;
  }
  console.log(`  commentary translations: ${placed} placed, ${skipped} skipped (no aligned passage_id yet)`);
}

// ─────────────────── Main ───────────────────

async function main() {
  const books = bookFilter
    ? BOOKS.filter((b) => b.code === bookFilter.toUpperCase())
    : BOOKS;
  if (books.length === 0) {
    console.error(`No book matched filter --book=${bookFilter}. Available: ${BOOKS.map((b) => b.code).join(', ')}`);
    process.exit(1);
  }
  console.log(`books to process: ${books.map((b) => b.code).join(', ')}`);
  console.log(`mode: ${isDryRun ? 'dry-run (writes JSON only)' : 'LIVE (writes to DB)'}`);

  let sql = null;
  if (!isDryRun) {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set. See the header comment for usage.');
      process.exit(1);
    }
    sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });
  }
  for (const book of books) {
    await ingestBook(book, { sql, dryRun: isDryRun });
  }
  if (sql) await sql.end();
}

await main();
