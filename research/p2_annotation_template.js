export const meta = {
  name: 'cpd-annotation-p2-nodpd',
  description: 'Phase-2 NON-CIRCULAR gold: 3 independent annotators (NO dictionary, NO English) + critic across all 7 genres',
  phases: [
    { title: 'Annotate', detail: '3 independent no-dictionary annotators per passage' },
    { title: 'Critique', detail: 'completeness critic per passage' },
  ],
}

// Embedded {id, genre, original(<=600 tok)} — text in-prompt: zero prod load,
// and the firewall is perfect (English never present).
const PASSAGES = __PASSAGES__

const ANNOT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['choice_points'],
  properties: { choice_points: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['pali', 'type', 'rationale', 'confidence'],
    properties: {
      pali: { type: 'string' },
      type: { type: 'string', enum: ['lexical', 'register', 'domestication', 'syntactic', 'doctrinal'] },
      rationale: { type: 'string' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    } } } },
}
const CRITIC_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['missed', 'spurious'],
  properties: {
    missed: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['pali', 'type', 'rationale'],
      properties: { pali: { type: 'string' }, type: { type: 'string' }, rationale: { type: 'string' } } } },
    spurious: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['pali', 'why'], properties: { pali: { type: 'string' }, why: { type: 'string' } } } },
  },
}

const RULES = `STRICT RULES (this is a deliberately dictionary-free gold standard):
- Do NOT use any dictionary or lexicon (no DPD, no PED, no lookups, no curl, no web). Reason ONLY from the Pāli text below, your own knowledge of Pāli grammar/morphology/usage, and how a competent translator could legitimately render it differently.
- Do NOT consult or imagine any English translation (translation-blind).
- A CHOICE-POINT is a span where a translator must make a NON-TRIVIAL commitment that changes meaning or framing — not stylistic wording. Types:
  · lexical: genuinely two different senses both fit the context.
  · register: sense settled, but connotation / social level forces a choice (e.g. a grand-building word as a high-status vs plain term).
  · domestication: a culture-specific term kept foreign vs mapped to a familiar target equivalent.
  · syntactic: a genuinely ambiguous parse/scope that changes meaning.
  · doctrinal: a technical Buddhist term whose sense is contested or whose deeper reading differs from the surface.
- GRANULARITY: mark ONLY genuine meaning-affecting decisions a careful translator would footnote — a passage has a HANDFUL, not dozens. Empty list is valid.`

function annotPrompt(p, k) {
  return `You are independent reviewer #${k} producing a rigorous, DICTIONARY-FREE scholarly annotation of translation CHOICE-POINTS. Passage id ${p.id} (genre ${p.genre}).

${RULES}

PĀLI TEXT:
${p.original}

Return ONLY the structured choice-point list. Your final output IS the data.`
}
function criticPrompt(p, annots) {
  const lists = JSON.stringify((annots || []).map((a, i) => ({ reviewer: i, choice_points: (a && a.choice_points) || [] })))
  return `You are the COMPLETENESS CRITIC for dictionary-free choice-point annotation of passage ${p.id} (genre ${p.genre}). Three independent reviewers produced:
${lists}

Find (1) genuine choice-points ALL THREE missed; (2) any SPURIOUS over-marking. Same rules — NO dictionary, NO English.

${RULES}

PĀLI TEXT:
${p.original}

Return ONLY structured output: missed[] and spurious[].`
}

phase('Annotate')
const results = await pipeline(
  PASSAGES,
  (p) => parallel([0, 1, 2].map((k) => () =>
    agent(annotPrompt(p, k), { label: `annot ${p.id} #${k}`, phase: 'Annotate', schema: ANNOT_SCHEMA }))),
  (annots, p) =>
    agent(criticPrompt(p, annots), { label: `critic ${p.id}`, phase: 'Critique', schema: CRITIC_SCHEMA })
      .then((critic) => ({ id: p.id, genre: p.genre, annotators: annots, critic }))
)
log(`phase-2 no-DPD annotation complete: ${results.length} passages`)
return { batch: 'annotation-p2-nodpd', n: results.length, results }
