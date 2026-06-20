#!/usr/bin/env python3
"""Divergence lane, rung 2: commitment-divergence classification.

Rung 1 (deterministic lexical dissimilarity) FAILED its nulls (p=0.92/0.99,
divergence_poc.json) — style noise drowns commitment. Rung 2 keeps the human
disagreement as the SIGNAL SOURCE and uses an LLM only to classify each
aligned Sujato/ATI rendering pair as commitment-divergent or merely stylistic.
English-only prompts (no Pali) so the model's own choice-point prior cannot
substitute for the human-divergence signal; translations stay a detector.

Emits research/out/divergence_judge_run.js (one agent per sutta x 2 reps).
"""
import json, re, math, html, collections, glob, sys, io

sys.path.insert(0, "research/scripts")
from divergence_poc import (content_words, tf, cos, strip_html, split_sentences,
                            sujato_segments, align)

mirror = json.load(open("research/data/divergence_mirror.json", encoding="utf-8"))
bundles = {}
for p in ("research/data/validation_bundle.json", "research/data/lowfame_bundle.json"):
    bundles.update(json.load(open(p, encoding="utf-8")))
test_ids = sorted(set(mirror) & set(bundles))

SUTTAS = []
for sid in test_ids:
    segs_en = sujato_segments(sid)
    if not segs_en: continue
    b = bundles[sid]
    seg_ids = [k for k in b["segments"] if k in segs_en]
    seg_tf = {k: tf(content_words(segs_en[k])) for k in seg_ids}
    pairs = {}
    for t in [x for x in mirror[sid]["translations"] if x["source"] == "ati"]:
        sents = split_sentences(strip_html(t["text"]))
        if not sents: continue
        assign, _ = align(sents, seg_ids, seg_tf)
        for k, idxs in assign.items():
            if idxs:
                ati = " ".join(sents[i] for i in sorted(idxs))
                pairs.setdefault(k, []).append({"translator": t["translator"], "ati": ati})
    items = [{"segment_id": k, "sujato": segs_en[k], "ati": v} for k, v in pairs.items()]
    if items:
        SUTTAS.append({"id": sid, "k": len(b["comment_segs"]), "items": items})

print(f"suttas: {len(SUTTAS)}, total pairs: {sum(len(s['items']) for s in SUTTAS)}")

NO_TOOLS = ("ABSOLUTE CONSTRAINT: answer ONLY from your own analysis of the texts given. Do NOT "
            "use any tools - no file reads, no Glob/Grep, no Bash, no web fetches. Any tool use "
            "invalidates this experiment.")

script = """export const meta = {
  name: 'cpd-divergence-judge',
  description: 'Divergence lane rung 2: classify aligned Sujato/ATI rendering pairs as commitment-divergent vs stylistic. English-only; human disagreement is the signal.',
  phases: [{ title: 'Judge' }],
}
const SUTTAS = __DATA__
const SCHEMA = { type:'object', additionalProperties:false, required:['judgments'],
  properties:{ judgments:{ type:'array', items:{
    type:'object', additionalProperties:false, required:['segment_id','commitment_divergent','strength'],
    properties:{
      segment_id:{type:'string'},
      commitment_divergent:{type:'boolean'},
      strength:{type:'integer', minimum:0, maximum:2},
      kind:{type:'string', enum:['lexical-sense','register','domestication','syntactic-scope','doctrinal','omission','stylistic-only']},
    } } } } }
const NO_TOOLS = __NOTOOLS__
function prompt(s, r) {
  const lines = s.items.map(it =>
    `SEGMENT ${it.segment_id}\\n  A: ${it.sujato}\\n` + it.ati.map(a => `  B(${a.translator}): ${a.ati}`).join('\\n')).join('\\n\\n')
  return `You are reviewer #${r}, comparing two professional English translations of the same Buddhist text, segment by segment. Translation A is one translator; each B line is another translator's rendering of (approximately) the same material.

For EACH segment, judge whether A and B diverge in COMMITMENT — i.e., a reader would take away a different meaning, reference, scope, or doctrinal claim — as opposed to mere stylistic variation (word order, synonyms with the same sense, register of address, archaism, abridgement of repetition). Misalignment artifacts (B clearly translating different material than A) are NOT commitment divergence.

strength: 0 = same commitment (stylistic only or misaligned), 1 = a real but minor commitment difference, 2 = a clear interpretive fork a careful reader would notice.

${NO_TOOLS}

${lines}

Return one judgment per segment shown.`
}
phase('Judge')
const results = await pipeline(
  SUTTAS,
  (s) => parallel([0,1].map(r => () =>
    agent(prompt(s, r), { label:`judge ${s.id} #${r}`, phase:'Judge', schema: SCHEMA })))
      .then(reps => ({ id: s.id, k: s.k, reps })))
return { batch: 'divergence-judge', n: results.length, results }
"""
script = script.replace("__DATA__", json.dumps(SUTTAS, ensure_ascii=False))
script = script.replace("__NOTOOLS__", json.dumps(NO_TOOLS))
io.open("research/out/divergence_judge_run.js", "w", encoding="utf-8").write(script)
print(f"wrote research/out/divergence_judge_run.js ({len(script)} chars)")
