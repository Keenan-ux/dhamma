# BPS ingest handoff

A coordinated pass over the Buddhist Publication Society
(bps.lk) catalogue to lift the English commentary, Abhidhamma,
Khuddaka-paratext, and essay layers of dhamma.fly.dev. Built to
hand to a fresh chat.

Read this *after* `CLAUDE.md`, `HANDOFF.md`, and `TRANSLATIONS.md`
for project context.

---

## Posture

Proceeding under fair-use / scholarly-indexing logic. Not asking
permission first. The reasoning:

- BPS's PDF terms forbid "altering" the file. That clause was
  written with whole-file redistribution in mind. Scholarly
  quotation with attribution and link-back is a distinct posture
  that the license neither contemplates nor forbids.
- The use is non-commercial, transformative (passages displayed
  alongside their Pāli source and cross-referenced), preserves
  attribution, and does not substitute for the original (PDFs
  remain freely available at bps.lk).
- A heads-up notification will follow once material is on the
  page, framed as good-faith disclosure rather than permission
  request. BPS retains the practical ability to ask for changes;
  Keenan will honour any reasonable response.
- Permission-first risks an unanswered inbox blocking real work
  for months, or a cautious "no" from someone who hasn't seen the
  attribution discipline in context.

The notification email is a separate workstream and only fires
after at least the Visuddhimagga and the four commentary books
are ingested and rendering correctly with full attribution. See
§"Notification email" at the bottom.

---

## Scope

Six tiers, ordered by value-to-scholarship and difficulty.

### Tier 1 — Visuddhimagga (Ñāṇamoli)

*The Path of Purification*, translation by Bhikkhu Ñāṇamoli of
Buddhaghosa's Visuddhimagga. Single largest English commentary
lift available from any source. Roughly 800 dense pages, 23
chapters following Buddhaghosa's structure (sīla / samādhi /
paññā).

- **Status now:** Pāli Visuddhimagga is in `passages` already
  (part of the 3,470 commentary rows). No English coverage.
- **Source:** bps.lk online library, free PDF (verify current
  filename — historically a single combined PDF).
- **Alignment:** Ñāṇamoli's chapter and section numbering follows
  Buddhaghosa's; the Pāli passages we have are likewise indexed
  by chapter and §. Mapping should be largely mechanical at the
  paragraph level once the PDF is text-extracted.
- **Footnotes:** Ñāṇamoli's footnotes are scholarly content in
  their own right — etymologies, cross-refs to canon, comparisons
  with Tika readings. Decision: store as `translations.notes`
  field (add column if absent) so they surface on the card but
  don't conflate with the translation body.
- **Estimate:** the largest single ingest in the project. Plan
  it as its own workstream after the workflow is proven on Tier 2.

### Tier 2 — Four commentary books (Bodhi)

The original target of the (now-shelved) permission email. All
free PDFs on bps.lk.

- *The All-Embracing Net of Views* (BP209S) — Brahmajāla Sutta
  + its commentary + sub-commentary fragments. ~350 pp.
  PDF: <https://www.bps.lk/olib/bp/bp209s-Bodhi_All-Embracing-Net-Of-Views.pdf>
- *The Discourse on the Root of Existence* (BP210S) —
  Mūlapariyāya Sutta + commentary. ~80 pp.
  PDF: <https://www.bps.lk/olib/bp/bp210s_Bodhi_Root-Of-Existance.pdf>
- *The Great Discourse on Causation* (BP211S) — Mahānidāna Sutta
  + commentary. ~120 pp.
  PDF: <https://www.bps.lk/olib/bp/bp211s_Bodhi_Great-Discourse-n-Causation.pdf>
- *The Discourse on the Fruits of Recluseship* (BP212S) —
  Sāmaññaphala Sutta + commentary. ~200 pp.
  PDF: <https://www.bps.lk/olib/bp/bp212s_Bodhi_Fruits-Of-Recluseship.pdf>

Catalogue-number note: the earlier draft of this handoff had BP211S
and BP212S reversed. The authoritative BPS catalogue (and the
filenames of the PDFs above) confirm BP211S is Mahānidāna and BP212S
is Sāmaññaphala. Per-book passage_id alignment: BP209S → dn1;
BP210S → mn1; BP211S → dn15; BP212S → dn2.

**Alignment:** each book has a structured English translation of
the canonical sutta, then Bodhi's translation of the relevant
commentary section, then a translator's introduction and notes.
Map by:
- Sutta passages → `translations` table aligned to the canonical
  passage_id (e.g. `pli-tv-…dn1…`). Note: many of these already
  have a Sujato translation; the Bodhi rendering is an additional
  translator row, not a replacement. Reader's translator-switcher
  already supports this.
- Commentary passages → `translations` table aligned to the
  `cst-…m.mul-…-a` Aṭṭhakathā passage_ids. This is the bulk of
  the value-add.
- Introduction + endnotes → `articles` table (Library), one
  article per book, tagged `category='author-essay'` author
  `bodhi-bps`.

### Tier 3 — *A Comprehensive Manual of Abhidhamma* (Bodhi)

Bhikkhu Bodhi's translation of Anuruddha's *Abhidhammattha-
saṅgaha* with Bodhi's own extensive explanatory commentary. The
standard English entry point to Abhidhamma. ~450 pp.

- **Status now:** 7,530 Abhidhamma passages in Pāli, near-zero
  English coverage. This lifts an entire piṭaka.
- **Two layers in one book:** Anuruddha's verse text (translation)
  + Bodhi's prose explanation. Distinguish carefully:
  - Anuruddha verses → `translations` with `translator='bodhi'`
    aligned to the corresponding Abhidhammattha-saṅgaha
    passage_id (in our `passages` already).
  - Bodhi's prose commentary → either `translations.notes` on the
    same row OR a separate `commentary_layer` row. Decision:
    propose `notes`, but flag for the maintainer before
    finalising.
- **Tables/diagrams:** the book has substantial tables (cetasika
  associations, citta classifications). These should render in
  the reader; either as HTML tables in `notes` or a side panel.
  Defer the visual layer until the text layer is in.

### Tier 4 — Other Ñāṇamoli translations (BPS)

Niche but unique. None of these have English elsewhere.

- *The Path of Discrimination* — Paṭisambhidāmagga (Khuddaka).
  We have the Pāli; English is rare. ~400 pp.
- *The Guide* — Nettippakaraṇa, exegetical paratext attributed
  to Mahākaccāna. ~250 pp.
- *Minor Readings and Illustrator* — Khuddakapāṭha + its
  commentary Paramatthajotikā I. ~270 pp. Aligns to a small,
  well-defined set of Khp passages.
- *The Life of the Buddha* — chronological Pāli sources
  assembled and translated. Closer to anthology than direct
  translation; ingest as a single Library article rather than
  per-passage rows.
- *Three Cardinal Discourses* (Wheel 17) — short pamphlet.
  Already partially via ATI? Verify before ingesting.
- *Mindfulness of Breathing* (BPS, 1964) — translations of the
  ānāpānasati-relevant suttas with commentary extracts.
  Topically essential; short, well-bounded ingest.

Also in this tier, John D. Ireland's *The Udāna and the
Itivuttaka* (BPS, 1997): the standard English translations of two
Khuddaka books, paired in one volume. Maps cleanly to the
existing Pāli Udāna and Itivuttaka passages; significant English
coverage gain for Khuddaka. Treat as a separate ingest script
since translator is Ireland, not Ñāṇamoli.

### Tier 5 — BPS anthologies and major Wheels

- *Saṁyutta Nikāya: An Anthology*, Bhikkhu Bodhi / Nyanaponika /
  John D. Ireland / M. O'C. Walshe — Wheel 318/319/320, three
  volumes. Partial SN coverage with substantial selections;
  scholar-curated.
- *Aṅguttara Nikāya Anthology*, Nyanaponika / Bodhi — Wheel
  208/211. Abridged AN translations.
- *The Way of Mindfulness*, Bhikkhu Soma — Wheel 19.
  Satipaṭṭhāna Sutta + commentary + sub-commentary in full.
  Critical text for Vipassana practitioners. ATI has a partial
  version; the full BPS Wheel edition is more complete and
  carries the Ṭīkā extracts.
- *The Word of the Buddha*, Nyanatiloka — Wheel-republished
  anthology by topic; classic introductory compilation.
- *Buddhist Dictionary*, Nyanatiloka — manual of Buddhist terms.
  Could supplement the dictionary layer (Pāli term → English
  definition, organised topically). Out of scope for the
  `translations` pipeline; consider a separate `glossary`
  ingest if the dictionary layer expands.
- *Concept and Reality in Early Buddhist Thought*, Bhikkhu
  Ñāṇananda — short monograph on papañca. Article.
- *The Magic of the Mind*, Bhikkhu Ñāṇananda — short monograph.
  Article.
- *The Heart of Buddhist Meditation*, Nyanaponika Thera (BPS,
  originally 1962). Major satipaṭṭhāna work; includes his
  Satipaṭṭhāna Sutta translation + extensive exegesis +
  commentary extracts. Two layers: canonical portions to
  `translations` aligned to MN 10 / DN 22 passage_ids; exegetical
  body as a Library article.
- *The Noble Eightfold Path: The Way to the End of Suffering*,
  Bhikkhu Bodhi — Wheel 308/311. Standard intro; one of his most
  cited shorter works. Article in the Library.
- *Going for Refuge: Taking the Precepts*, Bhikkhu Bodhi —
  Wheel 282/284. Standard refuge/sīla pair. Article.
- *The Buddha's Ancient Path*, Piyadassi Thera (BPS, full-length
  book, not a Wheel). Article, but long — possibly split per
  chapter.
- *The Removal of Distracting Thoughts*, Soma Thera — Wheel on
  Vitakka-saṇṭhāna Sutta + commentary. Pairs with his *Way of
  Mindfulness* above; same ingest pattern.
- *Buddhism Explained*, Khantipalo Bhikkhu (BPS). Standard intro;
  article. Various Khantipalo Wheels also belong in Tier 6.
- **Nyanaponika individual Wheels worth surfacing by name:**
  *The Power of Mindfulness* (W 121/122), *The Roots of Good and
  Evil* (W 251/253), *The Five Mental Hindrances* (W 26), *The
  Four Sublime States* (W 6), *Abhidhamma Studies*. Each an
  article; small but high-citation works.
- **Disciple biographies (the BPS Wheel originals):** Nyanaponika
  authored Wheel-form lives of Sāriputta (W 90/92), Mahā
  Moggallāna, Mahākassapa, Ānanda, and others, later anthologised
  by Wisdom Publications as *Great Disciples of the Buddha*. The
  **Wisdom anthology is out of scope** (commercially
  copyrighted); the **individual BPS Wheels are in scope** and
  carry the same content. Ingest from the Wheels.

Most Wheels are 30–100 pages. Each is an article in the Library
unless it contains substantive translated canonical material, in
which case the canonical portions go to `translations` and the
exegesis goes to `articles`. Decide per-publication.

### Tier 6 — Wider Wheel and Bodhi Leaves catalogue

BPS has hundreds of Wheel publications and Bodhi Leaves pamphlets
by Nyanaponika, Piyadassi, Soma, Ñāṇadassana, Ñāṇananda, Ireland,
Khantipalo, Mahā Kassapa, and others. The ATI selection (56
already in your Library) was opportunistic; a fuller pass would
add many more.

- **Approach:** crawl the bps.lk online library index,
  cross-reference against existing `articles.source_id` rows
  (anything tagged `ati-lib-…` is already in via ATI), ingest the
  delta as new `articles` rows tagged `bps-direct`.
- **De-dup carefully:** some ATI articles are the BPS source
  text. If the same Wheel exists in both, prefer the ATI row (it
  has been on the site longer; preserving stable URLs matters)
  and skip the BPS duplicate. Mark dupes in an internal log so
  the next pass can re-check.

---

## Schema

Existing tables sufficient with minor additions:

- `passages` — unchanged. Pāli text is already in.
- `translations(passage_id, translator, source, license, text,
  notes?)` — add `notes` column if absent (TEXT, nullable).
  Translator-key per book:
  - `bodhi` for the four commentary books and the
    Abhidhammattha-saṅgaha manual
  - `nanamoli` for Visuddhimagga, Paṭisambhidāmagga, Netti,
    Minor Readings
  - Multi-translator anthology rows: use a stable composite
    string, e.g. `bodhi+nyanaponika+ireland`
  - `source_book` column (TEXT) so the card can show "from *The
    All-Embracing Net of Views* (BP209S, 1978)" — add if absent
- `articles` — already supports the Library tab. For BPS-direct
  articles use `source='bps-direct'`, `license='bps-fair-use'`
  (a new license string we're asserting; see "License string"
  below).
- `license` strings:
  - For ATI rows: existing `cc-by-nc-4.0` stays
  - For BPS-direct rows: introduce `bps-fair-use` as a marker
    string. Document it in `server/sql/schema.sql` with a
    comment pointing to this handoff. Display logic should show
    a per-card note: "From BPS publication, used under fair use
    for scholarly indexing. See bps.lk for the source."

---

## Attribution requirements

Every BPS-derived passage and article must carry:

1. The original translator's name on the card
2. The source publication title and catalogue number (e.g.
   "BP209S, 1978")
3. A link back to the bps.lk page for the book (deep link if
   stable, else the bps.lk library index)
4. A short license note: "Used under fair use for non-commercial
   scholarly indexing. Original © Buddhist Publication Society,
   Kandy."

Render this in the same per-card chrome the ATI rows use — small
italic line at the bottom of the passage. Do not introduce new
visual treatment; the discipline is uniformity.

---

## Hard rules

- **Don't redistribute the PDFs.** No raw PDF files in the repo,
  no PDF download links. The site indexes passages; the source
  remains at bps.lk.
- **Don't strip footnotes silently.** Either ingest them into
  `notes` or explicitly drop them with a note in the ingest log
  recording the decision per-book.
- **Don't conflate translators on anthology rows.** A Wheel
  319 passage by Walshe and a Wheel 318 passage by Bodhi are
  different `translator` values, even if they're in the same
  "anthology" mental category.
- **Don't lump in Wisdom Publications material.** *In the
  Buddha's Words*, *Middle Length Discourses*, *Connected
  Discourses*, *Numerical Discourses* are commercially
  copyrighted by Wisdom, not BPS. The fair-use logic does not
  extend to them. Hard stop.
- **Don't ingest anything that's already in via ATI without
  deduplicating.** Check `articles.source_id` and
  `translations.translator + passage_id` before insert.
- **Don't refactor the schema mid-ingest.** If the column
  additions (`notes`, `source_book`) need to happen, do them
  first in a single migration, ingest after.

---

## Pre-flight checks

Before starting:

1. Confirm `flyctl proxy 15432 --app dhamma-pg` is running or
   start it. All ingest scripts target the production DB
   directly.
2. `psql … -c "SELECT translator, COUNT(*) FROM translations
   GROUP BY 1 ORDER BY 2 DESC"` — record current baseline counts
   so you can verify deltas after each tier.
3. Spot-check that bps.lk's PDF library is still up and the
   target PDFs still resolve. Catalogue numbers may have changed
   since this handoff was written.
4. Confirm the `articles.embedding` Meaning-search backfill (an
   open item in CLAUDE.md) is either done or explicitly deferred
   — adding hundreds of new articles will widen the gap.

---

## Phasing recommendation

1. **Schema migrations** (one PR): add `translations.notes` and
   `translations.source_book` columns if absent; document the
   `bps-fair-use` license string in `schema.sql`. Ship and
   verify.
2. **Tier 2** (four commentary books): smallest scope, validates
   the PDF→structured pipeline. Build the per-book ingest script
   under `scripts/ingest/ingest-bps-bodhi-cy.mjs`. Verify
   alignment to existing canonical and Aṭṭhakathā passage_ids.
3. **Tier 3** (Abhidhamma manual): proves the two-layer pattern
   (Anuruddha + Bodhi's commentary as `notes`).
4. **Tier 1** (Visuddhimagga): largest single ingest. Worth its
   own focused session.
5. **Tier 4** (other Ñāṇamoli): individual ingest scripts per
   book, smaller and incremental.
6. **Tier 5 + 6** (anthologies + wider Wheels): batch ingest with
   careful de-dup against ATI.
7. **Notification email** — only after Tier 1–3 are visible on
   the live site. See below.

Each tier ends with: a smoke test on prod (`curl …/api/search`
for a known passage that should now have new English coverage),
a count delta recorded in `TRANSLATIONS.md`, and a commit per
tier.

---

## Notification email

After Tier 1–3 are live, send a short notification email to
`info@bps.lk` and `cnt@bps.lk`. Posture: disclosure and
invitation, not permission request. Draft to be written by the
new session once the work is on the page; the email points to
concrete URLs they can click and review.

Tone: scholarly, not apologetic, not consultative. Same register
as the ATI email that was sent. Sign-off: Keenan,
keenan@boothcheck.com.

Do not send the notification before the work is visible. The
whole point of this posture is that BPS responds to something
concrete, not a description.

---

## What's explicitly out of scope

- Wisdom Publications material (Bodhi's MN/SN/AN/AN/IBW
  translations). Commercially copyrighted.
- PTS Pali Text Society editions of canonical texts (PTS PED
  itself is already in via DPD). Their other publications are a
  separate licensing question.
- BPS Sinhala-language publications. Out of audience scope.
- Audio recordings on bps.lk (the BPS lecture series). Different
  medium, different ingest pipeline.
- Bhikkhu Anālayo's work — published by Hamburg / Numata Center
  / Wisdom variously, not BPS. Separate audit per
  `TRANSLATIONS.md` §Other translator gaps.

---

## Files this work will touch

- `server/sql/schema.sql` — migrations for `notes`,
  `source_book`, license-string comment
- `scripts/ingest/ingest-bps-bodhi-cy.mjs` — new, Tier 2
- `scripts/ingest/ingest-bps-abhidhamma.mjs` — new, Tier 3
- `scripts/ingest/ingest-bps-visuddhimagga.mjs` — new, Tier 1
- `scripts/ingest/ingest-bps-nanamoli-misc.mjs` — new, Tier 4
- `scripts/ingest/ingest-bps-anthologies.mjs` — new, Tier 5
- `scripts/ingest/ingest-bps-wheels.mjs` — new, Tier 6
- `TRANSLATIONS.md` — update §"Currently live in prod" tables
  after each tier; remove the "blocked" framing from Bodhi
  commentary section
- `CLAUDE.md` — bump the "State as of last handoff" passage and
  translation counts
- `src/PassageCard.jsx` and friends — minor display updates if
  the per-card license note needs new chrome

No frontend changes should be needed for the Library tab to
surface new articles; the existing renderer is data-driven.
