---
name: dhamma-research
description: Run a rigorous, academically-defensible research study against the Dhamma corpus (dhamma.fly.dev / dhamma-pg) and write it up to a publishable standard. Produces a frozen pre-registration, an auditable hyperlinked full-enumeration dataset (canon-vs-commentary split, every citation resolving to a real corpus row), and a process-free thesis-format paper that passes a de-AI editor pass and adversarial peer review. Invoke for "/dhamma-research", or when the operator wants to study a question across the Pāli canon + commentaries to the awakening-census quality bar, enumerate every instance of something, build a research dataset, or turn a corpus finding into a defensible write-up. The skill carries the METHOD + the WRITING STANDARD; the operator supplies the question.
---

# dhamma-research

You run a corpus research study to a **publishable** standard and write it up so a Buddhist-studies
examiner would accept it. Two non-negotiables: **every claim is auditable** (resolves to a real corpus
row, hyperlinked), and **the paper reads like a human scholar wrote it** (no AI tells, no leaked internal
process). The intellectual content is the operator's question; what this skill carries is the *method*,
the *audit discipline*, and the *writing standard*.

**Run it through — decide, don't ask.** This skill is meant to run start to finish unattended; the operator
may have launched it and walked away. At a decision point, settle it yourself by the standard *which choice
is the more academically defensible, fair, and balanced* — and if a step is an obvious, defensible part of
doing the research, just do it. Reserve questions for the operator for genuine scope or values calls that
this standard cannot settle; never stop for something a competent researcher would simply proceed on.

**Treat the framing as a hypothesis, not a brief.** The operator's question, seed, or outline is a
*starting* hypothesis to test — never a conclusion to confirm or a script to execute. Pre-register its
negation with equal weight; if the data contradicts the framing, correct the framing and say so.
Over-confident or over-scaffolded framing never lowers the bar for falsification — and an obviously-missing
step (a counter-hypothesis, a control, a checked negative) is a *root* gap to close before continuing, not
a line for the Limitations section.

## The two bars already in this repo (reuse them, don't reinvent)

- **Output bar** — the awakening census: `public/research/awakening-events.json` rendered by
  `AwakeningStudy` in `src/ResearchView.jsx`. Full enumeration, every event hyperlinked to its passage,
  canon-vs-commentary columns, expandable evidence, a stated inter-coder agreement.
- **Method bar** — the translation study: `research/PREREGISTRATION.md`, `REPORT_v11.md`. k≥3 blind
  annotators, inter-annotator agreement (IAA), adversarial viva, held-out tests, a hard gate (**no
  fabricated evidence; every citation resolves to a real row**), and the `[canon]/[abhi]/[comm]/
  [scholarship]/[extension]` confidence tags.
- **Tool playbook** — `research/intoxicants/HANDOFF.md` (mode/scope heuristics, homograph traps:
  `meraya` not `surā`) and `research/TOOLING-AND-PROCESS.md`.
- **Method core** — `@PROVENANCE-SIGNATURE.md`: the provenance-signature framework (the eleven axes, the
  question→axes triage, the recall ladder, the paper segmentation, the worked Uttarakuru example). Imported
  and invoked as the first design step. Canon-vs-commentary is its first axis, not the whole method; the
  triage decides which other axes a given question is load-bearing on.
- **Writing standard** — `@WRITING-STANDARD-READABILITY.md`: how the paper is WRITTEN so a scholar reads it
  straight through (the Anālayo benchmark). Two physical lanes (plain hedged prose organized by finding in
  the body; all apparatus in footnotes + appendices), idea-shaped sections with one short visible Methods
  note, a numbered roadmap, worked examples, signposts, mostly inline typeset figures with few argued tables,
  ~15 pages. Governs the paper's FORM; the method core governs what is KNOWN. Reference implementation:
  `research/awakening/FINDINGS-readable.md` (render to PDF with `research/_render_pdf.py` + headless Chrome).

## Hard rules (the spine)

1. **Pre-register before you look — and if you already looked, pre-register the *rule*.** Freeze
   `RESEARCH-DESIGN.md` (master question, falsifiable hypotheses incl. an explicit H0/H1
   counter-hypothesis, a **codebook** defining every coded field, scope, edition) *before* the full
   census. No post-hoc bucket-fitting. The discovery-sweep-first flow (§3.6) means a seed often *already
   exists* when you write the prereg; that is fine and must be **disclosed** — the prereg's value is then
   the frozen **decision rule + falsifiable predictions + audit protocol**, not data-blindness. Three
   disciplines pay off: (a) **pre-commit a minimum count of disconfirming cases** as a falsification leg
   (e.g. "≥3 of the audited transitions must run counter, or H0 wins") — this makes suppressing
   counter-cases a pre-registered *failure*, not a choice, and is the single highest-yield honesty device;
   (b) **score every prediction verbatim afterward**, PASS and FAIL alike; (c) **a falsified prediction is
   a logged deliverable, not a silent fix** — when the data overturns a prereg leg (the IG cosmology's
   AN 7.66 Sineru figure falsified the draft's "Sineru's height is sub-commentarial"), record it as a
   scored-and-falsified leg and fold the correction openly; never quietly edit the number.
2. **Every citation resolves to a real corpus row.** No invented passages, no half-remembered ids.
   Spot-check against `/api/passage/:id`. Fabricated evidence fails the study.
3. **Canon vs commentary is the FIRST axis, not the only one — code the provenance signature.** The `layer`
   (mula/attha/tika/anya) is a structural ROLE, not a date and not an authority; treating it as the whole
   provenance question hides the within-canon chronological gradient and the verified-vs-assumed asymmetry.
   Import `@PROVENANCE-SIGNATURE.md` and run its triage at design time to pick the load-bearing axes
   (chronological stratum coded *independently* of layer, attribution, epistemic marking, cross-recensional
   reach, pre-Buddhist provenance, harmonization). The single canon-vs-commentary bit is demoted to one
   signal of a fuller signature. *(The Uttarakuru study is the cautionary case: 20 of 26 structurally
   "canonical" rows coded late-canonical or later, and the geography is never placed under the canon's own
   verification formula — both invisible to the layer axis alone.)* Keep canonical / commentarial /
   modern-scholar voices rigorously separate via the confidence tags.
4. **Reconfirm load-bearing negatives by SQL** (via `flyctl proxy 15432:5432 --app dhamma-pg`). A claim
   like "X never appears in the canon" must be a `GROUP BY work_role` count, not a search impression —
   the search lane is flaky and over/under-matches (it has been wrong before; see the `kammaṭṭhāna` case).
   Counts are **passage-rows**, and the corpus **double-ingests the canon** under two id schemes
   (SuttaCentral + CST): early-stratum counts run ~2× (commentary is CST-only, so the contrast is
   *understated*, never a moved headline), and the `pli-kn` Khuddaka catch-all mixes strata and
   double-counts the per-work slugs (exclude it, don't re-bucket). Also `work_slug` ≠ `work_role` (the
   Visuddhimagga is `pli-vism` but `work_role='mula'`). Account for all three — see `@PROVENANCE-SIGNATURE.md`
   RUNG 5.
5. **Drive the API serially and gently.** The box has no concurrency guard; fan-out crashes it. Within
   any agent, one request at a time; prefer `exact`/`stem` (FTS) over `meaning`; use `meaning` sparingly.
6. **A study is a living document, not an append log — the reader meets one paper, not a changelog.**
   Every change (an instance added, a count corrected, a section written, a phase landed) ends with the
   **Coherence pass** (editorial pass 4) before it commits or deploys. Two structural rules keep the job
   small: **counts are data-bound and stated once** (render every number from the dataset; never hardcode
   a count the data could drift from; give each headline fact ONE canonical home and reference it
   elsewhere), and **amend in place, then renumber** (the whole document is the edit unit — weave the new
   material into the arc, write its transitions, fix the section/table numbering and the abstract's
   roadmap; never bolt a phase onto the end).

## Method (run in this order)

0. **Triage the provenance axes first.** Before the design contract, run the `@PROVENANCE-SIGNATURE.md`
   triage (§4): the scope/shape gate, the always-on default-core axes, the question-type priors (PASS A),
   the trip-wires, the per-claim-cluster budget. Record the chosen axis set, the PASS-A codebook, and the
   named commitment to re-triage (PASS B) after enumeration. Honour the budget: ~5 cheap floor axes always;
   expensive axes only by trip-wire, ≤3 per cluster.
1. **Design contract.** Write `research/<topic>/RESEARCH-DESIGN.md`: master question; sub-questions on
   their *distinct* axes (don't merge typologies/dimensions); H0/H1; the codebook (including the triaged
   provenance axes); scope + edition disclosure; the dataset schema; the stopping rule. Freeze it (record
   the corpus snapshot count + date).
2. **Structural enumeration first.** Start from the corpus's own closed lists and known loci, not free
   search — that bounds the universe.
3. **Exhaustive multi-modal search, fully logged.** Every term × every relevant mode/scope/pitaka/layer.
   **Search the morphological STEM, not the surface string** — Pāli declension lengthens the final vowel
   (`uttarakuru` → `uttarakurūnaṁ / -su`), so a short-vowel substring silently drops the long-vowel forms;
   and run a **concept-independent / periphrasis pass** for any "no canonical warrant" claim, because a
   concept can be canonical without the name. **Absence of a TERM is not absence of the PHENOMENON**:
   before writing "X is purely commentarial," check whether the canon describes the thing in *other*
   words (the commentary's *upacāra-samādhi* "access concentration", 0 canon, names a hindrance-free
   pliant mind the canon already describes unlabelled — *vinīvaraṇacitta* / *kallacitta*, ~25 canon
   rows). The label and tiering may be late while the phenomenon is canonical; keep the licence narrow
   (this licenses "the label is late", not "the technical distinction is canonical"). And **pre-stage the
   verification pass while the bulk count runs serially**: a long enumeration is a prep window, so author
   the sense-audit samples, the stratum-splits, and the compound-vs-simplex checks before the numbers
   land, so verification fires on arrival instead of reacting to a count that "looks wrong." **Log every
   query** (`term · mode · scope · pitaka · layer ·
   endpoint · result-count`) and report the **search-depth ladder** (exact-FTS < short-substring < stem) as
   a first-class finding: recall is a measured variable, not an assumption.
   **Recall must exceed the question: run the wide discovery sweep (`@PROVENANCE-SIGNATURE.md` §3.6).**
   The morphological ladder widens *vertically* on the term the question names; the sweep widens
   *horizontally* across the rival vocabularies it did not — concept-neighbourhood expansion, an
   ASCII-invisibility check (long-ā / retroflex families a diacritic-naive search drops), co-text
   bootstrapping, a negative-space pass, and at least one **serendipity pass** told to ignore the question
   and report anything of general importance to another field. **Per-family sense-audit is mandatory:**
   every family the sweep promotes climbs its own ladder and is sense-audited on sampled rows before its
   count is believed — a high count of an abstract term is a doctrinal-list / homograph lexeme until proven
   otherwise (`%carita%` = 224 canon rows, all conduct, 0 temperament; `anusaya` / `cetopariya` are mostly
   fixed lists, not person-typing). A count whose sense you have not read is not yet a count.
   **Scale to an enumeration fleet for contested points — the headline question AND any sub-question or
   clarification that earns it** (a list to audit, a phrase to chase, a "how much is enough" debate).
   Fan out ~12–20 reasoning lenses that *only enumerate* (hundreds to thousands of stems + loci + an
   inference path per avenue; the limited-samādhi pass: 3,045 terms / 317 avenues), then take advantage
   of **every** avenue, not a decisive subset. **Hard rule (the reason/execute split):** the fleet agents
   reason about WHAT to search and never query; the orchestrator executes serially against `dhamma-pg`
   via the proxy + `sql.py` (NEVER the live `/api/*`, which cold-starts ~38 s and has no concurrency
   guard), sense-audits every count, and reads the priority loci. See `@PROVENANCE-SIGNATURE.md` §3.6.
   **Enforce the split mechanically, do not merely instruct it:** default workflow/subagent tooling carries
   Bash + flyctl + psycopg2, and an agent told to "verify against the rows" WILL extract `DATABASE_URL` and
   fire its own concurrent full-scan queries — which wedges `dhamma-pg` (observed 2026-06-22: a 24-agent
   adversarial-verify workflow left ~36 zombie `state='active'` backends, oldest 19 min). Forbid
   Bash/flyctl/psycopg2 in the agent prompt (or use a read-only/no-tools agent type) and pass the rows and
   counts **inline**; only the orchestrator touches the DB. Recovery if it happens:
   `pg_terminate_backend` on the stale `pg_stat_activity` rows (lighter than a `dhamma-pg` restart).
4. **Re-triage, then saturation stopping rule.** Run PASS B: re-evaluate the trip-wires on the *discovered*
   claims and add any fired axis with a logged warrant (an obviously-missing axis is a root gap to close
   here, not a Limitations line). Then loop-until-dry: keep adding strategies until **≥2 consecutive rounds
   find nothing new**; reconcile against external lists (secondary scholarship's cited passages, adjacent
   datasets); k≥3 blind coders sweep and union. Target "zero missed"; **claim only "saturated + measured"** —
   never assert unprovable completeness; report the residual recall risk.
   **Cross-read the axes to find the spine, and let the question be demoted.** The signature axes are the
   pattern substrate: read the wide field *across* axes (not down the one the question assumed) and let the
   *data* pick the spine — the axis with the sharpest split; rivals reported as runners-up. If the wide
   field shows the framing was searching one corner of a larger field, **re-spine and say so**: "demoted to
   a special case" / "the real unit is X" is a first-class result, not a failure (the carita study's
   chronology question was correct but demoted under the master function-vs-essence axis). Freeze the
   *selection rule*, not the answer-axis, so this stays un-bucket-fittable.
5. **Code blind, measure agreement.** k≥3 independent coders classify the per-instance fields; report IAA
   per field; adjudicate + log disagreements. **Per-claim-granularity gate:** a work→code lookup (e.g.
   `WORK_ATTRIBUTION[work]`) is a *recall aid for seeding candidates*, never the recorded code. Any
   per-claim axis (attribution, epistemic, harmonization) must be coded from the *row's own* content;
   before freezing a count, spot-audit ≥8 coded rows across work-classes and confirm each code is a
   function of that row, not of its work. A category that comes out exactly 0 or exactly = a work's size
   is the signature of a per-work shortcut: re-code it per row. (The awakening R1 retrofit published a
   false "0 buddha-vacana" precisely because it skipped this gate; see PROVENANCE-SIGNATURE §2.)
6. **Adversarially verify.** For load-bearing claims, an independent skeptic agent re-fetches the passage
   and tries to refute. Distinguish "unsupported" from "unavailable" (tool down ≠ claim false).

## The auditable dataset

`public/research/<topic>.json`, modeled on `awakening-events.json`: one record per unit of analysis with
`id, citation, sc_id, pts_ref, layer, voice, evidence_pali, evidence_en, tr_provenance` + the topic's
coded fields + (for commentarial cells) a `warrant` (the canonical id, or null) + (where the triaged
question needs it) the per-claim **provenance signature** (the coded axes from `@PROVENANCE-SIGNATURE.md`).
Pre-compute the cross-tab aggregates the paper's tables need, including the **stratigraphy table** (rows by
ascending chronological stratum, layer/stratum disagreements flagged) and, where epistemic marking is
coded, the **epistemic-status column** and the **absence table** (silent claim · expected frame · SQL-zero ·
licensed inference · confidence). Version it (`<topic>-census vX.Y`), pin the corpus snapshot date, and
publish the codebook + query log beside it (data-availability statement).
Render it as a `<Topic>Study` component in `src/ResearchView.jsx` (sibling to `AwakeningStudy`) — clickable
citations (`#/read/<id>`), canon/commentary + cross-tab tables, expandable evidence — admin-gated via the
existing Research tab + `/api/research`.

## The paper (final, public-facing) — format

The written form follows `@WRITING-STANDARD-READABILITY.md` (the Anālayo-benchmark readable standard), not a
process-shaped template. The body is **idea-shaped**: a human opening, a numbered roadmap, six sections named
for what the data says about the subject, one short visible **Methods note** (corpus + edition + recall floor
+ headline IAA, ~200 to 300 words), worked examples, signposts, mostly inline typeset figures with at most
one or two argued tables, then **Notes** and **Appendices A/B/C**. Target ~15 pages. Render to PDF.

**The rigor is preserved but relocated, not deleted.** Everything the method core produces still appears, in
the apparatus lane: the **per-claim provenance signature** goes in a footnote on the sentence it backs and in
Appendix A (full enumeration), NOT inline in the body; the **stratigraphy** finding drives the body's date
section and its dot-strip figure, with the wide stratigraphy table in Appendix A; an **epistemic-
stratification** section and an **absence table** (where those axes were coded) live in the body as prose +
one figure with the SQL/char-gap detail in Appendix B. The litmus test: a reader who skips every footnote,
table, and appendix still finishes with the data's highlights; a reviewer who follows any footnote still
reaches the full provenance signature. See `@WRITING-STANDARD-READABILITY.md` §2 (the mechanical
body/footnote/appendix placement rule) and §7 (what stays the same).

Citation apparatus: SuttaCentral id (primary) + PTS vol.page + CST row-id; flag variant readings; declare
diacritics; **translation provenance** — where the corpus has no English (commentary, Abhidhamma) the
rendering is the author's own gloss, marked as such and checked against the standard published translation.

## Editorial passes (run all four, in order, before shipping OR re-shipping the paper)

> The first three are the de-AI / peer-review / process-scrub passes for the prose. The fourth, the
> **Coherence pass, runs after ANY change, not only the first write** — it is the gate that keeps an
> expanding study from going patchy.


1. **De-AI copy edit — a SEPARATE pass, not inline.** Hand the draft to a dedicated editor agent with
   `EDITOR-CHECKLIST.md`. It strips em-dashes and the standard AI tells and returns clean prose.
   **Gate: zero em-dashes; checklist items addressed.**
2. **Adversarial peer review.** Three reviewer personas — a **Pāli philologist** (citations, readings,
   diacritics, gloss accuracy), a **meditation-studies scholar** (does it engage Cousins/Bronkhorst/Crosby
   etc.; is the contribution real), a **methodological skeptic** (is the stopping rule honest; are
   negatives proven or merely unfound; H0/H1 decided fairly). Each returns a review memo; revise to
   address every point; record the memo + responses in the internal log.
3. **Process-leak scrub.** The paper must **NOT** name the internal orchestration — no "agents", "the
   workflow", "a 114-agent pass", "the box", tool-friction notes. It **MUST** keep a real **Methods**
   section (corpus, edition, query log, codebook, IAA). *Rule: methods = the reproducible WHAT (required);
   orchestration = the internal HOW (excluded).* Grep the final paper for `agent|workflow|box|prompt|LLM`
   and remove leaks.
4. **Coherence pass — whole-document, MANDATORY after every change (not just the first write).** Hand the
   WHOLE rendered study to a dedicated coherence-editor persona with `COHERENCE-CHECKLIST.md`, and run the
   deterministic `<topic>-consistency` check on the dataset. It reads the artifact end to end as a
   first-time reader and reports every seam: numbers that disagree across prose and tables, a fact stated
   (and drifting) in three places, skipped section letters, "three results" when there are four, a section
   bolted on without a transition, terminology drift, a dangling cross-reference, an honesty tag dropped.
   **Gate: the deterministic check passes and every must-fix seam is applied before the change commits or
   deploys.** This is the pass that keeps the study reading as one paper as it grows; skipping it is how
   a study goes patchy.

## Two artifacts per study (keep them separate)

- **The paper** — clean, process-free, hyperlinked, publishable.
- **The internal methods/handoff log** — `research/<topic>/HANDOFF.md`: orchestration, tool friction,
  query-log raw, IAA tables, the dual-track tool-evaluation. This is where "how the sausage was made"
  lives; it never bleeds into the paper.

## Honesty rules

Confidence-tag every claim. Keep canon / commentary / secondary separate. State scope + limits.
**No normative practice claims**; for reader-facing aids, present what the sources license and flag what
they don't (e.g. the texts hold *carita* is teacher-assigned, not self-diagnosed — never output a single
"your answer is X" verdict). When the tool was unavailable, say so; don't dress an unfound result as a
proven negative.
**Never discard a finding; the only question is where it is filed.** Include always, decide only where.
A surprising, orthogonal, or off-question count is never dropped — it routes to an existing slot: the
standing general-importance section for patterns beyond the question (`@WRITING-STANDARD-READABILITY.md`
§5.8), a footnote/appendix for an in-scope-but-minor split, or an explicit "recorded, not used in the
thesis" note for a count you discounted but want on record. This includes the **granularity surprise**:
when a coarse code hides a boundary that is itself a finding about where a concept lives (a term
near-zero in the suttas but heavy in Abhidhamma+commentary, masked by a bucket lumping Abhidhamma with
the Nikāyas; cf. `@PROVENANCE-SIGNATURE.md` I.1), split it and file the split even though the study did
not ask it. Every filed find still earns the §5.8 gate (what / where / whence + a confidence tag), so
this stays a filing rule, not a dumping ground — never folded into the paper's own thesis, never
silently dropped.
