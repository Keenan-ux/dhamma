# Paper source-of-truth: the MD → JSX single-source

*2026-06-22. Each rigorous study's prose lived in two hand-synced copies — the readable `.md` (PDF source)
and a hand-written JSX component in `src/ResearchView.jsx` (the deployed reader) — and editing one and
forgetting the other was the standing drift hazard (the carita `53→43`, the access-concentration `39→22`,
and the de-comma recasts all had to land twice). Item #6 of the tool/DB pass closes this. The **individual-
guidance** study is now single-sourced; the pattern below rolls the others over the same way.*

## How it works now (individual-guidance)

The narrative — **§§II–VIII + the "Findings of general importance" section** — is **generated from
`FINDINGS-readable.md`** into `ResearchView.jsx` by `research/individual-guidance/gen-narrative.mjs`. The MD
is the single source; the reader is regenerated. The workflow is:

```
# edit FINDINGS-readable.md (prose, citations as plain "AN 7.66" / CST cites already mapped)
node research/individual-guidance/gen-narrative.mjs   # regenerate the narrative JSX in place
npm run build                                         # validate
# commit FINDINGS-readable.md + ResearchView.jsx together
```

The generator:
- writes between two marker pairs in `ResearchView.jsx` — `GEN:NARRATIVE-A` (§§II–IV) and `GEN:NARRATIVE-B`
  (§§V–Findings) — leaving the data-bound `{ds.term}` drift-strip table between them untouched;
- wraps citations using a display→id map **extracted from the current JSX** (the id authority), so ids stay
  exactly what the reader already had (dash-insensitive, word-bounded, so `Paṭis` is not matched inside
  `Paṭisambhidāmagga`); it prints any MD citation not in the map (add it to the reader once);
- maps `## II. Title` → `<h2>Title</h2>` (number dropped), `### …` → `<h3>`, `**G1. …**` → `<h3>` + `<p>`,
  `*x*` and `` `x` `` → `<em>`.

**Verification before deploy:** `npm run build` (JSX compiles), `node research/paper-sync-check.mjs … IndividualGuidanceStudy`
(drift drops to the out-of-scope parts only), and curl every `<Cite>` id (all 200). The first regeneration
also *fixed* the drift that had accumulated in the JSX (un-synced de-comma splits; missing G-finding `Where:`
provenance lines) by aligning the reader to the canonical MD.

## What stays hand-JSX (small, stable, NOT generated)

These are data-bound or reader-only and change rarely; they remain hand-written, outside the markers:
- the **abstract** + its **reproducibility `<details>`** (carries `{fmt(frameN)}` data-binding);
- the **`{ds.term}` drift-strip table** (rendered from the dataset);
- the **appendix census tables** + drill-downs (rendered from `public/research/individual-guidance.json`);
- the MD's **"Method in brief"** + **footer** have no reader equivalent (the reader uses the `<details>`
  instead), so they live only in the MD/PDF. `paper-sync-check.mjs` flags these as "drift"; that is expected.

## Rolling over the other studies

`AwakeningStudy`, `HeartBaseStudy`, `UttarakuruStudy`, `NagaStudy`, and the explorations are still hand-JSX.
To single-source one: add the `GEN:NARRATIVE-A/B` markers around its narrative regions, point `gen-narrative.mjs`
at its MD + component name (the generator is parameterizable per study), regenerate, verify (build +
paper-sync + citation curls), deploy. A future pass can generalize `gen-narrative.mjs` to take the MD path and
component name as args so one script serves all studies.
