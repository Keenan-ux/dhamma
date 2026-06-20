#!/usr/bin/env python
"""Build coding-ready occurrence-windows for the naga census (recall-first).

Frame = the BROAD substring `nāg` over passages.original (guarantees recall,
incl. compound-final serpents like campeyya-nāga). Then a precise Python token
rule drops the morphological false-friend families (the *āgata / āgāmin /
āgacchati / agghati / āgamana / āgāra* lemmas) so the coding set is not swamped
by `samannāgata`/`anāgāmī`. Whatever genuine *nāga*-lexeme survives (serpent /
elephant / epithet / tree / citizen / person) is windowed and left for the
referent gate (coders) to classify — precision is a coding step, not a regex.

Output: research/naga/data/windows.json     (one record per row with >=1 genuine token)
        research/naga/data/windows_summary.txt
"""
import os, re, json
import psycopg2

PALI = "a-zA-ZāīūṁṃṅñṭḍṇḷḥĀĪŪṀṂṄÑṬḌṆḶḤ"
# maximal Pali-letter token that contains the substring "nāg"
TOKEN = re.compile(r"[%s]*nāg[%s]*" % (PALI, PALI), re.IGNORECASE)
# morphological false friends: nāg + āgata/āgāmin/āgacchati/āgamana/āganta/
# āghāta/āgāra stems, and na+agghati (nāggh-). These are NOT the naga morpheme.
# (nāg+h catches an-āghāta "non-anger"; nāg+ant catches an-āgantā "not-coming".)
NOISE = re.compile(r"nāg(at|ām|acch|aman|ant|āra|h)|nāggh", re.IGNORECASE)
WIN = 180

def is_genuine(tok):
    return not NOISE.search(tok)

def process(orig):
    """Return (windows, genuine_tokens, n_genuine_occ) for one row's original."""
    spans, toks, n = [], set(), 0
    for m in TOKEN.finditer(orig):
        t = m.group(0)
        if not is_genuine(t):
            continue
        n += 1
        toks.add(t.lower())
        a, b = max(0, m.start() - WIN), min(len(orig), m.end() + WIN)
        spans.append([a, b])
    if not spans:
        return [], [], 0
    spans.sort()
    merged = [spans[0]]
    for a, b in spans[1:]:
        if a <= merged[-1][1] + 20:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    wins = []
    for a, b in merged:
        w = orig[a:b].replace("\n", " ").strip()
        wins.append(("" if a == 0 else "…") + w + ("" if b == len(orig) else "…"))
    return wins, sorted(toks), n

def main():
    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn, connect_timeout=20)
    cur = conn.cursor()
    cur.execute("SET statement_timeout='180s';")
    cur.execute(
        "SELECT id, citation, title, work_role, position, original, translation "
        "FROM passages WHERE original ~* 'nāg' ORDER BY work_role, id;"
    )
    out = []
    scanned = 0
    for row in cur:
        scanned += 1
        rid, citation, title, layer, position, orig, tr = row
        orig = orig or ""
        wins, toks, n = process(orig)
        if not wins:
            continue
        out.append({
            "id": rid, "citation": citation, "title": title, "layer": layer,
            "orig_len": len(orig), "n_occ": n, "tokens": toks,
            "has_translation": bool((tr or "").strip()),
            "windows": wins,
        })
    base = "research/naga/data"
    json.dump(out, open(f"{base}/windows.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    by = {}
    for o in out:
        d = by.setdefault(o["layer"], {"rows": 0, "occ": 0, "wins": 0})
        d["rows"] += 1; d["occ"] += o["n_occ"]; d["wins"] += len(o["windows"])
    lines = [f"scanned {scanned} substring-nāg rows; {len(out)} rows carry a genuine nāga token",
             "layer\trows\tgenuine_occ\twindows"]
    for L in ("mula", "attha", "tika", "anya"):
        d = by.get(L, {"rows": 0, "occ": 0, "wins": 0})
        lines.append(f"{L}\t{d['rows']}\t{d['occ']}\t{d['wins']}")
    lines.append(f"TOTAL\t{len(out)}\t{sum(d['occ'] for d in by.values())}\t{sum(d['wins'] for d in by.values())}")
    lines.append(f"\nwindows.json size: {os.path.getsize(f'{base}/windows.json')/1024:.0f} KB")
    open(f"{base}/windows_summary.txt", "w", encoding="utf-8").write("\n".join(lines))
    print("\n".join(lines))

if __name__ == "__main__":
    main()
