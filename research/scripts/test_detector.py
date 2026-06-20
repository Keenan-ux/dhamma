#!/usr/bin/env python3
"""Sanity check: does the lexical detector reproduce the 2026-06-06 hand
analysis? Validates the discriminator (within-lemma polysemy vs homonymy/
synonymy) and confirms the register/domestication blind spot (finding #2)."""
import detector as D

# (token, expected_fire, why)
CASES = [
    ("payirupāsati", True,  "real polysemy: attends/sits-at-feet vs honours"),
    ("pāsāda",       False, "register choice (palace/longhouse) — invisible to lexical (finding #2)"),
    ("rājā",         False, "homonyms (king/dusty/royal/daemon) — king senses collapse"),
    ("nisinna",      False, "synonyms seated≈sitting collapse"),
    ("ratti",        False, "single sense: night"),
    ("bhagavā",      False, "single sense"),
    ("uposatha",     False, "domestication choice (sabbath/uposatha) — invisible to lexical"),
]

D.load_cache()
print(f"{'token':16s} {'fire':5s} {'exp':5s} {'lemma':14s} senses")
ok = 0
for tok, exp, why in CASES:
    lk = D.lookup(D.norm(tok))
    lemma, defs, tie = D.pick_lemma(D.norm(tok), lk["dpd"])
    clusters = D.cluster_senses(defs)
    fire = len(clusters) >= D.N_SENSE_DEFAULT
    mark = "OK " if fire == exp else "XX "
    if fire == exp: ok += 1
    print(f"{mark}{tok:13s} {str(fire):5s} {str(exp):5s} {str(lemma):14s} {len(clusters)}  {clusters}")
    print(f"      ({why})")
D.save_cache()
print(f"\n{ok}/{len(CASES)} cases match hand analysis")
