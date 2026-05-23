// Tier 1 ingest: Bhikkhu Ñāṇamoli's translation of the Visuddhimagga
// (BP207h, BPS Online Edition 2014).
//
// Different from the Bodhi-4 ingest in three ways:
//
//   1) Vism has 23 chapters (not the Bodhi-4's two-Part layout).
//      Each chapter contains numbered paragraphs (Ñāṇamoli §1, §2, …)
//      that align directly to CST Vism paragraph rows under
//      cst-e0101n.mul-{section}_p{para} / cst-e0102n.mul-{section}_p{para}.
//
//   2) Far more translation rows. The Bodhi-4 produced 38 commentary
//      rows total across 4 books; Vism alone produces ~3000+
//      Ñāṇamoli-paragraph rows because each numbered paragraph is its
//      own translations entry aligned to its specific CST anchor.
//
//   3) License: bps-online-free (Vism's BPS Online Edition uses
//      free-redistribution-with-share-alike terms — distinct from
//      the Bodhi-4 books' bps-fair-use posture).
//
// Usage:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-bps-vism.mjs --dry-run    # writes JSON to .cache/bps/bp207h-proposed.json
//   node ingest-bps-vism.mjs              # LIVE — writes to DB

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

import { parseBp207h } from './bps-bp207h.mjs';
import { alignVism, parseNyanamoliParagraphs } from './bps-vism-align.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const isDryRun = !!args['dry-run'];

// ─────────────────── Text utilities ───────────────────
//
// Same de-hyphenation + whitespace-collapse pattern as the Bodhi-4
// orchestrator. Pulled inline rather than imported to keep this
// module standalone.

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

function cleanBody(text) {
  return collapseWhitespace(dehyphenate(text));
}

// ─────────────────── Front-matter article (Translator's Introduction) ───────────────────

function buildIntroArticle(parsed) {
  // BP207h front matter is ~118K chars — title page, copyright, ToC,
  // bibliography, abbreviations, then the meaty Translator's
  // Introduction starting at the "INTRODUCTION" marker. Pull from
  // INTRODUCTION onward as the article body; everything earlier is
  // metadata/boilerplate.
  const introStart = parsed.front.search(/^INTRODUCTION\s*$/m);
  const body = introStart >= 0 ? parsed.front.slice(introStart) : parsed.front;
  const cleaned = cleanBody(body.replace(/^INTRODUCTION\s*\n/, ''));
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((p) => !/^[ivxlcdm]{1,5}$/i.test(p) && !/^\d{1,4}$/.test(p))
    .map((p) => `<p>${p}</p>`)
    .join('\n');
  return {
    slug: 'bps-bp207h-intro',
    title: 'Introduction to The Path of Purification (Visuddhimagga)',
    author: 'nanamoli-bps',
    category: 'author-essay',
    source: parsed.source,
    source_url: parsed.sourceUrl,
    body: `<h2>Translator's Introduction</h2>\n${paragraphs}`,
    summary: null,
    tags: ['bps', 'nanamoli', 'visuddhimagga', 'introduction'],
    copyright: parsed.copyright,
    license: parsed.license,
    year: 2010,
  };
}

// ─────────────────── Per-chapter translations rows ───────────────────
//
// Each Ñāṇamoli paragraph in chapter K becomes one translations row
// aligned to its corresponding CST passage_id from the alignment
// helper. Rows whose alignment couldn't resolve get the <UNALIGNED>
// placeholder and are skipped in live ingest.

function buildVismTranslations(parsed, alignment) {
  const rows = [];
  for (const chapter of alignment.chapter_pairings) {
    const nyanamoliChapter = parsed.chapters.find((c) => c.n === chapter.n);
    if (!nyanamoliChapter) continue;
    const nyanamoliPars = parseNyanamoliParagraphs(nyanamoliChapter.text);
    const parsByN = new Map(nyanamoliPars.map((p) => [p.n, p]));

    for (const pairing of chapter.pairings) {
      const par = parsByN.get(pairing.nyanamoli_n);
      if (!par) continue;
      const anchor = pairing.cst_passage_ids?.[0];
      const passage_id = anchor || `<UNALIGNED:vism:ch${chapter.n}-§${pairing.nyanamoli_n}>`;
      const fullText = par.text;   // already collapsed by parseNyanamoliParagraphs

      // Notes block: extra CST anchors if this Ñāṇamoli paragraph
      // spans multiple CST rows (sequential pairing distributes
      // proportionally when counts mismatch).
      const extraAnchors = (pairing.cst_passage_ids || []).slice(1);
      const notes = extraAnchors.length > 0
        ? `Aligned across ${pairing.cst_passage_ids.length} CST paragraphs (${extraAnchors.join(', ')})`
        : null;

      rows.push({
        passage_id,
        language: 'en',
        translator: parsed.translator,
        source: parsed.source,
        text: fullText,
        notes,
        copyright: parsed.copyright,
        license: parsed.license,
        source_url: parsed.sourceUrl,
        source_book: parsed.sourceBook,
        _vism: {
          chapter_n: chapter.n,
          chapter_title: chapter.title,
          nyanamoli_n: pairing.nyanamoli_n,
          nyanamoli_pts_page: pairing.nyanamoli_pts_page,
          cst_anchor_title: pairing.cst_anchor_title,
          cst_paragraph_count: pairing.cst_paragraph_count,
        },
      });
    }
  }
  return rows;
}

// ─────────────────── Main ingest ───────────────────

async function main() {
  console.log(`mode: ${isDryRun ? 'dry-run (writes JSON only)' : 'LIVE (writes to DB)'}`);

  let sql = null;
  if (process.env.DATABASE_URL) {
    sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });
  } else if (!isDryRun) {
    console.error('DATABASE_URL not set. See the header comment for usage.');
    process.exit(1);
  }

  console.log(`parsing BP207h PDF...`);
  const parsed = await parseBp207h();
  console.log(`  front=${parsed.front.length}, 23 chapters, endmatter=${parsed.endmatter.length}`);

  console.log(`aligning Ñāṇamoli chapters to CST Vism rows...`);
  const alignment = await alignVism({ sql });
  console.log(`  chapters detected: ${alignment.chapters_detected} / ${alignment.chapters_expected}`);
  console.log(`  CST Vism rows in scope: ${alignment.total_cst_rows}`);
  if (alignment.unmatched_chapters.length > 0) {
    console.log(`  unmatched chapters (CST subdivision incomplete?):`);
    for (const c of alignment.unmatched_chapters) console.log(`    Ch ${c.n} (${c.pali})`);
  }

  const article = buildIntroArticle(parsed);
  const translationRows = buildVismTranslations(parsed, alignment);

  console.log(`built:`);
  console.log(`  article: ${article.slug} (${article.body.length} chars body)`);
  console.log(`  translation rows: ${translationRows.length}`);
  const unaligned = translationRows.filter((r) => r.passage_id.startsWith('<UNALIGNED')).length;
  if (unaligned > 0) console.log(`  unaligned rows (will skip in live mode): ${unaligned}`);

  if (isDryRun) {
    const outDir = path.join(__dirname, '.cache', 'bps');
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, 'bp207h-proposed.json');
    await fs.writeFile(outFile, JSON.stringify({
      code: parsed.code,
      article,
      translation_count: translationRows.length,
      alignment_summary: {
        chapters_detected: alignment.chapters_detected,
        chapters_expected: alignment.chapters_expected,
        unmatched_chapters: alignment.unmatched_chapters,
      },
      translations: translationRows,
    }, null, 2));
    console.log(`→ ${outFile}`);
    if (sql) await sql.end();
    return;
  }

  // Live mode — INSERT into DB
  await sql`
    INSERT INTO articles (slug, title, author, category, source, source_url,
                          body, summary, tags, copyright, license, year)
    VALUES (${article.slug}, ${article.title}, ${article.author},
            ${article.category}, ${article.source}, ${article.source_url},
            ${article.body}, ${article.summary}, ${article.tags},
            ${article.copyright}, ${article.license}, ${article.year})
    ON CONFLICT (slug) DO UPDATE SET
      title=EXCLUDED.title, body=EXCLUDED.body, source_url=EXCLUDED.source_url,
      copyright=EXCLUDED.copyright, license=EXCLUDED.license, year=EXCLUDED.year
  `;
  console.log(`✓ article ${article.slug} upserted`);

  let placed = 0, skipped = 0, missing = 0;
  for (const row of translationRows) {
    if (row.passage_id.startsWith('<UNALIGNED')) { skipped++; continue; }
    const exists = await sql`SELECT id FROM passages WHERE id = ${row.passage_id} LIMIT 1`;
    if (exists.length === 0) { missing++; continue; }
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
    if (placed % 200 === 0) console.log(`  ... ${placed} translations placed`);
  }
  console.log(`\ntranslations: ${placed} placed, ${skipped} skipped (unaligned), ${missing} missing (no matching passage in DB)`);

  await sql.end();
}

await main();
