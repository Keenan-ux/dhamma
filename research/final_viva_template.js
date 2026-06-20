export const meta = {
  name: 'cpd-final-viva',
  description: 'Final confirmatory viva: after two contamination controls, does the validated claim survive?',
  phases: [{ title: 'Attack' }, { title: 'Synthesis' }],
}
const BRIEF = __BRIEF__
const V = { type:'object', additionalProperties:false, required:['strongest_attack','severity','claim_survives','recommendation'],
  properties:{ strongest_attack:{type:'string'}, severity:{type:'string',enum:['fatal','serious','minor','none']},
    claim_survives:{type:'boolean'}, specific_fixes:{type:'array',items:{type:'string'}}, recommendation:{type:'string'}}}
const SY = { type:'object', additionalProperties:false, required:['verdict','survives_overall','must_fix','summary'],
  properties:{ verdict:{type:'string',enum:['validated','validated-with-caveats','not-validated']},
    survives_overall:{type:'boolean'}, must_fix:{type:'array',items:{type:'string'}}, summary:{type:'string'}}}
const CLAIM = 'FINAL CLAIM (upgraded after two contamination controls): The model translation-blind choice surface predicts where human expert translators placed comments, ABOVE chance and ABOVE a salience(length)-matched null, on BOTH famous (lift +40.5) and low-fame/Vinaya (lift +41.6) text, p<0.0001 — and this is NOT memorization: a memorization probe found 30/30 CANNOT-RECALL with zero verbatim overlap, and the lift is identical on low-memorization-risk text. Therefore the model REASONS about genuine translation choice-points, matching independent human-expert judgment.'
const BASE = 'You are a hostile examiner. Find the single most damaging flaw that could INVALIDATE the claim; judge honestly if it survives. The two obvious attacks (raw contamination; salience confound) have been addressed by controls in the briefing — find what those controls do NOT cover, or a flaw in the controls themselves. Critique only the briefing; no tools.\n\n' + CLAIM + '\n\nBRIEFING:\n' + JSON.stringify(BRIEF)
const LENSES = [
  {k:'location-vs-text-memory', f:'The memorization probe tested whether the model can REPRODUCE comment TEXT. But the contamination worry was memorized LOCATIONS (which segments are commented). A model could encode "segment X is salient/commented" without storing the prose. Does the probe actually rule out location-memory? Is the briefing right that zero text recall implies no location memory?'},
  {k:'ground-truth-proxy', f:'SC comments are selective and noisy (cross-refs, textual variants, not-all-cruxes). The claim is "genuine choice-points." Does co-location with a selective proxy + over-flagging (precision 0.4-0.5) actually establish that, or only "the model and translators both attend to salient/loaded segments" — a weaker claim than "reasons about choice-points"?'},
  {k:'salience-null-adequacy', f:'The salience null matched on segment LENGTH only. Cruxes cluster on other features (rare lemmas, doctrinal terms, syntactic complexity) that a length-only null does not absorb. Could a richer difficulty null (hapax density, term-load) absorb the remaining +41 lift, reducing "reasoning" to "tracks lexical difficulty"?'},
  {k:'construct', f:'Even granting all controls: does "predicts where translators footnote" equal "is a valid choice-point finder for an auditable-translation workbench"? What would the claim still NOT license building on?'},
]
phase('Attack')
const attacks=(await parallel(LENSES.map(l=>()=>agent(BASE+'\n\nLENS: '+l.f+'\n\nMount your strongest attack. Structured output.',{label:'attack:'+l.k,phase:'Attack',schema:V}).then(v=>({lens:l.k,...v}))))).filter(Boolean)
phase('Synthesis')
const synthesis=await agent('You are the chair. Four examiners attacked the upgraded, control-backed claim:\n'+JSON.stringify(attacks)+'\n\n'+CLAIM+'\n\nGiven the contamination controls PASSED, decide: validated / validated-with-caveats / not-validated. Be precise about what is now established vs what remains genuinely open. List must-fixes only if any are load-bearing. Structured output.',{label:'chair',phase:'Synthesis',schema:SY})
return { attacks, synthesis }
