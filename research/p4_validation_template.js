export const meta = {
  name: 'cpd-external-validation',
  description: 'External validation: does the model translation-blind/comment-blind choice surface predict where SC translators (sujato/brahmali) placed comments?',
  phases: [{ title: 'Annotate', detail: '3 segment-level annotators per sutta' }],
}

const SUTTAS = __DATA__

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['choice_segments'],
  properties: { choice_segments: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['segment_id', 'type', 'rationale'],
    properties: {
      segment_id: { type: 'string', description: 'the segment id that contains a choice-point' },
      type: { type: 'string', enum: ['lexical', 'register', 'domestication', 'syntactic', 'doctrinal'] },
      rationale: { type: 'string' },
    } } } },
}

function fmt(segs) {
  return Object.entries(segs).map(([k, v]) => `${k}\t${v}`).join('\n')
}

function prompt(s, k) {
  return `You are independent reviewer #${k}. Below is a Pāli text as numbered SEGMENTS (segment_id<TAB>Pāli). Identify which SEGMENTS contain a genuine translation CHOICE-POINT — a place where a careful translator would add a footnote because a non-trivial commitment must be made (lexical sense, register/connotation, culture-specific term, ambiguous syntax/scope, or a contested doctrinal sense). You MAY use your knowledge of Pāli and the lexicon.

ABSOLUTE FIREWALL: reason ONLY from the Pāli. Do NOT use, recall, or reconstruct any English translation OR any translator's note/comment for this text. Judge each segment on the Pāli alone.

GRANULARITY: flag a segment only if it has a real, footnote-worthy choice. Many segments are routine narrative/formula with no genuine crux — do not flag those. Return the segment_ids you flag, with type + brief rationale.

SUTTA ${s.id} — segments:
${fmt(s.segments)}

Return ONLY the structured list of choice_segments.`
}

phase('Annotate')
const results = await pipeline(
  SUTTAS,
  (s) => parallel([0, 1, 2].map((k) => () =>
    agent(prompt(s, k), { label: `val ${s.id} #${k}`, phase: 'Annotate', schema: SCHEMA })))
      .then((annots) => ({ id: s.id, annotators: annots }))
)
return { batch: 'external-validation', n: results.length, results }
