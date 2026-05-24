# Ṭīkā re-embed deferred — finish this later

**Status: deferred, not abandoned.** The sub-commentaries (Ṭīkā,
work_role='tika') were excluded from the May 2026 DPD-glossed
re-embed pass for performance reasons. They still need to be
embedded with English gloss injection. This file captures why
and how to resume.

## Why we skipped

The full corpus DPD-glossed re-embed was running at ~14 rows/s
through aṭṭhakathā (commentary), then dropped to ~2.4 rows/s on
the ṭīkā (sub-commentary) passages — about 5x slower. The
bottleneck isn't BGE-M3 on GPU; it's the DPD gloss lookup in
`gloss_inject.py`, which walks every Pāli word of the passage
against the inflection table and builds the gloss appendix.
Ṭīkā passages are typically longer and more grammatical-analytic,
so they have more distinct words to look up per passage.

Concrete numbers from the run:
- Aṭṭhakathā rate: ~14 rows/s, avg input ~40 chars
- Ṭīkā rate: ~2.4 rows/s, avg input ~250 chars
- Aṭṭhakathā total: ~91,800 rows
- Ṭīkā total: ~77,800 rows
- Original ETA for full pass: ~15 hours
- Revised ETA (attha + vism only): ~30 min

Deferring ṭīkā lets us deploy the queued commits and ship the
search improvements today rather than tomorrow night. Most
scholarly search value comes from aṭṭhakathā anyway — when a user
queries "metta" they want the canonical sutta and Buddhaghosa's
commentary on it, not Dhammapāla's grammatical analysis of
Buddhaghosa.

## What's still missing without ṭīkā

Cross-language Meaning quality on the ~77K ṭīkā rows. An English
query like "stream-entry" or "purification of view" against a
ṭīkā passage will only hit FTS (which has unaccent) and the
existing Pāli-only embedding — no English-side semantic signal.
Browsing ṭīkā by passage_id, citation lookup, and FTS all still
work; only the vector ANN side is weaker than it could be.

## How to resume

The script is resume-friendly — `passages_embedding_meta` tracks
which passages have been embedded at the current `gloss_version`.
Re-running with the same flags is safe; already-done rows are
skipped.

```powershell
# From C:\Dev\Dhamma (PowerShell)
$raw = (flyctl ssh console --app dhamma -C "printenv DATABASE_URL" | Out-String).Trim()
$pass = ($raw -split ':')[2].Split('@')[0]
$env:DATABASE_URL = "postgres://dhamma:$pass@localhost:15432/dhamma"
& scripts/ingest/.venv/Scripts/python.exe scripts/ingest/embed_passages_glossed.py --scope=tika
```

`--scope=tika` is the predicate added alongside `attha` in May 2026.
It filters to `p.work_role = 'tika' AND p.source_edition = 'cst'`.

## When to resume

Pick whichever first:
- A quiet weekend day where the laptop can grind for 9-12 hours.
- After any other DB writes have settled — the script holds a
  light row-level lock on the meta table but a deploy still
  deadlocks against it on the passages table.
- After the next BGE-M3 / @huggingface/transformers v3 migration
  (would need a full corpus re-embed anyway, ṭīkā included; this
  deferred work folds into that).

## Don't forget

Once ṭīkā lands, drop this file. The handoff backlog should also
be updated:
- HANDOFF.md `### CST DPD-glossed re-embed` section
- Backlog task #20 (currently `completed` once aṭṭhakathā lands)

Leaving this orphan file around is a smell — its existence means
the re-embed isn't really finished.
