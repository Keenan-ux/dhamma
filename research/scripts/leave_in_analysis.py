#!/usr/bin/env python3
"""Quantify the user's hypothesis: if a wide set of polysemous technical Pāli
terms is left UNTRANSLATED (transliterated + openable gloss), how much of the
choice-point problem — especially the hard blind-spot (register/domestication/
doctrinal) class — simply disappears? Uses the phase-2 non-circular gold."""
import json, re, unicodedata, collections, sys
sys.path.insert(0, "research/scripts")
import dpd_local as D
D.connect()

PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]

# Candidate "leave-in-Pāli" vocabulary: the technical terms practitioners /
# scholars routinely leave untranslated because they carry non-1:1 freight.
LEAVE_IN = set("""
dhamma kamma saṅkhāra sati sampajañña sampajāna samādhi paññā sīla citta
cetasika viññāṇa nāma rūpa khandha āyatana dhātu nibbāna saṃsāra dukkha sukha
domanassa somanassa upekkhā vedanā saññā taṇhā upādāna avijjā jhāna samatha
vipassanā mettā karuṇā muditā brahmavihāra kilesa āsava nīvaraṇa bojjhaṅga
magga phala nirodha samudaya arahant arahaṃ bhikkhu bhikkhunī saṅgha buddha
sutta vinaya abhidhamma anattā anicca sacca ariya puthujjana paṭiccasamuppāda
paccaya saddhā viriya pīti passaddhi cetanā phassa manasikāra vitakka vicāra
āyu kāya vedanā nimitta sotāpanna sakadāgāmī anāgāmī sekha asekha
""".split())

ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))
NONLEX={"register","domestication","doctrinal"}

def lemmas_for(token):
    out=set()
    lk=D.lemma_lookup(token)
    for e in lk["dpd"]:
        out.add(norm(e["lemma"]))
    return out

def is_leave_in(tokset):
    for t in tokset:
        if t in LEAVE_IN: return True
        # resolve inflected -> lemma
        if lemmas_for(t) & LEAVE_IN: return True
        # stem fallback: token starts with a leave-in term (compounds)
        for w in LEAVE_IN:
            if len(w)>=4 and t.startswith(w[:max(4,len(w)-1)]): return True
    return False

total=collections.Counter(); leavein=collections.Counter()
examples=collections.defaultdict(list)
for a in ann["results"]:
    marks=[]
    for ri,rv in enumerate(a.get("annotators") or []):
        if not rv: continue
        for cp in rv.get("choice_points",[]):
            t=set(toks(cp.get("pali","")))
            if t: marks.append((ri,t,cp.get("type","?"),cp.get("pali","")))
    cl=[]
    for ri,t,ty,pali in marks:
        for c in cl:
            if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; c["ty"][ty]+=1; break
        else: cl.append({"rev":{ri},"tok":set(t),"ty":collections.Counter({ty:1}),"pali":pali})
    for c in cl:
        if len(c["rev"])<2: continue
        ty=c["ty"].most_common(1)[0][0]
        li=is_leave_in(c["tok"])
        total[ty]+=1; total["ALL"]+=1
        if li:
            leavein[ty]+=1; leavein["ALL"]+=1
            if len(examples[ty])<6: examples[ty].append(c["pali"][:30])
        if ty in NONLEX:
            total["BLINDSPOT"]+=1
            if li: leavein["BLINDSPOT"]+=1

def pct(a,b): return f"{a}/{b} = {a/b:.1%}" if b else "n/a"
print("=== How much of the gold sits on 'leave-in-Pāli' vocabulary? ===")
print(f"  ALL choice-points:        {pct(leavein['ALL'], total['ALL'])}")
print(f"  BLIND-SPOT (reg/dom/doc): {pct(leavein['BLINDSPOT'], total['BLINDSPOT'])}")
print("  by type:")
for ty in ["doctrinal","register","domestication","lexical","syntactic"]:
    print(f"    {ty:14s} {pct(leavein[ty], total[ty])}")
print("\n  examples of leave-in choice-points by type:")
for ty in ["doctrinal","lexical","register"]:
    print(f"    {ty}: {examples[ty]}")
out={"all":[leavein["ALL"],total["ALL"]],"blindspot":[leavein["BLINDSPOT"],total["BLINDSPOT"]],
     "by_type":{ty:[leavein[ty],total[ty]] for ty in ["doctrinal","register","domestication","lexical","syntactic"]}}
json.dump(out,open("research/out/leave_in_analysis.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/leave_in_analysis.json")
