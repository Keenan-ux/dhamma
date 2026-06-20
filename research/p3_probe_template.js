export const meta = {
  name: 'cpd-probe-lexical-permitted',
  description: 'Phase-3 probe: dictionary-PERMITTED annotators find pure-lexical choice-points the no-DPD gold structurally could not contain — to bound true lexical recall',
  phases: [{ title: 'Probe', detail: '2 lexical annotators per passage' }],
}

const PASSAGES = __PASSAGES__

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['lexical_choice_points'],
  properties: { lexical_choice_points: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['pali', 'sense_a', 'sense_b', 'confidence'],
    properties: {
      pali: { type: 'string' },
      sense_a: { type: 'string', description: 'first defensible dictionary sense in this context' },
      sense_b: { type: 'string', description: 'second defensible dictionary sense in this context' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    } } } },
}

function prompt(p, k) {
  return `You are lexical reviewer #${k}. You MAY use your full knowledge of the Pāli lexicon (DPD/PED senses). Your narrow task: find PURE-LEXICAL choice-points in this passage — words that have TWO genuinely different DICTIONARY senses, BOTH of which plausibly fit this context, so a translator must choose. These are the "quiet" lexical splits a reader without a dictionary would NOT notice (no contextual, doctrinal, register, or syntactic flag — just two dictionary meanings). Do NOT mark register/domestication/doctrinal/syntactic choices; ONLY two-dictionary-sense splits. Do NOT use any English translation.

For each: the Pāli word, sense_a, sense_b (both must genuinely fit here). If none, return an empty list.

PĀLI TEXT (id ${p.id}, genre ${p.genre}):
${p.original}

Return ONLY the structured list.`
}

phase('Probe')
const results = await pipeline(
  PASSAGES,
  (p) => parallel([0, 1].map((k) => () =>
    agent(prompt(p, k), { label: `probe ${p.id} #${k}`, phase: 'Probe', schema: SCHEMA })))
      .then((annots) => ({ id: p.id, genre: p.genre, annotators: annots }))
)
return { batch: 'probe-lexical', n: results.length, results }
