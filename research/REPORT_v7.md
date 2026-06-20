# The Unreported Controls — Location Prior, Not Content

*Auditable Translation project. REPORT_v7 records the three preregistered
final-viva controls that ran 2026-06-09 but were never written up, completes
the one left unscored, and integrates them into the project verdict. Written
2026-06-12 during the full-record audit. Artifacts:
`out/difficulty_null_{famous,lowfame}.json`, `out/cruxonly_metrics.json`,
`out/locprobe_metrics.json`, `out/locprobe_clean_famous.json`,
`out/locprobe_clean_lowfame.json`. Rules frozen in `PREREG_controls.md`
(2026-06-07, before any control ran).*

Date: 2026-06-12. Prod-free. **Verdict: the P5/P6 co-location result is, by
the project's own preregistered rule, explained by a location prior — the
model does not need the Pāli to predict where the comments are.**

---

## 1. What ran on 2026-06-09 (undocumented until now)

Three of the four controls REPORT_v6 §5 listed as "genuine future work"
were executed two days after REPORT_v6, per the frozen rules:

| control | prereg rule | result | verdict |
|---|---|---|---|
| 1. Difficulty-matched null | beats 97.5th pct on BOTH arms | lift +52.8 famous / +52.9 lowfame, p≈0 | **PASS** — not mere lexical difficulty |
| 3. Cruxes-only target | descriptive | crux-only recall 0.778 / 0.803 (up from 0.634 / 0.645), beats nulls | supportive |
| 2. Location-recall probe | "needs content" iff with-content ≥ location-only + 0.15 | famous clean: **+0.007**; lowfame: **−0.119** | **FAIL — location prior explains the result** |
| 4. Human IAA ceiling | — | not computable from existing data (no two humans annotate the same text) | open gap |

## 2. Control 2, precisely — the decisive one

The probe gives the model **no Pāli whatsoever**: only the sutta id, the
ordered segment-id list, and the count K of commented segments. It must
predict *which* K segments the SuttaCentral translator commented on.

- **Famous arm, clean (tools forbidden, p7 rerun):** location-only recall
  **0.627** (chance 0.348) vs with-content 0.634. Content advantage
  **+0.007** against the preregistered ≥0.15 threshold. Zero exact-set
  reproductions — consistent with a *prior*, not verbatim recall.
- **Low-fame arm (p6 run, scored 2026-06-12):** location-only **0.764**
  (chance 0.265) vs with-content 0.645. Content advantage **−0.119** — the
  model predicts comment locations *better without the text*. 23 exact-set
  reproductions, including exact K-of-50+ sets on obscure Vinaya texts.
- **Caveat on the low-fame arm (timestamp-verified):** those annotations came
  from the p6 template, which did **not** forbid tool use, and bilara-data
  (including the comment files) is local — the exact sets are plausibly
  file-reads, not weight memory. The arm is *suggestive, not clean*. The
  clean famous arm alone, however, already triggers the preregistered
  CONTAMINATED verdict, so the conclusion does not rest on the suspect arm.
  A clean (no-tools) low-fame rerun is the missing cell and is queued.

## 3. What this does to the v6 verdict

REPORT_v6's ESTABLISHED claim was: co-location above chance **and** above
length-salience, fame-invariant, not verbatim-memorized. Every word of that
remains true — and Control 1 strengthens it (not mere difficulty either).
But Control 2 now identifies the *mechanism* the viva said was
undistinguished: **a location prior over where SuttaCentral comments sit,
carried without needing the text in the prompt.** The viva's two objections
were not merely cautious; they were predictive:

1. "Location ≠ text memory; fame-invariance is non-diagnostic" — confirmed.
   The memorization probe tested text recall and found none; the location
   probe tested positional recall and found nearly all of the signal.
   Fame-invariance is now *explained*: SuttaCentral's comment files are
   public GitHub training data, so "low-fame in the canon" never meant
   "absent from the weights." Both arms are equally memorizable.
2. "Noisy proxy" — partially defused (Control 3: the signal is *stronger* on
   genuine cruxes), which makes the location-prior finding more pointed: the
   prior is good, it tracks real cruxes, and it does not come from reading
   the passage in front of the model.

**Downgraded:** the workbench-grade claim ("the model's flags track expert
attention") now carries a serious qualifier — it demonstrably tracks expert
attention *on texts whose expert annotations are published training data*.
Whether it can do so on text it has never seen annotated is exactly what the
famous/low-fame contrast was supposed to test and, we now know, could not.

**Survives:** the lexical backbone (deterministic, model-free, recall 0.647
on non-circular gold — untouched by any of this); the commentary-lane
negative; the meta-finding, now with a **seventh instance** — and the first
in which the demotion sat unrecorded for three days. The discipline failure
is itself a datum: the checks only protect the record if their results are
written down.

## 4. What would settle it now

1. **The clean low-fame location probe** (no tools) — completes Control 2's
   four cells for Opus 4.8.
2. **The same four cells on an independent model family (Fable 5).** This
   breaks *judge* circularity (every annotator and examiner so far was
   Opus 4.8) and tests whether the location prior is family-general. Note
   carefully what it cannot do: both families share public training data, so
   cross-family agreement would NOT rescue the finder from contamination —
   only a model whose with-content recall beats its own location-only by
   ≥0.15 earns the "reads the text" claim.
3. **Truly unseen ground truth** — expert annotations that post-date training
   cutoffs or were never published. The divergence lane's Sujato-vs-ATI
   intersection is the project's nearest source of such a signal, and its
   mirror also produces the two-humans-same-text data that Control 4 needs.

## 5. Bottom line

The model-as-finder lane, as validated in P5/P6, is **demoted from
"validated finder" to "validated location prior."** The flags still land
where experts comment — but the mechanism is now positively indicated to be
memory/convention over published annotation locations, not reading. For the
Auditable Translation design this sharpens, rather than kills, the
architecture: detectors that are constitutively immune to this failure
(deterministic lexical, human-divergence) carry the structure; the model's
role narrows to *staging evidence at* choice-points, not *finding* them —
unless an independent family passes the content-advantage gate that
Opus 4.8 just failed.
