# Tier C — CST corpus ingest (Aṭṭhakathā, Ṭīkā, optional Mūla)

This is the dedicated work plan for ingesting Vipassana Research Institute /
Chaṭṭha Saṅgāyana Tipiṭaka XML data into the dhamma corpus. Picks up from
where the previous session left off — corpus, search, dictionary all live;
this expands coverage into the commentaries.

## Where we're starting from

| State | Detail |
|---|---|
| Live URL | https://dhamma.fly.dev/ |
| Corpus | 7,286 Pali passages (full SuttaCentral Tipiṭaka — Sutta 5,764 + Vinaya 420 + Abhidhamma 1,102) |
| Dictionary | 88,933 DPD headwords + 727,678 inflection lookups, wired to PassageCard's selection popover |
| Search | hybrid FTS + BGE-M3 vector with HNSW, alias-OR expansion, prefix-stem matching, ts_headline snippets |
| CST data | cloned at `scripts/ingest/.cache/cst-test/` (gitignored). 7,656 XML files, all scripts including `romn/` (Roman/IAST) |

## Scope (decided)

**Ingest all 7,656 CST XML files** including mūla (canonical), aṭṭhakathā
(commentaries), and ṭīkā (sub-commentaries). Single ingest pass.

| Suffix | What | Count |
|---|---|---|
| `.mul.xml` | Mūla (canonical text — Tipiṭaka in VRI edition) | ~120 |
| `.att.xml` | Aṭṭhakathā (commentaries — Buddhaghosa, Dhammapāla, etc.) | ~80 |
| `.tik.xml` | Ṭīkā (sub-commentaries) | ~50 |
| `.nrf.xml` | Anya — supplementary/extra-canonical works | ~30 |
| (other) | various edition-specific files | rest |

## Open decisions to settle on day-1

### 1. Mūla overlap with existing SuttaCentral corpus

SuttaCentral data uses the Mahāsaṅgīti edition. CST uses the Burmese Sixth
Council edition. They're 99% identical but have different:
- Segmentation (paragraph boundaries differ)
- Spelling variants (rare)
- IDs (`sn36.7` vs `s0306c.mul`)

**Three stances:**
- **(i) Both, attributed** *(recommended)* — ingest CST mūla as a parallel
  edition. Each passage tagged with its source edition. Browse view shows
  both. Compare can show edition divergences. Some duplication in search
  results but value to scholars is real.
- (ii) Skip CST mūla — only ingest Aṭṭhakathā + Ṭīkā + Anya. Avoid duplicate
  text. Smaller ingest, simpler search results.
- (iii) Replace SC mūla with CST mūla — loses English translations.
  Probably bad — translations are highly valued by users.

If choosing (i), the schema needs a `source_edition` column on `passages`
(e.g., `sc` = SuttaCentral, `cst` = CST/VRI) so search can group / filter.

### 2. Citation format for CST IDs

CST filenames like `s0101a.att.xml` parse to many passages. The internal
XML `<div id="dn1" n="dn1" type="sutta">` gives a useful per-passage id.

Recommended scheme: derive from XML `<head>` + canonical numbering:
- `s0101a.att.xml` (Sumaṅgalavilāsinī, the DN Aṭṭhakathā) → passages cited as `Sv-a [n]`
- `s0201a.att.xml` (Papañcasūdanī, the MN Aṭṭhakathā) → `Ps-a [n]`
- `s0301a.att.xml` (Sāratthappakāsinī, the SN Aṭṭhakathā) → `Spk-a [n]`
- `s0401a.att.xml` (Manorathapūraṇī, the AN Aṭṭhakathā) → `Mp-a [n]`
- Mahāvaṃsa/etc., one mapping each

Build a CST-filename → citation-prefix lookup table. Extend `formatCitation()`
in `scripts/ingest/format-citation.mjs`.

## Technical work plan

### Step 1 — survey & sample (≈30 min)

- Re-read [cst-tipitaka-source.md memory note](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/cst-tipitaka-source.md) for format details.
- Read 3-5 sample files from `romn/` (`s0101a.att.xml`, `s0101m.mul.xml`,
  `s0101t.tik.xml`, `vin01a.att.xml`, `abh01m.mul.xml`) to confirm TEI
  structure across types.
- Verify the CST encoding gotcha: the `romn/` files use a custom Pali
  transliteration. Look for special characters (`+`, `C`, `D`, etc.) that
  need normalizing to IAST.

### Step 2 — schema additions (≈20 min)

```sql
ALTER TABLE passages
  ADD COLUMN IF NOT EXISTS source_edition TEXT,         -- 'sc' | 'cst'
  ADD COLUMN IF NOT EXISTS xml_div_id    TEXT,          -- the <div id="…">
  ADD COLUMN IF NOT EXISTS work_role     TEXT;          -- 'mula' | 'attha' | 'tika' | 'anya'

CREATE INDEX IF NOT EXISTS idx_passages_edition ON passages(source_edition);
CREATE INDEX IF NOT EXISTS idx_passages_role    ON passages(work_role);

-- Backfill existing SC passages
UPDATE passages SET source_edition = 'sc' WHERE source_edition IS NULL;
```

Update `seed-stubs.sql` to add the work hierarchy for commentaries:
- `pli-att` umbrella under `pli-tipitaka`
- Per-nikāya commentary works under `pli-att`:
  - `pli-dn-att` (Sumaṅgalavilāsinī)
  - `pli-mn-att` (Papañcasūdanī)
  - `pli-sn-att` (Sāratthappakāsinī)
  - `pli-an-att` (Manorathapūraṇī)
  - Vinaya commentaries, Abhidhamma commentaries, Khuddaka commentaries
- Same shape for `pli-tik` (sub-commentaries)
- Flip `is_stub` to false as content lands

### Step 3 — CST → IAST normalization (≈1 hr)

CST encoded text uses non-IAST diacritic substitutes. Build a normalization
table:
- `+` → `ṃ` (anusvāra)
- `C` → `ṅ`
- (and ~10 others — confirm from cst-test/code/converters/)

Write a `normalizeCst()` function. Test against a few known passages —
output should match SuttaCentral's Pali for the same text.

If CST has a different macron convention than SC (e.g. `ā` vs `aa` vs
`a^`), the normalization handles it.

### Step 4 — TEI XML parser (≈2-3 hr)

Use `node:fs/promises` for streaming. UTF-16 BOM detection at file head;
decode to UTF-8. Use a permissive XML parser (e.g. `htmlparser2` already
in deps, or `node-xml-stream`).

For each file, extract:
- `<TEI.2><text><body><div type="book">` — top-level work
- `<div type="chapter|sutta|…">` — sub-sections, recursive
- `<head>` — section titles → passage `title`
- `<p>` — paragraph text → passage `original`
- `<pb ed="V|P|M" n="…"/>` — page break markers (preserve as inline marker)
- `<hi rend="bold|italic">` — drop the tags, keep the text (re-highlight via FTS)

Pass each `<div type="sutta|chapter">` as one `passage` row. Some files
will have many levels of nesting — pick the level that gives ~1-5KB
average passage size.

### Step 5 — embedding + insert (≈8-12 hr background)

Use the existing BGE-M3 pipeline (`scripts/ingest/ingest.mjs` pattern).
Same model, same params — preserves vector compatibility with the existing
corpus.

Estimated counts (rough):
- ~3,000-5,000 commentary passages (longer than sutta passages on average)
- ~1,500-3,000 sub-commentary passages
- ~500-1,000 anya passages
- Plus mūla if option (i) — another ~5,000-7,000 parallel edition passages

Per-passage embedding latency on user's CPU: ~3 sec average for the long
commentary passages. So 10,000 passages × 3 sec = ~8 hrs.

Run in background like the previous ingests. `--basket=cst` or similar
flag. Idempotent via `ON CONFLICT (id) DO UPDATE`.

### Step 6 — verify in Browse + Search (≈30 min)

- Browse: Theravāda › Tipiṭaka › Commentaries should now be live, not stub.
- Search "sampajāna" should pull in commentary passages alongside canonical
  ones. Filter by `source_edition='cst'` if needed.
- Compare-stats counts should reflect the larger corpus.

### Step 7 — deploy (≈10 min)

`fly deploy`. No memory bump needed (corpus growth is data, not RAM).
Server image stays at 636 MB (only embedding model bakes in).

The HNSW index rebuilds itself incrementally as rows are added during
ingest — no manual rebuild step.

## Files to look at first

| Path | Why |
|---|---|
| `scripts/ingest/.cache/cst-test/` | source data, already cloned |
| `scripts/ingest/.cache/cst-test/code/converters/` | CST-to-other-script conversion code — has the encoding table |
| `scripts/ingest/ingest.mjs` | template for the new ingest |
| `scripts/ingest/format-citation.mjs` | extend with CST citation logic |
| `server/sql/schema.sql` | add source_edition / xml_div_id / work_role |
| `server/sql/seed-stubs.sql` | flip commentary works to is_stub=false at ingest end |
| `server/src/corpus.js` | API may want to expose source_edition in passage shape |

## What's done already vs what remains

**Done (don't redo):**
- CST repo cloned ✓ (do not re-clone — check `.cache/cst-test/` first)
- Schema for `passages`, `aliases`, `dictionary_entries`, `dictionary_inflections` ✓
- Search pipeline with FTS + vector + alias-OR + prefix-stem + ts_headline ✓
- Dictionary lookup with proper morphology ✓
- Browse tree with Khuddaka split ✓
- Vinaya citation formatter ✓
- Auto-stop Fly machines configured ✓ (4 GB memory required; do not lower)

**Tier C progress as of 2026-05-18:**

Decisions settled:
- Mūla overlap: option (i), parallel editions with `source_edition` column.
- Citation scheme: PTS/CPD abbreviations (`Sv-a`, `Ps-a`, `Spk-a`, `Mp-a`, `Sp`, `As`, `Vism`, …) with sutta-id pattern recognition (`dn1_5` → "Sv-a 5").

Surveyed and verified:
- romn/ files are **already in standard IAST** — no CST encoding pass needed (memory note corrected). Step 3 collapsed to "strip BOM, normalize whitespace, NFC".
- Two structural modes coexist in romn/: nested `<div>` (Sutta nikāya files only, ~15 divs each) and flat `<p rend="...">` (Vinaya, Abhidhamma, Khuddaka extra-canonical files — zero divs, thousands of `<p>` per file). Parser handles both.
- Total corpus: **18,702 passages** across 217 files. Breakdown: mūla 7,279; aṭṭhakathā 3,284; ṭīkā 5,109; anya 3,030.

Code shipped (uncommitted in working tree):
- `scripts/ingest/cst-works.mjs` — filename → (work_slug, citation_prefix, work_name, role) map, with explicit entries for major works and a fallback for the long tail.
- `scripts/ingest/cst-parse.mjs` — TEI XML parser. Reads UTF-16 BOM, handles both structural modes, strips `<pb>`, keeps `<hi>` text, converts `<note>` to inline parens.
- `scripts/ingest/cst-parse-smoke.mjs` — parses 5 representative files and reports passage shape.
- `scripts/ingest/cst-count-all.mjs` — parses all 217 files (no DB, no embedding) and reports totals; used to estimate ingest time.
- `scripts/ingest/ingest-cst.mjs` — full pipeline (workForFile → parse → embed BGE-M3 → INSERT). Resumes by SELECTing existing CST ids and skipping. Recursively promotes umbrella stubs (`pli-commentary`, `pli-subcommentary`, `pli-anya`) once a descendant goes live.
- `scripts/ingest/cst-fix-citations.mjs` — re-formats `citation` column for source_edition='cst' rows using current `formatCstCitation`. Idempotent; run after the bulk ingest to migrate citations to the polished format.
- `scripts/ingest/apply-schema.mjs` — extended to also apply seed-stubs and verify tier-C columns.

Schema applied to prod (via flyctl proxy 15432 + apply-schema.mjs):
- `passages.source_edition` (TEXT) — 'sc' for existing 7,286 rows; 'cst' for new ingest.
- `passages.xml_div_id` (TEXT) — CST `<div id="…">` round-trip.
- `passages.work_role` (TEXT) — 'mula' | 'attha' | 'tika' | 'anya'.
- Indexes on source_edition and work_role.
- seed-stubs has two new umbrellas: `pli-subcommentary`, `pli-anya`.

End-to-end smoke verified:
- 109 CST passages from s0101a.att.xml + abh01a.att.xml ingested.
- Search "brahmajāla" ranks `cst-s0101a.att-dn1_1` (Sumaṅgalavilāsinī's commentary on Brahmajālasutta) as top hit — well above the canonical SC DN 1.
- Browse shows `pli-dn-attha: Sumaṅgalavilāsinī (15)` and `pli-abh-attha: Atthasālinī (94)` as live (no longer stubs).

**Currently in-flight (background process):**
- `node ingest-cst.mjs` running in background. Log at `scripts/ingest/ingest-cst.log`.
- Local proxy: `flyctl proxy 15432 --app dhamma-pg` (PID listed in `Get-NetTCPConnection -LocalPort 15432`).
- Rate ~0.25 passages/sec (~4 sec/passage post-load). Full run ETA ~20-28 hours.
- Resumable via the same command — `done` set is loaded from `SELECT id FROM passages WHERE source_edition='cst'`.

**Remaining after ingest completes:**
- Run `node cst-fix-citations.mjs --apply` once to migrate the rest of the citations to the polished format. (Citations inserted during the running ingest used a stale formatter import; the script is idempotent and will only update rows that need it.)
- Step 6 verify: `/api/corpus` shows full commentary tree live; spot-check 5-10 search queries hitting both editions.
- Step 7 deploy: `fly deploy`. Server code is unchanged so this just packages the new schema+seed-stubs SQL files; the prod DB already has both applied manually.
- UX decision (out of scope for tier C but worth flagging): once CST mūla is in, Browse `pli-dn` will show 64 suttas (34 SC + 30 CST overlapping the same canonical 34). Consider an edition filter / collapse-by-canonical-id UX. Not blocking — just confusing for casual browsers.

## Reference memories

- [cst-tipitaka-source.md](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/cst-tipitaka-source.md) — CST data format + encoding details
- [xenova-v2-pinned.md](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/xenova-v2-pinned.md) — embedding library pinning + CVE override
- [fly-memory-requirement.md](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/fly-memory-requirement.md) — why 4 GB / shared-cpu-2x
- [snippet-sentence-upgrade.md](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/snippet-sentence-upgrade.md) — eventual sentence-level snippets
- [never-suggest-stopping.md](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/never-suggest-stopping.md) — user prefers forward motion; don't offer "pause/stop" as an option

## First moves for the new session

1. `git log --oneline -10` and `curl -s https://dhamma.fly.dev/api/dbcheck` to confirm state matches what's written above.
2. Verify CST clone is intact: `Test-Path C:\Dev\Dhamma\scripts\ingest\.cache\cst-test\romn\s0101a.att.xml` should return `True`.
3. Read steps 1-2 above. Get the CST encoding table from
   `cst-test/code/converters/` (Python or C# files inside).
4. Decide mūla-overlap stance (recommend (i) — both editions, attributed)
   with the user before starting on the schema change.
5. Begin step 1.

Estimated total: ~1-2 focused days, dominated by the background embedding
pass (8-12 hours wall but parallelizable with other work).
