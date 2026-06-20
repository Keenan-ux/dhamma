export const meta = {
  name: 'cpd-crux-classifier',
  description: 'Control 3: classify each SC comment as a genuine translation crux vs cross-ref / textual-variant / parallel / pedagogical, to de-noise the target.',
  phases: [{ title: 'Classify' }],
}
const SUTTAS = __DATA__   // [{id, comments:{seg:text}}]
const SCHEMA = { type:'object', additionalProperties:false, required:['labels'],
  properties:{ labels:{ type:'array', items:{ type:'object', additionalProperties:false,
    required:['segment_id','label'], properties:{ segment_id:{type:'string'},
    label:{type:'string', enum:['crux','crossref','textual_variant','parallel','pedagogical_other']} } } } } }
function prompt(s) {
  const items = Object.entries(s.comments).map(([k,v])=>`${k}: ${v}`).join('\n\n')
  return `Below are a translator's published notes for ${s.id}, one per segment. Classify EACH note by its primary function:
- crux: flags a genuine TRANSLATION CHOICE (lexical sense, register, ambiguous syntax, untranslatable/technical term, doctrinal rendering decision).
- crossref: mainly points to another text/passage ("see ...", "cf. ...").
- textual_variant: about a manuscript/reading variant or emendation.
- parallel: cites a parallel (Sanskrit/Chinese/Āgama) without a translation-choice point.
- pedagogical_other: background, historical, doctrinal explanation, or anything not a translation choice.

NOTES:
${items}

Return a label for every segment_id listed.`
}
phase('Classify')
const results = await pipeline(
  SUTTAS,
  (s) => agent(prompt(s), { label:`classify ${s.id}`, phase:'Classify', schema:SCHEMA })
           .then((out)=>({ id:s.id, labels:out.labels }))
)
return { batch:'crux-classify', n:results.length, results }
