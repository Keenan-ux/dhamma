# Dictionaries roadmap

Tracking the expansion of dictionary coverage beyond DPD. Six sources
have been agreed on, ordered by expected user-facing value:

| # | Dictionary | Status | Why |
|---|---|---|---|
| 1 | **DPPN** — Pali Proper Names (Malalasekera, 1937; rev. Ānandajoti 2025) | **done** | Fills DPD's biggest gap: people, places, suttas as proper names. 13,603 entries live in prod. |
| 2 | **PED** — Pali-English Dictionary (Rhys Davids & Stede, 1921–25) | **NEXT** | Cross-reference against DPD on contested word meanings. |
| 3 | Monier-Williams Sanskrit-English | pending | Pali↔Sanskrit cognate cross-ref; preparation for Mahāyāna corpus. |
| 4 | BHS — Buddhist Hybrid Sanskrit (Edgerton) | pending | Edge case; matters once Mahāyāna lands. |
| 5 | CPD — Critical Pali Dictionary | pending | Scholarly gold standard but incomplete (alphabetical) and harder to extract. |
| 6 | Buddhadatta — Concise Pali-English | pending | Mostly redundant with DPD; low priority. |

After each one ships, return to this file and flip its row.

---

## Starting state (as of this handoff)

- Live at https://dhamma.fly.dev/ — 25,986 passages, 5,113 with English translations.
- Two dictionaries integrated:
  - **DPD** (Digital Pali Dictionary, Bodhirasa) — 88,933 headwords +
    727,678 inflection mappings. source='dpd'.
  - **DPPN** (Dictionary of Pali Proper Names, Malalasekera 1937,
    rev. Ānandajoti 2025) — 13,603 entries. source='dppn'.
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
  Expect: `('dpd', 88933)` and `('dppn', 13603)`.

  Or from prod via curl:
  ```bash
  curl -s "https://dhamma.fly.dev/api/lookup?term=S%C4%81riputta" | jq '.entries | group_by(.source) | map({source: .[0].source, n: length})'
  ```
  Expect `[{ "source": "dpd", "n": 1 }, { "source": "dppn", "n": 5 }]`.

---

## How dictionary lookup currently works

[server/src/dictionary.js](server/src/dictionary.js) — `/api/lookup?term=X`.

The cascade, in order of preference:

1. **English-reverse**: if `term` has no Pali diacritics and is plain
   ASCII letters, search `definition*` columns for the term as a
   whole word. Returns `matched_via='english-reverse'`. Added recently
   so e.g. selecting "monastery" in a translation pane returns the
   Pali words *meaning* monastery (vihāra, ārāma, …).
2. **Headword/lemma exact**: case-insensitive match on `headword_lower`
   or `lemma_lower`.
3. **Inflection table**: `dictionary_inflections.surface_lower` → entry.
4. **Pali stem prefix**: `paliStem.stemForPrefix(q)` then headword prefix.
5. **Literal prefix**: `headword LIKE q || '%'`.
6. **Compound decomposition**: scan for DPD headwords that appear as
   substrings of the term (with long-vowel sandhi expansion). Catches
   `maggādhipatino` → finds `magga`. Pali-only — skipped when the term
   looks English.

DPPN entries will live in the **same `dictionary_entries` table**,
just with `source='dppn'`. All the existing cascade steps (except
inflection-table, which DPPN doesn't need) will work on them
automatically.

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

## Task 2: PED ingest

PTS's **Pali-English Dictionary** (Rhys Davids & Stede, 1921–25). The
canonical Western Pali lexicon for ~80 years until DPD. Useful as a
cross-reference on contested word meanings — DPD's meanings sometimes
modernize PTS's nineteenth-century glosses and a scholar will want to
see both.

### Source options

1. **GitHub** — try in order:
   - https://github.com/jakubkr/pali-english-dictionary (mentioned in
     the previous handoff)
   - search "PED pali english dictionary json" / "Rhys Davids Stede
     pali dictionary"
   - bitbucket / GitLab mirrors
2. **archive.org** — original PTS scans, OCR available but quality
   varies for diacritics. Last resort.
3. **suttacentral** — they sometimes bundle PED alongside other
   dictionaries; check their data repos.

Same preference: structured > scrape.

### Acceptance criteria

- Rows land in `dictionary_entries` with `source='ped'`.
- `lemma` preserves diacritics in lowercase Pali form (matches DPD
  convention — DPD lemmas are lowercase: `sati`, `dhamma`,
  `anāthapiṇḍika`).
- `lemma_lower` = `lemma.toLowerCase()`.
- `headword_lower` = same (PED doesn't decline either; same as DPPN
  in that respect).
- `pos`, `grammar`, `definition_lit`, `sanskrit`, etc. — populate
  whatever the source data exposes; null is fine for the rest.
- `definition` = the entry body. PED entries cite Sanskrit cognates
  and PTS canonical references; keep those inline.
- `source_id` = lemma + numeric disambiguator when PED itself
  numbers senses (PED uses superscripts like `dhamma¹`, `dhamma²`).
  Decompose to plain `dhamma 1`, `dhamma 2` for storage.

### Lookup wiring

The per-source cascade in [server/src/dictionary.js](server/src/dictionary.js)
already takes `source = ANY(${sources})`. Add `'ped'` to the
default-sources array. PED should follow the DPD cascade shape
(headword → inflection if PED ships one → stem-prefix → literal prefix
→ compound), not DPPN's shorter cascade.

### UI wiring

Add `ped` to `SOURCE_LABEL` in [src/dictHtml.js](src/dictHtml.js) with
the academic citation form: `{ name: 'Pali-English Dictionary',
short: 'PED', attribution: 'Rhys Davids & Stede, 1921–25' }`. The
group rendering in DictionaryView/LookupPanel already loops over
sources — adding the label is the only UI touch.

If PED ships HTML markup (italic for Sanskrit cognates, bold for
cross-references), reuse `sanitizeDictHtml` and add a render branch in
the two entry components mirroring the DPPN path.

### Smoke checks (after deploy)

Use a word with diacritics for the headword path — `dhamma` without
the macron trips `looksEnglish()` and routes through english-reverse
first (known follow-up from the DPPN handoff). `nibbāna` or `paññā`
exercise the per-source paliCascade cleanly:

```bash
curl -s "https://dhamma.fly.dev/api/lookup?term=nibb%C4%81na" \
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

Belt-and-suspenders DB check:

```bash
DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
  /c/Dev/Dhamma/scripts/ingest/.venv/Scripts/python.exe -c "
  import os, psycopg2
  conn = psycopg2.connect(os.environ['DATABASE_URL'])
  cur = conn.cursor()
  cur.execute(\"SELECT source, count(*) FROM dictionary_entries GROUP BY source ORDER BY source\")
  for r in cur.fetchall(): print(r)
  "
```

Expect `('dpd', 88933)`, `('dppn', 13603)`, and a new `('ped', N)`
row where N is whatever the chosen source data contained (PTS PED has
roughly ~14,000 entries; structured GitHub dumps may have fewer if
they only cover the alphabetically-completed portion).

---

## Optional side-quest while you're in dictionary.js

The english-reverse step does a sequential regex scan over
`definition` / `definition_alt` / `definition_lit` across every
source. After PED lands the table will be ~115K rows; current
`monastery` query is ~316ms (auditor measured on the DPPN audit) and
will get slower with PED. A `pg_trgm` GIN index on `definition`
brings the same query under 50ms:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_dict_def_trgm
  ON dictionary_entries USING GIN (definition gin_trgm_ops);
```

Add to server/sql/schema.sql so it applies on next boot. The regex
word-boundary in the existing query (`~* '\mfoo\M'`) already plays
well with the trigram index — no rewrite needed.

Not blocking the PED task — but if you have 15 minutes after the
ingest while waiting on deploy, this is a clean perf win.

---

## After PED: queue for next sessions

- **Task 3 (Monier-Williams)**: clean JSON dumps on GitHub (search
  "monier-williams sanskrit-english json"). source='mw'.
  Will need `language='san'` in some rows since MW is Sanskrit not Pali.
  Will surface naturally when the user clicks a Pali word whose DPD
  entry includes a Skt. cognate — the Skt. field becomes a clickable
  link into MW.
- **Tasks 4–6**: TBD when those become relevant.
