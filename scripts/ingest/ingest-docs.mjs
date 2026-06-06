// Ingest the site's own documentation into the `articles` table under
// category='docs'. The Docs tab (src/DocsView.jsx) renders every article
// WHERE category='docs', served by the existing /api/library +
// /api/library/:slug endpoints, so no backend or UI change is needed here.
//
// These docs are authored in-repo (not scraped from an external source),
// so source='dhamma' and license='cc-by-4.0' (the project's own prose).
//
// IMPORTANT — body HTML allowlist. DocsView renders bodies through
// src/dictHtml.js sanitizeDictHtml(), whose allowed tags are exactly:
//   b, i, em, strong, abbr, p, br, hr, span, sup, sub
// Everything else (h1-h6, ul, ol, li, blockquote, a, table) is unwrapped
// and dropped. So section labels use <p><strong>…</strong></p>, item runs
// use <br> inside a <p>, and there are no headings, lists, or links. Keep
// it that way or the rendered doc loses structure silently.
//
// Tone rules (CLAUDE.md): quiet, scholarly, no marketing copy, no
// em-dashes (commas/periods only).
//
// Idempotent: UPSERT on slug, so re-runs converge. Safe to re-run after
// editing any doc body below.
//
// Usage (with `flyctl proxy 15432 --app dhamma-pg` up and DATABASE_URL set
// to point at localhost:15432):
//   cd scripts/ingest
//   node ingest-docs.mjs

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.');
  process.exit(1);
}

// Author bylines are intentionally null — these are tool documentation,
// not signed essays. The Docs index and reader both omit the byline when
// author is null.
const DOCS = [
  {
    slug: 'docs-how-search-works',
    title: 'How search works',
    summary:
      'The three search modes (Exact, Stem, Meaning), the hybrid full-text and vector ranking behind Meaning mode, and the scholar-curated alias overlay that ties cross-tradition terms together.',
    body: `
<p>Search offers three modes. Each answers a different question, and the right one depends on whether you know the surface form of the word you want, a variant of it, or only the idea.</p>

<p><strong>Exact</strong></p>
<p>Exact mode matches the words you type as written, against a full-text index over every passage. Diacritics are folded at both index time and query time, so a query for <i>anapana</i> matches indexed <i>ānāpāna</i> without your having to type the macrons. Beyond that folding, no expansion happens: the words must be present. Exact is the mode to reach for when you already know the term and want only the passages that contain it. Boolean operators (AND, OR, NOT), quoted phrases, and proximity (NEAR) are honoured in the query grammar.</p>

<p><strong>Stem</strong></p>
<p>Stem mode runs the same full-text search but first expands your query through the scholar-curated alias table. A search for <i>sati</i> is rewritten to also match its asserted equivalents, so the query becomes, in effect, <i>sati</i> OR <i>smṛti</i> OR <i>念</i> OR <i>mindfulness</i>. This is the mode for following a single concept across the canon and its commentaries when it surfaces under different spellings, inflections, or languages.</p>

<p><strong>Meaning</strong></p>
<p>Meaning mode is for when you can describe what you want but cannot name the passage. It combines full-text retrieval with semantic vector search and fuses the results, so a thematic query such as <i>how to behave around lay families</i> can surface the relevant discourse even when none of those exact words appear in it.</p>

<p>The fusion draws on four retrieval lanes, each ranked independently and then combined by reciprocal rank fusion at k equal to 60:</p>
<p>
<i>Full text.</i> The alias-expanded query against the indexed text of every passage.<br>
<i>Passage embedding.</i> Approximate nearest-neighbour search over a dense vector for each passage's source text, held in <span>passages.embedding</span>.<br>
<i>Translation embedding.</i> The same nearest-neighbour search over vectors for the English translations, held in <span>translations.embedding</span>. Because much of the commentary is embedded as Pāli, this lane is what lets an English query reach Pāli commentary through its translation.<br>
<i>Blurb embedding.</i> A short, densely thematic one-paragraph description of what each sutta is about, held in <span>blurbs</span>. Because a blurb is brief and on topic, its vector is not diluted by thousands of characters of surrounding narrative, so a thematic query can surface the sutta that is genuinely <i>about</i> the topic even when the body-text lanes drown it.</p>

<p>Vector lookups apply a cosine-distance threshold so that queries with no good semantic match return fewer results rather than irrelevant ones, and a length-aware adjustment keeps single-line verses from crowding out substantial discourses on broad thematic queries. The embeddings are produced by the BGE-M3 multilingual model, the same model and parameters used during ingest. The first Meaning query after the server wakes loads that model and takes roughly a minute and a half; subsequent queries return in well under two seconds.</p>

<p><strong>The alias overlay</strong></p>
<p>The alias table is a curated authority overlay that records cross-tradition term equivalence as an asserted fact: <i>sati</i> with <i>smṛti</i> with <i>念</i>, <i>dhamma</i> with <i>dharma</i> with <i>法</i>, and the English glosses scholars reach for, such as <i>loving-kindness</i> for <i>mettā</i>. Lookups are bidirectional and tolerant of hyphenation and case, so <i>loving kindness</i>, <i>loving-kindness</i>, and <i>Loving Kindness</i> all resolve to the same entry. The overlay remains in place even though vector search approximates the same relationships, because cross-canon equivalence is a curated fact, not an inferred similarity, and the scholar should be able to see and trust where the connection comes from.</p>

<p><strong>Scopes and filters</strong></p>
<p>Each mode can be narrowed by scope (the whole corpus, titles, original-language text, translation text, citation, or the Library) and by layer (Tipiṭaka, Aṭṭhakathā, Ṭīkā, extra-canonical, or Library), and constrained to a piṭaka or a single translator. The scopes and filters compose, so a Meaning query can be restricted to translation text within the Sutta-piṭaka, for instance.</p>
`.trim(),
  },
  {
    slug: 'docs-about-the-corpus',
    title: 'About the corpus',
    summary:
      'What the corpus contains, how it is layered into canon, commentary, sub-commentary, and extra-canonical material, the cross-references to SuttaCentral, and where the texts come from.',
    body: `
<p>The corpus holds roughly 194,710 passages of Pāli text together with their English translations, drawn from the Theravāda canon, its classical commentarial layers, and a body of extra-canonical works. The text follows the structure that scholars expect, divided into four layers.</p>

<p><strong>Tipiṭaka</strong></p>
<p>The canonical mūla, the discourses of the Sutta-piṭaka, the monastic rules of the Vinaya-piṭaka, and the analytical treatises of the Abhidhamma-piṭaka. This is the foundational layer to which the commentaries refer.</p>

<p><strong>Aṭṭhakathā</strong></p>
<p>The classical commentaries, including the Visuddhimagga, Samantapāsādikā, Sumaṅgalavilāsinī, Papañcasūdanī, Sāratthappakāsinī, Manorathapūraṇī, Atthasālinī, and the Khuddaka commentaries. These were ingested at paragraph-level granularity, one retrievable unit per paragraph, so a search returns the specific passage of commentary rather than an entire treatise.</p>

<p><strong>Ṭīkā</strong></p>
<p>The sub-commentaries, the later glosses on the Aṭṭhakathā across the four Nikāyas, the Visuddhimagga, the Abhidhamma, and the Vinaya. These too are held at paragraph-level granularity.</p>

<p><strong>Extra-canonical</strong></p>
<p>A body of works outside the canon and its primary commentaries, drawn from the CST collection.</p>

<p><strong>Cross-references</strong></p>
<p>Passages carry parallels sourced from SuttaCentral. Where a parallel points to a text held in this corpus, it renders as a link you can follow; parallels to Sanskrit, Chinese, or Gāndhārī witnesses that are not yet ingested render as plain references for context.</p>

<p><strong>Sources and licenses</strong></p>
<p>The Pāli text is the Chaṭṭha Saṅgāyana edition prepared by the Vipassana Research Institute. The canonical segmentation and the parallels data come from SuttaCentral's bilara-data and sc-data. English translations come from several sources: Bhikkhu Sujato's translations from SuttaCentral, released to the public domain under CC0; the offline edition of the Access to Insight library, contributed by translators including Ṭhānissaro Bhikkhu, Maurice Walshe, Nyanaponika Thera, Bhikkhu Bodhi, John Ireland, and others, under CC BY-NC 4.0; and material from Buddhist Publication Society editions, indexed under a non-commercial scholarly-use posture with per-passage attribution back to the original publication. Each translation displays its translator and license in the reader.</p>
`.trim(),
  },
  {
    slug: 'docs-dictionary-coverage',
    title: 'Dictionary coverage',
    summary:
      'The five dictionaries behind word lookup, DPD, DPPN, PED, Monier-Williams, and Edgerton, what each one is, and how a lookup resolves a word to its entries.',
    body: `
<p>Selecting a word in any reader, or searching from the Dictionary tab, looks the word up across five dictionaries. Three cover Pāli, two cover Sanskrit. Results are grouped by source so you can weigh them against one another.</p>

<p><strong>DPD, the Digital Pali Dictionary</strong></p>
<p>The Digital Pali Dictionary by Bodhirasa, the primary Pāli lexicon here, with 88,933 headwords. It is paired with a table of 727,678 inflected forms, so an inflected word in a passage resolves to its dictionary headword: <i>sampajāno</i> finds the entry for <i>sampajāna</i>. Licensed CC BY-NC-SA.</p>

<p><strong>DPPN, the Dictionary of Pali Proper Names</strong></p>
<p>Malalasekera's dictionary of proper names, 13,603 entries covering the people, places, and works of the canon as named entities. It fills the gap a general lexicon leaves, the biographical and geographical detail behind a name. This is the 1937 work in the 2025 revision by Ānandajoti.</p>

<p><strong>PED, the Pali-English Dictionary</strong></p>
<p>The Pali Text Society's dictionary by Rhys Davids and Stede, 1921 to 1925, with 15,702 entries, useful as a cross-reference against the DPD on contested meanings. From the 2021 digitization, CC BY-NC 3.0.</p>

<p><strong>Monier-Williams, Sanskrit-English</strong></p>
<p>The Monier-Williams Sanskrit-English Dictionary of 1899, 193,890 entries from the Cologne digitization. It supports Pāli to Sanskrit cognate cross-reference and the reading of Sanskrit material. Headwords are stored in IAST transliteration.</p>

<p><strong>BHS, Buddhist Hybrid Sanskrit</strong></p>
<p>Edgerton's Buddhist Hybrid Sanskrit Dictionary of 1953, 17,839 entries from the Cologne digitization, the companion to Monier-Williams for the transitional Sanskrit of the Mahāyāna sūtras.</p>

<p><strong>How a lookup resolves</strong></p>
<p>A lookup tries the most precise match first and falls back step by step. It begins with an exact match on the headword across every source, so that a Pāli word typed without diacritics still finds its canonical entry. Failing that, for a plain English word it searches the definitions in reverse. It then consults the DPD inflection table, then a stem-prefix match, then a literal prefix, and finally, for the DPD only, decomposes compounds to find their constituent headwords. Each source runs this cascade independently and the results are merged, so a single query can return a DPD inflection, a DPPN proper name, and a PED sense in one response.</p>

<p>The two Sanskrit dictionaries are held under the language tag <span>san</span> and surface only when a lookup requests Sanskrit, so an ordinary Pāli lookup is not diluted by Sanskrit entries.</p>
`.trim(),
  },
  {
    slug: 'docs-sources-and-licenses',
    title: 'Sources and licenses',
    summary:
      'A consolidated note on where the texts, translations, and dictionaries come from and the license each is used under.',
    body: `
<p>This is a non-commercial scholarly tool. Every source is used under its own license, and the reader shows the translator and license on each passage. The licenses are summarised here in one place.</p>

<p><strong>Pāli source text</strong></p>
<p>The Chaṭṭha Saṅgāyana edition from the Vipassana Research Institute, with canonical segmentation and parallels from SuttaCentral's bilara-data and sc-data.</p>

<p><strong>English translations</strong></p>
<p>
Bhikkhu Sujato, from SuttaCentral, dedicated to the public domain under CC0.<br>
The Access to Insight offline library, by Ṭhānissaro Bhikkhu, Maurice Walshe, Nyanaponika Thera, Bhikkhu Bodhi, John Ireland, and others, under CC BY-NC 4.0.<br>
Buddhist Publication Society editions, including translations and commentary by Bhikkhu Bodhi, Ñāṇamoli Thera, Nyanaponika Thera, and Soma Thera, indexed under a non-commercial scholarly-use posture with per-passage attribution to the original publication. This reflects the project's own asserted use, not a Creative Commons grant from the publisher.</p>

<p><strong>Dictionaries</strong></p>
<p>
Digital Pali Dictionary, Bodhirasa, CC BY-NC-SA.<br>
Dictionary of Pali Proper Names, Malalasekera 1937, revised by Ānandajoti 2025.<br>
Pali-English Dictionary, Rhys Davids and Stede 1921 to 1925, 2021 digitization, CC BY-NC 3.0.<br>
Monier-Williams Sanskrit-English Dictionary 1899 and Edgerton's Buddhist Hybrid Sanskrit Dictionary 1953, both from the Cologne Digital Sanskrit Lexicon.</p>

<p><strong>This documentation</strong></p>
<p>The prose of these Docs pages is original to the project and is offered under CC BY 4.0.</p>
`.trim(),
  },
  {
    slug: 'docs-reading-commentary-english',
    title: 'Reading the commentaries in English',
    summary:
      'Most of the commentary is untranslated Pāli. How to read it with the interlinear gloss and word lookup, how to reach it from an English query, and where translations of the commentary do exist.',
    body: `
<p>Most of this corpus is commentary, the Aṭṭhakathā and the Ṭīkā, and most of it has never been translated into English. Only a few percent of the commentarial text carries a translation. This page describes how to read the untranslated commentary, how to find it from an English query, and where the translations that do exist can be found.</p>

<p><strong>Interlinear gloss</strong></p>
<p>The reader's overflow menu offers an interlinear toggle. With it on, each Pāli word in a passage is shown above a short English gloss drawn from the Digital Pali Dictionary, with inflected forms resolved to their headword. This is the primary reading aid for the commentary, where a continuous translation is usually not available. It does not produce fluent English, but it lets a reader with some Pāli follow the sense of a passage word by word.</p>

<p><strong>Word lookup</strong></p>
<p>Selecting any word in the reader opens its dictionary entries, with inflected forms resolved to their headword and compounds decomposed into their parts. For a proper name, the Dictionary of Pali Proper Names supplies the person, place, or work behind it. See <i>Dictionary coverage</i> for how a lookup resolves.</p>

<p><strong>Finding commentary by meaning, in English</strong></p>
<p>Meaning mode can reach Pāli commentary from an English query. Two mechanisms make this work. The passage embeddings carry an appendix of DPD English glosses for each Pāli word, so the semantic vector of an untranslated commentary passage is sharpened toward its English sense. And the alias overlay rewrites an English query into its Pāli equivalents before the search runs, so a search for <i>loving-kindness</i> reaches <i>mettā</i>. Where a commentary passage does carry an English translation, that translation is embedded as well, and a separate retrieval lane matches the English query against it directly. See <i>How search works</i> for the full ranking.</p>

<p><strong>Where the commentary is translated</strong></p>
<p>Some commentarial works are available in English in the reader, shown through the translator switcher on the passage. Ñāṇamoli Thera's translation of the Visuddhimagga is aligned paragraph by paragraph to the Pāli. Bhikkhu Bodhi's translations of four commentaries, on the Brahmajāla, the Mūlapariyāya, the Mahānidāna, and the Sāmaññaphala suttas, are aligned to their sections. Where more than one translator covers a passage, the switcher lists each, with the source and license shown beneath.</p>

<p><strong>A note on use</strong></p>
<p>The interlinear gloss and the dictionary are aids to reading the Pāli, not a substitute for it. A gloss gives a leading sense of a word, which is not always the sense the commentator intends, and it cannot by itself resolve a grammatical homograph from context. Read them as a scaffold for the Pāli, and weigh the dictionary senses against one another where they differ.</p>
`.trim(),
  },
];

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: false });

  const records = DOCS.map((d) => ({
    slug: d.slug,
    title: d.title,
    author: null,
    category: 'docs',
    source: 'dhamma',
    source_url: null,
    body: d.body,
    summary: d.summary,
    tags: null,
    copyright: null,
    license: 'cc-by-4.0',
    year: 2026,
  }));

  console.log(`Upserting ${records.length} docs into articles (category='docs')`);

  for (const r of records) {
    await sql`
      INSERT INTO articles ${sql(r, 'slug', 'title', 'author', 'category', 'source', 'source_url', 'body', 'summary', 'tags', 'copyright', 'license', 'year')}
      ON CONFLICT (slug) DO UPDATE SET
        title      = EXCLUDED.title,
        author     = EXCLUDED.author,
        category   = EXCLUDED.category,
        source     = EXCLUDED.source,
        source_url = EXCLUDED.source_url,
        body       = EXCLUDED.body,
        summary    = EXCLUDED.summary,
        license    = EXCLUDED.license,
        year       = EXCLUDED.year
    `;
    console.log(`  upserted ${r.slug}`);
  }

  const rows = await sql`
    SELECT slug, title, length(body) AS body_len
    FROM articles
    WHERE category = 'docs'
    ORDER BY slug
  `;
  console.log(`\nDocs now in table: ${rows.length}`);
  for (const r of rows) console.log(`  ${r.slug.padEnd(28)} ${String(r.body_len).padStart(5)}  ${r.title}`);

  await sql.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
