# Dictionaries roadmap

Tracking the expansion of dictionary coverage beyond DPD. Six sources
have been agreed on, ordered by expected user-facing value:

| # | Dictionary | Status | Why |
|---|---|---|---|
| 1 | **DPPN** — Pali Proper Names (Malalasekera, 1937) | **NEXT** | Fills DPD's biggest gap: people, places, suttas as proper names. |
| 2 | PED — Pali-English Dictionary (Rhys Davids & Stede, 1921–25) | pending | Cross-reference against DPD on contested word meanings. |
| 3 | Monier-Williams Sanskrit-English | pending | Pali↔Sanskrit cognate cross-ref; preparation for Mahāyāna corpus. |
| 4 | BHS — Buddhist Hybrid Sanskrit (Edgerton) | pending | Edge case; matters once Mahāyāna lands. |
| 5 | CPD — Critical Pali Dictionary | pending | Scholarly gold standard but incomplete (alphabetical) and harder to extract. |
| 6 | Buddhadatta — Concise Pali-English | pending | Mostly redundant with DPD; low priority. |

After each one ships, return to this file and flip its row.

---

## Starting state (as of this handoff)

- Live at https://dhamma.fly.dev/ — 25,986 passages, 5,113 with English translations.
- One dictionary integrated: **DPD** (Digital Pali Dictionary, Bodhirasa).
  88,933 headwords + 727,678 inflection mappings, source='dpd'.
- Verify the DB count:
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
  Expect: `('dpd', 88933)`.

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

## Task 1: DPPN ingest

### What DPPN is

Malalasekera's **Dictionary of Pali Proper Names** (1937–38). Two
volumes, ~7,000 entries covering every person, place, monastery,
mountain, sutta, work, mythical being, and term-of-art referenced in
the Pali Tipiṭaka and its commentaries. Each entry is a short
biographical/contextual paragraph with references to source texts.

Example entry shape (Sāriputta):

> A monk in the Buddha's time, the chief of the Buddha's disciples,
> together with Mahā-Moggallāna. He was born in the brahmin village
> of Upatissa (Nāḷaka), near Rājagaha, on the same day as Moggallāna…
> [continues for ~2,000 words, with refs like (Vin.i.39, DA.i.13, …)]

### Source options (pick one — try in order)

1. **palikanon.com** — has DPPN as static HTML pages, one per entry.
   Easy to scrape. Look at `https://www.palikanon.com/english/pali_names/`.
2. **GitHub** — search for "dictionary-of-pali-proper-names" or "DPPN
   data". As of recent years a few people have made structured (JSON,
   markdown) versions. Check:
   - https://github.com/digitalpalitools (the DPD org's other repos)
   - https://github.com/suttacentral (their data sets sometimes include
     auxiliary dictionaries)
3. **ancient-buddhist-texts.net** — has DPPN entries, less structured.
4. **archive.org** — has scans of the original PTS edition; OCR
   quality varies.

GitHub > palikanon.com > scrape. Structured beats unstructured.

### Acceptance criteria for the ingest

- All DPPN entries land in `dictionary_entries` with `source='dppn'`.
- `lemma` = the entry's headword as DPPN gives it (proper case,
  preserve diacritics: "Sāriputta", "Anāthapiṇḍika", "Vesāli").
- `lemma_lower` = `lemma.toLowerCase()` (Postgres lower preserves
  diacritics; matching uses lowercased form).
- `headword_lower` = same as `lemma_lower` for DPPN (no inflection
  variants to canonicalize).
- `pos` = `'name'` for everyone.
- `definition` = the entry's full body text. Can be long (sometimes a
  few thousand chars). That's fine — TEXT column.
- `source_id` = the entry's headword again (used as the UNIQUE key).
- No inflection rows needed — DPPN entries don't decline (or rather,
  the genitive "Sāriputtassa" is rare enough that we can skip).

### Lookup-side wiring

`runLookup` already iterates by `source` query param (defaults to
'dpd'). We'll want the default to be **multi-source** so a user
selecting "Sāriputta" gets DPPN entries even though source defaults
to 'dpd'.

Two options:

(a) Change the default to look across all sources, ordered by source
priority (`dppn` first for proper-name-shaped queries, `dpd` first
otherwise — heuristic on Title Case + diacritic count).

(b) Always query both, return both, let the UI display them grouped
by source.

**Pick (b)** — simpler, gives the reader both lexical and biographical
context when relevant. Group in the UI by `source`.

### UI changes (minimal)

[src/DictionaryView.jsx](src/DictionaryView.jsx) and the in-passage
`LookupPanel` in [src/BrowseView.jsx](src/BrowseView.jsx):

- Group entries by `source`. Show DPPN entries in their own section
  with a "PROPER NAMES · MALALASEKERA" header so users know what
  they're reading.
- DPPN definitions are long — collapse to ~200 chars by default with
  a "show more" toggle. Or just render in full but with `max-height`
  + scroll. Either is fine.

### What "done" looks like

Open a sutta passage that mentions a known person ("Anāthapiṇḍika" is
in the standard opening). Select that word. The popover should show:
1. (If DPD has anything) — DPD's grammatical entry, near the top.
2. **A new section** — DPPN entry with the biographical text
   ("Anāthapiṇḍika was a wealthy merchant of Sāvatthī …").

Smoke check:
```bash
curl -s "https://dhamma.fly.dev/api/lookup?term=An%C4%81thapi%E1%B9%87%E1%B8%8Dika" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      const d = JSON.parse(s);
      const bySrc = {};
      for (const e of d.entries) (bySrc[e.source] ||= []).push(e.lemma);
      console.log(bySrc);
    })"
```

Expect entries from both `dpd` and `dppn`.

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

## Working notes for the new session

- The flyctl proxy on :15432 may have died — restart with
  `flyctl proxy 15432:5432 --app dhamma-pg` if needed.
- `scripts/ingest/.venv/` has the Python environment with psycopg2 etc.
- Ingest pattern reference: [scripts/ingest/ingest-dpd.mjs](scripts/ingest/ingest-dpd.mjs)
  is the model — it ingests the existing DPD dataset. Pattern your
  DPPN ingest after it (read source data → INSERT batches → progress
  log). Should fit in a single new file like
  `scripts/ingest/ingest-dppn.mjs`.

## After DPPN: queue for next sessions

- **Task 2 (PED)**: see [pali-english-dictionary](https://github.com/jakubkr/pali-english-dictionary)
  or the Pali Text Society's original. Same schema, source='ped'.
- **Task 3 (Monier-Williams)**: there are clean JSON dumps on GitHub
  (search "monier-williams sanskrit-english json"). source='mw'.
  Will need `language='san'` in some rows since MW is Sanskrit not Pali.
- **Tasks 4–6**: TBD when those become relevant.
