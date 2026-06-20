import json, sys, urllib.request, urllib.parse, time

# usage: python fetch.py search "<term>" mode scope pitaka layer limit outfile
#        python fetch.py passage <id> outfile
BASE = "https://dhamma.fly.dev"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "dhamma-research/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")

kind = sys.argv[1]
if kind == "search":
    term, mode, scope, pitaka, layer, limit, out = sys.argv[2:9]
    params = {"q": term, "mode": mode, "scope": scope, "limit": limit}
    if pitaka != "-":
        params["pitaka"] = pitaka
    if layer != "-":
        params["layer"] = layer
    url = BASE + "/api/search?" + urllib.parse.urlencode(params)
    raw = get(url)
    d = json.loads(raw)
    r = d.get("results", [])
    with open(out, "w", encoding="utf-8") as f:
        f.write("URL " + url + "\n")
        f.write("count " + str(len(r)) + "\n")
        for x in r:
            f.write(str(x.get("id")) + " | " + str(x.get("citation")) + " | " +
                    str(x.get("layer")) + " | " + str(x.get("title")) + " | " +
                    (str(x.get("snippet", ""))[:160].replace("\n", " ")) + "\n")
    print("ok", len(r))
elif kind == "passage":
    pid, out = sys.argv[2], sys.argv[3]
    raw = get(BASE + "/api/passage/" + pid)
    open(out, "w", encoding="utf-8").write(raw)
    d = json.loads(raw)
    print("ok", d.get("citation"), "|", d.get("title"), "| origlen", len(d.get("original", "")))
