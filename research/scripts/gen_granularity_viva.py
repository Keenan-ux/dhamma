#!/usr/bin/env python3
"""Generate out/granularity_viva_run.js — adversarial viva on the granularity result.

5 hostile examiners (distinct lenses) + chair, tools forbidden, attacking the
claims in REPORT_v11. A claim survives only if it survives them. Embeds the real
metrics so examiners attack numbers, not a summary.

Run from repo root:  python research/scripts/gen_granularity_viva.py
"""
import json, io

m = json.load(io.open("research/out/granularity_metrics.json", encoding="utf-8"))
sn36_audit = json.load(io.open("research/out/sn36_audit.json", encoding="utf-8"))["summary"]

def lane(pid, name): return m["passages"][pid]["lanes"][name]["span"]
BRIEF = {
  "prereg_targets": "span-level + fusion 'tames the flood' iff, held-out under leave-one-passage-out: precision>=0.50 AND commitment-recall>=0.70 AND flood_ratio<2.0, beating the permutation null and the segment-level baseline. Pre-committed NULL outcome: if no rule clears this, the workbench must rank-not-gate (ranked affordances + human cutoff), detection stays triage-grade.",
  "design": {
    "passages": "DN2 opening (famous, 2 translators) + SN36.21 Sīvakasutta (obscure, 3 translators)",
    "roles": "annotators k=4 (translation-blind, gold candidates) + source-critic k=3 (translation-blind detector lane, herd-blind-spot catcher) + divergence-span k=6 reps (English-only, the human-translation detector) + grading panel k=5 (translation-blind, labels each pooled span commitment/weak/style/spurious FROM PRIMARY EVIDENCE, source-blind)",
    "gold": "gold = the 5-grader majority label over the candidate pool = annotation UNION divergence-fired UNION critic-fired spans. Graders judge commitment-vs-style from Pāli+DPD+commentary only, NOT from whether translators differed (keeps gold independent of the divergence lane).",
    "known_caveat": "the gold is DETECTOR-SEEDED: the pool is the union of the three detectors' proposals, so recall/precision are WITHIN-POOL; a choice-point all three detectors missed is not in the gold (absolute recall unmeasured). The within-pool permutation null is weak because the pool is commitment-enriched by construction.",
    "merge": "the coordinator merged surface-variant duplicates (vedehiputto/vedehiputta, opakkamika/opakkamikāni) into concepts by shared Pāli token; DN2 31->20 concepts, sn36 29->17.",
  },
  "metrics": {
    "dn2_gold": "20 concepts: 7 commitment, 8 weak, 3 style, 2 spurious. grader IAA exact=0.819 commitment-binary=0.981.",
    "sn36_gold": "17 concepts: 12 commitment, 4 weak, 1 style. grader IAA exact=0.634 commitment-binary=0.731.",
    "dn2_lanes": {k: lane("dn2", k) for k in ["lexical","divergence>=1","divergence>=3","critic>=2","div>=2 OR critic>=2"]},
    "sn36_lanes": {k: lane("sn36.21", k) for k in ["lexical","divergence>=1","divergence>=3","critic>=2","div>=2 OR critic>=2"]},
    "leave_one_out_F1fit": m["leave_one_out"],
    "fixed_rule_both_passages": "div>=2 OR critic>=2 (chosen a priori, NO per-passage fitting): DN2 rec 1.00 prec 0.64 flood 1.57 ; sn36 rec 0.83 prec 0.67 flood 1.25 — clears all three targets on BOTH. div>=1 alone: DN2 rec 0.86 prec 0.50 flood 1.71 ; sn36 rec 0.83 prec 0.83 flood 1.0.",
    "herd_blind_spot": "divergence MISSED (translators agree) komārabhacca (DN2), upāsaka+semha (sn36); the source-critic recovered all 3.",
    "lexical_flood": "the validated deterministic lexical lane fires on 20 (DN2) / 24 (sn36) pure function-word tokens (viharati, atha, yena, santi, gotama) that no annotator/critic/grader marks — vs divergence which stays silent (div=0) on every style/spurious item.",
    "divergence_strength": "div>=5/6 reps -> precision 1.00 on sn36 (the strongest divergences are all real commitment choice-points).",
  },
  "staging_replication": {
    "claim": "the P0 grounded-fidelity headline replicates on the obscure passage sn36.21 (n=1 famous -> n=2)",
    "audit": {"A_grounded": sn36_audit["A_grounded"], "B_ungrounded": sn36_audit["B_ungrounded"]},
    "note": "coordinator-run audit vs dpd.db; the 10 grounded 'fabrications' spot-reviewed: >=3 are auditor under-credits (DPD content present), the rest commentary glosses outside the bolded-gloss index (the upper-bound caveat). audit corpus = bolded glosses only.",
  },
  "claims_under_test": [
    "C1: the granularity flood was a WRONG-UNIT problem; at the SPAN level the divergence lane fires at readable granularity (precision 0.50-0.83, flood ~1.0-1.7) where the segment-level binary flooded (REPORT_v10: 7/10).",
    "C2: a FIXED, untuned over-flag fusion (div>=2 OR critic>=2) clears all three prereg targets on BOTH a famous and an obscure passage — so the detector generalizes without a tuned threshold.",
    "C3: no single divergence rep-count THRESHOLD transfers across passages (F1-optimal T=3 on DN2, 1 on sn36) -> don't tune a global cut; rank-don't-gate by divergence strength + human cutoff.",
    "C4: the source-critic recovers the herd-consensus blind spot (the choice-points where translators agree but the sources say they shouldn't) on BOTH passages.",
    "C5: the P0 grounded-staging fidelity (0% hallucinated warrants, ~0 fabrication) replicates on the obscure passage; ungrounded free-recall fabricates 56%.",
  ],
}

JS = r'''export const meta = {
  name: 'granularity-viva',
  description: 'Adversarial viva on REPORT_v11 granularity + staging-replication claims: 5 hostile examiners (distinct lenses) + chair, tools forbidden.',
  phases: [ { title: 'Examiners' }, { title: 'Chair' } ],
}

const BRIEF = __BRIEF__;
const NO_TOOLS = 'CONSTRAINT: Do not use any tools or look anything up. Reason ONLY from the brief below and your own expertise. Closed-book.';
const EVIDENCE = JSON.stringify(BRIEF, null, 1);

const EXAM_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  lens: { type: 'string' },
  attacks: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    target_claim: { type: 'string' }, attack: { type: 'string' },
    severity: { type: 'string', enum: ['fatal', 'serious', 'minor'] },
    survives_as: { type: 'string', description: 'the narrowed claim that DOES survive your attack, or "nothing survives" if fatal' },
  }, required: ['target_claim', 'attack', 'severity', 'survives_as'] } },
}, required: ['lens', 'attacks'] };

const CHAIR_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  verdict: { type: 'string', enum: ['build', 'fix-then-build', 'do-not-build'] },
  fatal_count: { type: 'integer' }, serious_count: { type: 'integer' },
  surviving_claims: { type: 'array', items: { type: 'string' } },
  must_fix: { type: 'array', items: { type: 'string' } },
  own_forensic_check: { type: 'string', description: 'one independent check you ran in your head on the numbers, and what it showed' },
  one_line: { type: 'string' },
}, required: ['verdict', 'fatal_count', 'serious_count', 'surviving_claims', 'must_fix', 'one_line'] };

phase('Examiners')
const LENSES = [
  ['gold-validity', 'Attack the GOLD. It is detector-seeded (pool = annotation ∪ divergence ∪ critic); recall/precision are within-pool; absolute recall over all spans is unmeasured; the within-pool permutation null is weak (pool is commitment-enriched). Does any recall/precision number mean what REPORT_v11 says it means?'],
  ['circularity', 'Attack CIRCULARITY. The source-critic and the grading panel are the SAME translation-blind LLM family reasoning from the same primary evidence. Does that inflate the critic lane recall and/or the gold itself? Is the divergence lane (English-only) the only truly independent measurement, and if so what does that do to C2/C4?'],
  ['contamination-generalization', 'Attack CONTAMINATION + GENERALIZATION. DN2 is famous (grader IAA 0.98 is suspiciously high — are graders leaning on memorized scholarship rather than reasoning?). n=2 passages, ~19 commitment concepts total. Can C1/C2/C3 generalize from 2 passages, one of them contaminated?'],
  ['threshold-shopping', 'Attack THRESHOLD-SHOPPING. The F1-fit leave-one-passage-out FAILED to transfer (C3). The "fixed rule div>=2 OR critic>=2 clears both" (C2) — is that a post-hoc rule chosen AFTER seeing both passages? Were the prereg targets (0.50/0.70/2.0) loose enough that many rules pass? Is the verdict robust to the exact target values?'],
  ['merge-measurement', 'Attack the MEASUREMENT. The coordinator concept-merged surface variants (31->20, 29->17) AFTER seeing the data, and DN2 div>=1 precision lands exactly at the 0.50 floor. Did the merge or the matchkey fuzzy-matching manufacture or destroy signal? Could a different merge flip the verdict?'],
];
const exams = await parallel(LENSES.map(([lens, brief]) => () =>
  agent(`You are hostile examiner [${lens}] in a viva defending a research claim set. Your job is to INVALIDATE, not to be fair. ${brief}\n\nFor each attack name the target claim (C1-C5), the attack, severity (fatal/serious/minor), and the narrowed claim that still survives.\n\n=== EVIDENCE BRIEF ===\n${EVIDENCE}\n\n${NO_TOOLS}`,
    { schema: EXAM_SCHEMA, phase: 'Examiners', label: `exam:${lens}` }).then(r => r && ({ ...r })).catch(() => null)));

phase('Chair')
const chair = await agent(
  `You are the viva CHAIR. Five hostile examiners attacked the claim set below; their attacks follow. Weigh them, run ONE independent forensic check of your own on the numbers, and render a verdict: build / fix-then-build / do-not-build. Be honest — this program's discipline is that confident positives get pulled back to their defensible core (it has happened 10 times). State which of C1-C5 survive, the must-fixes, and your own forensic check.\n\n=== CLAIMS + EVIDENCE ===\n${EVIDENCE}\n\n=== EXAMINER ATTACKS ===\n${JSON.stringify(exams.filter(Boolean), null, 1)}\n\n${NO_TOOLS}`,
  { schema: CHAIR_SCHEMA, phase: 'Chair', label: 'chair' }).catch(() => null);

return { examiners: exams.filter(Boolean), chair };
'''
JS = JS.replace("__BRIEF__", json.dumps(BRIEF, ensure_ascii=False))
io.open("research/out/granularity_viva_run.js", "w", encoding="utf-8").write(JS)
print("wrote research/out/granularity_viva_run.js")
print("DN2 fusion:", json.dumps(lane("dn2","div>=2 OR critic>=2")))
print("sn36 fusion:", json.dumps(lane("sn36.21","div>=2 OR critic>=2")))
