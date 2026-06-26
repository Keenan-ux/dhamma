#!/usr/bin/env python
"""§2a - the instrumental-precept / circularity enumeration. ONE connection, serial.

Emits research/intoxicants/_instrumental_evidence.json carrying, per query: the exact
pattern + mask, the per-stratum DEDUPED (is_primary) count + per-Mchar density, and a
deterministic count-lock sample (full original + translation) so the sense-read is a
re-read from file. Also fetches named priority loci in full.

Folds in the design-fleet + completeness-critic refinements (PREREG-instrumental.md):
niggahita class [ṁṃ] on every enumerand; intoxicant-specific drink tie (no majja
false-friends); the pamādaṭṭhāna dependency split; the P5 both-pass cross-tab with the
Āmagandha + soceyya + flesh-bar contrast classes; the P3 causal/list rule is applied at
sense-read time (this script only gathers; coding happens on the dumped samples).

Density rule (DEDUPED-DENOMINATORS.json): is_primary on BOTH sides; stratum() is the
chronological axis. Patterns are PostgreSQL ~* POSIX over original, FULL diacritics.

Run:  PYTHONIOENCODING=utf-8 python research/intoxicants/_run_instrumental.py
"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "naga"))
from sql import _get_dsn
import psycopg2

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_instrumental_evidence.json")
STRATA = ("1early", "2late", "3abh", "4para", "5comm", "6tika", "7other")
CANON = ("1early", "2late", "3abh", "4para")
COMM = ("5comm", "6tika")

# intoxicant-specific drink tie: avoids the majja false-friends (majjha/majjana/miñja)
# by requiring an intoxicant token. surā keeps minor deva noise; co-occurrence + sample-read filter it.
DRINK = r"(meraya|surā|majja[ṃṁ]|majjap|majje[\s,.]|madirā|pānānuyog|surāpān|telapāk|madhupān|vāruṇī)"

conn = psycopg2.connect(_get_dsn(), connect_timeout=25)
conn.autocommit = True
cur = conn.cursor()
cur.execute("SET statement_timeout = '180s';")


def probe(label, pattern, exclude=None, bears_on=None, note=None, also=None, n=24):
    """also = an extra AND co-occurrence requirement (PG ~*), already diacritic-safe."""
    exc = "AND original !~* %(exc)s" if exclude else ""
    extra = "AND original ~* %(also)s" if also else ""
    params = {"pat": pattern, "exc": exclude, "also": also, "n": n}
    cur.execute(f"""
        WITH d AS (SELECT stratum(work_slug) s, SUM(char_length(original))/1000000.0 mchar
                   FROM passages WHERE is_primary GROUP BY s),
             c AS (SELECT stratum(work_slug) s, COUNT(*) cnt
                   FROM passages
                   WHERE is_primary AND original ~* %(pat)s {exc} {extra}
                   GROUP BY s)
        SELECT d.s, COALESCE(c.cnt,0), round(d.mchar::numeric,3),
               round((COALESCE(c.cnt,0)/d.mchar)::numeric,3)
        FROM d LEFT JOIN c USING (s) ORDER BY d.s;""", params)
    per = {}
    for s, cnt, mchar, dens in cur.fetchall():
        per[s] = {"count": int(cnt), "mchar": float(mchar), "density_per_mchar": float(dens), "sample": []}
    cur.execute(f"""
        WITH base AS (SELECT id, work_slug, stratum(work_slug) s, original, translation,
                      row_number() OVER (PARTITION BY stratum(work_slug) ORDER BY md5(id::text)) rn
                      FROM passages
                      WHERE is_primary AND original ~* %(pat)s {exc} {extra})
        SELECT id, work_slug, s, original, translation FROM base WHERE rn <= %(n)s ORDER BY s, rn;""", params)
    for pid, ws, s, orig, tr in cur.fetchall():
        per.setdefault(s, {"count": 0, "sample": []})["sample"].append(
            {"id": pid, "work_slug": ws, "original": orig, "translation": tr})
    total = sum(v["count"] for v in per.values())
    canon = sum(per.get(s, {}).get("count", 0) for s in CANON)
    comm = sum(per.get(s, {}).get("count", 0) for s in COMM)
    rec = {"kind": "probe", "label": label, "pattern": pattern, "exclude": exclude, "also": also,
           "bears_on": bears_on, "note": note,
           "totals": {"all": total, "canon": canon, "commentary": comm}, "per_stratum": per}
    sys.stderr.write(f"[{label}] all={total} canon={canon} comm={comm}  pat={pattern!r}"
                     + (f" also=DRINK" if also == DRINK else (f" also={also!r}" if also else ""))
                     + (f" -exc={exclude!r}" if exclude else "") + "\n")
    return rec


def split_drink(label, pattern, bears_on=None, note=None, n=20):
    """Dependency-split a general term by whether the drink cluster co-occurs. The WITHOUT-drink
    rows are the diagnostic (e.g. pamādaṭṭhāna as a general 'base of heedlessness' idiom)."""
    cur.execute("""
        SELECT stratum(work_slug) s,
               count(*) FILTER (WHERE original ~* %(d)s) with_d,
               count(*) FILTER (WHERE original !~* %(d)s) without_d
        FROM passages WHERE is_primary AND original ~* %(p)s GROUP BY s ORDER BY s;""",
        {"p": pattern, "d": DRINK})
    rows = {}
    tw = two = 0
    for s, w, wo in cur.fetchall():
        rows[s] = {"with_drink": int(w), "without_drink": int(wo)}
        tw += int(w); two += int(wo)
    cur.execute("""
        WITH base AS (SELECT id, work_slug, stratum(work_slug) s, original, translation,
                      row_number() OVER (PARTITION BY stratum(work_slug) ORDER BY md5(id::text)) rn
                      FROM passages WHERE is_primary AND original ~* %(p)s AND original !~* %(d)s)
        SELECT id, work_slug, s, original, translation FROM base WHERE rn <= %(n)s ORDER BY s, rn;""",
        {"p": pattern, "d": DRINK, "n": n})
    samp = [{"id": pid, "work_slug": ws, "stratum": s, "original": o, "translation": t}
            for pid, ws, s, o, t in cur.fetchall()]
    rec = {"kind": "split", "label": label, "pattern": pattern, "bears_on": bears_on, "note": note,
           "per_stratum": rows, "totals": {"with_drink": tw, "without_drink": two},
           "without_drink_sample": samp}
    sys.stderr.write(f"[{label}] with_drink={tw} without_drink={two}  pat={pattern!r}\n")
    return rec


def fetch_locus(pid):
    cur.execute("SELECT id, work_slug, work_role, stratum(work_slug), citation, title, original, translation "
                "FROM passages WHERE id = %s;", (pid,))
    r = cur.fetchone()
    if not r:
        sys.stderr.write(f"[locus] {pid} NOT FOUND\n")
        return {"id": pid, "found": False}
    keys = ["id", "work_slug", "work_role", "stratum", "citation", "title", "original", "translation"]
    d = dict(zip(keys, r)); d["found"] = True
    sys.stderr.write(f"[locus] {pid} ok ({d['work_role']}/{d['stratum']}) {d.get('citation')}\n")
    return d


SIX = r"(dhanajāni|kalahappavaḍḍhan|rogāna[ṁṃ]\s*āyatan|akittisañjanan|kopīnanida[ṁṃ]san|paññāya\s+dubbalikaraṇ)"

QUERIES = [
    # ---- P1 — consequential / instrumental framing ----
    dict(label="precept-compound", pattern=r"surāmerayamajjap?pamād", bears_on="P1",
         note="the strict precept compound; single/geminate-p; where the precept lives"),
    dict(label="adinava-of-drink", pattern=r"ādīnav", also=DRINK, bears_on="P1",
         note="drawback/danger enumeration tied to drink"),
    dict(label="six-drawbacks-union", pattern=SIX, bears_on="P1/P2",
         note="the six dn31 drawback enumerands (niggahita class); finds DN mula + commentary restatement"),
    dict(label="apayamukha", pattern=r"apāyamukh", bears_on="P1",
         note="drains-on-wealth / gateways-to-ruin; drink first"),
    dict(label="parabhava-drink", pattern=r"parābhav", also=DRINK, bears_on="P1",
         note="downfall/ruin frame tied to drink (snp1.6 kin)"),

    # ---- P2 — faculty / wisdom-weakening as operative harm ----
    dict(label="panna-dubbala", pattern=r"paññ[aā]ya\s+dubbalikaraṇ", bears_on="P2",
         note="weakening of wisdom; the faculty harm; the sixth drawback"),
    dict(label="dubbalikarana-any", pattern=r"dubbal[iī]karaṇ", bears_on="P2",
         note="the -weakening- term broadly; what is the object?"),
    dict(label="cittamohani", pattern=r"cittamohan", bears_on="P2", note="'confuses the mind' (an5.179)"),
    dict(label="ummadana", pattern=r"ummādan", bears_on="P2", note="'ends in madness' (snp2.14)"),
    dict(label="madaniya", pattern=r"madanīy", bears_on="P2/effect", note="the effect-vocabulary 'intoxicating'"),
    dict(label="moha-cluster", pattern=r"(sammoh|sammuyh|sammūḷh|muyh|mucchā|visaññ)", also=DRINK,
         exclude=r"sammohavinodan", bears_on="P2",
         note="cognitive clouding tied to drink (cluster-gated; Sammohavinodanī masked)"),

    # ---- P3 — drink co-occurring with each other-precept (instrumental mechanism; causal/list split at read) ----
    dict(label="drink+killing", pattern=r"pāṇātipāt", also=DRINK, bears_on="P3", note="drink co-occurs w/ killing"),
    dict(label="drink+stealing", pattern=r"adinnādān", also=DRINK, bears_on="P3", note="drink co-occurs w/ stealing"),
    dict(label="drink+sexual", pattern=r"(kāmesumicchācār|kāmesu micchācār|abrahmacariy)", also=DRINK,
         bears_on="P3", note="drink co-occurs w/ sexual misconduct"),
    dict(label="drink+lying", pattern=r"musāvād", also=DRINK, bears_on="P3", note="drink co-occurs w/ lying"),
    dict(label="five-vice-agentive", pattern=r"surāmerayamajjap?pamādaṭṭhāyī", bears_on="P3-baseline",
         note="the agentive five-precept vice compound; pure list-enumeration baseline"),
    # the explicit 'having become heedless, one does X' causal connective near drink:
    dict(label="pamatto-does", pattern=r"pamatto.{0,60}(karoti|karot|āpajj|kareyy|akās)", also=DRINK,
         bears_on="P3", note="heedless-then-acts causal bigram near drink"),

    # ---- P4 — gift / other-protection framing + the self-purification negative leg ----
    dict(label="mahadana-drink", pattern=r"mahādān", also=DRINK, bears_on="P4", note="abstaining-as-great-gift (an8.39)"),
    dict(label="abhaya-avera-drink", pattern=r"(abhaya|avera|abyāpajjh|avyāpajjh)", also=DRINK,
         exclude=r"abhayarāj|abhayagir|abhayatther|abhayuvar", bears_on="P4",
         note="freedom-from-fear/enmity to others, tied to drink (names masked)"),
    dict(label="self-purification-drink", pattern=r"(soceyy|pārisuddh|visuddh|sucikamm)", also=DRINK,
         exclude=r"visuddhimagg|sīlavisuddh|cittavisuddh|diṭṭhivisuddh", bears_on="P4-neg",
         note="is the precept framed as the DRINKER's self-purification? predicted ~0"),

    # ---- P5 — structured absence: drink as intrinsic impurity? both-pass cross-tab ----
    # (a) expected-present pass (the impurity vocabulary IS in the corpus):
    dict(label="impurity-vocab-present", pattern=r"(asuci|asucī|amedhy|asucik)", bears_on="P5-present",
         note="ritual-impurity vocabulary corpus-wide (kāyagatāsati etc.) - proves the vocab exists"),
    dict(label="stain-vocab-present", pattern=r"(aṅgaṇ|kiliṭṭh|saṃkiliṭṭh|upakkiles|malin)", bears_on="P5-present",
         exclude=r"maṅgal", note="stain/blemish vocabulary corpus-wide - proves the vocab exists"),
    # (b) the absence: impurity tied to drink (predicted ~0 as intrinsic; sense-read any hits):
    dict(label="impurity-of-drink", pattern=r"(asuci|asucī|amedhy|asucik)", also=DRINK, bears_on="P5",
         note="impurity predicated of drink? predicted ~0 (drink-as-impurity-per-se)"),
    dict(label="stain-of-drink", pattern=r"(aṅgaṇ|kiliṭṭh|upakkiles|\bmal[aā]\b)", also=DRINK,
         exclude=r"maṅgal|mālā", bears_on="P5", note="stain predicated of drink? predicted ~0 as intrinsic"),
    dict(label="papa-akusala-of-drink", pattern=r"(pāpa|akusal)", also=DRINK, bears_on="P5-read",
         note="papa/akusala near drink - NONZERO; read whether predicated of LIQUID or of heedlessness"),
    # (c) affirmative contrast classes:
    dict(label="amagandha", pattern=r"āmagandh", bears_on="P5-contrast",
         note="Āmagandhasutta: taint = bad CONDUCT not substance; the canon's purity adjudication (snp2.2)"),
    dict(label="soceyya-scheme", pattern=r"soceyy", bears_on="P5-contrast",
         note="the purity scheme (an3.119/an10.176); confirm drink-precept content NOT in it"),

    # ---- positive control: the effect-test in the medicine ruling + the flesh-bar contrast ----
    dict(label="undetectability", pattern=r"na vaṇṇo na gandho na raso", bears_on="P5-control",
         note="telapāka: liquor permitted only where it can no longer intoxicate"),
    dict(label="lonasovira", pattern=r"(loṇasovīrak|sovīrak)", bears_on="P5-control",
         note="non-intoxicating ferment permitted; the line drawn by effect"),
    dict(label="majjalakkhana", pattern=r"majja.{0,4}lakkhaṇappatt|lakkhaṇappattāya\s+surāya", bears_on="P5-control",
         note="the offence is drinking surā THAT HAS REACHED the mark of an intoxicant (effect-gated)"),
    dict(label="flesh-bar", pattern=r"manussama[ṁṃ]s", bears_on="P5-contrast",
         note="categorical human-flesh bar (same Bhesajjakkhandhaka); NO undetectability carve-out -> asymmetry"),
]

LOCI = [
    "dn31", "pli-tv-bu-vb-pc51", "an8.39", "an5.179", "snp2.14", "snp2.2", "an3.119", "an10.176",
    "an3.39", "an5.81", "sn14.25", "kp2", "snp1.6",
    "cst-abh03m2.mul-014", "cst-vin02m2.mul-vin3_6",
    "cst-s0105t.nrf-60_p030", "cst-s0305a.att-sn5_12_p079", "cst-s0105t.nrf-75_p005",
    "cst-vin02a1.att-56_p002", "cst-vin02a1.att-56_p003", "cst-e0905n.nrf-084",
]


def main():
    results = {"_doc": "§2a instrumental-precept enumeration; deduped is_primary; count-lock samples included.",
               "drink_tie": DRINK, "six_drawbacks_union": SIX, "queries": [], "splits": [], "loci": []}
    for q in QUERIES:
        results["queries"].append(probe(**q))
    sys.stderr.write("\n--- splits ---\n")
    results["splits"].append(split_drink("pamadatthana-split", r"pamād[aā]ṭṭhān",
                                          bears_on="P1", note="dependency split: is pamādaṭṭhāna drink-only or a general idiom?"))
    sys.stderr.write("\n--- loci ---\n")
    for pid in LOCI:
        results["loci"].append(fetch_locus(pid))
    json.dump(results, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sys.stderr.write(f"\n[done] {len(results['queries'])} queries, {len(results['splits'])} splits, "
                     f"{len(results['loci'])} loci -> {OUT}\n")


if __name__ == "__main__":
    main()
