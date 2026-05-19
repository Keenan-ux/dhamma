# Dictionaries roadmap

Tracking the expansion of dictionary coverage beyond DPD. Six sources
have been agreed on, ordered by expected user-facing value:

| # | Dictionary | Status | Why |
|---|---|---|---|
| 1 | **DPPN** — Pali Proper Names (Malalasekera, 1937; rev. Ānandajoti 2025) | **done** | Fills DPD's biggest gap: people, places, suttas as proper names. 13,603 entries live in prod. |
| 2 | **PED** — Pali-English Dictionary (Rhys Davids & Stede, 1921–25) | **done** | Cross-reference against DPD on contested word meanings. 15,702 entries live in prod (CC BY-NC 3.0). |
| 3 | **Monier-Williams Sanskrit-English** | **NEXT** | Pali↔Sanskrit cognate cross-ref; preparation for Mahāyāna corpus. |
| 4 | BHS — Buddhist Hybrid Sanskrit (Edgerton) | pending | Edge case; matters once Mahāyāna lands. |
| 5 | CPD — Critical Pali Dictionary | pending | Scholarly gold standard but incomplete (alphabetical) and harder to extract. |
| 6 | Buddhadatta — Concise Pali-English | pending | Mostly redundant with DPD; low priority. |

After each one ships, return to this file and flip its row.

---

## Starting state (as of this handoff)

- Live at https://dhamma.fly.dev/ — 25,986 passages, 5,113 with English translations.
- Three dictionaries integrated:
  - **DPD** (Digital Pali Dictionary, Bodhirasa) — 88,933 headwords +
    727,678 inflection mappings. source='dpd'.
  - **DPPN** (Dictionary of Pali Proper Names, Malalasekera 1937,
    rev. Ānandajoti 2025) — 13,603 entries. source='dppn'.
  - **PED** (PTS Pali-English Dictionary, Rhys Davids & Stede 1921-25,
    digitized by Buddhadust 2021) — 15,702 entries, CC BY-NC 3.0.
    source='ped'.
- Verify the DB counts:
  ```bash
  PYTHONIOENCODING=utf-8 DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
    /c/Dev/Dhamma/scripts/ingest/.venv/Scripts/python.exe -c "
    import os, psycopg2
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(\"SELECT source, count(*) FROM dictionary_entries GROUP BY source\")
    for r in cur.fetchall(): print(r)
    "
  ```
  Expect: `('dpd', 88933)`, `('dppn', 13603)`, and `('ped', 15702)`.

  Or from prod via curl:
  ```bash
  curl -s "https://dhamma.fly.dev/api/lookup?term=dhamma" | jq '.entries | group_by(.source) | map({source: .[0].source, n: length})'
  ```
  Expect entries from all three sources, e.g.
  `[{"source":"dpd","n":10},{"source":"dppn","n":3},{"source":"ped","n":1}]`.

---

## How dictionary lookup currently works

[server/src/dictionary.js](server/src/dictionary.js) — `/api/lookup?term=X`.

The cascade, in order of preference:

0. **Headword/lemma exact across all sources**: case-insensitive match
   on `headword_lower` or `lemma_lower`. Runs FIRST so that
   diacritic-free Pali words (`sati`, `dhamma`, `buddha`) find their
   DPD/DPPN/PED lemmas before being shunted into english-reverse.
1. **English-reverse** (only if step 0 found nothing): if `term` has no
   Pali diacritics and is plain ASCII letters, search `definition*`
   columns for the term as a whole word. Returns
   `matched_via='english-reverse'`. Per-source LIMIT to keep one
   source's short defs from crowding out the others'.
2. **Inflection table** (DPD only): `dictionary_inflections.surface_lower`
   → entry. Per source.
3. **Pali stem prefix**: `paliStem.stemForPrefix(q)` then headword
   prefix.
4. **Literal prefix**: `headword LIKE q || '%'`.
5. **Compound decomposition** (DPD only): scan for DPD headwords that
   appear as substrings of the term (with long-vowel sandhi expansion).
   Catches `maggādhipatino` → finds `magga`. Skipped for proper-name
   and PED sources to avoid noise.

Steps 2-5 are the `paliCascadeFallback` — each source independently
finds its first hit. The merged result groups by source in the UI.

All three sources (DPD, DPPN, PED) live in the **same
`dictionary_entries` table**, distinguished by `source`. The default
source set is `['dpd', 'dppn', 'ped']`; pass `?source=dpd` (or
`?source=dpd,ped`) to restrict.

---

## Schema (existing, don't touch unless you need to)

```sql
CREATE TABLE dictionary_entries (
  id             BIGSERIAL PRIMARY KEY,
  source         TEXT NOT NULL,           -- 'dpd', 'dppn', 'ped', 'mw', ...
  source_id      TEXT,                    -- the dictionary's own id (e.g. "Sāriputta")
  headword_lower TEXT,                    -- bare canonical form (lowercase, no diacritic strip)
  lemma          TEXT NOT NULL,           -- display form
  lemma_lower    TEXT NOT NULL,
  language       TEXT NOT NULL DEFAULT 'pli',
  pos            TEXT,                    -- 'name' for DPPN
  grammar        TEXT,                    -- gendered category if relevant ("m.", "f.")
  definition     TEXT NOT NULL,           -- the biographical text for DPPN
  definition_lit TEXT,
  definition_alt TEXT,
  sanskrit       TEXT,
  construction   TEXT,
  root           TEXT,
  example        TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_id)
);
```

No schema migration needed — `source='dppn'` is just a new value.

---

## Task 1: DPPN ingest — DONE

Shipped: 13,603 DPPN entries live in prod at https://dhamma.fly.dev/
under `source='dppn'`. Lookup defaults to both DPD and DPPN; results
group by source in DictionaryView and the in-passage LookupPanel.

What landed:

- [scripts/ingest/ingest-dppn.mjs](scripts/ingest/ingest-dppn.mjs) —
  pulls `DPPN.json` from ancient-buddhist-texts.net (the 2025
  Ānandajoti revision), strips 38 alphabet-section dividers, extracts
  the bare lemma from the first `<b>` in each entry's `name`, uses the
  HTML-stripped `<span class="Head">` text as `source_id` (auto-numbered
  on the 29 unnumbered duplicates), and stores `name + entry` as the
  full HTML `definition`.
- [server/src/dictionary.js](server/src/dictionary.js) — refactored
  into a per-source `paliCascade(q, source, language)` that runs the
  forward steps (headword → inflection (DPD only) → stem-prefix →
  literal prefix → compound (DPD only)) independently for each source
  and merges. This is what lets "Vesāli" hit DPD via inflection AND
  DPPN's `Vesālī` via literal-prefix in the same response. The
  english-reverse step queries each source with its own LIMIT so
  DPPN's long biographies aren't crowded out by DPD's short defs.
- [src/dictHtml.js](src/dictHtml.js) — sanitizer for DPPN's HTML
  (allowlist of `<b>`, `<i>`, `<em>`, `<strong>`, `<abbr title=…>`,
  `<p>`, `<span>` — strips all classes and other attrs via DOMParser
  walk, not regex), plus a `prepareDppnHtml` that drops the
  duplicate `<span class="Head">` prefix before sanitizing, and a
  `groupEntriesBySource` helper.
- [src/DictionaryView.jsx](src/DictionaryView.jsx) and
  [src/BrowseView.jsx](src/BrowseView.jsx) (LookupPanel) — render
  entries grouped by source with a small uppercase header per group.
  DPPN entries longer than 600 chars (400 in the popover) collapse
  with a gradient fade + "Show more" toggle.

Smoke check (live):

```bash
curl -s "https://dhamma.fly.dev/api/lookup?term=S%C4%81riputta" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      const d = JSON.parse(s);
      const bySrc = {};
      for (const e of d.entries) (bySrc[e.source] ||= []).push(e.source_id || e.lemma);
      console.log(bySrc);
    })"
```

Expect `{ dpd: [ 'sāriputta' ], dppn: [ 'Sāriputta 01. ...', ..., 'Sāriputta 05' ] }`.

Known follow-ups (small, optional):

- `looksEnglish` returns true for diacritic-free Pali words like
  `buddha`, `dhamma`, `sutta`. They get sent to english-reverse first
  even though the user usually wants the Pali headword. DPPN saves us
  here (Buddha/Dhamma surface as proper-name entries in the DPPN
  half), but we could prefer headword over english-reverse when the
  headword exists exactly. Not blocking — log this for a future pass.
- DPPN proper names that share a bare lemma with a Pali word but
  differ in final vowel length (Tipiṭaka's `Vesāli` vs DPPN's `Vesālī`)
  match only via the literal-prefix step today. A small "final-vowel
  flex" pass at the headword step would catch these before falling
  through. Again — optional.

---

## Standing project rules (don't violate)

- **No Tailwind.** Inline styles with `var(--bc-*)` tokens only.
- **No LLM at runtime by default.** DPPN is a static data ingest, not
  AI translation — fine.
- **Pin model & DB versions.** No re-embedding needed for DPPN
  (dictionary entries don't have vectors).
- **Quiet, scholarly tone.** No marketing copy in UI.
- **Bias toward forward motion.** After ingesting, write the smoke
  check, deploy, and tee up Task 2 (PED) in DICTIONARIES.md.

## Working notes (carry-over)

- The flyctl proxy on :15432 may have died — restart with
  `flyctl proxy 15432:5432 --app dhamma-pg` if needed.
- DB password lives in Fly secrets on the `dhamma` app
  (`flyctl ssh console --app dhamma --command "printenv DATABASE_URL"`
  after a wake-up curl).
- `scripts/ingest/.venv/` has the Python environment with psycopg2 etc.
- Ingest pattern reference now includes
  [scripts/ingest/ingest-dpd.mjs](scripts/ingest/ingest-dpd.mjs) (TSV
  source, has inflections) and
  [scripts/ingest/ingest-dppn.mjs](scripts/ingest/ingest-dppn.mjs)
  (JSON source, no inflections, HTML definitions). Pick whichever is
  closer to the next source's shape.

---

## Task 2: PED ingest — DONE

Shipped: 15,702 PED entries live in prod at https://dhamma.fly.dev/
under `source='ped'`. Lookup defaults to cascading across DPD + DPPN
+ PED; results group by source in DictionaryView and the in-passage
LookupPanel.

What landed:

- [scripts/ingest/ingest-ped.mjs](scripts/ingest/ingest-ped.mjs) —
  unzips `Tabfile_PTSPED-2021.zip` from
  [vpnry/ptsped](https://github.com/vpnry/ptsped) (the Buddhadust
  digitization, proofread 2021, CC BY-NC 3.0), parses
  `headword\tHTML-definition` lines, skips the 3 metadata rows
  (000License/001info/002info). One row per headword — PED merges
  multi-sense entries inline via `<b>Dhamma<sup>1</sup></b>...
  <b>Dhamma<sup>2</sup></b>...` rather than separate rows, so the
  earlier handoff's "decompose to dhamma 1, dhamma 2" speculation
  turned out unnecessary.
- [server/src/dictionary.js](server/src/dictionary.js) — refactored
  so headword/lemma exact match runs as a cross-source **step 0**
  before english-reverse. This fixes the looksEnglish gotcha from
  the DPPN handoff: typing `sati`, `dhamma`, or `buddha` (no
  diacritics) used to get shunted into english-reverse and miss the
  canonical DPD lemma whose English gloss didn't happen to contain
  the Pali word as English prose. Now `sati` returns 4 DPD + 1 PED
  via headword in ~4 ms warm. The per-source fallback cascade
  (`paliCascadeFallback`) keeps its inflection/stem-prefix/prefix/
  compound steps for everything step 0 misses.
- [src/dictHtml.js](src/dictHtml.js) — added `<sup>` and `<sub>` to
  the sanitizer allowlist (PED uses superscripts for sense numbers
  and citation refs). Added `preparePedHtml` (thin wrapper over
  `sanitizeDictHtml`; PED bodies start with the bold lemma already,
  no head-span to strip). New `ped` entry in `SOURCE_LABEL`.
- [src/DictionaryView.jsx](src/DictionaryView.jsx) and
  [src/BrowseView.jsx](src/BrowseView.jsx) — both `DictEntry` and
  `LookupEntry` now dispatch via a `HTML_PREPARERS` map
  (`{ dppn, ped }`), so adding a fourth HTML source later is one
  line. Collapse-on-long-entry behavior reused for PED (PED's
  `dhamma` entry is 33 KB; `nibbāna` 24 KB — they need it).

Smoke check (live):

```bash
curl -s "https://dhamma.fly.dev/api/lookup?term=dhamma" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      const d = JSON.parse(s);
      const bySrc = {};
      for (const e of d.entries) (bySrc[e.source] ||= []).push(e.source_id || e.lemma);
      console.log('matched_via:', d.matched_via);
      console.log(bySrc);
    })"
```

Expect `matched_via: headword` with entries from `dpd`, `dppn`,
AND `ped`.

---

## Side-quest: pg_trgm GIN on definition — DONE

`CREATE EXTENSION pg_trgm` already existed in the cluster (from
elsewhere). Added the GIN index live via the proxy and reflected it in
[server/sql/schema.sql](server/sql/schema.sql) so it persists across
container rebuilds:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_dict_def_trgm
  ON dictionary_entries USING GIN (definition gin_trgm_ops);
```

Observation: with `LIMIT 10`, the planner usually still picks a seq
scan because early-exit makes the seq path cheap enough on paper. When
forced (`SET enable_seqscan = off`), the bitmap index path runs the
same query in ~15 ms vs ~30 ms for the seq path — a real but modest
win. The index is still worth having for selective terms where seq
scan would need to walk the full table; the planner picks correctly
in those cases. Most of the 425 ms total on `monastery` is the
sequential regex scan over DPPN's very long biographical paragraphs,
which no index helps with structurally — that's a re-modeling problem
(e.g. sentence-level chunks) rather than an index problem. Live with
it.

---

## Task 3: Monier-Williams Sanskrit-English ingest

The canonical Sanskrit-English dictionary (Monier Monier-Williams,
1899). Two reasons it matters for Dhamma:

1. **Pali↔Sanskrit cognate cross-ref.** DPD and PED both include a
   Sanskrit cognate (`saṃsāra ← saṃsāra`, `dhamma ← dharma`,
   `nibbāna ← nirvāṇa`) in their `sanskrit` field. Today that field
   renders as plain text. With MW in the table the Sanskrit form can
   become a clickable lookup that fetches the full MW entry — turning
   a one-word footnote into "now show me what Sanskrit thought about
   this term."
2. **Preparation for Mahāyāna corpus.** When the Mahāyāna branch
   (currently a stub) gets ingested, its passages are Sanskrit-original.
   MW is the obvious dictionary for them.

### Source options

Try in order — structured beats scraped:

1. **GitHub** — search "monier-williams sanskrit-english json" or
   "monier williams cologne" (the Cologne Digital Sanskrit Dictionaries
   project digitized MW; their data shows up in a few mirrors).
   Concrete leads to try:
   - https://github.com/sanskrit-coders/stardict-sanskrit (StarDict
     bundles of various Skt dictionaries, MW included — same shape as
     the vpnry/ptsped repo we used for PED)
   - https://github.com/sanskrit/data (the broader sanskrit org)
   - https://github.com/funderburkjim/MWS (Monier-Williams Source —
     the Cologne XML)
2. **Cologne Digital Sanskrit Dictionaries** — https://www.sanskrit-lexicon.uni-koeln.de/
   ships the source XML/CSV directly. Authoritative; expect a download
   page.
3. **DSAL (U Chicago)** — https://dsal.uchicago.edu/dictionaries/macdonell/
   serves MW + macdonell + apte via a search UI. Probably has dumps
   somewhere. Their data tends to follow the same encoding (UTF-8,
   marked-up with the Cologne tagging scheme).

The Cologne data is the original digitization; everything downstream
derives from it. If a structured GitHub mirror is convenient, use it;
otherwise go to Cologne directly.

### Encoding caveat

Sanskrit uses a wider diacritic set than Pali: long vowels (ā ī ū ē
ō), retroflex consonants (ṭ ḍ ṇ ṣ ṛ ṝ ḷ), palatal sibilants (ś),
visarga (ḥ), candrabindu, and vocalic r (ṛ ṝ). The MW source data
may use SLP1, IAST, Velthuis, or HK encoding — convert to IAST
(matches our Pali storage convention) before insert. The Cologne data
typically uses SLP1; conversion libraries exist (npm:
`sanscript`, `sanskrit-roman`, or the C++ `transliterator` cli).

### Acceptance criteria

- Rows land in `dictionary_entries` with `source='mw'`.
- `language='san'` (NOT `'pli'`) — first non-Pali source.
- `lemma` = the Sanskrit headword in IAST (e.g. "dharma", "nirvāṇa",
  "saṃsāra"). Lowercase. Preserve diacritics.
- `lemma_lower` = `lemma.toLowerCase()` (already lowercase, but keep
  the convention).
- `headword_lower` = same. (Sanskrit nouns inflect heavily — eight
  cases × three numbers × three genders — but MW headwords are
  citation forms only. Skip the inflection table; the user typing an
  inflected Skt form is rare and DPD handles its Pali-side inflections.)
- `definition` = entry body. Keep HTML if the source ships it (use
  `preparePedHtml`-style sanitizing); otherwise plain text.
- `pos`, `grammar` — populate if the source data exposes them
  (Sanskrit grammar is rich; MW marks gender, root, derivation).

### Lookup wiring

`runLookup` already handles multi-source via
`source = ANY(${sources})`. To include MW:

1. Add `'mw'` to the default-sources array. **But:** MW is Sanskrit,
   not Pali. The default `language='pli'` filter would exclude it.
   Either:
   - Drop the `language` filter from runLookup's queries (matches all
     languages by default), or
   - Add a parallel `language=ANY([...])` filter so MW (`san`) is
     queried alongside DPD/DPPN/PED (`pli`).

   Drop the filter — it's a fixture left from when this was Pali-only.
   The `source` filter alone is enough; if the user wants
   language-restricted lookups they can pass `?language=pli`.

2. MW probably has no inflection table — follow the DPPN/PED cascade
   shape in `paliCascadeFallback` (skip the inflection step). The
   `if (source === 'dpd')` checks already handle this.

3. For Pali → Sanskrit bridging: when a DPD entry has a non-empty
   `sanskrit` field, the UI could render the Skt form as a button that
   triggers `lookupApi({ term: e.sanskrit, source: 'mw' })`. New
   interaction; not strictly part of the ingest but the whole reason
   MW gets first prize after PED.

### UI wiring

Add `mw` to `SOURCE_LABEL` in [src/dictHtml.js](src/dictHtml.js):

```js
mw: { name: 'Monier-Williams Sanskrit-English', short: 'MW',
      attribution: 'Monier-Williams, 1899' }
```

Plus `prepareMwHtml` (probably identical to `preparePedHtml` —
sanitize-only — unless MW ships custom markup that needs special
handling). The `HTML_PREPARERS` map in DictionaryView and BrowseView
gets one new entry.

The DPD entry component already shows `e.sanskrit` in the footer; turn
it into a clickable lookup link (see "Lookup wiring" item 3 above)
to make the Skt cross-ref the headline feature of this ingest.

### Smoke check (after deploy)

```bash
curl -s "https://dhamma.fly.dev/api/lookup?term=dharma&source=mw" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      const d = JSON.parse(s);
      console.log('matched_via:', d.matched_via);
      console.log('entries:', d.entries.length);
      console.log('first entry:', d.entries[0]?.lemma, '·', d.entries[0]?.definition?.slice(0, 150));
    })"
```

Plus the combined check — `?term=dhamma` (Pali) should still return
DPD + DPPN + PED entries; adding MW should NOT regress those because
MW headwords are Sanskrit (`dharma`, not `dhamma`).

---

## After Monier-Williams: queue for next sessions

- **Task 4 (BHS — Buddhist Hybrid Sanskrit, Edgerton 1953)**: matters
  once Mahāyāna passages land; covers transitional Skt forms the pure
  MW doesn't.
- **Task 5 (CPD — Critical Pali Dictionary)**: scholarly gold standard
  but incomplete (alphabetical, never finished past T). High effort to
  extract; deliberately deferred until the Pali side is otherwise
  saturated.
- **Task 6 (Buddhadatta — Concise Pali-English)**: mostly redundant
  with DPD; lowest priority.
