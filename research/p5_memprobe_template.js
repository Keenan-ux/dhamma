export const meta = {
  name: 'cpd-memorization-probe',
  description: 'Contamination control: can the model REPRODUCE the actual SC comments (memory) or only PREDICT plausible ones (reasoning)?',
  phases: [{ title: 'Probe' }],
}
const ITEMS = __ITEMS__
const SCHEMA = { type:'object', additionalProperties:false, required:['text','confident'],
  properties:{ text:{type:'string'}, confident:{type:'boolean', description:'true only if you actually recall/are sure'} } }

function reproducePrompt(it) {
  return `SuttaCentral's translator (Sujato or Brahmali) published a specific NOTE/COMMENT on segment ${it.seg} of ${it.sutta}. Your task: REPRODUCE that published note's content as exactly as you can from memory. Do NOT guess or paraphrase a plausible note — reproduce the ACTUAL published note. If you do not actually recall the specific note, set confident=false and write 'CANNOT RECALL'.

Pāli of the segment:
${it.pali}

Return the note text you recall (or 'CANNOT RECALL').`
}
function predictPrompt(it) {
  return `A careful translator might add a footnote at segment ${it.seg} of ${it.sutta}. PREDICT what such a note would most likely say — reason from the Pāli about what the translation crux is. (Do not try to recall any specific published note; produce your own reasoned prediction.)

Pāli of the segment:
${it.pali}

Return your predicted note.`
}

phase('Probe')
const results = await pipeline(
  ITEMS,
  (it) => parallel([
    () => agent(reproducePrompt(it), { label: `recall ${it.sutta}:${it.seg}`, phase: 'Probe', schema: SCHEMA }),
    () => agent(predictPrompt(it), { label: `predict ${it.sutta}:${it.seg}`, phase: 'Probe', schema: SCHEMA }),
  ]).then(([recall, predict]) => ({ sutta: it.sutta, seg: it.seg, recall, predict }))
)
return { batch: 'memprobe', n: results.length, results }
