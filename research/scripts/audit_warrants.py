#!/usr/bin/env python3
"""P0 — the headline: machine-checkable hallucinated-warrant audit.

For every evidence_ref a staging agent emitted, resolve it against the LOCAL
dpd.db (dpd_headwords + bold_definitions + lookup) and classify:

  valid                 ref resolves to a real row AND the claimed content is
                        actually present in that row.
  fabricated_sense      ref resolves to a real row, but the claimed sense/gloss
                        is NOT in it (the model attributed a meaning the source
                        does not give — e.g. cites "longhouse" to DPD, or the
                        paṇḍitā gloss to DPD instead of the commentary).
  hallucinated_warrant  ref does not resolve to any real row (the cited lemma
                        isn't a DPD headword / the term is bolded nowhere).
  unverifiable          source is parallel/grammar/cognate/concordance/other and
                        cannot be checked against dpd.db (reported, NOT counted
                        as hallucination — an honest coverage gap).

Headline rates are split by mode: A_grounded (packet provided, cite-only) vs
B_ungrounded (free recall). The A-vs-B delta = what verified-extraction buys.

This is run by the coordinator, not trusted from the sub-chat (HANDOFF §8).
Run from repo root:  python research/scripts/audit_warrants.py <briefs.json>
Emits a per-ref verdict table for manual spot-review + research/out/dn2_audit.json
"""
import json, io, os, re, sys, sqlite3, unicodedata

sys.stdout.reconfigure(encoding="utf-8")
DB = "scripts/ingest/.cache/dpd-released/dpd.db"
OUT = "research/out/dn2_audit.json"   # default; override with argv[2]
PALI_RE = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
STOP = set("the a an of to in on at and or is are be it its as for with by that this "
           "his her he she they them name day on-that being one who which form means "
           "sense meaning gloss term word root from into not also etc i.e e.g pali "
           "designation refers refer used use given gives give".split())

# meta-scaffolding words a brief wraps a gloss in ("DPD glosses X as ...") —
# they are not sense content and must not dilute the claim-vs-source match.
META = set("dpd ped cped dppn mw bhs gloss glosses glossed lists list includes "
           "include included gives give given sense senses field entry headword "
           "defines defined rendered renders rendering meaning meanings here term "
           "word root construction literally lit context primary secondary commentary "
           "atthakatha aṭṭhakathā takes treats analyses analyzes unpacks reads".split())

def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def words(s):
    return set(w for w in (norm(x) for x in PALI_RE.findall(s or "")) if len(w) > 2 and w not in STOP)

def pali_runs(s):
    """Contiguous runs of Pāli tokens (a quoted gloss is usually one run)."""
    runs, cur = [], []
    for tok in re.findall(r"[^\s]+", s or ""):
        m = PALI_RE.fullmatch(tok.strip("\"'.,;:()—-“”’‘"))
        if m and len(m.group(0)) > 1:
            cur.append(m.group(0))
        else:
            if len(cur) >= 3: runs.append(cur)
            cur = []
    if len(cur) >= 3: runs.append(cur)
    return runs

def windows(run, min_words=3):
    """Sliding windows of a token run, longest first (for corpus substring search)."""
    out = []
    for w in range(len(run), min_words - 1, -1):
        for i in range(0, len(run) - w + 1):
            out.append(run[i:i + w])
    return out

class DB_:
    def __init__(s, path=DB):
        s.c = sqlite3.connect(path); s.bold = None; s._corpus = None
    def lemma_senses(s, lemma):
        """All real warrant strings for a lemma (across its headwords): the
        meaning fields AND the sanskrit field (a brief may cite the Skt cognate,
        which is a real DPD datum and must not read as fabricated)."""
        ids = s._ids(lemma)
        if not ids: return None
        q = "SELECT meaning_1,meaning_2,meaning_lit,sanskrit,construction FROM dpd_headwords WHERE id IN (%s)" % ",".join("?"*len(ids))
        senses = []
        for m1, m2, ml, skt, con in s.c.execute(q, ids):
            senses += [x for x in (m1, m2, ml, skt, con) if x]
        return senses
    def _ids(s, key):
        # try the lemma as a lookup key, and stripped of trailing sense-number
        for k in {norm(key), re.sub(r"\s+\d+(\.\d+)?$", "", norm(key))}:
            row = s.c.execute("SELECT headwords FROM lookup WHERE lookup_key=?", (k,)).fetchone()
            if row and row[0]:
                ids = json.loads(row[0])
                if ids: return ids
        # also: maybe ref is itself a lemma_1 directly
        rows = s.c.execute("SELECT id FROM dpd_headwords WHERE lemma_1=? OR lemma_1 LIKE ?",
                           (key, norm(key) + " %")).fetchall()
        return [r[0] for r in rows]
    def headword_exists(s, lemma):
        return bool(s._ids(lemma)) or bool(
            s.c.execute("SELECT 1 FROM dpd_headwords WHERE lemma_1=? LIMIT 1", (norm(lemma),)).fetchone())
    def _load_bold(s):
        if s.bold is None:
            s.bold = {}
            for (b,) in s.c.execute("SELECT bold FROM bold_definitions WHERE bold IS NOT NULL"):
                k = norm(b); s.bold[k] = s.bold.get(k, 0) + 1
        return s.bold
    def comm_rows(s, term):
        return [r[0] for r in s.c.execute(
            "SELECT commentary FROM bold_definitions WHERE bold=? AND commentary IS NOT NULL LIMIT 12",
            (norm(term),))]
    def comm_present(s, term):
        return norm(term) in s._load_bold()
    def _load_corpus(s):
        """Whole commentary corpus as one normalized in-memory blob — substring
        search is then C-level fast. NFC-normalize the JOINED blob once (one C
        call) rather than per-row (369K calls = the old 11-min runtime)."""
        if s._corpus is None:
            parts = [r[0].lower() for r in s.c.execute(
                "SELECT commentary FROM bold_definitions WHERE commentary IS NOT NULL")]
            s._corpus = unicodedata.normalize("NFC", "\n".join(parts))
        return s._corpus
    def corpus_has(s, phrase):
        """Is this Pāli phrase present anywhere in the 103MB commentary corpus?
        (Verifies a quoted gloss is REAL commentary, independent of ref-code.)"""
        if len(phrase) < 14:  # too short to be specific
            return False
        return norm(phrase) in s._load_corpus()

def pali_tokens_from_ref(ref):
    """A ref may be 'pāsāda', 'payirupāsati 1', 'dpd #2', 'vedehī'. Pull the
    Pāli-looking content tokens (the citable key)."""
    toks = [t for t in PALI_RE.findall(ref or "") if len(t) > 2 and not norm(t) in {"dpd", "sense", "lemma", "ref"}]
    return toks

def content_supported(claim, real_texts, strip=None):
    """Does the claim's DISTINCTIVE content appear in the real source text?
    A single generic shared word (e.g. 'son', 'day') must NOT validate — the
    claim is supported only if a substantial fraction of its content words are
    present, or a salient phrase is a substring. `strip` removes meta-scaffolding
    and the headword so they don't dilute the fraction. Returns (supported, snip)."""
    cw = words(claim) - (strip or set())
    if not cw:
        return None, ""
    union = set()
    for rt in real_texts:
        union |= words(rt)
        # phrase-level: a salient substring match in either direction
        if len(norm(claim)) >= 5 and (norm(claim) in norm(rt) or norm(rt) in norm(claim)):
            return True, rt[:120]
    # fraction of the claim's distinctive content that is actually present
    frac = len(cw & union) / len(cw)
    if frac >= 0.5:
        snip = next((rt[:120] for rt in real_texts if words(rt) & cw), "")
        return True, snip
    return False, ""

# Pāli<->English bridges for commentary glosses whose claim is in English
BRIDGES = [("paṇḍit", {"wise", "learned", "sage", "clever", "intelligent"}),
           ("paccaya", {"condition", "requisite", "support"})]

def commentary_supported(claim, rows):
    sup, snip = content_supported(claim, rows)
    if sup: return True, snip
    cl = norm(claim); joined = " ".join(rows).lower()
    for pali, engset in BRIDGES:
        if pali in joined and (pali in cl or (words(claim) & engset)):
            return True, next((r[:120] for r in rows if pali in r.lower()), "")
    return False, ""

def audit_ref(db, ref):
    src = ref.get("source", "other"); rk = ref.get("ref", ""); claim = ref.get("claim", "")
    if src == "dpd":
        # resolve the cited lemma
        keys = pali_tokens_from_ref(rk) or pali_tokens_from_ref(claim)
        lemma = None
        for k in keys:
            if db.headword_exists(k): lemma = k; break
        if lemma is None:
            # last resort: the whole ref string as a lemma
            if db.headword_exists(rk): lemma = rk
        if lemma is None:
            return {"verdict": "hallucinated_warrant", "detail": f"no DPD headword resolves from ref={rk!r}"}
        senses = db.lemma_senses(lemma) or []
        # strip meta-scaffolding + the headword itself so they don't inflate the match
        strip = META | words(lemma) | words(rk)
        sup, snip = content_supported(claim, senses, strip=strip)
        if sup:
            return {"verdict": "valid", "lemma": lemma, "matched": snip}
        return {"verdict": "fabricated_sense", "lemma": lemma,
                "detail": f"claim attributes content absent from DPD senses of {lemma!r}",
                "real_senses": senses[:4]}
    if src == "commentary":
        # 1. verify a quoted Pāli gloss against the REAL commentary corpus (103MB),
        #    independent of the ref-code (agents cite ref=ref_code, claim=the gloss).
        #    De-hyphenate first: agents write compounds like "uposatha-saddo" /
        #    "pātimokkhuddesa-sīla-..." that are solid in the corpus.
        dehyph = re.sub(r"(?<=\w)-(?=\w)", "", claim)
        runs = [[t for t in r if norm(t) not in META] for r in pali_runs(dehyph)]
        for run in sorted(runs, key=len, reverse=True):
            for win in windows(run, min_words=2):
                phrase = " ".join(win)
                if db.corpus_has(phrase):
                    return {"verdict": "valid", "via": "commentary-corpus", "matched": phrase}
        quoted = any(len(r) >= 2 for r in runs)
        # 2. fall back: cited term bolded + claim bridge-matches its gloss rows
        keys = pali_tokens_from_ref(rk) or pali_tokens_from_ref(claim)
        term = next((k for k in keys if db.comm_present(k)), None)
        if term is not None:
            sup, snip = commentary_supported(claim, db.comm_rows(term))
            if sup:
                return {"verdict": "valid", "term": term, "matched": snip}
        if quoted:
            return {"verdict": "fabricated_sense",
                    "detail": "claim quotes Pāli commentary not found in the 103MB commentary corpus"}
        return {"verdict": "unverifiable",
                "detail": "English-only commentary paraphrase, no checkable Pāli quote or bolded term"}
    return {"verdict": "unverifiable", "detail": f"source={src} not checkable against dpd.db"}

def main():
    global OUT
    briefs_path = sys.argv[1] if len(sys.argv) > 1 else "research/out/dn2_workflow_result.json"
    if len(sys.argv) > 2: OUT = sys.argv[2]
    wf = json.load(io.open(briefs_path, encoding="utf-8"))
    briefs = wf.get("briefs", wf) if isinstance(wf, dict) else wf
    db = DB_()
    rows = []
    for b in briefs:
        cp = b.get("choice_point_id"); mode = b.get("mode"); rep = b.get("rep")
        for opt in b.get("options", []):
            for ref in opt.get("evidence_refs", []):
                v = audit_ref(db, ref)
                rows.append({"choice_point": cp, "mode": mode, "rep": rep,
                             "rendering": opt.get("rendering"), "source": ref.get("source"),
                             "ref": ref.get("ref"), "claim": ref.get("claim"), **v})
    # aggregate by mode
    def agg(subset):
        n = len(subset)
        c = {k: sum(1 for r in subset if r["verdict"] == k)
             for k in ("valid", "fabricated_sense", "hallucinated_warrant", "unverifiable")}
        checkable = n - c["unverifiable"]
        return {"refs": n, **c,
                "hallucinated_warrant_rate": round(c["hallucinated_warrant"] / checkable, 4) if checkable else None,
                "fabricated_sense_rate": round(c["fabricated_sense"] / checkable, 4) if checkable else None,
                "checkable_refs": checkable}
    modes = sorted(set(r["mode"] for r in rows if r["mode"]))
    summary = {"overall": agg(rows)}
    for m in modes:
        summary[m] = agg([r for r in rows if r["mode"] == m])
    out = {"n_briefs": len(briefs), "n_refs": len(rows), "summary": summary, "refs": rows}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"audited {len(rows)} evidence_refs across {len(briefs)} briefs\n")
    for m in ["overall"] + modes:
        a = summary[m]
        print(f"  {m:14s} refs={a['refs']:3d} checkable={a['checkable_refs']:3d}  "
              f"valid={a['valid']:3d} fabricated={a['fabricated_sense']:3d} "
              f"hallucinated={a['hallucinated_warrant']:3d} unverifiable={a['unverifiable']:3d}  "
              f"| HALL_RATE={a['hallucinated_warrant_rate']} FAB_RATE={a['fabricated_sense_rate']}")
    print(f"\nwrote {OUT}  (per-ref verdicts inside — spot-review the fabricated/hallucinated rows)")

if __name__ == "__main__":
    main()
