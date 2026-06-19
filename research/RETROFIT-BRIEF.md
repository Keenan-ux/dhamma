# Retrofit brief — apply the provenance signature to the past studies

A self-contained brief for a fresh chat. Goal: re-examine each completed dhamma-research study under the
**provenance-signature framework** (`.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md`), which the
skill now imports. The past studies were built on the single canon-vs-commentary axis, which is one
projection of a richer object; this retrofit checks whether the missing axes change any finding.

**Read first:** `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md` (the 11 axes, the triage §4, the
recall ladder, the worked Uttarakuru example §7), and `research/uttarakuru/FINDINGS-v2.md` (a worked
retrofit — what the framework surfaced that the single axis could not).

**Posture (binding):** this is a *test*, not a re-confirmation. Do not re-open a settled finding to defend
it; re-open it to see if the missing axes move it. If a retrofit changes a conclusion, change it and say
so; if it confirms one, report the confirmation as a strengthening. An obviously-missing axis is a root gap
to close, not a Limitations line. Do not query the corpus concurrently (the box wedges under fan-out: drive
SQL serially via `flyctl proxy 15432:5432 --app dhamma-pg`; agents plan, the operator runs).

## The procedure (per study)

1. **Re-triage.** Run the §4 triage on the study's actual question. Which axes are load-bearing? Record the
   chosen set + the justification for what you exclude.
2. **Recall re-check (mandatory for all).** Re-run the recall ladder on the study's key terms: search the
   morphological STEM, not the surface string (the Uttarakuru `uttarakuru` vs long-ū `uttarakurū-` miss,
   and the `amama` vs `amamā` miss, both under-counted the canonical layer); run a concept-independent /
   periphrasis pass for any "no canonical warrant" claim. Report the search-depth ladder. If recall grows,
   the census and every count built on it move.
3. **Chronology pass (the highest-yield axis).** Code chronological stratum *independently of the
   mula/attha/tika layer*. The decisive question: are any "canonical" attestations actually late-canonical
   (paritta, Apadāna, Buddhavaṃsa, Vinaya frame-narrative) or Abhidhamma? If so, a finding framed as
   "canon vs commentary" may really be an early→late gradient *inside* the canon. Flag the contestability
   of Pāli relative chronology and the circularity risk (do not let a genre/register label do duty as a
   date).
4. **Epistemic pass (where the question is about authority/literalness).** Are the load-bearing claims
   stated flat as background, or under the canon's own verification formula (`dibba-cakkhu`, `abhiññā`,
   `sayaṃ abhiññā sacchikatvā`)? A claim never epistemically marked is assumed, not verified.
5. **Add the signature + re-segment.** Where an axis fired, add its column to the dataset and a section to
   the paper (stratigraphy table, epistemic-status column, absence table), then run the four editorial
   passes + the deterministic coherence check. Counts stay data-bound.

## Per-study triage (the load-bearing axes, as a starting hypothesis to test)

- **Awakening census** (`public/research/awakening-events.json`, `AwakeningStudy`). Question = a full
  enumeration of awakening events. Load-bearing: **chronological stratum** (are the events spread across
  strata; is the commentarial/Apadāna/Jātaka awakening material late?), **attribution** (Buddha-vacana
  report vs hagiographic frame — the Apadāna/Jātaka awakenings are redactor-narrated), and the **recall
  re-check** on the attainment markers. Canon-vs-commentary columns already exist; add chronology +
  attribution and check whether the commentarial events are a *late* layer rather than a separate voice.
- **Individual-guidance** (`public/research/individual-guidance.json`). Question = how a person is matched
  to a teaching/object, canon vs commentary. Load-bearing: **chronological stratum** (the carita /
  kammaṭṭhāna / 40-object apparatus is late — the study already half-found this; code it as stratum, not
  just layer), **semantic-drift** (carita's temperament sense is a re-coinage — already noted; make it the
  drift strip), **epistemic marking** (is the matching system asserted-verified or systematized), and
  **cross-recension** (is the guidance typology pre-sectarian or Theravāda-systematic?).
- **Heart-base / bhavaṅga / insight-stages** (`public/research/heart-base-and-insight.json`). Already a
  three-tier (sutta / Abhidhamma / commentary) study, so the chronology axis is half-built. Add:
  **epistemic marking** (is the heart-base ever stated as verified, or always posited?), **cross-recension**
  (the Abhidhamma heart-base and the insight-ñāṇa ladder — Theravāda-specific vs shared with other
  Abhidharma?), and **harmonization** (where the commentary reconciles the sutta silence with the
  Abhidhamma placeholder).
- **Translation / divergence study** (`research/PREREGISTRATION.md`, `REPORT_v11.md`). The reception axis
  *is* the subject. Load-bearing: **reception/translation overlay**, **manuscript & edition provenance**
  (variant readings as load-bearing), **attribution**. Lower yield on chronology.
- **Intoxicants** (`research/intoxicants/`). Load-bearing: the **recall re-check** (the `majja` / `meraya`
  / `surā` homograph cluster is a known trap), **chronological stratum**, **cross-recension**.
- The public **Explorations** (wheel-turning-monarch, vegetarianism) are lighter worked examples, not
  rigorous studies; retrofit only if promoting one to a full study.

## What to hand back

Per study: the re-triage result, the recall-ladder delta (did the census grow?), the chronology finding
(any "canonical" attestation that is actually late), the epistemic finding (any load-bearing claim that is
never verified), and a verdict — finding *confirmed/strengthened*, *refined*, or *changed* — with the
dataset + paper updated and the coherence check green. Keep the internal log (`HANDOFF.md`) separate from
the paper; never let the orchestration leak into the prose.
