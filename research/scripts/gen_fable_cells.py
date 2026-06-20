#!/usr/bin/env python3
"""Generate the five-cell cross-family control workflow (2026-06-12).

Cells (all with the ABSOLUTE no-tools constraint):
  1. fable  famous  with-content   (18 suttas x 3 annotators)
  2. fable  lowfame with-content   (23 x 3)
  3. fable  famous  location-only  (18 x 2)
  4. fable  lowfame location-only  (23 x 2)
  5. opus   lowfame location-only  (23 x 2)  <- the clean cell p7 never persisted

Rationale strings are stripped in-script before return (scorers only use
segment_id); keeps the workflow return small.
Writes research/out/fable_cells_run.js
"""
import json, io

famous = json.load(open("research/data/validation_bundle.json", encoding="utf-8"))
lowfame = json.load(open("research/data/lowfame_bundle.json", encoding="utf-8"))

def content_cell(bundle):
    return [{"id": sid, "segments": b["segments"]} for sid, b in bundle.items()]

def loc_cell(bundle):
    return [{"id": sid, "segids": list(b["segments"].keys()), "k": len(b["comment_segs"])}
            for sid, b in bundle.items() if len(b["comment_segs"]) > 0]

data = {
    "CF": content_cell(famous), "CL": content_cell(lowfame),
    "LF": loc_cell(famous), "LL": loc_cell(lowfame),
}

NO_TOOLS = ("ABSOLUTE CONSTRAINT: answer ONLY from your own analysis. Do NOT use any tools "
            "- no file reads, no Glob/Grep, no Bash, no web fetches, nothing except returning "
            "your structured answer. Any tool use invalidates this experiment.")

script = """export const meta = {
  name: 'cpd-crossfamily-cells',
  description: 'Cross-family controls: Fable 5 four-cell (content/location x famous/lowfame) + Opus clean lowfame location cell. All tools-forbidden.',
  phases: [
    { title: 'Fable content', detail: 'with-content validation, 3 annotators/sutta', model: 'fable' },
    { title: 'Fable location', detail: 'location-only probe, 2 reps/sutta', model: 'fable' },
    { title: 'Opus location', detail: 'clean lowfame location-only, 2 reps/sutta', model: 'opus' },
  ],
}
const D = __DATA__
const VAL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['choice_segments'],
  properties: { choice_segments: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['segment_id', 'type', 'rationale'],
    properties: {
      segment_id: { type: 'string' },
      type: { type: 'string', enum: ['lexical', 'register', 'domestication', 'syntactic', 'doctrinal'] },
      rationale: { type: 'string' },
    } } } },
}
const LOC_SCHEMA = { type: 'object', additionalProperties: false, required: ['predicted_segments'],
  properties: { predicted_segments: { type: 'array', items: { type: 'string' } } } }

const NO_TOOLS = __NOTOOLS__

function fmt(segs) { return Object.entries(segs).map(([k, v]) => `${k}\\t${v}`).join('\\n') }

function valPrompt(s, k) {
  return `You are independent reviewer #${k}. Below is a Pāli text as numbered SEGMENTS (segment_id<TAB>Pāli). Identify which SEGMENTS contain a genuine translation CHOICE-POINT — a place where a careful translator would add a footnote because a non-trivial commitment must be made (lexical sense, register/connotation, culture-specific term, ambiguous syntax/scope, or a contested doctrinal sense). You MAY use your knowledge of Pāli and the lexicon.

ABSOLUTE FIREWALL: reason ONLY from the Pāli. Do NOT use, recall, or reconstruct any English translation OR any translator's note/comment for this text. Judge each segment on the Pāli alone.

${NO_TOOLS}

GRANULARITY: flag a segment only if it has a real, footnote-worthy choice. Many segments are routine narrative/formula with no genuine crux — do not flag those. Return the segment_ids you flag, with type + brief rationale.

SUTTA ${s.id} — segments:
${fmt(s.segments)}

Return ONLY the structured list of choice_segments.`
}

function locPrompt(s) {
  return `Sutta ${s.id} consists of these segments, in order:
${s.segids.join(', ')}

A SuttaCentral translator placed explanatory comments on exactly ${s.k} of these segments. You are NOT given the Pāli text. ${NO_TOOLS} If you do not know, give your best guess from structural intuition alone. Continuing: using only your knowledge of ${s.id}, its structure, and where translators typically comment, predict which ${s.k} segment ids were commented on. Return exactly ${s.k} segment ids from the list above.`
}

// strip rationales: scorers only consume segment_id (+type kept for type analysis)
function slim(a) {
  if (!a) return null
  return { choice_segments: (a.choice_segments || []).map(c => ({ segment_id: c.segment_id, type: c.type })) }
}

function contentRun(items, label, model) {
  return pipeline(items, (s) =>
    parallel([0, 1, 2].map((k) => () =>
      agent(valPrompt(s, k), { label: `${label} ${s.id} #${k}`, phase: 'Fable content', schema: VAL_SCHEMA, model })))
      .then((annots) => ({ id: s.id, annotators: annots.map(slim) })))
}

function locRun(items, label, model, phaseName) {
  return pipeline(items, (s) =>
    parallel([0, 1].map((r) => () =>
      agent(locPrompt(s), { label: `${label} ${s.id} #${r}`, phase: phaseName, schema: LOC_SCHEMA, model })))
      .then((preds) => ({ id: s.id, k: s.k, preds })))
}

const [cf, cl, lf, ll, ol] = await parallel([
  () => contentRun(D.CF, 'f-val-fam', 'fable'),
  () => contentRun(D.CL, 'f-val-low', 'fable'),
  () => locRun(D.LF, 'f-loc-fam', 'fable', 'Fable location'),
  () => locRun(D.LL, 'f-loc-low', 'fable', 'Fable location'),
  () => locRun(D.LL, 'o-loc-low', 'opus', 'Opus location'),
])
return {
  batch: 'crossfamily-cells-20260612',
  fable_content_famous: { batch: 'external-validation', n: cf.filter(Boolean).length, results: cf.filter(Boolean) },
  fable_content_lowfame: { batch: 'external-validation', n: cl.filter(Boolean).length, results: cl.filter(Boolean) },
  fable_loc_famous: { batch: 'location-probe', n: lf.filter(Boolean).length, results: lf.filter(Boolean) },
  fable_loc_lowfame: { batch: 'location-probe', n: ll.filter(Boolean).length, results: ll.filter(Boolean) },
  opus_loc_lowfame: { batch: 'location-probe', n: ol.filter(Boolean).length, results: ol.filter(Boolean) },
}
"""

script = script.replace("__DATA__", json.dumps(data, ensure_ascii=False))
script = script.replace("__NOTOOLS__", json.dumps(NO_TOOLS))
with io.open("research/out/fable_cells_run.js", "w", encoding="utf-8") as f:
    f.write(script)
print(f"wrote research/out/fable_cells_run.js ({len(script)} chars)")
print(f"cells: CF={len(data['CF'])} CL={len(data['CL'])} LF={len(data['LF'])} LL={len(data['LL'])}")
print(f"agents: {len(data['CF'])*3 + len(data['CL'])*3 + len(data['LF'])*2 + len(data['LL'])*4}")
