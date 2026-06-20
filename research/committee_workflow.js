export const meta = {
  name: 'cpd-committee-viva',
  description: 'Adversarial committee (PhD viva): independent skeptics try to invalidate the choice-point detection findings',
  phases: [{ title: 'Attack', detail: 'one skeptic per attack lens' }, { title: 'Synthesis', detail: 'survival verdict' }],
}

// Injected from research/out/committee_brief.json before launch.
const BRIEF = __BRIEF__

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['strongest_attack', 'severity', 'claim_survives', 'recommendation'],
  properties: {
    strongest_attack: { type: 'string', description: 'the single most damaging flaw you can mount' },
    severity: { type: 'string', enum: ['fatal', 'serious', 'minor', 'none'] },
    claim_survives: { type: 'boolean', description: 'does the central claim survive this attack?' },
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

const CENTRAL_CLAIM = `CENTRAL CLAIM UNDER EXAMINATION: "The lexical within-lemma sense detector is a valid audit-safe BACKBONE for choice-point detection — it catches roughly two-thirds of consensus-gold choice-points in the tested genres, and its blind spot on register/domestication/doctrinal choice-points (blind-spot recall ~0.34) is real and quantified, justifying the complementary divergence + commentary detectors. This is a phase-1 result on a small, partly non-random sample."`

const BASE = `You are a hostile PhD examiner. You will be given the full findings of a choice-point-detection validation study (metrics, concrete examples, and the authors' own stated threats to validity). Your job is NOT to be fair — it is to find the SINGLE most damaging flaw that could INVALIDATE the central claim, and judge honestly whether the claim survives it. Do not invent data; attack the methodology, the inference, the sample, or the measurement. You critique ONLY the briefing provided — do not call any external tools or APIs.

${CENTRAL_CLAIM}

FINDINGS BRIEFING (JSON):
${JSON.stringify(BRIEF)}`

const LENSES = [
  { key: 'sampling', focus: 'Sample validity & generalization: n=3/genre, only 4 genres scored offline before the DB outage (a NON-random subset), the seeded draw, and whether ANY per-genre number is decision-stable or generalizable to 194k passages.' },
  { key: 'gold-stability', focus: 'Gold-standard trust: IAA ~0.5 in several genres. If annotators agree only moderately on what a choice-point IS, is "recall against consensus gold" even well-defined? Does this collapse the headline numbers?' },
  { key: 'measurement-artifact', focus: 'Measurement artifacts: the fuzzy token-matching (substring / 5-char prefix), surface-vs-lemma mismatch, the 600-token truncation, and whether recall/precision are computed in a way that flatters or distorts the detector.' },
  { key: 'confound', focus: 'Confounds & alternative explanations: could ~0.68 recall be explained by annotators over-marking exactly the dictionary-polysemous words the detector trivially fires on? Is the blind-spot finding just an artifact of how types were assigned?' },
  { key: 'circularity', focus: 'Circularity & firewall: the "gold" is produced by LLM agents and the detector is evaluated for an LLM-mediated workbench. Is the gold circular? Could English have leaked despite the firewall? Is the whole validation self-referential?' },
]

phase('Attack')
const attacks = await parallel(LENSES.map((l) => () =>
  agent(`${BASE}\n\nYOUR ASSIGNED ATTACK LENS: ${l.focus}\n\nMount your strongest attack along this lens. Return structured output.`,
    { label: `attack:${l.key}`, phase: 'Attack', schema: VERDICT_SCHEMA })
    .then((v) => ({ lens: l.key, ...v }))))

const survived = attacks.filter(Boolean)
phase('Synthesis')
const synthesis = await agent(
  `You are the examination committee chair. Five independent hostile examiners attacked the central claim. Their verdicts:\n${JSON.stringify(survived)}\n\n${CENTRAL_CLAIM}\n\nSynthesize the committee's overall judgment. If any attack is 'fatal' and the claim does not survive it, the verdict cannot be 'build'. Weigh whether the honest, appropriately-scoped phase-1 claim survives, and list what MUST be fixed before the broader build proceeds. Return structured output.`,
  { label: 'chair synthesis', phase: 'Synthesis', schema: SYNTH_SCHEMA })

return { attacks: survived, synthesis }
