#!/usr/bin/env python3
"""Flatten /api/corpus into a flat passage list with genre labels, and report
distribution. Genre is derived from work_slug (the public corpus tree carries
no work_role, but the slug suffix/prefix encodes layer + pitaka)."""
import json, sys, collections

CORPUS = sys.argv[1] if len(sys.argv) > 1 else "research/data/corpus.json"

# Canonical Khuddaka works carrying their own top-level slug (verse-heavy or
# short-prose) — a distinct stratum so the verse genre is explicitly represented.
KHUDDAKA = {
    "pli-kp","pli-dhp","pli-ud","pli-iti","pli-snp","pli-vv","pli-pv",
    "pli-thag","pli-thig","pli-tha-ap","pli-thi-ap","pli-ja","pli-cnd",
    "pli-mnd","pli-nidd","pli-nd","pli-ps","pli-ap","pli-bv","pli-cp",
}
# Genuinely paracanonical / extra-canonical (post-canonical or non-root-format).
ANYA = {"pli-vism","pli-mil","pli-nett","pli-ne","pli-pet","pli-petk","pli-pe"}

def classify(work_slug, tradition_slug):
    s = work_slug or ""
    if s.endswith("-attha"):
        return "atthakatha"      # commentary
    if s.endswith("-tika"):
        return "tika"            # sub-commentary
    if s.startswith("pli-vinaya"):
        return "vinaya"
    if s.startswith("pli-abhidhamma"):
        return "abhidhamma"
    if s.startswith(("pli-dn","pli-mn","pli-sn","pli-an","pli-kn")):
        return "sutta"           # four main nikāyas (prose discourses)
    if s in KHUDDAKA or s.startswith(("pli-thig","pli-thag")):
        return "khuddaka"        # verse + short Khuddaka (verse genre)
    if s in ANYA or s.startswith("pli-cst-") or "-nrf" in s:
        return "anya"            # extra-canonical
    return "unknown"

def walk(work, tradition_slug, out):
    passages = work.get("passages")
    if passages:
        for p in passages:
            out.append({"id": p["id"], "work_slug": work.get("slug"),
                        "genre": classify(work.get("slug"), tradition_slug)})
    for c in work.get("children", []) or []:
        walk(c, tradition_slug, out)

def main():
    with open(CORPUS, encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for t in data.get("traditions", []):
        for w in t.get("works", []):
            walk(w, t.get("slug"), out)
    # distribution
    by_genre = collections.Counter(p["genre"] for p in out)
    print("TOTAL passages:", len(out))
    print("\nBy genre:")
    for g, n in by_genre.most_common():
        print(f"  {g:14s} {n:7d}")
    # full slug -> (genre,count) map for the record + unknown audit
    slug_genre = {}
    slug_count = collections.Counter()
    for p in out:
        slug_count[p["work_slug"]] += 1
        slug_genre[p["work_slug"]] = p["genre"]
    with open("research/data/slug_map.json", "w", encoding="utf-8") as f:
        json.dump({s: {"genre": slug_genre[s], "count": slug_count[s]}
                   for s in sorted(slug_count)}, f, indent=1, ensure_ascii=False)
    unknown = [(s, slug_count[s]) for s in slug_count if slug_genre[s]=="unknown"]
    if unknown:
        print("\nUNKNOWN slugs (need classification):")
        for s, n in sorted(unknown, key=lambda x:-x[1]):
            print(f"  {s:40s} {n:6d}")
    else:
        print("\nNo unknown slugs — all classified.")
    # write flat index
    with open("research/data/passage_index.json", "w", encoding="utf-8") as f:
        json.dump(out, f)
    print("\nwrote research/data/passage_index.json")

if __name__ == "__main__":
    main()
