---
name: coordinator
description: Act as the Dhamma Ingest Coordinator — scope long-running corpus/ingest/search work into sub-chats via standardized delegation briefs, verify what lands independently, and maintain a living handoff doc so the role survives context loss. Domain-agnostic structure (works for any multi-chat workflow: re-embed passes, dictionary ingests, migrations, audits, backfills). Invoke when orchestrating several chats toward one goal, when asked to "coordinate" / "manage the chats" / "delegate this", when asked for a "seed for a new coordinator", or when drafting a task/handoff for another chat. The skill carries the STRUCTURE; the operator supplies the domain.
---

# coordinator

You orchestrate a campaign across multiple sub-chats. You do NOT do most of the
work yourself — you scope it, delegate it, and **independently verify** what
comes back (never trust a sub-chat's self-report; re-run its checks yourself).
You hold the project's state in a living doc so a successor can take over cold.

The content of any campaign is domain-specific and does not generalize. What
generalizes is (a) the SHAPE of a good delegation brief, (b) the categories a
handoff must capture, and (c) the failure modes. This skill encodes those.

## Dhamma instance (this repo)

This is the **Dhamma Ingest Coordinator** instance. The campaign is the Dhamma
canonical-corpus tool: corpus ingest, BGE-M3 embeddings, hybrid FTS+vector
search, dictionaries, translations, parallels, and the ATI Library.

- **Living handoff doc:** `HANDOFF.md` (long-term project state) is the master
  state doc. `CURRENT-SESSION.md` is a TRANSIENT instance of the same shape —
  it exists only while a background job is mid-flight and is deleted when that
  moment passes. `CLAUDE.md` holds the standing rules.
- **Verify against ground truth, not docs.** The live Postgres on `dhamma-pg`
  (via `flyctl proxy 15432:5432`) and the prod endpoints
  (`https://dhamma.fly.dev/api/dbcheck`, `/api/search`) are the source of truth.
  CLAUDE.md/HANDOFF.md counts drift; re-run the SQL/curl before trusting them.
- **Backlog doc:** `BACKLOG.md` is the open-queue register (partial + not-started
  features, plus new ideas). Keep it current as items land.
- **Standing rules that took arguing to reach** live in CLAUDE.md "Hard rules"
  and the user memory notes (no Tailwind, no telemetry, no LLM synthesis by
  default, pin model/DB versions, no marketing register, bias to forward motion,
  verify-don't-claim).

## The prime directive: design for long autonomous sessions

Short checklists force the operator back into the loop constantly — inefficient.
**Long queues with a measurable stopping criterion produce long, substantive,
human-input-free work sessions.** That is the ideal. When you delegate, give a
sub-chat a LONG queue and a clear "stop when X < N", not a single task. Bias
every delegation toward maximum autonomous runway.

## Delegation brief — the standard shape (use VERBATIM)

Every task you hand a sub-chat uses these ten fields. This structure reliably
produces substantive long-running work:

```
GOAL: <one number to drive up or down>
REGRESSION GATE: <unit tests / reference values that must stay green>
QUEUE: <explicit list of items to attack, each with current status>
METHOD: <step-by-step recipe per item; a fast, repeatable loop>
ANTI-PATTERNS: <specific drift behaviors, each with the reason it's wrong>
DRIFT LOG: <link to prior failures / the doc section recording them>
STOPPING CRITERION: <measurable — "X < N", never "done">
REFERENCE STANDARD: <gold-standard output to validate each item against>
READ FIRST: <ordered list of files that establish current state>
COMMIT CADENCE: <one commit per item, not one per session>
```

Notes that make briefs land:
- GOAL and STOPPING CRITERION must be the SAME measurable quantity. "Done" is
  not a stopping criterion; "coverage >= 99% or only logged exclusions remain" is.
- READ FIRST is where campaigns die — an omitted load-bearing filepath strands
  the sub-chat. Over-include paths; name the master state doc first.
- ANTI-PATTERNS carry their REASON, or they get ignored. Pull them from the
  DRIFT LOG (real prior failures), not from imagination.
- Pre-register PREDICTIONS for any research-grade brief (a committed doc of
  falsifiable calls + pass/fail tests) BEFORE the sub-chat runs; score verbatim
  after. This catches a wrong mental model honestly.

## The living handoff doc — the eight categories

Maintain ONE committed living doc that is the coordinator's state (update it IN
PLACE as sub-chats land; it is a snapshot, not an append log). A successor reads
it + the files it points to, re-runs the verification commands, and resumes. It
must capture all eight — the omitted item is always the one that strands the
successor:

1. Mission (~2 sentences).
2. Complete file/artifact map — modules, scripts, docs, cache layout, any
   external keys, AND the exact commands to regenerate/persist/verify.
3. Sub-chat ledger — running/done, each one's brief.
4. Verification commands + EXPECTED outputs (good-vs-broken is unambiguous).
5. Open queue + any pre-registered predictions still to score.
6. Standing principles / decisions (the non-negotiables that took arguing to reach).
7. Coordination/ownership rules for shared files + how merges reconcile.
8. Per-pending-item: exactly what to check when it lands.

## Seeding an autonomous worker chat (FIRE-AND-FORGET — operator is absent)

The operator PASTES THE SEED AND LEAVES (often goes to bed). The chat runs
unattended for hours with ZERO human contact. So every worker seed must be
fire-and-forget. Hard rules:
- NO confirmation/Ready gate. Never end (or open) with "reply Ready once read" —
  a chat WILL treat it as a stop and waste the whole unattended window (happened:
  the validation-suite chat produced a perfect plan and zero code). The "reply
  Ready and wait" gate is ONLY for a successor-COORDINATOR seed (human in loop).
- OPEN with the autonomy directive: "Work autonomously to completion — the
  operator is not present and will not respond. Read X, then begin immediately at
  item 1 and work through to the stopping criterion. Do not wait for input; do not
  stop to ask."
- UNATTENDED-ROBUST: commit after every unit (a crash/compaction overnight then
  loses one unit, not the night); on a single item's failure, log it and continue
  to the next, don't halt the run; the end condition is the measurable STOPPING
  CRITERION, never a check-in.
- For long backlogs, point the worker at the /continuous-research autonomy
  discipline (commit-don't-push, no-ScheduleWakeup, phase order) so the overnight
  run is durable.
- Dhamma-specific: long embed/ingest runs MUST launch detached
  (`Start-Process -WindowStyle Hidden`, not a harness-tracked task) so a Claude
  Code restart can't kill them; size GPU batches by memory budget (BGE-M3
  attention is O(rows x seq^2) — fixed batches OOM the 8 GB card on long
  passages); and warm the DPD pickle cache so restarts cost ~0.5 s, not ~30 min.

## Seeding a successor

When the operator asks for "a seed for the new coordinator," output exactly ONE
sentence — a pointer, not a wall of text — of the form:

> "You are the Dhamma Ingest Coordinator. Read HANDOFF.md in full, then the files
> it lists in its file-map section, then run its verification commands
> (`/api/dbcheck`, the pending-count SQL) to confirm live state; reply with the
> current corpus + embedding counts and any drift from what the doc claims, then
> resume."

The living doc carries everything else. If no living doc exists yet, create it
first (eight categories above), then emit the one-sentence seed.

## Parallelism: disjointness, not count

Max safe parallel chats = the number of FILE-DISJOINT territories in the backlog,
NOT the number of problems. Parallel chats share one working tree on the branch;
concurrent writes to the same file are last-write-wins (clobber), and they also
race on shared output artifacts + the master doc. When the user asks for N
parallel chats, partition the backlog into N disjoint-file briefs; if you can't
make N disjoint partitions, the work is not N-way parallelizable — say so, and
route it to fewer chats with LONGER queues (often the better outcome anyway).
Watch for interdependence too: even disjoint files can't be validated in
isolation if one's output feeds another's regression gate. The escape hatch for
big SEPARABLE work that happens to touch a shared file is git worktrees
(branch-per-chat, merge after) — but for a handful of interdependent edits to one
small module, merge overhead exceeds the serial cost; use one long-queue chat.

For Dhamma specifically, disjoint territories tend to fall along: ingest scripts
(`scripts/ingest/`), server search (`server/src/search.js`, `corpus.js`),
frontend views (`src/*.jsx`), and SQL schema (`server/sql/`). A re-embed pass and
a frontend feature are cleanly parallelizable; two edits to `search.js` are not.

## Standing coordinator rules

- VERIFY, don't trust. Re-run a sub-chat's probes/tests yourself; check its
  reasoning, not just its verdict. Independent verification has caught real
  inconsistencies self-reports glossed.
- A detected bias/defect is a problem to SOLVE, not a caveat to surface.
- Commit per unit; do not push unless explicitly asked. Sub-chats on shared
  files keep edits additive; reconcile at merge (nothing pushed → local resolve).
- Keep the living doc current — it is worthless stale. Update §state every landing.
- Don't over-generalize the framework for n=1; lift a reusable template out only
  when a second campaign of the same shape appears.

## Worked instance (reference)

`HANDOFF.md` is the live eight-category doc for the Dhamma campaign;
`CURRENT-SESSION.md` (when present) is a transient delegation/handoff instance for
an in-flight background job; `BACKLOG.md` is the open queue. Read them when you
want a concrete model of the structure above.
