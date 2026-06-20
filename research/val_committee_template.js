export const meta = {
  name: 'cpd-validation-viva',
  description: 'Adversarial viva on the external-validation positive: does the model really predict expert-comment placement, or is it an artifact?',
  phases: [{ title: 'Attack' }, { title: 'Synthesis' }],
}
const BRIEF = __BRIEF__
const V = { type:'object', additionalProperties:false, required:['strongest_attack','severity','claim_survives','recommendation'],
  properties:{ strongest_attack:{type:'string'}, severity:{type:'string',enum:['fatal','serious','minor','none']},
    claim_survives:{type:'boolean'}, specific_fixes:{type:'array',items:{type:'string'}}, recommendation:{type:'string'}}}
const SY = { type:'object', additionalProperties:false, required:['verdict','survives_overall','must_fix','summary'],
  properties:{ verdict:{type:'string',enum:['validated','validated-with-caveats','not-validated']},
    survives_overall:{type:'boolean'}, must_fix:{type:'array',items:{type:'string'}}, summary:{type:'string'}}}
const CLAIM = `CENTRAL CLAIM: "The model's translation-blind, comment-blind choice surface PREDICTS where independent human expert translators (SuttaCentral sujato/brahmali) placed their comments, far above chance (overlap 135 vs per-sutta permutation null mean 79.5, p<0.0001; recall 0.634 of expert-comment segments). This is EXTERNAL, NON-CIRCULAR evidence that the model identifies genuine translation choice-points."`
const BASE = `You are a hostile examiner. Find the single most damaging flaw that could INVALIDATE the claim; judge honestly if it survives. Critique only the briefing; no tools.\n\n${CLAIM}\n\nBRIEFING:\n${JSON.stringify(BRIEF)}`
const LENSES = [
  {k:'contamination', f:'TRAINING CONTAMINATION: famous suttas; the model likely saw Sujato/Brahmali translations AND comments in pretraining. The permutation null controls for chance placement but NOT for memorized comment locations. Is +55 lift explainable as recall of memorized locations rather than reasoning? Which numbers cut each way (precision 0.513; over-flagging 263>213)?'},
  {k:'ground-truth', f:'COMMENT VALIDITY: SC comments are not all choice flags (cross-refs, textual-variant, historical), and translators footnote SELECTIVELY. Is "comment placement" a valid proxy for "choice-point"? Could 30% base rate + 37% model flag-rate manufacture overlap?'},
  {k:'null-design', f:'NULL ADEQUACY: segments are not exchangeable — cruxes and comments both cluster in doctrinally dense passages. A uniform per-sutta null may understate chance overlap, inflating significance. Is the null too weak?'},
  {k:'model-circularity', f:'RESIDUAL CIRCULARITY & CONSENSUS: flags are consensus of 3 same-model-family agents. Does agreement just encode shared priors? Does consensus>=2/3 + broad flagging inflate recall?'},
]
phase('Attack')
const attacks=(await parallel(LENSES.map(l=>()=>agent(`${BASE}\n\nLENS: ${l.f}\n\nMount your strongest attack. Structured output.`,{label:`attack:${l.k}`,phase:'Attack',schema:V}).then(v=>({lens:l.k,...v}))))).filter(Boolean)
phase('Synthesis')
const synthesis=await agent(`You are the chair. Four examiners attacked the validation claim:\n${JSON.stringify(attacks)}\n\n${CLAIM}\n\nSynthesize. Distinguish what survives (qualitative finding) from what is confounded (magnitude). Any fatal forbids 'validated'. List must-fixes. Structured output.`,{label:'chair',phase:'Synthesis',schema:SY})
return { attacks, synthesis }
