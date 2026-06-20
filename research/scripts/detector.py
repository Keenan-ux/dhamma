#!/usr/bin/env python3
"""Choice-point detector — lexical within-lemma sense backbone (phase 1).

Per PREREGISTRATION.md §6. FIREWALL: reads only the Pāli `original`; never
the English `translation`. Evidence is DPD via /api/lookup. Deterministic.

Algorithm per token:
  1. normalize (NFC, lower); keep only Pāli-letter tokens.
  2. /api/lookup -> DPD entries (cached).
  3. contextual lemma = DPD lemma with min diacritic-aware edit distance to
     the token (tie: more sense-rows, then alphabetical). This correctly
     separates homonyms (pāsāda picks pāsādo=mansion, not pasado=antelope).
  4. cluster that lemma's senses; collapse synonyms (Jaccard>=0.5 content-word
     overlap, or substring).
  5. FIRE iff distinct sense-clusters >= N_SENSE.
Homonymy (multiple plausible lemmas, min-dist tie) is logged separately,
NOT counted as a lexical fire.

Usage:
  python research/scripts/detector.py dn2
  python research/scripts/detector.py --batch research/data/sample.json \
         --out research/out/detector_results.json [--nsense 2]
"""
import json, sys, re, unicodedata, urllib.request, urllib.parse, os, time
from concurrent.futures import ThreadPoolExecutor

USE_LOCAL = False  # set by --local: read DPD from local SQLite mirror (offline)
RECORD = False     # set by --record: emit all_tokens (token, lemma, n_senses, comm)
_dpd = None

API = "https://dhamma.fly.dev"
CACHE_PATH = "research/data/lemma_cache.json"
N_SENSE_DEFAULT = 2
JACCARD = float(os.environ.get("JACCARD", "0.5"))  # synonym-collapse threshold (tunable)
MAX_TOKENS = 600  # per-passage cap; huge Khuddaka/Niddesa texts are truncated
                  # (logged) — density is per-100-resolved-tokens so unaffected.
COMM_MIN = 2      # commentary lane: fire if the term is bolded/glossed in the
                  # commentaries >= this many times (offline, DPD-independent).

PALI_RE = re.compile(
    r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+"
)
STOP = set("ca va vā ti hi nu kho pana iti me te so naṃ taṃ na no e".split())

_cache = None
def load_cache():
    global _cache
    if _cache is None:
        if os.path.exists(CACHE_PATH):
            with open(CACHE_PATH, encoding="utf-8") as f:
                _cache = json.load(f)
        else:
            _cache = {}
    return _cache

def save_cache():
    if _cache is not None:
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(_cache, f, ensure_ascii=False)

def norm(s):
    return unicodedata.normalize("NFC", s).lower()

def api_get(path):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(API + path, timeout=20) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if attempt == 2:
                return {"_error": str(e)}
            time.sleep(0.8 * (attempt + 1))

def _fetch_lookup(term):
    q = urllib.parse.urlencode({"term": term})
    data = api_get("/api/lookup?" + q)
    if data.get("_error"):
        return None  # do NOT cache errors — poisons future retries
    dpd = []
    for e in (data.get("entries") or []):
        if e.get("source") == "dpd" and e.get("definition"):
            dpd.append({"lemma": e.get("lemma") or "", "definition": e.get("definition")})
    return {"matched_via": data.get("matched_via"), "dpd": dpd}

def prefetch(terms):
    """Concurrently fetch uncached terms (huge speedup on cold vocabulary)."""
    if USE_LOCAL:
        return  # local lookups are instant; no prefetch needed
    c = load_cache()
    todo = [t for t in dict.fromkeys(terms) if t not in c]
    if not todo:
        return
    with ThreadPoolExecutor(max_workers=8) as ex:
        for t, res in zip(todo, ex.map(_fetch_lookup, todo)):
            if res is not None:
                c[t] = res

def lookup(term):
    if USE_LOCAL:
        return _dpd.lemma_lookup(term)
    c = load_cache()
    if term in c:
        return c[term]
    res = _fetch_lookup(term)
    if res is None:
        return {"matched_via": None, "dpd": []}  # transient; not cached
    c[term] = res
    return res

def lev(a, b):
    if a == b: return 0
    if not a: return len(b)
    if not b: return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (ca != cb)))
        prev = cur
    return prev[-1]

CONTENT_RE = re.compile(r"[a-zāīūṛṝḷṅñṭḍṇṃṁśṣḥēō]+", re.I)
def content_words(defn):
    # first clause-ish chunk of a gloss; drop grammar-ish leading tokens
    words = [w.lower() for w in CONTENT_RE.findall(defn)]
    return set(w for w in words if len(w) > 2)

def cluster_senses(defs):
    """Collapse near-synonym sense-rows. Returns list of representative defs."""
    clusters = []  # each: set of content words + representative string
    for d in defs:
        cw = content_words(d)
        merged = False
        for cl in clusters:
            inter = cw & cl["cw"]
            uni = cw | cl["cw"] or {1}
            jac = len(inter) / len(uni)
            if jac >= JACCARD or (cw and (cw <= cl["cw"] or cl["cw"] <= cw)):
                cl["cw"] |= cw
                merged = True
                break
        if not merged:
            clusters.append({"cw": cw, "rep": d})
    return [c["rep"] for c in clusters]

def pick_lemma(token_norm, dpd):
    """Group DPD entries by lemma; choose contextual lemma by min diacritic-
    aware edit distance. Returns (lemma, [definitions], homonym_tie:bool)."""
    by = {}
    for e in dpd:
        by.setdefault(norm(e["lemma"]), []).append(e["definition"])
    if not by:
        return None, [], False
    scored = []
    for lemma, defs in by.items():
        scored.append((lev(token_norm, lemma), -len(defs), lemma, defs))
    scored.sort()
    best = scored[0]
    # homonym tie: another distinct lemma at the same min edit distance
    tie = sum(1 for s in scored if s[0] == best[0]) > 1
    return best[2], best[3], tie

_textbundle = None
def detect_passage(pid, n_sense=N_SENSE_DEFAULT):
    # Prefer a locally-cached Pāli bundle (avoids the slow /api/passage call
    # and is FIREWALL-safe: the bundle stores `original` only).
    if _textbundle is not None and pid in _textbundle and _textbundle[pid].get("original"):
        original = _textbundle[pid]["original"]
        genre_hint = _textbundle[pid].get("work_slug")
    else:
        p = api_get(f"/api/passage/{urllib.parse.quote(pid)}")
        if not p or p.get("_error") or not p.get("original"):
            return {"id": pid, "error": p.get("_error") if p else "no passage"}
        original = p["original"]  # FIREWALL: translation field deliberately ignored
        genre_hint = p.get("work_slug")
    tokens = []
    for m in PALI_RE.finditer(original):
        tok = m.group(0)
        tn = norm(tok)
        if len(tn) < 3 or tn in STOP:
            continue
        tokens.append((m.start(), tok, tn))
    truncated = len(tokens) > MAX_TOKENS
    if truncated:
        tokens = tokens[:MAX_TOKENS]
    prefetch([tn for _, _, tn in tokens])  # warm cache concurrently
    fires = []          # lexical lane (within-lemma polysemy)
    comm_fires = []     # commentary lane (DPD-independent), tokens NOT already lexical
    all_tokens = []     # every resolved token's signals (when RECORD) for offline sweeps
    n_tokens = 0
    n_unresolved = 0
    homonyms = 0
    for pos, tok, tn in tokens:
        n_tokens += 1
        comm = _dpd.commentary_glossed(tn) if USE_LOCAL else 0
        lk = lookup(tn)
        if not lk["dpd"]:
            n_unresolved += 1
            if RECORD:
                all_tokens.append({"pos": pos, "token": tok, "lemma": None, "n_senses": 0, "comm": comm})
            # commentary lane can still fire on an unresolved (e.g. proper-name) token
            if comm >= COMM_MIN:
                comm_fires.append({"pos": pos, "token": tok, "lemma": None,
                                   "commentary": comm, "lane": "commentary"})
            continue
        lemma, defs, tie = pick_lemma(tn, lk["dpd"])
        if tie:
            homonyms += 1
        clusters = cluster_senses(defs)
        if RECORD:
            all_tokens.append({"pos": pos, "token": tok, "lemma": lemma,
                               "n_senses": len(clusters), "comm": comm})
        if len(clusters) >= n_sense:
            fires.append({
                "pos": pos, "token": tok, "lemma": lemma,
                "n_senses": len(clusters), "senses": clusters,
                "matched_via": lk["matched_via"], "homonym_tie": tie,
                "commentary": comm, "lane": "lexical",
            })
        elif comm >= COMM_MIN:
            comm_fires.append({"pos": pos, "token": tok, "lemma": lemma,
                               "commentary": comm, "lane": "commentary"})
    # token count excluding unresolved (the detector's effective denominator)
    resolved = n_tokens - n_unresolved
    return {
        "id": pid, "work_slug": genre_hint, "truncated": truncated,
        "n_tokens": n_tokens, "resolved": resolved, "unresolved": n_unresolved,
        "homonym_ties": homonyms,
        "n_fires": len(fires), "n_comm_fires": len(comm_fires),
        "density_per_100": round(100 * len(fires) / resolved, 2) if resolved else 0,
        "fires": fires, "comm_fires": comm_fires,
        **({"all_tokens": all_tokens} if RECORD else {}),
    }

def main():
    global _textbundle, USE_LOCAL, _dpd, RECORD
    args = sys.argv[1:]
    n_sense = N_SENSE_DEFAULT
    if "--local" in args:
        import dpd_local as _dpd
        _dpd.connect()
        USE_LOCAL = True
        args.remove("--local")
    if "--record" in args:
        RECORD = True
        args.remove("--record")
    if "--nsense" in args:
        i = args.index("--nsense"); n_sense = int(args[i+1])
        del args[i:i+2]
    if "--textfile" in args:
        i = args.index("--textfile")
        with open(args[i+1], encoding="utf-8") as f:
            _textbundle = json.load(f)
        del args[i:i+2]
    load_cache()
    try:
        if args and args[0] == "--batch":
            sample_path = args[1]
            out_path = "research/out/detector_results.json"
            if "--out" in args:
                out_path = args[args.index("--out")+1]
            with open(sample_path, encoding="utf-8") as f:
                sample = json.load(f)
            results = []
            for i, p in enumerate(sample["passages"]):
                r = detect_passage(p["id"], n_sense)
                r["genre"] = p["genre"]
                results.append(r)
                save_cache()
                tr = " [truncated]" if r.get("truncated") else ""
                print(f"  {i+1}/{len(sample['passages'])} {p['id']} "
                      f"fires={r.get('n_fires','?')}{tr}", flush=True)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump({"n_sense": n_sense, "results": results}, f, ensure_ascii=False, indent=1)
            print(f"wrote {out_path}  ({len(results)} passages)")
        else:
            pid = args[0]
            print(json.dumps(detect_passage(pid, n_sense), ensure_ascii=False, indent=1))
    finally:
        save_cache()

if __name__ == "__main__":
    main()
