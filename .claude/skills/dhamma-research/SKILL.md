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

## Hard rules (the spine)

1. **Pre-register before you look.** Freeze `RESEARCH-DESIGN.md` (master question, falsifiable
   hypotheses incl. an explicit H0/H1 counter-hypothesis, a **codebook** defining every coded field,
   scope, edition) *before* the full census. No post-hoc bucket-fitting.
2. **Every citation resolves to a real corpus row.** No invented passages, no half-remembered ids.
   Spot-check against `/api/passage/:id`. Fabricated evidence fails the study.
3. **Canon vs commentary is a standard axis**, always (`layer` ∈ mula/attha/tika/anya; `voice` ∈
   buddha/commentary). Keep canonical / commentarial / modern-scholar voices rigorously separate via the
   confidence tags.
4. **Reconfirm load-bearing negatives by SQL** (via `flyctl proxy 15432:5432 --app dhamma-pg`). A claim
   like "X never appears in the canon" must be a `GROUP BY work_role` count, not a search impression —
   the search lane is flaky and over/under-matches (it has been wrong before; see the `kammaṭṭhāna` case).
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

1. **Design contract.** Write `research/<topic>/RESEARCH-DESIGN.md`: master question; sub-questions on
   their *distinct* axes (don't merge typologies/dimensions); H0/H1; the codebook; scope + edition
   disclosure; the dataset schema; the stopping rule. Freeze it (record the corpus snapshot count + date).
2. **Structural enumeration first.** Start from the corpus's own closed lists and known loci, not free
   search — that bounds the universe.
3. **Exhaustive multi-modal search, fully logged.** Every term × every relevant mode/scope/pitaka/layer.
   **Log every query**: `term · mode · scope · pitaka · layer · endpoint · result-count`. This log is a
   required deliverable (reproducibility *and* a demonstration of the tool's research utility).
4. **Saturation stopping rule.** Loop-until-dry: keep adding strategies until **≥2 consecutive rounds
   find nothing new**; reconcile against external lists (secondary scholarship's cited passages, adjacent
   datasets); k≥3 blind coders sweep and union. Target "zero missed"; **claim only "saturated +
   measured"** — never assert unprovable completeness; report the residual recall risk.
5. **Code blind, measure agreement.** k≥3 independent coders classify the per-instance fields; report IAA
   per field; adjudicate + log disagreements.
6. **Adversarially verify.** For load-bearing claims, an independent skeptic agent re-fetches the passage
   and tries to refute. Distinguish "unsupported" from "unavailable" (tool down ≠ claim false).

## The auditable dataset

`public/research/<topic>.json`, modeled on `awakening-events.json`: one record per unit of analysis with
`id, citation, sc_id, pts_ref, layer, voice, evidence_pali, evidence_en, tr_provenance` + the topic's
coded fields + (for commentarial cells) a `warrant` (the canonical id, or null). Pre-compute the
cross-tab aggregates the paper's tables need. Version it (`<topic>-census vX.Y`), pin the corpus snapshot
date, and publish the codebook + query log beside it (data-availability statement).
Render it as a `<Topic>Study` component in `src/ResearchView.jsx` (sibling to `AwakeningStudy`) — clickable
citations (`#/read/<id>`), canon/commentary + cross-tab tables, expandable evidence — admin-gated via the
existing Research tab + `/api/research`.

## The paper (final, public-facing) — format

Abstract · Question + hypotheses · **Literature review** (engage the field; confirm/quantify known
results, don't rediscover them) · **Methodology** (corpus + edition, the full query log, codebook, IAA) ·
one chapter per sub-question · Discussion · **Limitations** · Contribution · References · **Appendix =
the dataset + data-availability statement**.

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
