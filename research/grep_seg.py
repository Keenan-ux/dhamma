import json, sys

# usage: python grep_seg.py <rawjson> <outfile> <substr1> [substr2 ...]
raw = sys.argv[1]
out = sys.argv[2]
needles = sys.argv[3:]
d = json.load(open(raw, encoding="utf-8"))
segs = d.get("segments") or {}
with open(out, "w", encoding="utf-8") as f:
    f.write("PASSAGE " + str(d.get("id")) + " | " + str(d.get("citation")) + " | " + str(d.get("title")) + "\n\n")
    if segs:
        for k, v in segs.items():
            p = v.get("pali", "")
            e = v.get("english", "")
            if any(n.lower() in p.lower() or n.lower() in e.lower() for n in needles):
                f.write(k + "\tPALI: " + p + "\n\tEN:   " + e + "\n")
    else:
        # no segments; search the original blob
        o = d.get("original", "")
        for n in needles:
            i = o.lower().find(n.lower())
            f.write("needle=" + n + " idx=" + str(i) + "\n")
            if i >= 0:
                f.write(o[max(0, i-300):i+500] + "\n---\n")
print("ok")
