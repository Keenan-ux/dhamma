# Contamination Controls + Final Viva — What Is Actually Established

*Auditable Translation project. The decisive test for phase-5's positive (model
choice surface co-locates with expert-comment placement): is it reasoning, or
memory / learned convention? Two controls + a final adversarial viva.
Artifacts: `out/memprobe_metrics.json`, `out/validation_famous.json`,
`out/validation_lowfame.json`, `out/final_viva.json`.*

Date: 2026-06-07. Prod-free. **Verdict: validated-with-caveats** (the empirical
result survives; the cognitive interpretation is retracted).

---

## 1. What is ESTABLISHED (survives all four final-viva attacks)

> The model's **translation-blind, comment-blind choice surface co-locates with
> where human expert translators (SuttaCentral) place comments** — above a
> flag-count-matched positional null **and** above a length-salience null,
> **p<0.0001**, on **both** famous (lift +40.5) and low-fame/Vinaya (+41.6)
> text; recall ~0.63–0.65. This is **not corpus-specific verbatim
> contamination**: the memorization probe found **30/30 "cannot recall", 0.000
> verbatim overlap**, and the lift is **fame-invariant**.

For the **practical goal — a workbench that surfaces candidate choice-points to
a scholar — this is enough and it is validated.** The model's flags reliably
land where expert attention lands, robustly and not by memorizing these texts.

## 2. What is NOT established (retracted)

> ~~Therefore the model *reasons* about genuine translation choice-points.~~

The final viva (4/4 examiners, all "serious", claim-as-worded does **not**
survive) showed this inference is unlicensed, for two reasons I had missed:

1. **Location ≠ text memory; fame-invariance is non-diagnostic.** The probe
   proved the model can't reproduce the comment *text*. But the task predicts
   *locations*, and a model can carry a **learned annotation-convention prior**
   ("translators footnote at similes, doctrinal lists, untranslatable terms,
   Vinaya procedural markers") with zero stored prose. Such a prior — and a
   generic difficulty/salience detector — predict **identical fame-invariant
   lift**, because the cue is structural, not fame-dependent. So my
   fame-contrast cannot separate "reasoning" from "learned convention."
2. **Noisy-proxy target + length-only null.** "A translator commented here" ≠
   "a genuine choice-point" (comments include cross-refs, textual-variant and
   parallel notes; precision is only 0.39–0.51). And the salience null matched
   **segment length only** — leaving rare-vocab density, code-switching,
   syntactic complexity, verse/prose as unexcluded common causes that drive
   *both* model flags and human footnoting.

So the honest statement: **the model and human translators attend to the same
loaded segments, robustly and not via memorization — but whether the model's
mechanism is "reasoning about choice-points" or "a learned prior over where
translation is conventionally hard" is not distinguished by these experiments.**

## 3. Why the distinction may not matter (for the product)

"Reasoning" vs "learned annotation conventions" is a **cognitive-science
question, not a product question.** A workbench needs flags that reliably track
where the real choices are; it does not need to adjudicate *why* the model
produces them. On that practical criterion the finder is **validated**. The
"reasoning" claim was a scientific over-reach; the useful claim stands.

## 4. The controls, precisely

- **Memorization probe** (30 commented segments, recall-vs-predict): 30/30
  "cannot recall", 0.000 verbatim overlap in both conditions → **no
  corpus-specific verbatim memory.** (Tests text-recall, not location-recall.)
- **Fame contrast** (low-fame Vinaya+obscure vs famous): lift +41.6 vs +40.5,
  both p<0.0001 → **not driven by familiarity** with famous texts. (But
  non-diagnostic for reasoning-vs-convention, per §2.)

## 5. The controls that would settle the cognitive question (genuine future work)

The viva named them precisely:
1. **Location-recall probe** (predict comment positions without the source) —
   tests positional priors directly.
2. **Structure-matched null** (rare-lemma/term-load/verse-prose), not length
   only — must beat *that* before "reasoning" is licensed.
3. **Cruxes-only target** (drop cross-refs/variant notes) + a **human
   inter-annotator ceiling** (how much do two translators agree?) — the model's
   recall is only interpretable against that ceiling.

## 6. The meta-finding (the most robust result of all)

**Six times** across this investigation, the model (me) produced a confident
positive interpretation, and adversarial/statistical checking correctly pulled
it back to the defensible core: the 77% "composition" (phase 2), the redesigned
commentary lane (phase 3), the leave-in-Pāli "31%" (4A), the per-passage lane
(4B), the "non-circular reasoning" (phase 5), and now "therefore it reasons"
(phase 6). Each survived only as the *narrower* claim.

That pattern **is** the headline result, and it is the project's founding thesis
proven on itself: **the model is a powerful generator of plausible claims and an
unreliable self-validator; external, adversarial checking is what separates the
survivable from the seductive.** This is precisely why the workbench must be
*expose-don't-resolve / warrant-not-trust*: let the model generate the
choice-surface (validated — it tracks expert attention), but never let its
*interpretations* stand without checkable evidence. The whole six-phase arc has
now empirically earned that architecture.

## 7. Bottom line for the original question

*Is the AI up to par? Is the proposition dead?* No, not dead — and the core
capability is validated: **Opus 4.8's choice surface reliably co-locates with
independent human-expert judgment, robustly and not by memorization.** The
proposition (a model-driven, evidence-grounded, auditable choice-surface
workbench) is **alive and supported at its load-bearing step.** What's not
established — and may be both hard to settle and unnecessary for the tool — is
the grander cognitive claim that the model *reasons* like a scholar rather than
applying a learned sense of where translation is hard. For building the tool,
the validated co-location is what counts. For claiming the science, stay
honest: co-location, yes; reasoning, unproven.
