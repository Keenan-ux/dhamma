# Current session — sentence-chunking embed running

**Transient handoff. Delete when the embed below finishes.**

## DO NOT KILL — active background job

A detached GPU embed is running and must be left alone unless explicitly
told to stop. It is NOT a zombie.

- **Job:** `scripts/ingest/embed_sentences.py --batch=64 --fetch=1024`
  filling `passage_sentences.embedding` for the scope-B mula `original`
  sentences (the sentence-chunking re-embed, RE-EMBED-PLAN.md Phase 6).
- **PID at launch:** 66556 (the venv launcher spawns the real
  `python3.13.exe` interpreter; match by command line in
  `Get-WmiObject Win32_Process -Filter "name='python3.13.exe'"`).
- **Launched:** 2026-06-04 ~21:13 EDT, detached via
  `Start-Process -WindowStyle Hidden` so a Claude Code restart will NOT
  kill it.
- **Log:** `scripts/ingest/logs/embed-sentences-20260604-211320.out.log`
  (path also in `logs/.latest-sentence-embed.txt`).
- **Scope / size:** 506,777 sentence rows pending at launch, ~19-22
  rows/s, **ETA ~7 hours**.
- **Resume-friendly:** pending = `passage_sentences WHERE embedding IS
  NULL`. Safe to kill and relaunch with the same command; it skips done
  rows. Keyset paginated over the `(passage_id, field, position)` PK.

### Check progress WITHOUT killing anything

```bash
tail -5 "C:/Dev/Dhamma/scripts/ingest/logs/embed-sentences-20260604-211320.out.log"
```

Or against the DB (proxy on 15432 must be up):

```sql
SELECT count(*) FILTER (WHERE embedding IS NOT NULL) AS done,
       count(*) FILTER (WHERE embedding IS NULL)     AS pending
FROM passage_sentences;
```

### Supporting processes (leave alone)

- `flyctl proxy 15432:5432 --app dhamma-pg` — local Postgres tunnel the
  embed writes through.

## DO NOT DEPLOY during this embed

Per RE-EMBED-PLAN.md and the 2026-05-29 outage: a `flyctl deploy` runs
the app's boot-time `applySchema()` which now also does
`CREATE TABLE/INDEX IF NOT EXISTS passage_sentences`, taking locks on the
table the embed is writing. Hold the deploy freeze until the embed is
done AND the HNSW build (below) is finished.

## When the embed completes — GO-TIME RUNBOOK (verified 2026-06-04 mid-embed)

Deploy-readiness was independently re-verified during the embed run. The
window is now SIMPLE: **deploy → smoke → done.** The risky HNSW dance is
DEFERRED (see decision below). Steps, in order:

0. **Confirm the embed is truly done** (not just the log's last line):
   `done=507777 pending=0` from the `passage_sentences` count query above,
   AND the embed process (PID 58756 / any `embed_sentences.py`) has exited.
1. **DECISION — DEFER the global sentence HNSW (`idx_psent_embedding`).**
   `attachSentenceSnippets` (search.js:656) is per-passage-scoped: it does
   `WHERE passage_id = ANY(ids) ... DISTINCT ON (passage_id) ORDER BY
   passage_id, embedding <=> qVec`, using the `idx_psent_passage` btree and
   scanning only the handful of sentences per result passage. It needs NO
   global HNSW. Building one requires the 2 GB RAM bump + `CREATE INDEX
   CONCURRENTLY` + machine-pinning that caused the 2026-05-29 outage — so
   defer it exactly like the blurbs HNSW. Build it ONLY if/when a global
   `vec_sentence` RRF lane is added (a separate follow-on, not this window).
   Net: dhamma-pg stays at 256 MB the whole time; no RAM bump, no scale-back.
2. **DEPLOY** the already-committed work (bf0472a, verified on disk):
   `flyctl deploy --remote-only --app dhamma`. CI triggers on `main` not
   `master`, so the manual deploy is required (per HANDOFF). Safe now: the
   embed is done, so boot-time `applySchema()` only runs `CREATE TABLE/INDEX
   IF NOT EXISTS` no-ops on the already-present table + btree (NO HNSW in
   schema.sql — verified, lines 367-385).
3. **SMOKE-TEST** on prod (first Meaning query cold-starts ~101 s):
   - A default-scope Meaning query that returns a vector-only mula hit shows
     a sentence-precise snippet, NOT the first 200 chars. (Pick a thematic
     English query whose top hit is a long mula sutta.)
   - Gloss `(gram)` down-rank: e.g. `apaccaya` glosses "causeless" (not
     "(gram) a suffix"), `manti` → "minister".
   - `curl -s https://dhamma.fly.dev/api/dbcheck` still healthy.
4. **TEARDOWN:** stop `flyctl proxy 15432` only if no further local→prod
   work is queued (the `field='translation'` follow-on will need it again).
   `dhamma` 4 GB / shared-cpu-2x stays as-is (never lower below 4096).
5. **DOC HYGIENE:** mark the sentence-snippet upgrade LANDED in BACKLOG.md;
   delete this transient CURRENT-SESSION.md (its job is done once deployed).

### What was verified (so the deploy is mechanical)
- bf0472a is in HEAD history; tree clean. (`66ec8bf` HEAD.)
- search.js `attachSentenceSnippets`: per-passage scoped, `embedding IS NOT
  NULL` graceful fallback, try/catch best-effort, gated on `meaningQVecLit`
  (Meaning-only). Correct.
- dictionary.js gloss down-rank (line 257): `'^\\s*\\(gram\\)'` doubled
  backslashes — the real fix, not the silent no-op. Correct.
- schema.sql: table + `idx_psent_passage` present; `idx_psent_embedding`
  HNSW deliberately absent with the standing-rule comment. Correct.

**Also committed but NOT deployed (held under the freeze, deploys in the
same window):** the `server/src/dictionary.js` gloss `(gram)`-sense
down-rank (commit bf0472a). Note: the agent that wrote it had a broken
regex (JS `sql\`\`` template cooked the backslashes away, making the
down-rank a silent no-op); it was fixed with doubled backslashes and
re-verified through the real JS path. This is independent of the sentence
work but held because no `flyctl deploy` may run while the embed writes
`passage_sentences`.

## Follow-ons (not started)

- The `field='translation'` half: re-run `segment_sentences.py --field
  translation` then `embed_sentences.py`, for English-side snippets.
- Full-corpus scope (A): only if the mula+Library snippet win proves
  worth the cost over the already-paragraph-sized commentary.

See `RE-EMBED-PLAN.md` for the full phased plan and `BACKLOG.md` for the
open queue.
