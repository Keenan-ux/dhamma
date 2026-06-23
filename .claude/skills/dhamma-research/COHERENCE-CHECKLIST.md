# Coherence pass checklist (whole-document, run after ANY change)

You are the coherence editor. A study has just been amended (an instance added, a count changed, a
section written, a number corrected). Your job is not to re-research and not to copy-edit prose tells
(that is the de-AI pass). Your job is to make the artifact read as **one paper written in one sitting**,
not a stack of phases. Read the WHOLE rendered study top to bottom as a first-time reader, then report
every seam. Apply every must-fix before the change lands.

The governing principle: **a study is a living document, not an append log. The reader meets one paper,
not a changelog.** A change is not done when the new bit is correct; it is done when the whole still
coheres.

## Two halves

**A. Deterministic check first** (a script, not a read). Author or run `<topic>-consistency` over the
dataset + the rendered numbers:
- The instance count equals the aggregate total equals the number the abstract states.
- Every cross-tab (facet×tier, mode×tier, criterion×tier, …) sums, by row and by column, to the totals.
- Every `id` resolves to a real corpus row; repeats are intentional and documented (e.g. one discourse
  with several assignment moments), not accidental duplicates.
- Every `facet` / `tier` / coded-field value is in the controlled vocabulary; no stray keys
  (a `directive_obj` leaking into a `mode` column is the signature failure).
- `meta.version` is bumped and `corpus_snapshot` is current; the data-availability statement matches.
- Every evidence quote is a literal substring of its source row (the no-fabrication gate).
If any of these fails, the prose built on it is wrong; fix the data first.

**B. Whole-document read** against the checklist below.

## Reconciliation (numbers)
- [ ] The headline N is identical everywhere it appears (abstract, tables, section prose, contribution).
- [ ] No count is hardcoded in prose that the dataset could drift from. Counts are rendered from the
      data; the only literal numbers are frozen findings (and those carry their query).
- [ ] Table totals and the running text agree. "X of Y cells" still equals the ledger.

## Single source of truth
- [ ] Each headline fact has ONE canonical statement. Other mentions reference it; they do not restate
      it differently. Flag any claim appearing in two places and confirm they agree and don't repeat.
- [ ] The reproducibility / method story is told once, in one place, not scattered across abstract +
      limitations + a footer saying the same thing three ways. Cross-reference instead of repeating.

## Structure and numbering
- [ ] Section sequence is complete and ordered: no skipped or duplicated labels (A, B, C… not A, B, D, F,
      G), no orphan section that the abstract's roadmap never promised, no promised section that is missing.
- [ ] The abstract's roadmap matches the actual sections and their order.
- [ ] "Three results follow" matches the number of results that actually follow. Recount after any add.
- [ ] Tables and figures are numbered in sequence and each is referenced from the text.
- [ ] New material is WOVEN, not bolted on: it has a transition in and out, sits in the argument's arc,
      and reads like it was always there — not like a phase appended to the end.

## Terminology
- [ ] The unit of analysis has one name used throughout (pick: instance / act / passage — not all three).
- [ ] Tier / layer / category names are consistent (e.g. the same work is always "para-canonical" or
      always "canonical Khuddaka", not both in different sections).
- [ ] Diacritics and citation format are uniform.

## Reference integrity
- [ ] Every internal cross-reference ("see section D", "the table below", "as the ledger shows")
      resolves to the thing it names after the renumbering.
- [ ] Every citation id and every warrant id resolves to a real row (covered by the deterministic check;
      confirm the prose's ids are in the dataset).

## Honesty seams (don't let an edit erode the standard)
- [ ] New claims carry a confidence tag and a stated limit; nothing tool-degraded is dressed as proven.
- [ ] The change introduced no process leak and no em-dash (the de-AI gates still hold).
- [ ] Canon / commentary / Abhidhamma / secondary voices stayed separated.
- [ ] **"Disagree == not-early" tautology check.** Wherever the prose reports a structural-layer vs
      chronological-stratum *disagreement* as evidence (e.g. "a `mūla` row coded late-canonical confirms
      the lateness"), confirm the stratum was coded **per row** (per-row philological features + κ), not
      assigned by the `work_slug → stratum` table. If it came from the table, the "disagreement" is true
      by construction (the work is simply late) and may NOT be narrated as independent corroboration —
      relabel it as a bucketing flag or cut the claim. (PROVENANCE-SIGNATURE §I.1 honesty box +
      per-claim-granularity guard; SKILL Method step 5.)
- [ ] **Raw-layer-magnitude-without-density check.** Any canon-vs-commentary magnitude claim ("the
      commentary says far more", "X is overwhelmingly commentarial") must report **density per million
      characters** (or per event/frame), not raw passage-row counts. Flag any magnitude headline standing
      on a row-ratio: the commentary was subdivided to ~330-char rows vs the canon's ~2,975-char rows, so a
      row count mostly measures segmentation (canon = ~9% of rows but ~44% by character). Direction-correct
      is not enough; the unit must be per-character. (SKILL standing rule 8.)

## The whole-read
- [ ] Read it straight through once. Does it read as one paper, or can you feel the phase boundaries?
      Name every seam you feel and fix it. If a section now duplicates or contradicts an earlier one,
      merge or reconcile them rather than leaving both.

Return: the deterministic check result, then a list of must-fix seams (with the exact location and the
fix) and should-fix improvements. The change does not land until the must-fixes are applied and the
deterministic check passes.
