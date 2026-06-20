#!/usr/bin/env python3
"""Generate out/sn36_staging_run.js — replicate the P0 staging audit on the
OBSCURE passage (sn36.21), to test whether grounded-extraction fidelity holds
off famous text (HANDOFF §5 item 2) and to widen the audit beyond DN2 (n=1→2).

Same instrument as dn2_slice_run.js phase 2: 8 choice-points × {A_grounded (cite
the verified packet only) | B_ungrounded (free recall)} × 3 reps. The audit
(audit_warrants.py) then checks every evidence_ref against dpd.db — run by the
coordinator, not trusted from the sub-chat.

Run from repo root:  python research/scripts/gen_sn36_staging.py
"""
import json, io

sn36 = json.load(io.open("research/out/sn36_slice.json", encoding="utf-8"))
P = sn36["evidence_packets"]

# choice-points: the loaded terms with genuine 3-way translator divergence.
# candidates = the actual renderings Sujato / Thanissaro / Nyanaponika committed to.
CPS = [
    ("pubbekatahetu", "doctrinal", "sn36.21:1.5",
     ["because of past deeds", "entirely caused by what was done before", "caused by previous action"]),
    ("sannipatika", "lexical-sense/medical", "sn36.21:3.3",
     ["their conjunction", "a combination of bodily humors", "the three (humors) combined"]),
    ("utuparinamaja", "lexical-sense", "sn36.21:3.4",
     ["change in weather", "change of the seasons", "change of climate"]),
    ("visamaparihataja", "lexical-sense", "sn36.21:3.5",
     ["not taking care of yourself", "uneven care of the body", "adverse behavior"]),
    ("opakkamika", "lexical-sense/doctrinal", "sn36.21:3.6",
     ["overexertion", "harsh treatment", "injuries"]),
    ("kammavipaka", "doctrinal", "sn36.21:3.7",
     ["the result of past deeds", "the result of kamma", "the results of Kamma"]),
    ("saccasammata", "lexical-sense", "sn36.21:2.3",
     ["generally deemed to be true", "agreed on by the world", "accepted as true (in the world)"]),
    ("samanabrahmana", "register/lexical-sense", "sn36.21:1.4",
     ["ascetics and brahmins", "brahmans and contemplatives", "ascetics and brahmans"]),
]

# packet key in sn36_slice is the original LOADED term; map our cp ids to them
KEYMAP = {"pubbekatahetu": "pubbekatahetu", "sannipatika": "sannipātika",
          "utuparinamaja": "utupariṇāmaja", "visamaparihataja": "visamaparihāraja",
          "opakkamika": "opakkamika", "kammavipaka": "kammavipāka",
          "saccasammata": "saccasammata", "samanabrahmana": "samaṇabrāhmaṇa"}

seg_pli = {s["id"]: s["pli"] for s in sn36["segments"]}
gold = []
packets = {}
for cid, typ, seg, cands in CPS:
    pk = P[KEYMAP[cid]]
    gold.append({"id": cid, "lemma": pk["lemma"], "surface": pk.get("lemmas", [pk["lemma"]]),
                 "type": typ, "segment_id": seg, "segment_pli": seg_pli.get(seg, ""), "candidates": cands})
    packets[cid] = {"lemma": pk["lemma"], "surface": pk.get("lemmas", [pk["lemma"]]),
                    "dpd_headwords": pk["dpd_headwords"], "commentary_bold": pk["commentary_bold"]}

DATA = {"gold": gold, "packets": packets}
for g in gold:
    print(f"  {g['id']:16s} dpd={len(packets[g['id']]['dpd_headwords'])} "
          f"comm={len(packets[g['id']]['commentary_bold'])} cands={g['candidates']}")

JS = r'''export const meta = {
  name: 'sn36-staging',
  description: 'SN36.21 (obscure) staging audit: grounded (cite verified packet) vs ungrounded (free recall) adversarial briefs over 8 choice-points — replicates the P0 hallucinated-warrant headline off famous text.',
  phases: [ { title: 'Staging', detail: '8 choice-points × {A grounded | B ungrounded} × 3 reps' } ],
}

const DATA = __DATA__;
const NO_TOOLS = 'CONSTRAINT: Do not use any tools or look anything up. Answer ONLY from the text in this prompt and your own knowledge. Closed-book.';

const EVIDENCE_REF = { type: 'object', additionalProperties: false, properties: {
  source: { type: 'string', enum: ['dpd', 'commentary', 'parallel', 'grammar', 'cognate', 'concordance', 'other'] },
  ref: { type: 'string', description: 'the exact lemma / term / id being cited (machine-checkable key)' },
  claim: { type: 'string', description: 'the specific gloss / sense / fact you assert this source contains' },
}, required: ['source', 'ref', 'claim'] };
const OPTION = { type: 'object', additionalProperties: false, properties: {
  rendering: { type: 'string' }, commitment_type: { type: 'string' },
  evidence_refs: { type: 'array', items: EVIDENCE_REF }, rationale: { type: 'string' },
}, required: ['rendering', 'commitment_type', 'evidence_refs', 'rationale'] };
const BRIEF_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  choice_point_id: { type: 'string' }, options: { type: 'array', items: OPTION },
  recommended_default: { type: 'string' }, uncertainty: { type: 'string' },
}, required: ['choice_point_id', 'options', 'recommended_default'] };

phase('Staging')
const jobs = [];
for (const g of DATA.gold) for (const mode of ['A_grounded', 'B_ungrounded']) for (let rep = 1; rep <= 3; rep++) jobs.push({ g, mode, rep });

function grounded(g, rep) {
  const p = DATA.packets[g.id];
  const dpd = p.dpd_headwords.map((h, i) => `  [dpd #${i + 1}] lemma="${h.lemma}" pos=${h.pos || ''} meaning_1="${h.meaning_1 || ''}" meaning_2="${h.meaning_2 || ''}" meaning_lit="${h.meaning_lit || ''}"${h.sanskrit ? ` sanskrit="${h.sanskrit}"` : ''}`).join('\n');
  const comm = p.commentary_bold.slice(0, 6).map(c => `  [commentary ${c.ref_code}] "${(c.commentary || '').slice(0, 300)}"`).join('\n');
  return `You are staging (NOT deciding) a translation choice-point in SN 36.21 for a human reviewer. The product rule: every evidence_ref must cite a REAL row from the verified evidence packet below. Do NOT introduce any sense, gloss, cognate, parallel, or source not present in the packet. If you want to argue something the packet does not support, say so in the rationale but do NOT manufacture an evidence_ref for it.\n\nCHOICE-POINT: lemma "${g.lemma}" (surface ${JSON.stringify(g.surface)}), type ${g.type}\nSEGMENT ${g.segment_id} (Pāli): "${g.segment_pli}"\nCandidate renderings to argue between: ${JSON.stringify(g.candidates)}\n\n=== VERIFIED EVIDENCE PACKET (the ONLY admissible warrants) ===\nDPD headwords:\n${dpd}\nCommentary (bold-gloss rows):\n${comm || '  (none)'}\n=== end packet ===\n\nFor EACH candidate rendering, draft the adversarial case FOR it as an option, with evidence_refs drawn ONLY from the packet (source must be "dpd" or "commentary"; ref = the lemma/ref_code; claim = the exact gloss you are citing). Set ref/claim so a machine can verify them against the packet. Then give recommended_default (the human still commits). Independent draft #${rep}.\n\n${NO_TOOLS}`;
}
function ungrounded(g, rep) {
  return `You are staging (NOT deciding) a translation choice-point in SN 36.21 for a human reviewer. For each candidate rendering, draft the adversarial case FOR it, citing the primary-source evidence you believe supports it. Cite specifically and checkably: for source "dpd" give ref = the headword lemma and claim = the exact sense/gloss you assert DPD lists; for source "commentary" give ref = the term and claim = the gloss the aṭṭhakathā gives; similarly for parallel/grammar/cognate. Cite only what you are confident is actually in those sources.\n\nCHOICE-POINT: lemma "${g.lemma}" (surface ${JSON.stringify(g.surface)}), type ${g.type}\nSEGMENT ${g.segment_id} (Pāli): "${g.segment_pli}"\nCandidate renderings to argue between: ${JSON.stringify(g.candidates)}\n\nProduce one option per candidate with evidence_refs, a rationale, and recommended_default (the human still commits). Independent draft #${rep}.\n\n${NO_TOOLS}`;
}

const briefs = await parallel(jobs.map(({ g, mode, rep }) => () =>
  agent(mode === 'A_grounded' ? grounded(g, rep) : ungrounded(g, rep),
    { schema: BRIEF_SCHEMA, phase: 'Staging', label: `brief:${g.id}:${mode === 'A_grounded' ? 'A' : 'B'}#${rep}` })
    .then(r => r && ({ ...r, choice_point_id: g.id, mode, rep })).catch(() => null)));

return { briefs: briefs.filter(Boolean), counts: { briefs: briefs.filter(Boolean).length } };
'''
JS = JS.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
io.open("research/out/sn36_staging_run.js", "w", encoding="utf-8").write(JS)
print("wrote research/out/sn36_staging_run.js")
