# Current session — live work in progress

**Status as of 2026-05-24 10:00 EDT.** This file is the live handoff
to a fresh chat. It exists because there's an active background
embed job running on this machine that should NOT be killed, and the
next chat needs context to pick up smoothly without disrupting it.

Read this first, then `HANDOFF.md` for longer-term project state,
then `CLAUDE.md` for the standing project rules.

When the embed completes and the user moves on to other work, delete
this file. The whole point of it is that it captures a transient
moment.

---

## DO NOT KILL — active background work

There's exactly one long-running job and two supporting processes you
must leave alone unless the user explicitly says to stop them. They
are NOT zombies. Identify them before terminating any Python or
flyctl process.

1. **Python embed** — `scripts/ingest/embed_passages_glossed.py`
   running with `--scope=cst --batch=64 --gloss-workers=4
   --fetch=512`. Re-embedding all CST passages (attha + tika + Vism
   mula) with DPD English-gloss appendices for cross-language Meaning
   search. **Background task ID: `b660vy6qm`** (this may change if it
   crashes and gets restarted — match by command-line in
   `Get-WmiObject Win32_Process -Filter "name='python.exe'"`).
2. **flyctl proxy** — `flyctl proxy 15432:5432 --app dhamma-pg`. The
   `:5432` is critical. See "The proxy port lesson" below.
3. **Monitor tail** — a `tail -F` watching the embed output. Task ID
   `biq90vsnt`. This one will naturally exit when the embed finishes
   or its timeout (1 hour) elapses.

### How to check progress WITHOUT killing anything

Read the embed's output file directly:

```bash
tail -15 "C:/Users/isaac/AppData/Local/Temp/claude/C--Dev-Dhamma/6162606f-b15a-442c-9e65-082c5d9bc083/tasks/b660vy6qm.output"
```

(If the task ID has changed, find the latest under that `tasks/`
directory by mtime.)

Look for lines like:

```
    1600 / 100000  ·   5.30 rows/s  ·  ETA 152m03s  ·  avg_in=661c
```

Or completion:

```
[embed] populated 67000 rows in NNN s
[hnsw] built in Xs
[done] N / N rows have embeddings
```

You can also query the DB directly to see the current count without
touching the running script:

```powershell
$raw = (flyctl ssh console --app dhamma -C "printenv DATABASE_URL" | Out-String).Trim()
$pass = ($raw -split ':')[2].Split('@')[0]
$env:DATABASE_URL = "postgres://dhamma:$pass@localhost:15432/dhamma"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" $env:DATABASE_URL `
  -c "SELECT COUNT(*) FROM passages_embedding_meta WHERE gloss_version='glossed-v1'"
```

When the embed started this session at 10:00 EDT it had 129,391 rows
already embedded out of 187,424 in scope (~69 %). Pending ~58 K.
Expected steady-state rate 5-6 rows/s, so ETA ~3-4 hours from start.

### What the embed is doing and why it matters

CST commentary passages were originally embedded as pure Pāli. Cross-
language Meaning quality (an English query against a Pāli passage)
was weak because the vector had no English signal. This pass injects
a DPD English-gloss appendix into each passage's embedding text:

```
input = original[:4500] + "  ⟦GLOSSARY⟧  " + gloss_appendix[:3500]
```

The gloss appendix is built by walking each Pāli word of the passage
through the DPD inflection table (728 K rows) and pulling the
headword + first short definition. Result: every passage's vector
now carries both the Pāli content and the English semantic anchors
for the same words. English queries hit them properly.

Resume-friendly: `passages_embedding_meta` tracks which passages have
been done at `gloss_version='glossed-v1'`. Re-running picks up where
it left off. Safe to kill and restart at any time IF you understand
the proxy must stay healthy (see below).

---

## The proxy port lesson

`flyctl proxy 15432:5432 --app dhamma-pg` — the `:5432` matters and
omitting it WILL produce a confusing failure mode. I lost an hour to
this. Document for future self.

Default `flyctl proxy <port>` forwards the local port to the SAME
port on the remote machine. Postgres on dhamma-pg listens on 5432,
not 15432. If you start `flyctl proxy 15432` (without the `:5432`),
the proxy listens on local 15432 and TCP-connects accepted, but every
psql query gets `server closed the connection unexpectedly` because
the proxy is trying to talk to remote port 15432 where nothing
listens. The agent log (`~/.fly/agent-logs/*.log`) is the source of
truth: it will show `err connect tcp […]:15432: connection was
refused` when this is happening.

If a proxy needs to be restarted, the command is:

```powershell
Start-Process -FilePath "C:\Users\isaac\.fly\bin\flyctl.exe" `
  -ArgumentList "proxy","15432:5432","--app","dhamma-pg" `
  -WindowStyle Hidden -PassThru | Select-Object Id
```

Always verify with a real query, not just `Test-NetConnection`. TCP
listen != actual forwarding works.

---

## Fly app sleep behaviour — gotcha when fetching DATABASE_URL

The `dhamma` Fly app uses `auto_stop_machines = 'suspend'`. After
idle it stops. When you next try
`flyctl ssh console --app dhamma -C "printenv DATABASE_URL"` against
a sleeping dhamma, flyctl errors with "app dhamma has no started VMs".

Wake it first by hitting any API endpoint:

```bash
curl -s https://dhamma.fly.dev/api/dbcheck > /dev/null && sleep 5
```

Then the SSH console call works. The PowerShell wrapper I've been
using captures this:

```powershell
$raw = (flyctl ssh console --app dhamma -C "printenv DATABASE_URL" | Out-String).Trim()
if (-not $raw -or $raw.Length -lt 50) {
  curl.exe -s https://dhamma.fly.dev/api/dbcheck | Out-Null
  Start-Sleep -Seconds 5
  $raw = (flyctl ssh console --app dhamma -C "printenv DATABASE_URL" | Out-String).Trim()
}
$pass = ($raw -split ':')[2].Split('@')[0]
$env:DATABASE_URL = "postgres://dhamma:$pass@localhost:15432/dhamma"
```

The `dhamma-pg` app, by contrast, has `min_machines_running = 1` and
stays warm. The proxy works as long as dhamma-pg is up and the local
flyctl WireGuard tunnel is healthy.

`flyctl ssh console ...` on Windows always prints "Error: The handle
is invalid." after the command succeeds. That's a benign TTY warning;
ignore it.

---

## Don't `tail -F` casually — zombie risk

The Monitor tool armed with `tail -F | grep --line-buffered ...` is
useful for tracking long-running scripts. But it never naturally
exits. Each call leaves a `tail.exe` process running indefinitely.
After a session of heavy monitoring you'll accumulate dozens of them
holding file handles open.

This session ran into it: 18 zombie `tail` processes were holding
locks on old output files. Cleanup:

```powershell
$tails = Get-Process tail -ErrorAction SilentlyContinue | Sort-Object StartTime
$keep = $tails | Select-Object -Last 1  # the freshest = currently active
$tails | Where-Object { $_.Id -ne $keep.Id } | ForEach-Object { Stop-Process -Id $_.Id -Force }
```

When monitoring background jobs, prefer the `until` pattern with
`Bash run_in_background:true` that exits cleanly:

```
until grep -q "DONE" output.log; do sleep 5; done
```

---

## What's deployed to prod right now

All search/UX work is **live on https://dhamma.fly.dev/** as of this
session's last `flyctl deploy` (10:01 EDT). Commits since the
previous handoff:

- **Tag filter from Tags tab into Search**, with active-filter chip
  and `?tag=type:value` URL persistence.
- **Reader column-mode toggle** Pāli / English / Both (desktop;
  narrow viewports already have their own tab toggle), persists in
  localStorage.
- **Translator-fetch race fix** — for merged paragraph groups, the
  multi-translator dropdown was double-firing and blanking English
  mid-load on Vism-style passages. One fetch path now via the group-
  translations endpoint.
- **Primary-text canonicality boost** — curated ~30 famous canonical
  suttas (Karaṇīyamettā, Mahāsatipaṭṭhāna, Ānāpānasati, etc.) get a
  2.5× score multiplier so they surface near the top for thematic
  queries. Composes with the existing 1.25× mula boost.
- **BPS-direct translator attribution chip** — Bodhi's BP210S
  commentary translation was rendering "SuttaCentral · CC0" in its
  attribution chip; now correctly shows the source book + bps.lk.
- **Cross-sutta prev/next ordering fix** in the corpus tree
  (numeric-aware ordering, no more dn3.4 being "before" dn1.1).
- **"Buddhist" framing pass** — removed from non-essential places
  (subtitle, manifest, README) per the in-flight site-wide review.

Verified on prod: `?tag=simile:Lotus&q=heart` returns 11 hits (vs
16,731 without the tag), confirming the tag filter actually runs.

The embed job is the only thing not yet deployed — its writes go to
`passages.embedding`, not the code. Once it finishes, no deploy is
required for the new embeddings to take effect; the existing search
code reads `embedding` directly.

---

## Files this session created or substantially changed

Newly created:
- `BPS_EMAIL_DRAFT.md` — refreshed for all 7 BPS books (Vism + Bodhi
  4 + BP304s + BP502s + BP214s + BP509s + BP501s). Drafted, NOT
  sent. User discretion.
- `TIKA_REEMBED_DEFERRED.md` — explains why ṭīkā was deferred and how
  to resume. **If the current `--scope=cst` embed completes
  successfully, delete this file** — ṭīkā will be done.
- `CURRENT-SESSION.md` — this file. Delete when the embed completes.

Modified:
- `scripts/ingest/embed_passages_glossed.py` — added TCP keepalive,
  `run_with_retry` wrapper, attha/tika scope predicates, thread pool
  for parallel gloss build, ProcessPoolExecutor scaffold (currently
  unused, sits at module top for a future activation).
- `server/src/search.js` — `tag` query param, PRIMARY_TEXTS curated
  list, EXISTS predicate against passage_tags applied in every
  passage branch (FTS, vector, RRF, counts).
- `server/src/corpus.js` — `/api/passage/:id/group-translations`
  endpoint, numeric-aware tree ordering, primary-text-aware sort.
- `server/src/index.js` — wired the new endpoint, tag param.
- `src/browse/ReadingPanel.jsx` — column-mode toggle, BPS-direct
  attribution branch, translator-fetch race fix.
- `src/SearchView.jsx` — `initialTag` prop, tag-filter chip.
- `src/TagsView.jsx` — "search within this tag" button.
- `src/Dhamma.jsx` — URL parse + write for `?tag=`.
- `src/api.js`, `src/useSearch.js` — `tag` plumbing.
- `HANDOFF.md` — section for this session's UX work.

---

## Open backlog when embed finishes

When the embed completes and the dust settles, the open items are:

- **#28 Dictionary expansion CPD then Buddhadatta** — blocked on the
  CPD email reply. Email draft is in repo at `CPD_EMAIL_DRAFT.md`,
  pre-session state, needs the same revision pass the ATI / BPS
  drafts got before sending.
- **#29 v3 migration from @xenova/transformers v2** — needs a full
  corpus re-embed to flip versions. Best done alongside or after the
  current gloss pass, not during.
- **#30 AI-assisted draft translations** — `TRANSLATIONS-AI.md`
  carries the design. Pilot is DN 1 Aṭṭhakathā using BP209S as gold
  standard. Not started; needs user decisions on model/UX/storage.
- **#35 Tier 6 wider BPS Wheels + Bodhi Leaves catalogue** — ~100+
  pamphlets. De-dup against existing ATI articles required.

And the smaller in-progress thread from earlier:

- **BPS_EMAIL_DRAFT.md needs reading-pass before send.** Same for
  SUTTACENTRAL and CPD drafts. ATI email already sent.
- **Drop `TIKA_REEMBED_DEFERRED.md`** when this embed finishes — the
  whole reason it exists is the deferral that's no longer happening.

---

## User preferences and tone notes

(Carried forward from CLAUDE.md and MEMORY.md, restated here for the
fresh chat's convenience.)

- Flat-rate Anthropic plans. Don't penny-pinch model variant or
  context.
- No em-dashes in writing or code comments. Use commas or periods.
- Don't use "Buddhist" in user-facing copy without checking — the
  framing is under active review.
- One person, Isaac Keenan Cyr, goes by Keenan. First-person
  singular in copy.
- Bias toward forward motion. Don't offer "stop / pause / ship and
  take a break" as options without specific reason.
- Wait for direction before substantive moves, but interpret a clear
  question ("which approach do you recommend?") as a real invitation
  to recommend.
- Verify work, don't just claim it. Run psql, hit prod endpoints,
  inspect DOM via the preview tools. Trust no commit message.

---

## When this session's embed completes

1. The job will print `[embed] populated N rows in Ts` followed by
   `[hnsw] built in Xs` followed by `[done] N / N rows have
   embeddings`.
2. Verify in DB:

   ```
   SELECT COUNT(*) FROM passages_embedding_meta
    WHERE gloss_version='glossed-v1';
   ```

   Should match `in_scope` from the script's startup line.
3. Smoke-test Meaning search against an English-only query that
   should now hit a ṭīkā passage. The gloss appendix should let
   "purification of view" find ṭīkā passages on diṭṭhi-visuddhi etc.
4. Delete `TIKA_REEMBED_DEFERRED.md` (the deferral no longer
   applies).
5. Delete `CURRENT-SESSION.md` (this file).
6. Update `HANDOFF.md` § "CST DPD-glossed re-embed" to mark the work
   complete.
7. Mark backlog task #20 in the task list as `completed`.

The actual embedding compute is the only thing that takes time.
Everything else is paperwork.
