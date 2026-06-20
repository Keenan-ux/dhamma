# Improving Dhamma as a research instrument — measurable plan

Cross-cutting plan distilled from running two real research lines through the tool (the
[intoxicants study](intoxicants/HANDOFF.md) and the meditation-objects line). Goal: not just
fix what bit *this* topic, but make every future line of inquiry faster, more trustworthy, and
*measurable*. Each item has a metric and a target so a change can be scored, not just asserted.

The organizing idea: **build a small fixed evaluation set and a serial research harness once, and
every future tool change is measured against it instead of re-discovered by hand.** That harness
(Part D) is the single highest-leverage generalized improvement.

---

## Part A — Targeted fixes (specific to what we just did)

These are the concrete defects the intoxicants line exposed. Full detail + measurements live in
[intoxicants/HANDOFF.md](intoxicants/HANDOFF.md) (P1-P7, F1-F10). Distilled with metrics:

| # | Fix | Metric → target |
|---|---|---|
| F1 | Intoxicant alias cluster in `seed-aliases.sql` (`surā↔meraya↔majja↔pamāda↔{alcohol,liquor,beer,wine,intoxicant,drunk}`) | Stem/Meaning recall on a 10-query intoxicant set: precept loci in top-5 for ≥8/10 (today ~4/10) |
| F5 | Bind port before DB boot-work + `lock_timeout` (**DONE, staged**) | Time-to-serve after a crash with a stale pg lock: <5 s (was: never / manual pg restart) |
| F7 | Vinaya-rule commentary bridge (`pli-tv-bu-vb-pcNN` → Sp `…vaṇṇanā`) + bhikkhu↔bhikkhunī via parallels | `/api/passage/pli-tv-bu-vb-pc51/commentary` returns non-empty attha+tika (today `{[],[]}`) |
| F8 | Degemination in the fold + "no exact hits — N stem hits" fallback | Known-headword recall (`ahicchattaka`, `majjappamādaṭṭhāna`, `surāpāna`…): exact-mode false-negative rate 0% on the set (today ~40%) |

---

## Part B — Generalized tool fixes (apply to *every* line of inquiry)

The targeted fixes above are instances of deeper, reusable problems. These pay off on any topic.

### B1 — Survive concurrent research load (resilience). **CRITICAL, generalizes everything.**
Every multi-agent study fans out parallel queries; the single 4 GB box currently crashes under
~3-16 concurrent requests and (pre-F5) could not self-recover. F5 fixes self-recovery; F6
(concurrency guard serializing embed/Meaning work + a real `/api/ready` readiness probe distinct
from the false-healthy `/api/dbcheck`) prevents the crash.
- **Metric:** sustained concurrent Meaning queries before first 5xx → **target ≥8** (today ~3);
  and full-availability recovery time after an induced load spike → **<60 s unattended** (today: never).

### B2 — Make absence citable (negative-result affordance). **Generalizes: every study has negatives.**
Soma-absent, psychedelics-absent, tea-absent, "kammaṭṭhāna not in the suttas" — the most important
findings are often negatives, and today a `0`-result is indistinguishable from a timed-out/failed
query. Return an explicit `{total:0, status:"ok"}` vs an error, and a UI banner ("no corpus
occurrence of X" vs "query failed").
- **Metric:** on a 10-query negative-control set, 10/10 return a *distinguishable* clean-zero
  (today: ambiguous blank, indistinguishable from the outage failures we hit).

### B3 — Homograph / sense disambiguation as a general mechanism. **Generalizes: every common term collides.**
`surā`(liquor)/`sura`(deva), `soma`(drink)/Somā(nun)/moon, `āsava`(taint)/`āsava`(ferment),
`majja`/`majjhima`. The fix is not per-word: (a) a curated false-friend demotion (the existing
`DIACRITIC_BOOST` pattern, generalized) and (b) a **sense facet** on results built from the
already-present DPPN proper-name layer ("Person: Somā" vs "Concept"), so a scholar can isolate the
sense in one click.
- **Metric:** precision@10 on a homograph test set (surā, soma, sati, dhamma, āsava) →
  **≥0.7 for the intended sense** (today: surā ~0/10, soma ~0/29 are the wanted sense).

### B4 — Canonical-source-first ranking. **Generalizes: every doctrinal query wants the sutta first.**
The 173 k fine commentary/ṭīkā rows now numerically dominate the ~14 k mula rows, so Meaning mode
buries SN 22.59 / MN 26 under Visuddhimagga paragraphs. A primary-text (mula) boost or a "canonical
first" toggle.
- **Metric:** on a 20-query "famous doctrine → expected sutta" set, the expected mula sutta in
  top-3 for **≥16/20** (observed misses: MN 26 absent from top-6 for "formless attainment is not
  liberation"; Vism outranked SN 22.59 for "aggregates are not self").

### B5 — Exact-mode false-negative guard (degemination + mode fallback). **Generalizes: every Pāli lookup.**
A scholar who types a known headword in Exact mode and gets 0 wrongly concludes "not in corpus."
Collapse doubled consonants in the fold; when exact=0 but stem>0, surface the stem count.
- **Metric:** known-headword recall (a 15-term set incl. compounds) — exact-mode false-negative
  rate **0%** (today ~40%; `ahicchattaka` 0 vs 30 stem, `majjapamadatthana` 0).

### B6 — Citation precision: prefer SC ids / subdivide coarse CST volume rows. **Generalizes: AN/SN citing.**
A snippet can match a sub-section while `/api/passage/:id` serves a different sutta from the same
coarse CST volume row (e.g. the three-`madā` verse matched, but the fetch served AN 3.31). The
commentaries were already subdivided per-paragraph; do the same for AN/SN mula, or dedupe to the
clean SC id (`an3.39`).
- **Metric:** on 20 search→fetch round-trips, the matched snippet text is present in the fetched
  passage **20/20** (today: coarse-volume rows fail this).

### B7 — Untranslated-mula coverage hint. **Generalizes: every Vinaya/Abhidhamma/commentary question.**
Meaning+translation is structurally blind to untranslated mula, so the medicinal `telapāka` ruling
was never reachable that way — it silently returned adjacent translated suttas. Blend the
original-sentence lane, or show "this concept may live in untranslated text — try Original scope."
- **Metric:** on a 10-query "answer lives only in untranslated mula" set, the correct passage
  surfaces or is flagged for **≥8/10** (today ~0/10 via the translation lane).

### B8 — Surface the Pāli lemma behind an English gloss. **Generalizes: translation is an interpretive layer.**
"Royal soma drinking [Pāli: `vājapeyya`]" — the single most illuminating philological fact of the
soma facet was invisible because the snippet showed only the translator's word. Show the underlying
lemma in snippets/hover.
- **Metric:** qualitative — a scholar can identify a translation artifact (English word with no
  matching Pāli lemma) without manually fetching+aligning. Tie to the gloss endpoint already built.

---

## Part C — Generalized research-process fixes (how the studies are *run*)

The dual-track method (answer + tool-eval) worked; these are the lessons that make it repeatable.

- **C1 — Match orchestration concurrency to the tool's capacity.** The first run fanned 16 heavy
  agents at a single 4 GB box and took it down for hours, costing ~90% of the planned queries.
  Rule: for a fragile single instance, **query serially within agents and cap concurrent
  API-hitting agents low** (the meditation-objects line is launched this way). Better still, run
  heavy research against a **read path that isn't production** (DB proxy / replica) — see C5.
- **C2 — Separate retrieval from verification, and separate "wrong" from "unavailable."** The
  find→adversarial-verify pipeline caught the real win here: C3's all-`not_found` was an *outage*
  artifact, not bad retrievals, and the verifier said so. Always re-fetch cited passages
  independently, and tag failures as `unavailable` vs `unsupported` so the outage noise doesn't
  masquerade as disproof.
- **C3 — Pre-register negative controls and actually run them.** Tea/betel started as
  "argument from silence." List expected-negatives up front and run them so absence is *citable*,
  not asserted.
- **C4 — Emit a structured friction log from every run.** The per-query `relevance 1-5 + friction`
  log is what turned a research workload into a measurable tool-eval and produced the F-backlog.
  Keep it mandatory; it is the feedstock for Parts A/B.
- **C5 — Stand up a non-production read path for heavy runs.** The data layer (`dhamma-pg`) stayed
  healthy while the app wedged; a `flyctl proxy` + direct read (or a read replica) lets a study
  hammer the corpus without risking the live tool, and is *more* reliable for bulk verification.
  (Blocked only on having the DB connection string locally — worth wiring a read-only role.)

---

## Part D — The evaluation harness (the measurable backbone)

**This is the keystone.** Build once; every change in Parts A/B is then scored automatically.

1. **A fixed gold set** (~30 queries, JSON), four kinds, each with an expected outcome:
   - *concept → expected canonical locus* (e.g. "aggregates are not self" → `sn22.59` in top-3);
   - *homograph → expected sense* (e.g. `surā` → a liquor passage, not a deva passage, in top-5);
   - *known headword → expected non-empty* (e.g. `ahicchattaka` exact → >0);
   - *negative control → clean zero* (e.g. `tea` → `total:0, status:ok`).
2. **A serial runner** (`scripts/eval/run.mjs`): hits the live (or local) API **one request at a
   time**, with timeouts and the homograph anchors baked in, and scores each query
   (precision@k, recall, false-negative rate, negative-distinguishability, p50/p95 latency).
3. **A scorecard** committed per run, so F1/F5/F6/B1-B8 each show a before/after number.

- **Metric for D itself:** a single `npm run eval` produces the scorecard in <2 min serial; every
  PR in Parts A/B cites its delta on this set. Turns "I think this helps" into "+0.3 precision@10
  on homographs, −40% exact false-negatives."

---

## Priority order (what to land first)

1. **F5** (done, staged) → deploy. Protects every future run.
2. **D** (eval set + serial runner). Cheap; makes everything else measurable and gives the heavy
   research lines a safe serial path (C1/C5).
3. **F6** (concurrency guard + readiness) → the box survives normal multi-query use.
4. **F1 + B3** (intoxicant aliases + homograph demotion) → cheapest recall/precision wins.
5. **B2 + B8** (negative banner + lemma-behind-gloss) → squarely on the tool's philological mission.
6. **F7, B4, B5, B6, B7** as the corpus-coverage backlog.
