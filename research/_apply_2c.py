#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Apply the Phase 2c precision/register edits proposed by the scan workflow.
JSX edits -> src/ResearchView.jsx ; naga data edits -> public/research/naga.json.
Each edit is an exact old->new substring; reports any old not found (and does NOT
write that file if a miss is found, so mismatches surface before any change)."""
import json, sys

OUT = r"C:\Users\isaac\AppData\Local\Temp\claude\C--Dev-Dhamma\3141d7b1-4c41-4003-ab83-6d04e06bf102\tasks\w0s4i2285.output"
R = json.loads(open(OUT, encoding='utf-8').read())['result']['results']

JSX = 'src/ResearchView.jsx'
NAGA = 'public/research/naga.json'

jsx_edits, naga_edits = [], []
for r in R:
    for e in r.get('register_edits', []) + r.get('precision_edits', []):
        jsx_edits.append((e['old'], e['new']))
    for e in r.get('data_edits', []):
        naga_edits.append((e['old'], e['new']))

def apply(path, edits, label):
    txt = open(path, encoding='utf-8').read()
    em_before = txt.count('—')
    misses, applied = [], 0
    for old, new in edits:
        if old == new:
            continue
        n_old = txt.count(old)
        if n_old == 0:
            if txt.count(new) > 0:
                applied += 1  # already applied (idempotent)
            else:
                misses.append(old[:90])
        else:
            txt = txt.replace(old, new)  # replace ALL (duplicates across records/spine get the same regrade)
            applied += 1
    em_after = txt.count('—')
    print(f"\n=== {label} ({path}) ===")
    print(f"  edits: {len(edits)} | applied: {applied} | misses: {len(misses)} | em-dash {em_before} -> {em_after}")
    for m in misses:
        print("   MISS:", m)
    if misses:
        print("  -> NOT WRITTEN (fix misses first).")
        return False
    open(path, 'w', encoding='utf-8').write(txt)
    print("  -> written.")
    return True

ok1 = apply(JSX, jsx_edits, "JSX (register+precision)")
ok2 = apply(NAGA, naga_edits, "naga data (em-dash regrade + meta load-bearing)")
if ok2:
    # validate naga json
    try:
        json.load(open(NAGA, encoding='utf-8'))
        print("\nnaga.json: valid JSON OK")
    except Exception as ex:
        print("\nnaga.json: INVALID:", ex)
print("\nDONE." if (ok1 and ok2) else "\nINCOMPLETE — see misses above.")
