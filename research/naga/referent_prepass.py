#!/usr/bin/env python
"""Deterministic referent pre-classification (the codebook token rules).

For every windowed candidate row, assign a provisional `referent` from its
nāga-token set using pre-registered lexical rules. Rows whose tokens are all
unambiguous (person / tree / citizen / strong-serpent / strong-elephant) are
auto-coded; rows with a bare/ambiguous noun (nāgo, nāgaṃ, mahānāga …) are
flagged `ambiguous` for blind agent coding. Mixed-sense rows are flagged too.

This is a TRIAGE + reproducibility layer, not the final word: the agent gate
re-codes everything flagged, and adjudication can overturn an auto-code.

Output: research/naga/data/prepass.json   (row -> provisional referent + why)
        research/naga/data/prepass_summary.txt
"""
import re, json
from collections import Counter

# --- pre-registered token rules (order matters: first match wins per token) ---
RULES = [
    ("person",   re.compile(r"^(nāgasen|nāgit|nāgasamāl|nāgadatt|nāgamitt|nāgamundi|nāgarjun)", re.I)),
    ("serpent",  re.compile(r"^(nāgarāj|nāgayoni|nāgakaññ|nāgakumār|nāgamāṇav|nāgabhavan|nāgalok|nāginda|nāgind|nāgapotak|nāgapotik|nāgāvās|campeyyanāg|nāgadīp|nāgarukkhamūl)", re.I)),
    ("citizen",  re.compile(r"^(nāgar)", re.I)),           # nāgara/nāgarika/aṭṭhakanāgara (nāgarāj already caught above)
    ("tree",     re.compile(r"^(punnāg|nāgalat|nāgarukkh|nāgapupph|nāgavall)", re.I)),
    ("elephant", re.compile(r"^(hatthināg|nāgavanik|nāganās|gajanāg|nāgadant)", re.I)),
    ("epithet_or_amb", re.compile(r"^(mahānāg)", re.I)),   # great-naga: epithet vs elephant vs serpent -> agent
    # bare noun -> ambiguous (serpent/elephant/epithet by context)
    ("ambiguous", re.compile(r"^nāg", re.I)),
]

def classify_token(tok):
    for label, rx in RULES:
        if rx.search(tok):
            return label
    return "ambiguous"

def main():
    base = "research/naga/data"
    rows = json.load(open(f"{base}/windows.json", encoding="utf-8"))
    out = []
    for r in rows:
        labels = Counter(classify_token(t) for t in r["tokens"])
        kinds = set(labels)
        # row-level provisional referent
        if kinds == {"ambiguous"} or kinds == {"epithet_or_amb"} or kinds == {"ambiguous", "epithet_or_amb"}:
            prov, needs_agent = "ambiguous", True
        elif len(kinds - {"ambiguous", "epithet_or_amb"}) == 1 and not (kinds & {"ambiguous"}):
            prov, needs_agent = list(kinds - {"epithet_or_amb"})[0], ("epithet_or_amb" in kinds)
            if prov == "epithet_or_amb":
                prov, needs_agent = "ambiguous", True
        else:
            # mixed senses OR auto-sense + ambiguous tail -> agent adjudicates
            non_amb = kinds - {"ambiguous", "epithet_or_amb"}
            if len(non_amb) == 1 and not (kinds & {"ambiguous"}):
                prov, needs_agent = list(non_amb)[0], False
            elif len(non_amb) == 1:
                prov, needs_agent = list(non_amb)[0], True   # dominant sense + ambiguous tail
            else:
                prov, needs_agent = "mixed", True
        out.append({**r, "prov_referent": prov, "needs_agent": needs_agent,
                    "label_breakdown": dict(labels)})
    json.dump(out, open(f"{base}/prepass.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    # summary
    prov_by_layer = {}
    for o in out:
        prov_by_layer.setdefault(o["prov_referent"], Counter())[o["layer"]] += 1
    agent_needed = sum(1 for o in out if o["needs_agent"])
    auto = len(out) - agent_needed
    lines = [f"rows: {len(out)}  |  auto-coded: {auto}  |  need agent: {agent_needed}", ""]
    lines.append("prov_referent\tmula\tattha\ttika\tanya\ttotal")
    for prov in ("serpent", "elephant", "epithet_or_amb", "person", "tree", "citizen", "ambiguous", "mixed"):
        c = prov_by_layer.get(prov, Counter())
        tot = sum(c.values())
        if tot:
            lines.append(f"{prov}\t{c.get('mula',0)}\t{c.get('attha',0)}\t{c.get('tika',0)}\t{c.get('anya',0)}\t{tot}")
    open(f"{base}/prepass_summary.txt", "w", encoding="utf-8").write("\n".join(lines))
    print("\n".join(lines))

if __name__ == "__main__":
    main()
