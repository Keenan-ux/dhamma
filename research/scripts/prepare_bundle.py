#!/usr/bin/env python3
"""Fetch the Pāli `original` for each sampled passage into a translation-blind
bundle the annotator agents consume. FIREWALL: the `translation` field is
deliberately NOT stored, so annotators cannot see English even by accident."""
import json, urllib.request, urllib.parse, time, re

API = "https://dhamma.fly.dev"
PALI_RE = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")

def api_get(path):
    for a in range(4):
        try:
            with urllib.request.urlopen(API + path, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if a == 3: return {"_error": str(e)}
            time.sleep(1.5*(a+1))

def main():
    with open("research/data/sample.json", encoding="utf-8") as f:
        sample = json.load(f)
    bundle = {}
    for i, p in enumerate(sample["passages"]):
        pid = p["id"]
        d = api_get(f"/api/passage/{urllib.parse.quote(pid)}")
        if not d or d.get("_error"):
            bundle[pid] = {"genre": p["genre"], "error": d.get("_error") if d else "none"}
            continue
        original = d.get("original") or ""
        bundle[pid] = {
            "genre": p["genre"],
            "citation": d.get("citation"),
            "title": d.get("title"),
            "work_slug": d.get("work_slug"),
            "original": original,                 # Pāli only — FIREWALL
            "n_pali_tokens": len(PALI_RE.findall(original)),
            # translation deliberately omitted
        }
        if (i+1) % 10 == 0:
            print(f"  {i+1}/{len(sample['passages'])}", flush=True)
    with open("research/data/passage_text.json", "w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=1)
    nchars = sum(len(b.get("original","")) for b in bundle.values())
    print(f"wrote research/data/passage_text.json  ({len(bundle)} passages, {nchars} Pāli chars)")

if __name__ == "__main__":
    main()
