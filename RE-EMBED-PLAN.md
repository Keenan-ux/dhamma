# Re-embed plan — sentence chunking + v3 migration + clean HNSW rebuild

A phased implementation plan for the next corpus re-embed. It bundles
three deferred items into one maintenance-window pass so the corpus is
walked, embedded, and indexed only once:

1. **Sentence-level chunking** — a new `passage_sentences` table for
   sentence-granular retrieval and better Meaning-mode snippets.
   `/api/search` currently falls back to the first ~200 chars for
   vector-only hits (`makeSnippet` in `server/src/search.js`).
2. **Migration off `@xenova/transformers` v2 to v3.** Largely already
   done on the Node side; see the v3 section for what actually remains.
3. **A clean HNSW index rebuild** for `passages.embedding`, which has
   been deferred since the gloss re-embed and once caused a prod outage.

Tone is plain and operational. This is a deliberate maintenance-window
operation, not a casual background job. The 2026-05-29 outage learnings
and standing rules are quoted verbatim where they bear on a step.

Verified current state (`curl -s https://dhamma.fly.dev/api/dbcheck`,
2026-06-04): `passages: 194,710, tables: 13, pgvector: true,
postgres 16.14`.

---

## 0. Standing rules this plan must obey (quoted verbatim)

These are load-bearing. Do not paraphrase them away.

From `server/sql/schema.sql` (the blurbs HNSW comment) and
`BACKLOG.md`:

> **Standing rule: never put an HNSW build in schema.sql** — it is
> applied on every boot before `listen()`.

From `server/sql/schema.sql`:

> Never put an HNSW build back into schema.sql.

From `BACKLOG.md`, on the reindex that caused the outage:

> `REINDEX INDEX CONCURRENTLY idx_passages_embedding` on the 256 MB
> `dhamma-pg` instance ran for **4+ hours** on the disk-spill path
> (graph ~1.9 GB ≫ `maintenance_work_mem` 64 MB) and **caused a prod
> outage on 2026-05-29**: it held a SHARE UPDATE EXCLUSIVE lock on
> `passages` that blocked the app's boot-time schema apply (`db.js`
> runs `CREATE INDEX IF NOT EXISTS` on passages before `listen()`), so
> every app cold-start hung.

> **A reindex is genuinely optional and must be a deliberate
> maintenance-window op** — temporary `dhamma-pg` RAM bump + higher
> `maintenance_work_mem`, and NO concurrent `flyctl deploy` (the
> cold-start lock conflict).

From `HANDOFF.md`:

> Don't deploy while the gloss embed job is running — they deadlock on
> the passages table.

From the `fly-memory-requirement` memory note:

> **do not lower memory_mb below 4096**.

From the `onnxruntime-node-pin` memory note:

> Both `server/package.json` and `scripts/ingest/package.json` carry
> `overrides: { "onnxruntime-node": "1.17.0" }`. `@huggingface/
> transformers ^3`'s default pulls ORT 1.21, which requires DirectML on
> Windows and fails to load on the Win11 dev box; 1.17 works on both the
> Linux Fly container and locally.

The single most important operational rule, distilled from the outage:
**no `flyctl deploy` and no app cold-start may overlap an index build or
a long in-place vector write on `passages`.** The conflict is between
the index build's lock on `passages` and `db.js`'s boot-time
`applySchema()` running `CREATE INDEX IF NOT EXISTS` before `listen()`.

---

## 1. Scope and the honest marginal-win assessment

Read this before committing a week of compute.

The CST Aṭṭhakathā + Ṭīkā are already subdivided to per-`<p>` paragraph
rows (~300-500 chars each, ~173,684 rows). For that bulk, paragraph
rows already give sentence-ish granularity, so sentence chunking buys
little there. From `BACKLOG.md`:

> Note: the CST per-`<p>` subdivision already partly solves this for
> commentary (300-500 char paragraph rows). So the marginal win of
> sentence-level is mostly on Tipiṭaka mūla + ATI Library, not
> Aṭṭhakathā/Ṭīkā. Weigh against the disk + week-of-compute cost.

**Two viable scopings** — decide which before Phase 2:

- **(A) Full corpus.** Sentence-chunk every passage. ~5.7M sentence
  rows, ~30 GB volume, ~week of compute. Maximum uniformity; large
  redundant cost over already-fine commentary.
- **(B) Targeted (recommended).** Sentence-chunk only where the
  paragraph subdivision did NOT already help: Tipiṭaka mūla
  (`source_edition='sc'` or `work_role='mula'`, ~14,377 rows, many of
  them long suttas) plus ATI Library articles. Leave the per-`<p>` CST
  rows as their own "sentence" units (their paragraph row already IS the
  retrieval unit). This is a small fraction of the row multiplier and
  most of the user-visible snippet win.

The disk estimate of ~5.7M sentence rows ≈ 20 GB in `BACKLOG.md` is the
**full-corpus (A)** figure. Targeted (B) is far smaller (rough order:
Tipiṭaka mūla averages maybe 10-40 sentences/row over ~14K rows plus
~400 Library articles → low hundreds of thousands of sentence rows, a
few GB). The volume-extension prerequisite in Phase 1 still applies to
(A); for (B) the existing 15 GB may suffice but extend anyway for
headroom and because the HNSW build wants free disk.

This plan is written for **(A) full corpus** as the conservative upper
bound, with (B) called out wherever it changes a number. Pick a scope at
the top of the maintenance window and hold it.

A note on `passages.embedding` itself: the gloss re-embed already
populated every passage vector in place (`glossed-v1`). Sentence
embeddings are an **additive** new table; the v3 migration is the only
reason to also re-touch `passages.embedding`, and even that is optional
(see Phase 3). Keep the two concerns separate in your head: the new
sentence vectors are required work; re-touching the existing passage
vectors is a judgment call.

---

## 2. Phase 1 — Prerequisites (maintenance window setup)

Do all of this before any embed call.

### 1.1 Declare the maintenance window

This is not a background job you start and walk away from like the gloss
re-embed was. The HNSW rebuild step (Phase 4) needs an idle DB and a
RAM bump, and during that step **deploys must be frozen**. Pick a window
where no `flyctl deploy` will happen. Announce it to the second
collaborator if one is active.

### 1.2 Extend the `dhamma-pg` Fly volume

Current: `dhamma-pg` has a 15 GB volume (extended once from 5 GB during
the per-`<p>` ingest when disk hit 100% at ~150K fine rows). The
full-corpus sentence table plus its HNSW graph needs more.

- Full corpus (A): sentence rows ≈ 5.7M × 1024-d ≈ 20 GB of table data
  alone; the HNSW graph on those vectors adds several GB on top; plus
  the existing 15 GB of corpus. **Target ~30 GB minimum, prefer 40 GB**
  to leave the index build room (the build wants free disk, and the
  2026-05-29 incident was triggered partly by a disk-spill path).
- Targeted (B): the existing 15 GB may hold the smaller sentence table,
  but extend to ~25 GB anyway for HNSW-build headroom.

```
flyctl volumes list --app dhamma-pg
flyctl volumes extend <volume-id> --size 40 --app dhamma-pg
```

Verify free space after the extend and after the machine restarts on the
grown volume:

```
flyctl ssh console --app dhamma-pg -C "df -h /data"
```

Do this FIRST. A disk-full mid-embed is exactly the failure that
triggered the original 5 GB → 15 GB scramble; `HANDOFF.md` records that
crash at ~150K rows. Snapshots existed and no data was lost, but it cost
a night.

### 1.3 Snapshot / confirm backup posture

Confirm `dhamma-pg` volume snapshots are current before mutating
anything. The gloss-ingest crash was survivable specifically because
snapshots existed. List recent snapshots:

```
flyctl volumes snapshots list <volume-id> --app dhamma-pg
```

### 1.4 Open the local proxy and warm the DPD pickle cache

The embed runs locally and writes to prod over the proxy:

```
flyctl proxy 15432 --app dhamma-pg
# in another shell, from C:\Dev\Dhamma\scripts\ingest:
$env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
.venv/Scripts/python.exe warm_gloss_cache.py
```

`warm_gloss_cache.py` writes `scripts/ingest/.cache/gloss_index.pkl`,
cutting per-run GlossIndex startup from ~30 min of Postgres reads to
~5 s. The dynamic-batch embed launches 8 gloss worker processes, each of
which loads this pickle; without it, worker startup is `N_workers ×
~30 min`. Confirm the pickle exists before launching with
`--gloss-workers > 1`.

---

## 3. Phase 2 — Schema for `passage_sentences`

### 2.1 The table

Add to `server/sql/schema.sql` (it is idempotent and applied on every
boot, so `CREATE TABLE IF NOT EXISTS` is safe there — only the HNSW
index is forbidden):

```sql
CREATE TABLE IF NOT EXISTS passage_sentences (
  passage_id  TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  position    INT  NOT NULL,            -- 0-based sentence ordinal within the passage
  field       TEXT NOT NULL DEFAULT 'original', -- 'original' | 'translation'
  text        TEXT NOT NULL,
  embedding   vector(1024),
  PRIMARY KEY (passage_id, field, position)
);
CREATE INDEX IF NOT EXISTS idx_psent_passage ON passage_sentences(passage_id);
```

Notes:
- The brief specifies columns `(passage_id, position, text, embedding
  vector(1024))`. A `field` discriminator is added because the snippet
  use-case wants to surface the matched sentence from either the Pāli
  `original` or an English `translation`, and the gloss re-embed taught
  us cross-language matching is the whole game. If you want to keep it to
  the four columns exactly, segment only `original` and drop `field` from
  the PK — but then translation-side semantic snippets are not possible.
  Recommendation: keep `field`.
- `ON DELETE CASCADE` mirrors `translations` / `blurbs` so a passage
  delete cleans up its sentences.
- The composite PK makes the embed pass resumable per
  `(passage_id, field, position)` and lets the ANN snippet subquery be
  `WHERE passage_id = ? AND embedding IS NOT NULL`.

### 2.2 The HNSW index — NOT in schema.sql

This is the standing-rule trap. The `passage_sentences` HNSW index is a
much larger version of the same hazard that took down prod. Putting it
in `schema.sql` would make `applySchema()` build it on **every boot**
before `listen()`, blocking cold-starts until the build finishes — and
on a multi-million-row table that is minutes-to-hours.

> **Standing rule: never put an HNSW build in schema.sql** — it is
> applied on every boot before `listen()`.

The index is built ONCE, by hand, in the maintenance window (Phase 4),
as a deliberate `CREATE INDEX CONCURRENTLY`. Add a comment to
`schema.sql` next to the table documenting this, in the same shape as the
existing `blurbs` / `translations` / `dictionary_entries` HNSW comments,
ending with the verbatim rule.

### 2.3 Meta / resume bookkeeping

Reuse the established pattern. Either:
- a `passage_sentences_embedding_meta(passage_id, model, sentence_count,
  embedded_at)` table mirroring `passages_embedding_meta`, or
- simpler: treat `embedding IS NULL` as "pending" exactly like
  `embed-articles.mjs` and `embed-blurbs.mjs` do (`WHERE embedding IS
  NULL`). Since sentence rows are inserted in one segmentation step and
  embedded in a second, a NULL-embedding filter is the natural resume
  cursor and needs no extra table.

Recommendation: NULL-embedding resume for the sentences (matches the
Node embedder pattern); keep `passages_embedding_meta` untouched.

---

## 4. Sentence segmentation approach

Pāli-aware, regex-based, no model needed. The server already has a
sentence terminator set in `search.js`:

```js
const SENT_END_RE = /[.!?。！？]/;
```

Extend it for the corpus's scripts. The brief calls for `.!?।` — the
Devanāgarī danda `।` (U+0964) and double-danda `॥` (U+0965) appear in
some CST/transliteration sources. Final terminator class:

```
[.!?।॥。！？]
```

Pāli-specific handling the segmenter must get right:

- **Abbreviations and ellipsis.** Pāli texts use `pe.` (peyyāla,
  "etc.") and `…pe…` heavily, plus numbered section markers. A bare
  split on `.` shatters these. Maintain a small abbreviation guard list
  (`pe`, `la`, numbered `1.` `2.` list markers) and do not split when the
  period follows a known abbreviation or a lone digit.
- **Gāthā (verse) lines.** Verse is line-broken, not sentence-punctuated.
  Treat a verse passage (the fine CST parser already groups consecutive
  gāthā lines into one verse-row; mūla verse passages are short) as a
  single sentence unit rather than trying to split it. A length floor
  (e.g. do not emit sentences shorter than ~15 chars; merge a too-short
  fragment into its neighbor) handles the long tail.
- **Section numbers / colophons.** Digit-only or `§`-only fragments are
  not sentences; the `gloss_inject.tokenize` filter already drops
  digit-only tokens and is a good reference for "has at least one Pāli or
  Latin letter."
- **Empty / whitespace fragments.** Drop after trimming.

Keep the segmenter as a small pure function so it can be unit-tested on a
handful of known-hard passages (a `…pe…` sutta, a Theragāthā verse, a DN
prose sutta) before the full run. Put it where both the segmentation step
and any future use can import it — a `scripts/ingest/sentence_split.py`
(Python, to live next to `embed_passages_glossed.py`) is the natural
home, with a JS mirror only if the server ever needs to segment at
request time (it should not — pre-computation is the whole point; see the
`snippet-sentence-upgrade` memory note: doing this per-query is
"prohibitive — 10-30 embed calls per result").

Reuse the server's `refineFragment` sentence-expansion logic as a
cross-check on the terminator set so snippet rendering and sentence
storage agree on where a sentence ends.

---

## 5. Phase 3 — v3 migration (`@xenova/transformers` v2 → v3)

### What the brief assumes vs. what is actually on disk

The brief lists "migration off `@xenova/transformers` v2 to v3" as one of
the three bundled items, and `BACKLOG.md` lists it as not-started. **The
code is further along than the docs.** Verified this session:

- `server/package.json` and `scripts/ingest/package.json` both already
  depend on `@huggingface/transformers: "^3"` (the v3 package; v2 was
  `@xenova/transformers`).
- `server/src/embed.js`, `scripts/ingest/embed-articles.mjs`, and
  `scripts/ingest/embed-blurbs.mjs` all already `import { pipeline, env }
  from '@huggingface/transformers'` and call it with the v3 `dtype: 'q8'`
  option (not the v2 `quantized: true`).
- The `xenova-v2-pinned` memory note referenced in `CLAUDE.md` no longer
  exists on disk; only `onnxruntime-node-pin.md` does. The live pin
  reality is the ORT 1.17 override, not a `@xenova/transformers` v2 pin.

So the Node-side import/library migration is effectively **already
done**. What actually remains for "v3 migration":

1. **Confirm and document that the Node side is on v3.** Update
   `CLAUDE.md` and `BACKLOG.md` to stop calling this not-started, and
   delete the stale reference to the non-existent `xenova-v2-pinned`
   note. (`HANDOFF.md` item 13 already flags "Drop the `xenova-v2-pinned`
   memory note — superseded by the v3 migration.")
2. **The ORT 1.17 pin caveat stays.** Per `onnxruntime-node-pin.md`,
   `@huggingface/transformers ^3`'s default pulls onnxruntime-node 1.21,
   which requires DirectML on Windows and **fails to load on the Win11
   dev box**. Both package.json files override it to 1.17.0. Do NOT lift
   that override as part of this work. If a future v3 minor bump
   complains that 1.17 is too old, the note's instruction is: "lift the
   override and verify on both target environments (Linux container +
   Win11 dev box) before merging" — that is a separate, gated task, not
   part of this re-embed.
3. **The Python embed pipeline is independent of the Node package
   version.** `embed_passages_glossed.py` uses raw `onnxruntime` +
   `transformers` (HF) with the CUDA EP and the `Xenova/bge-m3`
   `onnx/model_fp16.onnx` file. The "@xenova/transformers v2 → v3"
   migration does not touch it. The Python GPU embedder is the workhorse
   for this pass and needs no v3 change.

### Does the version flip require a full re-embed?

**No — not on its own.** The vectors are determined by the *model* and
its pooling/normalization, not by which JS wrapper library calls it.
`@xenova/transformers` v2 and `@huggingface/transformers` v3 both run the
same `Xenova/bge-m3` ONNX weights with `pooling: 'mean', normalize:
true`. As long as the model file, quantization, and pooling/normalize
options are held constant, v2 and v3 produce the same (or
numerically-equivalent) vectors and the existing index stays valid.

The hard rule in `CLAUDE.md` is the relevant one:

> Embeddings produced by BGE-M3 only work against vectors produced by
> BGE-M3. Don't switch models mid-corpus without a re-embed pass.

A **library** version flip is not a **model** switch. So the v3
migration does not force a re-embed. The reason to *pair* it with this
re-embed is purely opportunistic: a corpus walk is already happening for
sentence chunking, so this is the natural moment to also confirm
v2/v3 parity end-to-end and (optionally) re-touch `passages.embedding` if
any drift is found. Recommendation:

- Treat v3 as **already migrated**; spend this window verifying parity
  (embed one known passage on the Python GPU path and on the Node v3 q8
  path, confirm cosine similarity ≈ 1.0 between a fresh vector and the
  stored `glossed-v1` vector for the same input) and updating the docs.
- Do NOT re-embed `passages.embedding` solely for the version flip.
  Re-embed it only if (a) parity verification surfaces real drift, or (b)
  you decide to fold a content change (e.g. a gloss-version bump) into
  the same pass.

---

## 6. Phase 4 — The embed run

Reuse the hardened `embed_passages_glossed.py` as the engine for the
sentence pass; do not write a new GPU embedder. It already carries every
lesson from the gloss re-embed:

- **Detached launch.** Launch via PowerShell `Start-Process` so the job
  survives the shell closing, exactly as the gloss re-embed ran ("detached
  Start-Process launch"). Redirect stdout/stderr to a log file and tail
  it.
- **Memory-budgeted dynamic batching.** Each GPU batch is sized so
  `rows × max_input_chars² ≤ --mem-budget` (default 85e6), capped at
  `--batch` (16). BGE-M3 self-attention is O(rows × seq²); a fixed batch
  OOMs the 8 GB card on long inputs. The `j > i` guard guarantees a lone
  over-budget row still embeds by itself, so OOM is structurally
  impossible. Sentences are SHORTER than passages, so this budget is
  generous for the sentence pass — most batches will hit the `--batch`
  cap rather than the memory cap. That is fine and faster.
- **DPD pickle cache.** Whether the sentence embed injects glosses is a
  decision (see below). If it does, the warm pickle cache from Phase 1.4
  keeps gloss-worker startup at ~5 s each.
- **Resume-friendly.** Re-run is safe; pending = rows with `embedding IS
  NULL` (the Node-embedder pattern) or absent meta rows (the gloss
  pattern). Ctrl-C and re-launch resumes.
- **TCP keepalive + reconnect-with-retry.** `embed_passages_glossed.py`
  already wraps every DB write in `run_with_retry` and reconnects on an
  `OperationalError`, covering the `flyctl proxy 15432` tunnel dropping
  during a brief internet hiccup. Keep that path.

### Adapting the engine for sentences

The current script reads `(id, original)` from `passages`, builds a
glossed input, embeds, and UPDATEs `passages.embedding`. For sentences,
two sub-steps:

1. **Segment pass (cheap, CPU, one-time).** Walk in-scope passages, run
   the Pāli-aware segmenter, INSERT sentence rows
   `(passage_id, field, position, text, NULL embedding)`. Idempotent via
   the PK + `ON CONFLICT DO NOTHING`. This is fast and DB-bound, not
   GPU-bound; can run before the GPU is even warm.
2. **Embed pass (GPU).** Fork `embed_passages_glossed.py` to a
   `embed_sentences.py` (or add a `--target sentences` mode) that selects
   `(passage_id, field, position, text)` from `passage_sentences WHERE
   embedding IS NULL`, embeds `text` directly, and UPDATEs the row's
   `embedding`. Keep the dynamic batching, detached launch, keepalive,
   and retry verbatim.

**Gloss injection for sentences?** The gloss appendix exists to give
untranslated Pāli commentary an English signal in its vector. A single
sentence is short; appending a multi-hundred-char gloss appendix would
swamp the sentence's own signal and defeat the point of sentence
granularity. Recommendation: **embed sentences as raw text, no gloss
injection.** This also drops the gloss-worker pool from the sentence
pass entirely (no pickle cache needed for the sentence embed itself —
keep it only if you also do a glossed passage re-touch). The
cross-language recall is already carried by the passage-level
`glossed-v1` vectors and the `vec_t` translation lane; the sentence lane's
job is snippet precision and sentence-granular retrieval, not
cross-language bridging.

### Proven launch config (adapt scope)

From `HANDOFF.md`, the gloss re-embed's proven config was:

```
--scope=cst --batch=16 --gloss-workers=8 --fetch=256
```

For the sentence embed (no glossing): `--batch=16 --fetch=256`, no gloss
workers. Sentences are short so you can likely raise `--batch` to 32-64
safely under the same `--mem-budget`; test on `--limit 500` first and
watch GPU memory before committing the full run.

### Do NOT deploy during the embed

> Don't deploy while the gloss embed job is running — they deadlock on
> the passages table.

The segment pass and the sentence-embed pass write to
`passage_sentences`, not `passages`, so the deadlock surface is smaller
than the gloss re-embed's in-place `passages` UPDATEs. But the
boot-time `applySchema()` still runs `CREATE TABLE IF NOT EXISTS
passage_sentences` and `CREATE INDEX IF NOT EXISTS idx_psent_passage`,
which take locks on the new table. **Hold the deploy freeze for the whole
window anyway** — it is the simplest invariant and the outage came
precisely from violating it.

---

## 7. Phase 5 — HNSW rebuild, IN the maintenance window

This is the step that caused the 2026-05-29 outage. Read the failure
mode, then follow the procedure exactly.

### The exact failure mode (so it is not repeated)

From `BACKLOG.md`, verbatim:

> `REINDEX INDEX CONCURRENTLY idx_passages_embedding` on the 256 MB
> `dhamma-pg` instance ran for **4+ hours** on the disk-spill path
> (graph ~1.9 GB ≫ `maintenance_work_mem` 64 MB) and **caused a prod
> outage on 2026-05-29**: it held a SHARE UPDATE EXCLUSIVE lock on
> `passages` that blocked the app's boot-time schema apply (`db.js`
> runs `CREATE INDEX IF NOT EXISTS` on passages before `listen()`), so
> every app cold-start hung. Resolution: `pg_terminate_backend` the 3
> reindex backends → locks released → app booted; dropped the invalid
> `idx_passages_embedding_ccnew` artifact.

Three compounding causes:

1. **Memory starvation.** `dhamma-pg` is shared-cpu-1x / 256 MB. With
   `maintenance_work_mem` at its tiny default (64 MB), the HNSW graph
   (~1.9 GB for the passages index) could not be built in RAM and spilled
   to disk, stretching the build to 4+ hours.
2. **Lock conflict with boot.** The build holds a lock on `passages`.
   Every app cold-start runs `applySchema()` → `CREATE INDEX IF NOT
   EXISTS` on `passages` BEFORE `listen()`. The boot blocked on the
   build's lock; the app never reached `listen()`; cold-starts hung.
   With `auto_stop_machines = 'suspend'` and `min_machines_running = 0`,
   every wake is a cold-start, so the whole site was effectively down.
3. **It was run casually**, not in a window with deploys frozen.

The `passage_sentences` HNSW build is the same hazard at larger scale
(millions of rows). Treat it with more care, not less.

### Procedure

Do these in order. Freeze deploys for the entire phase.

**Step A — temporarily bump `dhamma-pg` RAM.** The 256 MB instance
cannot build a multi-GB graph in memory. Scale it up for the window:

```
flyctl scale memory 2048 --app dhamma-pg     # or higher if budget allows
```

This is temporary; scale back to 256 MB after (Phase 6). Note `dhamma-pg`
is normally always-on at 256 MB; the bump is for the build only.

**Step B — raise `maintenance_work_mem` for the building session.** Set
it on the session that runs the build, large enough to hold the graph in
RAM and avoid the disk-spill path that caused the 4-hour build. With a
2 GB instance, something like:

```sql
SET maintenance_work_mem = '1500MB';
SET max_parallel_maintenance_workers = 0;  -- shared-cpu, keep it single
```

(Set per-session, not cluster-wide, so a stray reconnect doesn't inherit
a giant setting.)

**Step C — freeze deploys and pin a machine up.** The lock-vs-boot
conflict only bites when a cold-start runs `applySchema()` during the
build. Two defenses, use both:
- **No `flyctl deploy` for the whole phase** (the standing rule).
- Keep one `dhamma` machine awake so no cold-start `applySchema()` fires
  mid-build. Temporarily `flyctl scale count 1 --app dhamma` with the
  machine started, or set `min_machines_running = 1` for the window, then
  revert. An already-running app does not re-run `applySchema()`, so it
  will not contend for the `passages_sentences` lock.

**Step D — build CONCURRENTLY, one fresh index.** For
`passage_sentences`, this is a first-time `CREATE INDEX CONCURRENTLY`
(there is no existing index to REINDEX):

```sql
CREATE INDEX CONCURRENTLY idx_psent_embedding
  ON passage_sentences USING hnsw (embedding vector_cosine_ops);
```

`CONCURRENTLY` keeps reads/writes live and does not take ACCESS
EXCLUSIVE; it takes the weaker SHARE UPDATE EXCLUSIVE. That is exactly
the lock that conflicted with the boot-time `CREATE INDEX` last time —
which is why Step C (no cold-start during the build) is the real
protection, not the `CONCURRENTLY` flag.

If a `CREATE INDEX CONCURRENTLY` is interrupted it leaves an INVALID
index (the `_ccnew` artifact from the incident is the analogous case).
After any failure, check and drop invalids before retrying:

```sql
SELECT indexrelid::regclass, indisvalid
FROM pg_index WHERE NOT indisvalid;
-- DROP INDEX <invalid_name>;  if any
```

**Step E — if you also re-touched `passages.embedding`** (only if you
chose to, per Phase 3): its existing `idx_passages_embedding` is valid
and serves search; in-place updates only degrade graph quality
marginally. A `REINDEX INDEX CONCURRENTLY idx_passages_embedding` is
**genuinely optional** (the standing rule). If you do it, it is subject
to the identical Steps A-D. Prefer to skip it unless recall is measurably
worse.

**Step F — verify the index is valid and used.**

```sql
\d+ passage_sentences          -- confirm idx_psent_embedding present + valid
EXPLAIN ANALYZE
  SELECT passage_id, position FROM passage_sentences
   WHERE passage_id = '<some id>'
   ORDER BY embedding <=> '[...]'::vector LIMIT 1;
```

The snippet use-case scopes the ANN by `passage_id` (a handful of
sentences), so even without the HNSW index that per-passage scan is
cheap — the HNSW index matters for any *global* sentence-level retrieval
lane you add to the RRF fusion. If you only use sentences for snippets
(scoped to one passage), you may defer the global HNSW index the same way
the blurbs HNSW is deferred (seq scan over a small per-passage set), and
build it only when a global `vec_sentence` lane is added. Decide based on
whether Phase 7 wires a new RRF lane or only the snippet refinement.

---

## 8. Phase 6 — Wire-up, teardown, verification

### 6.1 Server changes (`server/src/search.js`)

Minimum (snippet upgrade only): in the Meaning path, for a vector-only
hit where `headline` is NULL, replace the first-200-char fallback in
`makeSnippet` with a scoped ANN subquery that returns the best-matching
sentence for that passage given the already-computed query vector. Per
the `snippet-sentence-upgrade` memory note, this is "fully batchable in
one SQL" — fetch the top sentence per result passage in a single
`LATERAL`/`DISTINCT ON` query keyed on the result ids, no per-result embed
call. The query vector is already in hand (`qVec` / `qVecLit`).

Optional (new retrieval lane): add a `vec_sentence` lane to the RRF
fusion alongside `vec_p` / `vec_t` / `vec_blurb`. This needs the global
HNSW index (Phase 5 Step D/F). Sentences are short and on-topic, so like
blurbs they resist length dilution — but unlike blurbs there are millions
of them, so weight and distance-clip carefully and A/B test as
`BLURB_WEIGHT` was tested. Treat as a follow-up, not a window blocker.

### 6.2 Teardown (revert the temporary bumps)

- `flyctl scale memory 256 --app dhamma-pg` (back to the always-on
  baseline).
- Revert `min_machines_running` / `flyctl scale count` on `dhamma` to the
  fly.toml baseline (`min_machines_running = 0`, `auto_stop_machines =
  'suspend'`).
- Do NOT touch `dhamma`'s 4 GB / shared-cpu-2x sizing
  (`fly-memory-requirement`: "do not lower memory_mb below 4096").
- Stop the `flyctl proxy 15432` if no further local-to-prod work is
  queued.

### 6.3 Verify

```
curl -s https://dhamma.fly.dev/api/dbcheck
# passages unchanged (~194,710); tables +1 (passage_sentences); pgvector true
```

- Sentence row count and embedded count:
  `SELECT count(*), count(embedding) FROM passage_sentences;`
- 0 orphans:
  `SELECT count(*) FROM passage_sentences s LEFT JOIN passages p ON
   p.id = s.passage_id WHERE p.id IS NULL;`
- Index valid: the `pg_index WHERE NOT indisvalid` check returns nothing.
- Snippet smoke: a Meaning query that previously returned a vector-only
  hit now shows a sentence-precise snippet instead of the first 200
  chars. Compare a known query (e.g. an English thematic query against a
  CST commentary passage) before/after.

---

## 9. Rollback and safety

- **The new table is additive.** If the sentence work goes wrong, `DROP
  TABLE passage_sentences` (and remove its `schema.sql` block) restores
  the prior behavior completely; `passages.embedding` and all search
  lanes are untouched. The snippet fallback reverts to first-200-chars.
- **Resume, do not restart.** Both the segment pass and the embed pass
  are idempotent (PK `ON CONFLICT`, NULL-embedding cursor). A crash mid-
  run is resumed by re-launching, exactly like the gloss re-embed.
- **Volume snapshots** taken in Phase 1.3 are the backstop for the
  worst case (disk-full or corruption during the build). The 2026-05-29
  and the per-`<p>` disk-full incidents were both survivable because
  snapshots existed.
- **If the HNSW build hangs the site again:** the proven recovery is
  `pg_terminate_backend` on the build backend(s), which releases the
  lock and lets the app boot, then drop any INVALID `_ccnew`-style index
  artifact. Keep a `psql` session ready during Phase 5 to do this fast.
- **Do not lift the ORT 1.17 override** as a convenience during this
  work; it is a separate gated task per `onnxruntime-node-pin.md`.

---

## 10. Estimate (disk, wall-clock, cost)

Anchor numbers, verified or from the project docs:

- Corpus: **194,710 passages** (`/api/dbcheck`, 2026-06-04).
- Gloss re-embed throughput was ~3-5 rows/s on long passages on the RTX
  GPU; the translation backfill hit ~11.6 rows/s on shorter rows
  (`HANDOFF.md`). Sentences are short, so expect throughput nearer the
  high end, **~10-15 sentence-rows/s**, modulo DB write latency over the
  proxy.

**Full corpus (A):**
- Sentence rows: ~5.7M (`BACKLOG.md`). Table data ≈ 5.7M × 1024-d × 4
  bytes ≈ 23 GB of vectors alone, plus text and the HNSW graph (several
  GB) on top → **~30 GB needed; provision 40 GB** (Phase 1.2).
- Wall-clock at ~10-15 rows/s: 5.7M / ~12 ≈ **~130 hours of GPU embed**,
  i.e. roughly a week of background runs (matches `BACKLOG.md`'s "ballpark
  a week"). The segment pass is a separate cheap CPU/DB pass measured in
  hours.
- HNSW build on millions of vectors with a temporary 2 GB instance and
  large `maintenance_work_mem`: hours, not the prior 4+ (the 4-hour build
  was the *disk-spill* path on 64 MB; in-RAM is far faster). Budget a
  multi-hour window and watch it.

**Targeted (B, recommended):**
- Rows: low hundreds of thousands (Tipiṭaka mūla ~14,377 rows + ~400
  Library articles, ~10-40 sentences each) → a few GB of vectors. The
  existing 15 GB may suffice; extend to ~25 GB for build headroom.
- Wall-clock: under a day of GPU embed; HNSW build in well under an hour
  in-RAM.
- This captures the snippet/retrieval win where it is real (mūla +
  Library) for a fraction of the cost.

**Cost.** Compute is local (the RTX dev box) — no per-token or cloud GPU
spend; the user is on flat-rate plans. The only recurring cost delta is
the bigger `dhamma-pg` volume (Fly bills per GB-month of provisioned
volume); the temporary `dhamma-pg` RAM bump is billed only for the window
hours. Scale `dhamma-pg` back to 256 MB after (Phase 6.2). `dhamma`'s 4
GB stays as-is.

**Recommendation:** run scope (B) first. It de-risks the whole pipeline
(segmenter, schema, embed adaptation, in-RAM HNSW build, snippet wiring)
on a small corpus in a short window, proves the snippet win, and only
then commit the week-long full-corpus (A) pass if (A)'s marginal recall
on already-fine commentary rows proves worth the disk and time.
