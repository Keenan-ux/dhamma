# Paper source-of-truth: the MD ↔ JSX dual-maintenance problem

*2026-06-22. Why each study's prose currently lives in two hand-synced copies, the interim protocol that
keeps them in step, and the migration that would make it single-source. Item #6 of the tool/DB improvement
pass: the SAFE half (a drift-checker + this decision) is delivered now; the full render-refactor is
deferred, deliberately, for the reasons below.*

## The two copies

Each rigorous study exists as prose in **two** places:

1. `research/<study>/FINDINGS-readable.md` — the readable / PDF source (rendered by `research/_render_pdf.py`).
2. A hand-written JSX component in `src/ResearchView.jsx` (e.g. `IndividualGuidanceStudy`) — the **deployed**
   reader on the admin-gated Research tab, with clickable `<Cite id>` passage links, `<em>` Pāli styling,
   the typeset abstract tags, the reproducibility `<details>`, and the data-bound appendix census tables.

A prose change must be applied to both. Editing one and forgetting the other is the standing drift hazard;
this campaign hit it repeatedly (the carita `53→43` correction, the access-concentration `39→22` fix, the
de-comma recasts all had to land twice).

## Why it is not already single-source (the hard part)

The obvious fix — render the reader **from** the MD — runs into three real frictions:

- **Data-bound counts.** The WRITING-STANDARD mandates that counts in the reader are rendered from the
  dataset, not hardcoded (`{fmt(frameN)}`, `data?.aggregates?.…`). The MD carries the literal numbers. So
  neither "render the MD" nor "generate the MD from the JSX" is lossless: one side has `{expr}`, the other
  has `755`. A single source has to resolve this (e.g. the MD carries the literal and the reader stops
  data-binding those few counts, or the MD gains a `{{count:…}}` placeholder syntax).
- **Citation links.** The MD writes `(AN 7.66)`; the JSX wraps it `<Cite id="an7.66">AN 7.66</Cite>`. A
  single source needs citation markup in the MD (a `[AN 7.66](cite:an7.66)` link syntax) and a renderer that
  maps it to `<Cite>` — and `_render_pdf.py` must learn the same syntax.
- **Reader-only chrome.** The `<details>` reproducibility panel, the interactive drill-downs, and the
  appendix tables (rendered from `public/research/<study>.json`) have no MD equivalent; the renderer must
  splice them in around the MD-derived narrative.

None of these is hard alone; together they are a real refactor of a **live, multi-study** component — and
doing it while the operator is reading the deployed paper risks breaking the very thing being read. So the
render-refactor is **deferred** to a window when the paper is not mid-read and the result can be
visually verified side-by-side.

## Interim protocol (now)

1. Edit BOTH copies for any prose change (this campaign's discipline).
2. Before deploy, run the drift checker as an **eyeball aid** (not a hard gate — it has known false
   positives on legitimate rewordings and on the data-bound counts):

   ```
   node research/paper-sync-check.mjs research/individual-guidance/FINDINGS-readable.md IndividualGuidanceStudy
   ```

   It bounds the JSX to the study's prose region, strips markup, and fuzzy-matches each sentence to its
   nearest counterpart; it lists sentences with no close match (lowest similarity = most likely real drift).
   Scan the low-score lines; a sentence wholly present in one copy and absent from the other scores near 0.

## The migration (deferred follow-on, when not mid-read)

Single-source the narrative by rendering the reader FROM the MD:

1. Give the MD a citation link-syntax (`[AN 7.66](cite:an7.66)`) and a count-placeholder syntax for the
   handful of data-bound numbers.
2. Write a small MD→React renderer (markdown + the two custom syntaxes → the existing styled `<p>`/`<em>`/
   `<Cite>` components) and teach `_render_pdf.py` the same two syntaxes.
3. Replace ONE study's hand-written narrative JSX with the MD render, behind a verification that the rendered
   HTML matches the current output, then roll the others over one at a time.
4. The appendix tables, `<details>`, and drill-downs stay JSX, spliced around the MD-derived narrative.

Net: prose edited once (in the MD), the reader and the PDF both generated from it, the drift hazard gone.
