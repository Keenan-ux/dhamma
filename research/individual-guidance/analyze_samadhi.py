#!/usr/bin/env python
"""Interpret SAMADHI-COUNTS.json against the not-yet-run clusters.

Reads the exhaustive layer-count matrix (no DB). Prints, per cluster:
  - decisive terms with their 1canon / 2para / 3comm / 4tika / total counts
  - the stratigraphic signature (0-canon + commentary-heavy = commentarial fill)
Then global views: top canon-count terms (sense-audit candidates), and the
clean '0-canon, commentary-only' set (the negative-space finds).
"""
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, "SAMADHI-COUNTS.json"), encoding="utf-8"))
META = C.pop("_meta", None)
print(f"[meta] {META}\n")

LAYERS = ["1canon", "2para", "3comm", "4tika"]

def row(stem):
    """Return the count dict for an exact stem, else None."""
    return C.get(stem)

def find(sub):
    """All terms containing sub (case/diacritic-insensitive-ish), with counts."""
    s = sub.lower()
    return {k: v for k, v in C.items() if s in k.lower()}

def show(label, stems):
    print(f"== {label} ==")
    for st in stems:
        v = row(st)
        if v is None:
            # try substring: show the closest matches
            hits = find(st)
            if not hits:
                print(f"  {st:32s}  (no exact; no substring match)")
                continue
            for k, vv in sorted(hits.items(), key=lambda x: -x[1]['total'])[:6]:
                print(f"  ~{k:31s}  canon={vv['1canon']:<5} para={vv['2para']:<4} comm={vv['3comm']:<5} tika={vv['4tika']:<5} tot={vv['total']}")
        else:
            print(f"  {st:32s}  canon={v['1canon']:<5} para={v['2para']:<4} comm={v['3comm']:<5} tika={v['4tika']:<5} tot={v['total']}")
    print()

# ---- the 12 not-yet-run clusters (decisive stems from handoff + inference paths) ----
show("L6 access/momentary vocab (expect 0-canon)",
     ["upacara", "upacarasamadhi", "khanikasamadhi", "appanasamadhi", "parikamma",
      "appana", "khanika"])
show("L6 one-pointedness genus",
     ["cittekaggata", "cittassekaggata", "ekaggata", "avikkhepa"])
show("L6 object-defined samadhis (theme not depth)",
     ["animitta", "appanihita", "sunnata samadhi", "animitta cetosamadhi",
      "suññata", "animitto"])
show("L7 right-concentration definitions",
     ["sammasamadhi", "micchasamadhi", "sa-upanisa", "saupanisa", "sa-parikkhara",
      "vossaggarammana", "cittassa ekaggata"])
show("L8 degree / partiality vocab",
     ["padesa", "nippadesa", "paritta", "appamana", "mahaggata", "olarika",
      "sukhuma", "mattaso", "paripura", "samannagata"])
show("L9 cross-recensional / Abhidhamma",
     ["susima", "dhammatthiti", "dhammatthitinana", "anupubbabhisamaya",
      "ekabhisamaya"])
show("L10 commentary person-types / path-jhana",
     ["sukkhavipassaka", "suddhavipassana", "vipassanayanika", "samathayanika",
      "vipassanasamadhi", "maggajjhana", "lokuttarajjhana", "pannavimutta",
      "padakajjhana", "padaka"])
show("L12 breakthrough moment",
     ["dhammacakkhu", "abhisamaya", "gotrabhu", "kallacitta", "muducitta",
      "vinivarana", "vinivaranacitta", "maggacitta", "phalacitta"])
show("L13 faculty-grading ladder",
     ["samadhindriya", "samadhibala", "ekabiji", "kolankola", "sattakkhattuparama",
      "indriyaparopariya"])
show("L14 calm/insight order",
     ["samathapubbangama", "vipassanapubbangama", "yuganaddha", "dhammuddhacca"])
show("L16 jhana as pleasant-abiding",
     ["ditthadhammasukhavihara", "sukhavihara", "ditthadhamma"])
show("L18 orthogonal: lay/sudden attainers",
     ["khujjuttara", "anathapindika", "mahanama", "dighavu", "bahiya",
      "accharasanghata", "upasaka", "upasika"])
show("CAUSED-FRUIT (deployed; reconfirm)",
     ["samadhiyati", "samahite citte", "samahito yathabhutam",
      "sukhino cittam samadhiyati", "samadhisamvattanika"])

# ---- global: stratigraphic negatives (clean commentarial-fill signature) ----
print("== CLEAN 0-CANON, commentary-present (negative-space finds) ==")
zc = [(k, v) for k, v in C.items()
      if v['1canon'] == 0 and (v['3comm'] + v['4tika']) >= 5]
for k, v in sorted(zc, key=lambda x: -(x[1]['3comm'] + x[1]['4tika']))[:40]:
    print(f"  {k:34s} comm={v['3comm']:<5} tika={v['4tika']:<5} para={v['2para']}")
print(f"  ...({len(zc)} terms total with canon=0 & comm+tika>=5)\n")

# ---- global: highest canon counts (sense-audit candidates) ----
print("== TOP canon-count terms (sense-audit: list/homograph artifacts?) ==")
for k, v in sorted(C.items(), key=lambda x: -x[1]['1canon'])[:40]:
    print(f"  {k:34s} canon={v['1canon']:<5} comm={v['3comm']:<6} tot={v['total']}")
