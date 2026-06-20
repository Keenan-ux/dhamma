#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""A1 attribution audit: capture attainment-marker windows for the 33 nikaya-prose
audit-core rows (and any extra ids passed), so per-claim coding works on focused
text, not the 300K-char CST volume monoliths. Serial DB pull through the proxy.

Writes research/awakening/_attr_worksheet.json: per id, the citation, length,
the nidana frame head (first 600 chars), and a window around every attainment
marker hit (the owner of the claim is read from these windows)."""
import os, re, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import psycopg2

HERE = os.path.dirname(os.path.abspath(__file__))

# the 33 nikaya-prose audit-core rows (work_of -> 'nikaya-prose')
CORE = [
 'an5.56','an8.11','an8.30','cst-s0403m1.mul-an5_2_1','cst-s0404m1.mul-an8_1_2',
 'cst-s0101m.mul-dn1_5','cst-s0201m.mul-mn1_1','cst-s0201m.mul-mn1_2',
 'cst-s0202m.mul-mn2_3','cst-s0202m.mul-mn2_4','cst-s0202m.mul-mn2_5',
 'cst-s0203m.mul-mn3_2','cst-s0203m.mul-mn3_5','cst-s0304m.mul-sn4_1',
 'cst-s0305m.mul-sn5_10','dn5','mn4','mn19','mn36','mn74','mn85','mn100','mn147',
 'sn8.7','sn8.12','sn35.121','sn47.29','sn47.30','sn52.24','sn54.8',
 'sn55.27','sn55.39','sn55.53',
]

# attainment / liberation markers. Each is searched glyph-normalised (dotted-m).
# The FIRST-PERSON ones are the buddha-vacana candidates when the speaker is the
# Buddha; the THIRD-PERSON ones are typically redactor-frame.
MARKERS = [
 # first-person own-awakening (autobiographical aorist + my-mind-was-freed)
 'abbhaññāsiṃ', 'abbhaññāsi', 'me cittaṃ vimuccittha', 'vimuccittha',
 'ñāṇañca pana me dassanaṃ udapādi', 'me ñāṇadassanaṃ', 'anuttaraṃ sammāsambodhiṃ abhisambuddho',
 'sammāsambodhiṃ abhisambuddho', 'abhisambuddho', 'pajānāmi',
 # third-person / redactor narrated openings
 'dhammacakkhuṃ udapādi', 'virajaṃ vītamalaṃ', 'arahattaṃ', 'arahattaṃ pāpuṇi',
 'aññāsi', 'aññaṃ byākāsi', 'khīṇā jāti', 'anupādāya āsavehi cittaṃ vimucci',
 'desanāpariyosāne', 'gāthāpariyosāne', 'satthā ahosi',
]

def windows(text, marker, pre=260, post=420, cap=4):
    out = []
    start = 0
    while len(out) < cap:
        i = text.find(marker, start)
        if i < 0:
            break
        a = max(0, i - pre)
        b = min(len(text), i + len(marker) + post)
        out.append({"at": i, "text": text[a:b]})
        start = i + len(marker)
    return out

def main():
    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn, connect_timeout=20); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='120s';")
    ph = ",".join(["%s"]*len(CORE))
    cur.execute(f"SELECT id, citation, original FROM passages WHERE id IN ({ph})", CORE)
    rows = {r[0]: (r[1], r[2]) for r in cur.fetchall()}
    sheet = {}
    for eid in CORE:
        if eid not in rows:
            sheet[eid] = {"MISSING": True}; continue
        cit, orig = rows[eid]
        hits = {}
        for m in MARKERS:
            w = windows(orig, m)
            if w:
                hits[m] = w
        sheet[eid] = {
            "citation": cit,
            "len": len(orig),
            "frame_head": orig[:600],
            "marker_hits": hits,
            "n_marker_kinds": len(hits),
        }
    out = os.path.join(HERE, "_attr_worksheet.json")
    json.dump(sheet, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", out)
    for eid in CORE:
        d = sheet[eid]
        if d.get("MISSING"): print(f"  {eid}: MISSING"); continue
        print(f"  {eid:28s} {d['citation']:12s} len={d['len']:7d} markers={list(d['marker_hits'].keys())}")

if __name__ == "__main__":
    main()
