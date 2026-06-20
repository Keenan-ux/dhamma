#!/usr/bin/env python3
"""P0 step 4-5 — persist the DN2 slice into the choice_point/option/commitment
data model (TRANSLATIONS-AI.md) and render a throwaway reader sketch.

Consumes: dn2_slice.json (gold + detector fires + evidence) , dn2_workflow_result.json
(briefs + divergence) , dn2_audit.json (per-ref verdicts). Emits:
  research/out/dn2_choicepoints.json  — the data-model instance (schema test)
  research/out/dn2_reader.html         — throwaway workbench sketch (flood eyeball)

Firewall honored: detectors are `flagged_by`; warrants are primary only.
Human translations recorded as `flagged_by`, NEVER `warranted_by`.
Run from repo root:  python research/scripts/build_schema.py
"""
import json, io, os, sys, html, collections

sys.stdout.reconfigure(encoding="utf-8")
SLICE = "research/out/dn2_slice.json"
WF = "research/out/dn2_workflow_result.json"
AUDIT = "research/out/dn2_audit.json"

def load(p, default=None):
    try: return json.load(io.open(p, encoding="utf-8"))
    except FileNotFoundError: return default

def main():
    sl = load(SLICE); wf = load(WF, {}); au = load(AUDIT, {})
    briefs = wf.get("briefs", [])
    divergence = wf.get("divergence", [])
    audit_refs = au.get("refs", [])

    # index audit verdicts by (choice_point, source, ref, claim)
    averd = {}
    for r in audit_refs:
        averd[(r["choice_point"], r["source"], r.get("ref"), r.get("claim"))] = r["verdict"]

    # which deterministic lanes flagged each gold segment-token + divergence
    seg_by = {s["id"]: s for s in sl["segments"]}
    div_by_seg = collections.defaultdict(list)
    for d in divergence:
        div_by_seg[d["segment_id"]].append(d)

    choice_points, options, commitments = [], [], []
    for g in sl["gold"]:
        cp_id = f"dn2-cp-{g['id']}"
        # flagged_by: deterministic lanes that fired on the surface + divergence (if any rep divergent on the segment)
        flagged = list(g["fired_lanes_on_surface"])
        seg_divs = div_by_seg.get(g["segment"], [])
        n_div = sum(1 for d in seg_divs if d.get("divergent"))
        if n_div: flagged.append(f"divergence({n_div}/{len(seg_divs)} reps)")
        choice_points.append({
            "id": cp_id, "segment_id": g["segment"], "span": g["surface"],
            "lemma": g["lemma"], "type": g["type"], "status": "flagged",
            "flagged_by": flagged,                       # detectors — NOT warrants
            "human_translation_signal": {                # recorded as detector only
                "sujato": g["sujato"], "thanissaro": g["thanissaro"]},
        })
        # options: collected from the briefs, deduped by rendering; attach AUDITED refs
        by_rendering = {}
        for b in briefs:
            if b.get("choice_point_id") != g["id"]: continue
            for opt in b.get("options", []):
                key = opt["rendering"].strip().lower()
                slot = by_rendering.setdefault(key, {
                    "id": f"{cp_id}-opt-{len(by_rendering)+1}", "choice_point_id": cp_id,
                    "rendering": opt["rendering"].strip(), "commitment_type": opt.get("commitment_type"),
                    "evidence_refs": [], "rationale": opt.get("rationale", ""),
                    "generated_by": "Opus-4.8 (staging)", "_seen": 0, "_ref_seen": set()})
                slot["_seen"] += 1
                for ref in opt.get("evidence_refs", []):
                    sig = (ref.get("source"), ref.get("ref"), ref.get("claim"))
                    if sig in slot["_ref_seen"]: continue
                    slot["_ref_seen"].add(sig)
                    verdict = averd.get((g["id"], ref.get("source"), ref.get("ref"), ref.get("claim")), "unaudited")
                    slot["evidence_refs"].append({**ref, "audit": verdict})
        for slot in by_rendering.values():
            slot.pop("_ref_seen", None)
            n_valid = sum(1 for r in slot["evidence_refs"] if r["audit"] == "valid")
            slot["n_evidence"] = len(slot["evidence_refs"])
            slot["n_valid_warrants"] = n_valid
            options.append(slot)
        # commitment: provisional default from PRIMARY evidence; human has NOT committed.
        commitments.append({
            "choice_point_id": cp_id, "chosen_option": None,
            "committed_by": None, "rationale": "awaiting human commitment (workbench is expose-don't-resolve)",
            "provisional_default": g["sujato"], "supersedes": None})

    out = {
        "passage": "dn2", "slice": sl["slice"],
        "schema": "choice_point / option / commitment (TRANSLATIONS-AI.md)",
        "firewall_note": "flagged_by records detectors incl. human-translation divergence; warrants (evidence_refs) are primary-only and audited; no human translation is a warrant",
        "choice_points": choice_points, "options": options, "commitments": commitments,
        "schema_fit": {
            "all_gold_representable": True,
            "doctrinal_case_note": "vedehiputta→paṇḍitā holds: flagged_by=commentary-presence (NOT divergence — both translators take the Videha-lady reading, the herd-consensus blind spot), warranted_by=commentary bold-gloss ref DNa. Schema separates flag from warrant cleanly.",
        },
    }
    os.makedirs("research/out", exist_ok=True)
    json.dump(out, io.open("research/out/dn2_choicepoints.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    render_reader(sl, out)
    print(f"choice_points={len(choice_points)} options={len(options)} commitments={len(commitments)}")
    print("wrote research/out/dn2_choicepoints.json + research/out/dn2_reader.html")

def render_reader(sl, model):
    """Throwaway sketch: prose with provisional defaults; each choice-point a
    clickable affordance revealing options + audited evidence. Eyeball the flood."""
    opts_by_cp = collections.defaultdict(list)
    for o in model["options"]:
        opts_by_cp[o["choice_point_id"]].append(o)
    cp_by_lemma = {c["lemma"]: c for c in model["choice_points"]}
    # map surface token -> cp for inline marking
    surf2cp = {}
    for c in model["choice_points"]:
        for s in c["span"]:
            surf2cp[s] = c
    blocks = []
    for seg in sl["segments"]:
        pli = html.escape(seg["pli"]); suj = html.escape(seg["sujato"])
        marks = []
        for surf, c in surf2cp.items():
            if surf in seg["pli"]:
                cp = c["id"]; opts = opts_by_cp.get(cp, [])
                rows = []
                for o in opts:
                    ev = "".join(
                        f"<li class=ev data-v='{r['audit']}'><b>{html.escape(r['source'])}</b> "
                        f"<code>{html.escape(str(r.get('ref','')))}</code>: {html.escape(str(r.get('claim','')))} "
                        f"<span class=v>[{r['audit']}]</span></li>" for r in o["evidence_refs"])
                    rows.append(
                        f"<div class=opt><div class=rend>{html.escape(o['rendering'])} "
                        f"<small>({html.escape(o['commitment_type'] or '')}; {o['n_valid_warrants']}/{o['n_evidence']} valid warrants)</small></div>"
                        f"<ul>{ev or '<li><i>no evidence_refs</i></li>'}</ul></div>")
                marks.append(
                    f"<details class=cp><summary>⚑ {html.escape(surf)} "
                    f"<small>{html.escape(c['type'])} · flagged_by: {html.escape(', '.join(c['flagged_by']) or '—')}</small></summary>"
                    f"<div class=cpbody><div class=sig>human-translation signal (detector only): "
                    f"Sujato “{html.escape(c['human_translation_signal']['sujato'])}” · "
                    f"Thanissaro “{html.escape(c['human_translation_signal']['thanissaro'])}”</div>"
                    f"{''.join(rows)}</div></details>")
        blocks.append(f"<div class=seg><div class=sid>{seg['id']}</div>"
                      f"<div class=pli>{pli}</div><div class=suj>{suj}</div>"
                      f"{''.join(marks)}</div>")
    css = """
    body{font-family:'Noto Serif',Georgia,serif;max-width:820px;margin:2rem auto;color:#2a2622;line-height:1.5;padding:0 1rem}
    h1{font-size:1.3rem;font-weight:600;border-bottom:2px solid #b8902a;padding-bottom:.3rem}
    .note{font-size:.8rem;color:#777;font-style:italic;margin-bottom:1.5rem}
    .seg{margin:1.1rem 0;padding:.6rem .8rem;border-left:2px solid #eadfc4}
    .sid{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:#a99}
    .pli{font-style:italic;color:#5a5048}.suj{margin:.25rem 0}
    details.cp{margin:.35rem 0;background:#faf6ec;border:1px solid #e6d9b8;border-radius:4px}
    details.cp summary{cursor:pointer;padding:.3rem .5rem;font-size:.85rem;color:#7a5a10}
    .cpbody{padding:.4rem .7rem;font-size:.82rem}
    .sig{color:#888;font-size:.76rem;margin-bottom:.4rem}
    .opt{margin:.4rem 0;padding:.35rem .5rem;background:#fff;border:1px solid #eee;border-radius:3px}
    .rend{font-weight:600}.opt ul{margin:.2rem 0 .2rem 1rem;padding:0}
    .ev{font-size:.76rem;list-style:none;margin:.12rem 0}
    .ev .v{font-size:.7rem}
    .ev[data-v=valid] .v{color:#2f7a2f}.ev[data-v=fabricated_sense] .v{color:#b22}
    .ev[data-v=hallucinated_warrant] .v{color:#b22;font-weight:700}.ev[data-v=unverifiable] .v{color:#999}
    code{background:#f2ece0;padding:0 .2rem;border-radius:2px;font-size:.9em}
    """
    doc = (f"<!doctype html><meta charset=utf-8><title>DN2 slice — workbench sketch</title>"
           f"<style>{css}</style><h1>DN 2 Sāmaññaphalasutta — opening (auditable-translation sketch)</h1>"
           f"<div class=note>Throwaway P0 sketch. Prose = Sujato (provisional default; no human commitment yet). "
           f"⚑ = a detected choice-point; open it for the staged options + their evidence_refs, each tagged with the "
           f"machine-checkable audit verdict. Human-translation divergence is shown as a <i>detector signal</i> only — never a warrant.</div>"
           f"{''.join(blocks)}")
    io.open("research/out/dn2_reader.html", "w", encoding="utf-8").write(doc)

if __name__ == "__main__":
    main()
