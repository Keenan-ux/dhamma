#!/usr/bin/env python3
"""Local DPD mirror — offline lemma + sense lookup and a commentary-gloss
signal, straight from the released DPD SQLite. Zero network, zero prod load.

- lemma_lookup(token): same shape the HTTP /api/lookup returned
  ({matched_via, dpd:[{lemma, definition}]}), via the 1.28M-row `lookup`
  table (resolves inflected forms) -> dpd_headwords meanings.
- commentary_glossed(token): does the commentarial tradition bold/gloss this
  term? (from bold_definitions, 369K rows) -> a doctrinal-choice signal that
  is INDEPENDENT of the dictionary polysemy the lexical detector consumes.
"""
import sqlite3, json, re, unicodedata

DB_PATH = "scripts/ingest/.cache/dpd-released/dpd.db"
_STRIP = re.compile(r" \d+(\.\d+)?$")
_conn = None
_bold = None

def norm(s): return unicodedata.normalize("NFC", s or "").lower()

def connect(path=DB_PATH):
    global _conn
    _conn = sqlite3.connect(path, check_same_thread=False)
    return _conn

def lemma_lookup(token):
    if _conn is None: connect()
    t = norm(token)
    row = _conn.execute("SELECT headwords FROM lookup WHERE lookup_key=?", (t,)).fetchone()
    if not row or not row[0]:
        return {"matched_via": None, "dpd": []}
    ids = json.loads(row[0])
    if not ids:
        return {"matched_via": None, "dpd": []}
    q = "SELECT lemma_1, meaning_1, meaning_2, meaning_lit FROM dpd_headwords WHERE id IN (%s)" % ",".join("?"*len(ids))
    dpd = []
    for lemma_1, m1, m2, ml in _conn.execute(q, ids):
        defn = m1 or m2 or ml or ""
        if defn:
            dpd.append({"lemma": _STRIP.sub("", lemma_1 or ""), "definition": defn})
    return {"matched_via": "lookup" if dpd else None, "dpd": dpd}

def _load_bold():
    global _bold
    if _bold is None:
        if _conn is None: connect()
        _bold = {}
        for (b,) in _conn.execute("SELECT bold FROM bold_definitions WHERE bold IS NOT NULL"):
            k = norm(b)
            _bold[k] = _bold.get(k, 0) + 1
    return _bold

def commentary_glossed(token):
    """Count of times this surface/lemma form is bolded (glossed) in the
    commentaries. >0 => the tradition flagged it as needing explanation."""
    b = _load_bold()
    t = norm(token)
    if t in b: return b[t]
    # also try the resolved lemma(s)
    lk = lemma_lookup(t)
    best = 0
    for e in lk["dpd"]:
        best = max(best, b.get(norm(e["lemma"]), 0))
    return best

if __name__ == "__main__":
    connect()
    for tok in ["payirupāsati", "pāsāda", "pāsādaṃ", "rājā", "uposatha", "vedehiputta", "paccaya"]:
        lk = lemma_lookup(tok)
        cg = commentary_glossed(tok)
        print(f"{tok:16s} lemmas={len(set(e['lemma'] for e in lk['dpd']))} "
              f"senses={len(lk['dpd'])} commentary_gloss={cg}")
