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

## When the embed completes — remaining phases (a deliberate window)

Per RE-EMBED-PLAN.md Phases 5-6, NOT yet done:

1. **Build the sentence HNSW index** in a maintenance window: bump
   `dhamma-pg` RAM to 2 GB, raise `maintenance_work_mem`, freeze deploys,
   keep one `dhamma` machine awake, then
   `CREATE INDEX CONCURRENTLY idx_psent_embedding ON passage_sentences
   USING hnsw (embedding vector_cosine_ops);`. Never put it in schema.sql.
   (If sentences are only used for per-passage snippets, the index can be
   deferred like the blurbs HNSW — a per-passage scan is cheap.)
2. **Wire the snippet upgrade** in `server/src/search.js`: replace the
   first-200-char fallback (`makeSnippet`) with a scoped ANN subquery
   returning the best-matching sentence per result passage.
3. Scale `dhamma-pg` back to 256 MB; revert any `dhamma` machine pinning.

## Follow-ons (not started)

- The `field='translation'` half: re-run `segment_sentences.py --field
  translation` then `embed_sentences.py`, for English-side snippets.
- Full-corpus scope (A): only if the mula+Library snippet win proves
  worth the cost over the already-paragraph-sized commentary.

See `RE-EMBED-PLAN.md` for the full phased plan and `BACKLOG.md` for the
open queue.
