#!/usr/bin/env python3
"""Generate out/granularity_run.js — the granularity-tuning workflow.

Per PREREGISTRATION_granularity.md. Embeds both passages' data and emits the
workflow with four mutually-blind roles:
  - annotators (translation-blind)            -> gold candidates
  - divergence-span extractor (English-only)  -> DETECTOR lane (the clean one)
  - source/herd critic (translation-blind)    -> DETECTOR lane (blind-spot catcher)
  - grading panel (translation-blind)         -> the {commitment|weak|style|spurious}
                                                 gold label over the pooled candidates

Whole-passage span extraction (robust to the abbreviated-list alignment problem;
identical instrument on both passages so leave-one-passage-out is apples-to-apples).

Run from repo root:  python research/scripts/gen_granularity.py
Then run the emitted workflow via the Workflow tool ({scriptPath: out/granularity_run.js}).
"""
import json, io, re, html

def clean(t):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t or ""))).strip()

dn2 = json.load(io.open("research/out/dn2_slice.json", encoding="utf-8"))
sn36 = json.load(io.open("research/out/sn36_slice.json", encoding="utf-8"))
mirror = json.load(io.open("research/data/divergence_mirror.json", encoding="utf-8"))
dn2_args = json.load(io.open("research/out/dn2_workflow_args.json", encoding="utf-8"))

# ---- DN2 (famous, 2 translators) ----
dn2_segs = [{"id": s["id"], "pli": s["pli"], "sujato": s["sujato"]} for s in dn2["segments"]]
dn2_sujato_full = " ".join(s["sujato"] for s in dn2_segs if s["sujato"])
dn2_than = dn2_args.get("thanissaro_opening") or clean(
    next((t["text"] for t in mirror["dn2"]["translations"] if t["translator"] == "thanissaro"), ""))[:1700]

# ---- SN36.21 (obscure, 3 translators) ----
sn_segs = [{"id": s["id"], "pli": s["pli"], "sujato": s["sujato"]} for s in sn36["segments"]]
sn_sujato_full = " ".join(s["sujato"] for s in sn_segs if s["sujato"])
def mclean(who):
    return clean(next((t["text"] for t in mirror["sn36.21"]["translations"] if t["translator"] == who), ""))
sn_than = mclean("thanissaro")
sn_nyana = mclean("nyanaponika")
# strip Thanissaro's translator's-note + footnotes so the divergence lane sees the
# rendering only (the note discusses kamma theory — not a translation of a span)
sn_than = re.sub(r"^Translator's note:.*?(?=On one occasion)", "", sn_than).strip()
sn_than = re.sub(r"\s*Notes\s+1\..*$", "", sn_than).strip()
sn_than = re.sub(r"\[\d+\]", "", sn_than)

DATA = {
    "dn2": {
        "title": "DN 2 Sāmaññaphalasutta (opening)", "famous": True,
        "segments": dn2_segs,
        "translations": [
            {"translator": "sujato", "text": dn2_sujato_full},
            {"translator": "thanissaro", "text": dn2_than},
        ],
    },
    "sn36.21": {
        "title": "SN 36.21 Sīvakasutta", "famous": False,
        "segments": sn_segs,
        "translations": [
            {"translator": "sujato", "text": sn_sujato_full},
            {"translator": "nyanaponika", "text": sn_nyana},
            {"translator": "thanissaro", "text": sn_than},
        ],
    },
}

# sanity print
for pid, d in DATA.items():
    print(f"{pid}: {len(d['segments'])} segs, {len(d['translations'])} translations "
          f"({', '.join(t['translator']+':'+str(len(t['text']))+'ch' for t in d['translations'])})")

JS = r'''export const meta = {
  name: 'granularity-tuning',
  description: 'Granularity-threshold tuning: span-level divergence + source-critic detectors vs a translation-blind graded commitment/style gold, on DN2 (famous) + sn36.21 (obscure). PREREGISTRATION_granularity.md.',
  phases: [
    { title: 'Detect', detail: 'annotators (gold) + divergence-span (English-only) + source-critic (Pāli-only), both passages, mutually blind' },
    { title: 'Grade', detail: 'translation-blind panel labels each pooled candidate span commitment|weak|style|spurious' },
  ],
}

const DATA = __DATA__;

const NO_TOOLS = 'CONSTRAINT: Do not use any tools or look anything up. Answer ONLY from what is in this prompt and your own knowledge. Closed-book.';
const CRITERION =
  'A COMMITMENT choice-point = a span where defensible renderings differ in WHAT A READER CONCLUDES — about reference, doctrine, material fact, scope, or cultural frame — NOT merely in connotation or word-flow. Test: "would choosing rendering A over B change what the reader believes the text asserts?" Yes=commitment; only feel/register of the same claim differs=style. Anchors: pāsāda palace/longhouse=commitment (material+rank); uposatha sabbath/observance=commitment (cultural frame); vedehiputta Videha-lady/wise-woman=commitment (doctrinal, commentary-only); ramaṇīya delightful/lovely=STYLE (same claim).';

const FOUND_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { found: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: {
      span: { type: 'string', description: 'the Pāli surface token(s) the decision lives in' },
      lemma: { type: 'string', description: 'the DPD headword it concerns' },
      segment_id: { type: 'string' },
      type: { type: 'string', description: 'lexical-sense | register | domestication | scope | syntactic | doctrinal' },
      why: { type: 'string', description: 'why defensible renderings differ in COMMITMENT, not style' },
    }, required: ['span', 'lemma', 'segment_id', 'type', 'why'],
  } } }, required: ['found'],
};

const DIVERGENCE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { found: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: {
      pali_term: { type: 'string', description: 'the Pāli word the translators render differently' },
      segment_id: { type: 'string', description: 'best-guess segment id from the Pāli list' },
      renderings: { type: 'array', items: {
        type: 'object', additionalProperties: false,
        properties: { translator: { type: 'string' }, text: { type: 'string' } },
        required: ['translator', 'text'] } },
      commitment_type: { type: 'string' },
      strength: { type: 'integer', description: '1 mild, 2 clear, 3 strong commitment divergence' },
      why: { type: 'string', description: 'why the difference changes the meaning a reader takes away (commitment), not just wording' },
    }, required: ['pali_term', 'segment_id', 'renderings', 'commitment_type', 'strength', 'why'],
  } } }, required: ['found'],
};

const GRADE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { grades: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: {
      idx: { type: 'integer' },
      span: { type: 'string' },
      label: { type: 'string', enum: ['commitment', 'weak', 'style', 'spurious'] },
      why: { type: 'string' },
    }, required: ['idx', 'label'],
  } } }, required: ['grades'],
};

function pliBlock(d) { return d.segments.map(s => `${s.id}: ${s.pli}`).join('\n'); }

// ---------- phase: Detect (annotation gold + divergence lane + source-critic) ----------
phase('Detect')
const ANNOT_K = 4, CRITIC_K = 3, DIV_REPS = 6, GRADE_K = 5;
const detectJobs = [];

for (const pid of Object.keys(DATA)) {
  const d = DATA[pid];
  // annotators (translation-blind) -> gold candidates
  for (let k = 1; k <= ANNOT_K; k++) detectJobs.push({ role: 'annot', pid, k });
  // source/herd critic (translation-blind) -> detector lane
  for (let k = 1; k <= CRITIC_K; k++) detectJobs.push({ role: 'critic', pid, k });
  // divergence-span (English-only) -> detector lane
  for (let r = 1; r <= DIV_REPS; r++) detectJobs.push({ role: 'div', pid, k: r });
}

function annotPrompt(d) {
  return `You are a Pāli philologist marking translation CHOICE-POINTS in a passage, reasoning ONLY from the Pāli below plus your knowledge of DPD/grammar/commentary. You may NOT consult any English translation.\n\n${CRITERION}\n\nList every COMMITMENT choice-point you find (do NOT pad with stylistic micro-variation; mark only spans where the commitment genuinely differs). For each give span, lemma, segment_id, type, and why it is a commitment not style.\n\nPĀLI (${d.title}):\n${pliBlock(d)}\n\n${NO_TOOLS}`;
}
function criticPrompt(d) {
  return `You are a choice-point DETECTOR reasoning ONLY from the Pāli below plus DPD/commentary knowledge (NO English translations). Your special target: commitment choice-points that are EASY TO MISS because the obvious rendering looks settled — e.g. a commentary gloss that overrides the surface sense (vedehī=paṇḍitā "wise woman"), or a technical term whose dictionary senses genuinely split. Find spans where the SOURCES reveal a real interpretive decision even where a translator might not hesitate.\n\n${CRITERION}\n\nList each, with span, lemma, segment_id, type, why.\n\nPĀLI (${d.title}):\n${pliBlock(d)}\n\n${NO_TOOLS}`;
}
function divPrompt(d, rep) {
  const trans = d.translations.map(t => `--- ${t.translator} ---\n${t.text}`).join('\n\n');
  return `You are comparing ${d.translations.length} independent expert English translations of one Pāli passage to find where they make DIFFERENT interpretive COMMITMENTS. You are given the translations, plus the Pāli ONLY so you can name which word each divergence is about.\n\nRULE: flag a span ONLY where the translations actually render it DIFFERENTLY in a way that changes the meaning a reader takes away (a COMMITMENT difference) — NOT where they merely use different words for the same claim (style), and NOT based on your own reading of the Pāli. Ground every flag in the translations actually diverging.\n\n${CRITERION}\n\nFor each divergence give: pali_term, segment_id (best guess), the rendering text from EACH translator, commitment_type, strength (1 mild/2 clear/3 strong), and why the difference is a commitment not style. Independent pass #${rep}.\n\nTRANSLATIONS:\n${trans}\n\nPĀLI SEGMENTS (for naming the term + segment only):\n${pliBlock(d)}\n\n${NO_TOOLS}`;
}

const detect = await parallel(detectJobs.map(j => () => {
  const d = DATA[j.pid];
  if (j.role === 'div')
    return agent(divPrompt(d, j.k), { schema: DIVERGENCE_SCHEMA, phase: 'Detect', label: `div:${j.pid}#${j.k}` })
      .then(r => r && ({ role: 'div', pid: j.pid, k: j.k, found: r.found })).catch(() => null);
  const prompt = j.role === 'annot' ? annotPrompt(d) : criticPrompt(d);
  return agent(prompt, { schema: FOUND_SCHEMA, phase: 'Detect', label: `${j.role}:${j.pid}#${j.k}` })
    .then(r => r && ({ role: j.role, pid: j.pid, k: j.k, found: r.found })).catch(() => null);
}));

const got = detect.filter(Boolean);

// ---------- build the candidate pool per passage (normalize + dedupe) ----------
function norm(s) { return (s || '').normalize('NFC').toLowerCase().replace(/[^a-zāīūṛṝḷḹṅñṭḍṇṁṃśṣḥ]/g, ''); }
const pools = {};
for (const pid of Object.keys(DATA)) {
  const byKey = {};
  for (const g of got.filter(x => x.pid === pid)) {
    for (const f of (g.found || [])) {
      const lemma = f.lemma || f.pali_term || f.span || '';
      const key = norm(lemma) || norm(f.span);
      if (!key) continue;
      if (!byKey[key]) byKey[key] = { key, lemma, span: f.span || lemma, segment_id: f.segment_id || '', sources: new Set() };
      byKey[key].sources.add(g.role);
      if (!byKey[key].span && f.span) byKey[key].span = f.span;
    }
  }
  // substring-merge near-dupes (longer key absorbing a contained shorter key)
  const keys = Object.keys(byKey).sort((a, b) => b.length - a.length);
  const merged = {};
  for (const k of keys) {
    const host = Object.keys(merged).find(m => m.includes(k) || k.includes(m));
    if (host) { byKey[host] && (merged[host].sources = new Set([...merged[host].sources, ...byKey[k].sources])); }
    else merged[k] = byKey[k];
  }
  const segPli = Object.fromEntries(DATA[pid].segments.map(s => [s.id, s.pli]));
  pools[pid] = Object.values(merged).map((v, i) => ({
    idx: i, lemma: v.lemma, span: v.span, segment_id: v.segment_id,
    segment_pli: segPli[v.segment_id] || '', sources: [...v.sources].sort(),
  }));
}

// ---------- phase: Grade (translation-blind panel over the pool, source-blind) ----------
phase('Grade')
function gradePrompt(d, pool, k) {
  const items = pool.map(p => `[#${p.idx}] span="${p.span}" lemma="${p.lemma}" segment=${p.segment_id}\n      Pāli: ${p.segment_pli}`).join('\n');
  return `You are grading candidate translation choice-points for one Pāli passage. For EACH candidate span, decide FROM THE PĀLI + your DPD/commentary knowledge ONLY whether it is a real COMMITMENT choice-point. You are NOT told how each candidate was found, and you must NOT consider any English translation.\n\n${CRITERION}\n\nLabel each candidate exactly one of: commitment (defensible renderings differ in what the reader concludes), weak (borderline), style (renderings would differ only in connotation/word-choice of the SAME claim), spurious (not a real decision at all). Grading pass #${k}.\n\nPASSAGE: ${d.title}\nCANDIDATES:\n${items}\n\n${NO_TOOLS}`;
}
const gradeJobs = [];
for (const pid of Object.keys(DATA)) for (let k = 1; k <= GRADE_K; k++) gradeJobs.push({ pid, k });
const grades = await parallel(gradeJobs.map(j => () =>
  agent(gradePrompt(DATA[j.pid], pools[j.pid], j.k), { schema: GRADE_SCHEMA, phase: 'Grade', label: `grade:${j.pid}#${j.k}` })
    .then(r => r && ({ pid: j.pid, k: j.k, grades: r.grades })).catch(() => null)
));

return {
  detect: got,
  pools,
  grades: grades.filter(Boolean),
  counts: {
    annot: got.filter(x => x.role === 'annot').length,
    critic: got.filter(x => x.role === 'critic').length,
    div: got.filter(x => x.role === 'div').length,
    grades: grades.filter(Boolean).length,
    pool_dn2: pools['dn2'].length, pool_sn36: pools['sn36.21'].length,
  },
};
'''

JS = JS.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
io.open("research/out/granularity_run.js", "w", encoding="utf-8").write(JS)
print("wrote research/out/granularity_run.js")
