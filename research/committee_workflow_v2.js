export const meta = {
  name: 'cpd-committee-viva-p2',
  description: 'Phase-2 adversarial committee: skeptics test the non-circular re-run and the complementary-detector claim',
  phases: [{ title: 'Attack', detail: 'one skeptic per lens' }, { title: 'Synthesis', detail: 'survival verdict' }],
}

const BRIEF = __BRIEF__

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['strongest_attack', 'severity', 'claim_survives', 'recommendation'],
  properties: {
    strongest_attack: { type: 'string' },
    severity: { type: 'string', enum: ['fatal', 'serious', 'minor', 'none'] },
    claim_survives: { type: 'boolean' },
    specific_fixes: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string' },
  },
}
const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'survives_overall', 'must_fix', 'summary'],
  properties: {
    verdict: { type: 'string', enum: ['build', 'fix-then-build', 'dont-build'] },
    survives_overall: { type: 'boolean' },
    must_fix: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
}

const CENTRAL_CLAIM = `CENTRAL CLAIM UNDER EXAMINATION (phase 2): "Phase 2 re-ran the study to fix phase-1's three rejected flaws (survivorship sampling, 0.97 dictionary-circularity, fragile headline). On the FULL 57-passage seeded-random sample, with NON-CIRCULAR gold (annotators barred from any dictionary and any English), measured against two detector lanes: (a) the lexical lane's recall is honest-but-lower than phase-1's circular figure; (b) the DPD-INDEPENDENT commentary lane provides MARGINAL RECOVERY of choice-points the lexical lane misses, especially register/doctrinal ones; (c) therefore no single lane suffices but the lanes COMPOSE — empirically supporting the multi-detector architecture. All figures carry CIs and disclosed residual biases."`

const BASE = `You are a hostile PhD examiner. Find the SINGLE most damaging flaw that could INVALIDATE the central claim, and judge honestly whether it survives. Attack methodology/inference/sampling/measurement — do not invent data. Critique ONLY the briefing; call no tools.

${CENTRAL_CLAIM}

FINDINGS BRIEFING (JSON):
${JSON.stringify(BRIEF)}`

const LENSES = [
  { key: 'reverse-bias', focus: 'The no-DPD gold may now be biased AGAINST the lexical detector: annotators without a dictionary could miss genuine lexical choice-points that need a dictionary to see, artificially deflating lexical recall and inflating the apparent "commentary recovery." Is the architecture conclusion an artifact of swapping one bias for another?' },
  { key: 'commentary-precision', focus: 'The commentary lane fires on bold_definitions counts; common words are glossed constantly. Is the "marginal recovery" real signal, or does the commentary lane fire so broadly that it "recovers" gold by blanketing the passage (high recall, near-zero precision)? Check its precision and whether recovery survives a precision floor.' },
  { key: 'residual-circularity', focus: 'Removing DPD breaks dictionary-circularity but the annotators and the detector are still the same model family (shared training). Is the gold still circular at the model level? Could the detector and annotators agree because they encode the same priors, not because the choice-points are real?' },
  { key: 'sampling-power', focus: 'Even with all 57 random passages, n per genre is modest and the gold is LLM-generated. Are per-genre and per-type recall numbers decision-stable? Do the CIs permit the compositional claim, or is "lanes compose" within noise?' },
  { key: 'measurement', focus: 'Fuzzy token matching, 600-token truncation, surface-vs-lemma alignment, and the strict-vs-fuzzy spread. Could the headline recall and the recovery figure flip under strict matching or a corrected matcher?' },
]

phase('Attack')
const attacks = await parallel(LENSES.map((l) => () =>
  agent(`${BASE}\n\nYOUR ASSIGNED ATTACK LENS: ${l.focus}\n\nMount your strongest attack. Return structured output.`,
    { label: `attack:${l.key}`, phase: 'Attack', schema: VERDICT_SCHEMA }).then((v) => ({ lens: l.key, ...v }))))
const survived = attacks.filter(Boolean)

phase('Synthesis')
const synthesis = await agent(
  `You are the examination committee chair. Five hostile examiners attacked the phase-2 claim. Verdicts:\n${JSON.stringify(survived)}\n\n${CENTRAL_CLAIM}\n\nSynthesize the overall judgment. Any 'fatal' the claim does not survive forbids 'build'. State whether the appropriately-scoped phase-2 claim survives and what MUST be fixed before broader build. Return structured output.`,
  { label: 'chair synthesis', phase: 'Synthesis', schema: SYNTH_SCHEMA })

return { attacks: survived, synthesis }
