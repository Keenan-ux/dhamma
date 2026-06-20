#!/usr/bin/env python3
"""P0 — DN2 vertical slice, deterministic half (TRANSLATIONS-AI.md proto steps 1-2).

Builds the segment-aligned DN2 opening, runs the primary-evidence detector
ensemble (FIREWALL: Pāli only — never reads an English translation as a
warrant), maps the 5 hand-gold choice-points to segments, and measures:
  - per-gold recall, attributed to the lane(s) that fired (lexical /
    commentary-presence / homonymy);   divergence is the LLM lane (workflow).
  - flag DENSITY (the granularity / flooding question the design lives on).

It ALSO emits, for the staging layer:
  - evidence_packets[token]  — the REAL DPD headwords + commentary(bold) rows,
    so a brief-drafting agent in "grounded" mode can cite from verified rows.
  - ground_truth_registry    — every real lemma/sense/bold-gloss, keyed for the
    machine-checkable hallucinated-warrant audit (audit_warrants.py).

Offline; reads the local DPD SQLite + local bilara-data. No prod, no network.
Run from repo root:  python research/scripts/dn2_slice.py
"""
import json, io, os, re, sys, unicodedata, sqlite3

sys.stdout.reconfigure(encoding="utf-8")

DB = "scripts/ingest/.cache/dpd-released/dpd.db"
BILARA = "scripts/ingest/.cache/bilara-data"
ROOT = f"{BILARA}/root/pli/ms/sutta/dn/dn2_root-pli-ms.json"
SUJATO = f"{BILARA}/translation/en/sujato/sutta/dn/dn2_translation-en-sujato.json"
MIRROR = "research/data/divergence_mirror.json"
OUT = "research/out/dn2_slice.json"

N_SENSE = 2          # lexical lane fires at >= this many within-lemma sense clusters
JACCARD = 0.5        # synonym-collapse threshold (study default)
COMM_MIN = 2         # commentary-presence lane fires at >= this bold-gloss count
STOP = set("ca va vā ti hi nu kho pana iti me te so naṃ taṃ na no e".split())
PALI_RE = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
CONTENT_RE = re.compile(r"[a-zāīūṛṝḷṅñṭḍṇṃṁśṣḥēō]+", re.I)
_STRIP = re.compile(r" \d+(\.\d+)?$")

# The 10-segment opening slice (captures all 5 hand-gold choice-points).
SEG_IDS = ["dn2:1.2", "dn2:1.3", "dn2:1.4", "dn2:1.5", "dn2:1.6",
           "dn2:2.1", "dn2:2.2", "dn2:2.3", "dn2:2.4", "dn2:2.5"]

# Hand-gold (TRANSLATIONS-AI.md "Worked examples"). surface = the running-text
# token(s) the choice lives in; lemma = the dictionary headword it concerns.
GOLD = [
    {"id": "pasada", "lemma": "pāsāda", "surface": ["uparipāsādavaragato"],
     "segment": "dn2:1.3", "type": "register/domestication",
     "sujato": "royal longhouse", "thanissaro": "palace",
     "note": "DPD: mansion/palace/pillared building; 'longhouse' in no dictionary — an interpretive register bet."},
    {"id": "uposatha", "lemma": "uposatha", "surface": ["tadahuposathe"],
     "segment": "dn2:1.3", "type": "domestication",
     "sujato": "the sabbath", "thanissaro": "the observance day",
     "note": "'sabbath' imports the weekly Judeo-Christian frame; 'observance/uposatha day' keeps the lunar technical term."},
    {"id": "payirupasati", "lemma": "payirupāsati", "surface": ["payirupāseyyāma", "payirupāsato", "payirupāsatu"],
     "segment": "dn2:1.6", "type": "lexical-sense",
     "sujato": "pay homage", "thanissaro": "(abridged)",
     "note": "DPD sense 1 attends-closely/sits-at-feet vs sense 2 honours; 'homage' overstates (vandati/namassati/pūjeti territory)."},
    {"id": "gana", "lemma": "gaṇa", "surface": ["gaṇī", "gaṇācariyo"],
     "segment": "dn2:2.2", "type": "lexical-sense",
     "sujato": "community", "thanissaro": "(abridged)",
     "note": "company/following vs community — contrast-preservation against saṅgha='order' (saṅghī ceva gaṇī ca)."},
    {"id": "vedehiputta", "lemma": "vedehiputta", "surface": ["vedehiputto", "vedehiputtaṁ"],
     "segment": "dn2:1.3", "type": "doctrinal/commentarial",
     "sujato": "son of the princess of Videha", "thanissaro": "son of Queen Videha",
     "note": "Buddhaghosa reads vedehī as paṇḍitā ('wise woman'), not the Videha lady — a commentarial reading neither translator takes."},
]

def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def content_words(defn):
    return set(w.lower() for w in CONTENT_RE.findall(defn) if len(w) > 2)

def cluster_senses(defs):
    """Collapse near-synonym sense-rows (Jaccard>=JACCARD or substring)."""
    clusters = []
    for d in defs:
        cw = content_words(d); merged = False
        for cl in clusters:
            inter = cw & cl["cw"]; uni = cw | cl["cw"] or {1}
            if len(inter) / len(uni) >= JACCARD or (cw and (cw <= cl["cw"] or cl["cw"] <= cw)):
                cl["cw"] |= cw; cl["reps"].append(d); merged = True; break
        if not merged:
            clusters.append({"cw": cw, "reps": [d]})
    return [{"rep": c["reps"][0], "members": c["reps"]} for c in clusters]

def lev(a, b):
    if a == b: return 0
    if not a or not b: return len(a) + len(b)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (ca != cb)))
        prev = cur
    return prev[-1]

class DPD:
    def __init__(self, path=DB):
        self.c = sqlite3.connect(path)
        self.bold = None
    def resolve_ids(self, token):
        row = self.c.execute("SELECT headwords FROM lookup WHERE lookup_key=?", (norm(token),)).fetchone()
        return json.loads(row[0]) if row and row[0] else []
    def headwords(self, token):
        ids = self.resolve_ids(token)
        if not ids: return []
        q = ("SELECT id,lemma_1,pos,grammar,meaning_1,meaning_2,meaning_lit,construction,"
             "example_1,sutta_1,sanskrit FROM dpd_headwords WHERE id IN (%s)" % ",".join("?"*len(ids)))
        out = []
        for r in self.c.execute(q, ids):
            m1, m2, ml = r[4], r[5], r[6]
            out.append({"id": r[0], "lemma": _STRIP.sub("", r[1] or ""), "pos": r[2],
                        "grammar": r[3], "meaning_1": m1, "meaning_2": m2,
                        "meaning_lit": ml, "construction": r[7], "example_1": r[8],
                        "sutta_1": r[9], "sanskrit": r[10],
                        # ONE representative sense per headword id (matches the
                        # validated detector via dpd_local: m1 or m2 or ml).
                        # meaning_2 is a re-phrasing of the SAME sense, not a
                        # distinct within-lemma sense — counting it inflates fires.
                        "def": m1 or m2 or ml or ""})
        return out
    def _load_bold(self):
        if self.bold is None:
            self.bold = {}
            for (b,) in self.c.execute("SELECT bold FROM bold_definitions WHERE bold IS NOT NULL"):
                k = norm(b); self.bold[k] = self.bold.get(k, 0) + 1
        return self.bold
    def comm_count(self, token):
        b = self._load_bold(); t = norm(token)
        if t in b: return b[t]
        best = 0
        for hw in self.headwords(t):
            best = max(best, b.get(norm(hw["lemma"]), 0))
        return best
    def comm_rows(self, term, limit=6):
        q = "SELECT bold,ref_code,nikaya,book,commentary FROM bold_definitions WHERE bold=? LIMIT ?"
        return [{"bold": r[0], "ref_code": r[1], "nikaya": r[2], "book": r[3], "commentary": r[4]}
                for r in self.c.execute(q, (norm(term), limit))]

def pick_lemma(token, headwords):
    """contextual lemma = min diacritic-aware edit distance; tie => homonymy."""
    by = {}
    for hw in headwords:
        if hw["def"]:
            by.setdefault(norm(hw["lemma"]), []).append(hw["def"])
    if not by: return None, [], False
    scored = sorted((lev(norm(token), lem), -len(defs), lem, defs) for lem, defs in by.items())
    best = scored[0]
    tie = sum(1 for s in scored if s[0] == best[0]) > 1
    return best[2], best[3], tie

def detect_segment(pli, dpd):
    """Run the three deterministic primary-evidence lanes over one segment."""
    fires = {"lexical": [], "commentary": [], "homonymy": []}
    resolved = 0
    for m in PALI_RE.finditer(pli):
        tok = m.group(0); tn = norm(tok)
        if len(tn) < 3 or tn in STOP: continue
        hws = dpd.headwords(tn)
        comm = dpd.comm_count(tn)
        if not hws:
            if comm >= COMM_MIN:
                fires["commentary"].append({"token": tok, "lemma": None, "comm": comm})
            continue
        resolved += 1
        lemma, defs, tie = pick_lemma(tn, hws)
        clusters = cluster_senses(defs)
        if len(clusters) >= N_SENSE:
            fires["lexical"].append({"token": tok, "lemma": lemma, "n_senses": len(clusters),
                                     "senses": [c["rep"] for c in clusters]})
        elif comm >= COMM_MIN:
            fires["commentary"].append({"token": tok, "lemma": lemma, "comm": comm})
        if tie:
            fires["homonymy"].append({"token": tok, "lemma": lemma})
    return fires, resolved

def main():
    dpd = DPD()
    root = json.load(io.open(ROOT, encoding="utf-8"))
    suj = json.load(io.open(SUJATO, encoding="utf-8"))
    mirror = json.load(io.open(MIRROR, encoding="utf-8"))
    th_block = next((t["text"] for t in mirror["dn2"]["translations"]
                     if t["translator"] == "thanissaro"), "")

    # --- segments + per-segment detection ---
    segments = []
    for sid in SEG_IDS:
        pli = root.get(sid, "").strip()
        fires, resolved = detect_segment(pli, dpd)
        n_fires = len(fires["lexical"]) + len(fires["commentary"])
        segments.append({"id": sid, "pli": pli, "sujato": suj.get(sid, "").strip(),
                         "n_resolved": resolved, "fires": fires, "n_fires": n_fires})

    # --- gold map: which lane(s) fired in the gold's segment, on its surface token(s) ---
    seg_by_id = {s["id"]: s for s in segments}
    gold_eval = []
    for g in GOLD:
        seg = seg_by_id[g["segment"]]
        surf = set(norm(s) for s in g["surface"])
        lanes = set()
        for lane in ("lexical", "commentary", "homonymy"):
            for f in seg["fires"][lane]:
                if norm(f["token"]) in surf:
                    lanes.add(lane)
        # also record the raw lexical/commentary signal on the gold lemma itself
        lemma_hws = dpd.headwords(g["lemma"])
        lemma_lemma, lemma_defs, lemma_tie = pick_lemma(g["lemma"], lemma_hws)
        lemma_clusters = cluster_senses(lemma_defs)
        gold_eval.append({
            **{k: g[k] for k in ("id", "lemma", "surface", "segment", "type", "sujato", "thanissaro", "note")},
            "fired_lanes_on_surface": sorted(lanes),
            "lemma_lexical_senses": len(lemma_clusters),
            "lemma_comm_count": dpd.comm_count(g["lemma"]),
            "surface_comm_count": max((dpd.comm_count(s) for s in g["surface"]), default=0),
            "recovered_deterministic": bool(lanes),   # lexical/commentary/homonymy only
        })

    # --- evidence packets (REAL rows) + ground-truth registry for the audit ---
    packets = {}
    registry = {"dpd": {}, "bold": {}}
    for g in GOLD:
        hws = dpd.headwords(g["lemma"])
        comm = dpd.comm_rows(g["lemma"]) + dpd.comm_rows(g["surface"][0])
        # the doctrinal vedehī gloss lives under vedehī / vedehiputto, not the compound
        if g["id"] == "vedehiputta":
            comm += dpd.comm_rows("vedehī") + dpd.comm_rows("vedehiputto")
        packets[g["id"]] = {"lemma": g["lemma"], "surface": g["surface"],
                            "dpd_headwords": hws, "commentary_bold": comm}
        registry["dpd"][norm(g["lemma"])] = [
            {"id": h["id"], "lemma": h["lemma"],
             "senses": [d for d in (h["meaning_1"], h["meaning_2"], h["meaning_lit"]) if d]}
            for h in hws]
        for r in comm:
            registry["bold"].setdefault(norm(r["bold"]), []).append(
                {"ref_code": r["ref_code"], "book": r["book"], "commentary": r["commentary"]})

    # --- granularity stats (report the flood honestly) ---
    flagged = [s for s in segments if s["n_fires"] > 0]
    n_lex = sum(len(s["fires"]["lexical"]) for s in segments)
    n_comm = sum(len(s["fires"]["commentary"]) for s in segments)
    stats = {
        "n_segments": len(segments),
        "n_flagged_segments": len(flagged),
        "flag_density_segments": round(len(flagged) / len(segments), 3),
        "total_fires": sum(s["n_fires"] for s in segments),
        "fires_per_segment_mean": round(sum(s["n_fires"] for s in segments) / len(segments), 2),
        "lexical_fires": n_lex,
        "commentary_fires": n_comm,
        "gold_total": len(GOLD),
        # surface-token recovery, per lane — the honest read
        "gold_recovered_lexical": sum(1 for g in gold_eval if "lexical" in g["fired_lanes_on_surface"]),
        "gold_recovered_commentary": sum(1 for g in gold_eval if "commentary" in g["fired_lanes_on_surface"]),
        "gold_recovered_any_deterministic": sum(1 for g in gold_eval if g["recovered_deterministic"]),
        # the flood caveat: commentary-presence is the FALSIFIED lane (BUILDLOG
        # phases 2-4 — blanket-fires, never beat its null). Its "recovery" of
        # the gold is indiscriminate, not detection. Quantified here:
        "commentary_lane_note": "commentary-presence was falsified as a corpus detector; it flags ~all content tokens, so gold 'recovery' via this lane is flooding not signal",
    }

    out = {"passage": "dn2", "title": "Sāmaññaphalasutta", "slice": "opening (1.2–2.5)",
           "params": {"n_sense": N_SENSE, "jaccard": JACCARD, "comm_min": COMM_MIN},
           "firewall": "detectors read Pāli `original` only; Sujato/Thanissaro stored for the LLM divergence lane + audit, never as a warrant",
           "famous_text_caveat": "DN2 is famous; per REPORT_v8 LLM finders on famous text are a location prior. The deterministic lanes here are model-free; the headline (audit) is contamination-independent.",
           "segments": segments, "gold": gold_eval, "stats": stats,
           "evidence_packets": packets, "ground_truth_registry": registry,
           "thanissaro_block_present": bool(th_block)}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # --- console summary ---
    print(f"DN2 opening slice — {len(segments)} segments\n")
    print("GOLD recovery (deterministic lanes: lexical / commentary / homonymy):")
    for g in gold_eval:
        lanes = ",".join(g["fired_lanes_on_surface"]) or "—MISS—"
        print(f"  {g['id']:13s} [{g['type']:24s}] seg {g['segment']:8s}  "
              f"lex_senses={g['lemma_lexical_senses']} comm={g['surface_comm_count']:2d}  -> {lanes}")
    print(f"\nSurface-token recovery by lane:  lexical {stats['gold_recovered_lexical']}/5  "
          f"commentary {stats['gold_recovered_commentary']}/5  (any {stats['gold_recovered_any_deterministic']}/5)")
    print(f"  NB commentary-presence is the FALSIFIED lane — it flags everything, so its 'recovery' is flooding.")
    print(f"Granularity/flood: {stats['n_flagged_segments']}/{stats['n_segments']} segments flagged; "
          f"{stats['total_fires']} fires ({stats['fires_per_segment_mean']}/seg) "
          f"= lexical {stats['lexical_fires']} + commentary {stats['commentary_fires']}")
    print(f"  -> the precise lexical lane recovers {stats['gold_recovered_lexical']}/5 on running text; "
          f"divergence (LLM lane, next) is what cleanly recovers pāsāda+uposatha register choices.")
    print(f"\nwrote {OUT}")

if __name__ == "__main__":
    main()
