# ITEM 2 — the Khuddaka `pli-kn` slug: investigation, decision, and corrections

*2026-06-22. Resolves the peer-review "Khuddaka-slug bucketing artifact (major, methodological)".
Artifact: `KN-STRATUM-MAP.json` (the frozen per-id disposition). Re-run: `COSMOLOGY-COUNTS-FIXED.json`
(`run_cosmology.py --case fixed`).*

## What `pli-kn` actually is

`pli-kn` holds **267 rows** that span the **entire Khuddaka Nikāya**, ingested from the CST recension
under one catch-all slug, keyed by CST e-number `cst-s0501m`…`cst-s0520m` (SuttaCentral tags kn1–kn20):

| kn | CST | work | stratum | dedicated slug that also holds it |
|---|---|---|---|---|
| 1 | s0501 | Khuddakapāṭha | early | pli-kp |
| 2 | s0502 | Dhammapada | early | pli-dhp |
| 3 | s0503 | Udāna | early | pli-ud |
| 4 | s0504 | Itivuttaka | early | pli-iti |
| 5 | s0505 | Suttanipāta | early | pli-snp |
| 6 | s0506 | Vimānavatthu | late | pli-vv |
| 7 | s0507 | Petavatthu | late | pli-pv |
| 8 | s0508 | Theragāthā | early | pli-thag |
| 9 | s0509 | Therīgāthā | early | pli-thig |
| 10 | s0510 | Apadāna | late | pli-ap |
| 11–12 | s0510m2/s0511 | Buddhavaṃsa | late | pli-bv |
| 13 | s0512 | Cariyāpiṭaka | late | pli-cp |
| 14–16 | s0513/s0514/s0515/s0516 | Mahā/Cūḷaniddesa | late | pli-nd |
| 17 | s0517 | Paṭisambhidāmagga | late | pli-ps |
| 18 | s0518 | Milindapañha | para | pli-mil |
| 19 | s0519 | Nettippakaraṇa | para | pli-ne |
| 20 | s0520 | Peṭakopadesa | para | pli-pe |

So `pli-kn` is a **coarse CST re-ingest of the whole Khuddaka**, and **every sub-work it holds is also
ingested under a dedicated slug**. This is the double-ingest the peer review flagged. It was verified
concretely on the temperament compound: the `pli-kn` carita rows (cst-s0515m kn15 Tuvaṭaka/Sāriputta
niddesa, kn16 Pārāyana niddesa, kn18 Milinda, kn19 Netti, kn20 Peṭaka) are the **same passages** as the
dedicated-slug rows `cnd19` / `mnd14` / `mnd16` (pli-nd), `ne21/36/37` (pli-ne), `pe2/7/8` (pli-pe),
`mil4.2/4.3` (pli-mil).

## The bug, and the constraint

The fine 6-stratum CASE put all 267 `pli-kn` rows in **2late**. That mixed strata two ways:
- **95** of the 267 are the **early** Khuddaka (Khp/Dhp/Ud/Iti/Snp/Thag/Thig) — early content miscounted
  as late-canonical.
- **172** are late/para content (Apadāna…Peṭakopadesa) that is **also** counted under its own slug —
  a double-count within (or across) the late and para strata.

The handoff asked to re-bucket "by sub-work … **without double-counting**". Because `pli-kn` is fully
duplicated by the dedicated slugs, re-bucketing its rows into 1early/2late/4para would **double-count**
every one of them against the dedicated slug. The only way to honour "without double-counting" is to
**exclude `pli-kn`** from the stratum analysis: each Khuddaka row is then counted **once**, via its
dedicated slug, at its correct stratum.

## The decision (frozen)

`KN-STRATUM-MAP.json` maps each of the 267 `pli-kn` ids to `1early-dup` (95), `2late-dup` (150), or
`4para-dup` (22) — its correct sub-work stratum, with the `-dup` marker meaning "excluded as a duplicate".
`run_cosmology.py --case fixed` loads the map, re-labels those rows, and drops them from the seven counted
strata.

## Effect on the cosmology census (re-ran, diffed)

`COSMOLOGY-COUNTS-FIXED.json` vs the baseline: **only the 2late column changes**, dropping by exactly the
`pli-kn` contribution (e.g. yojana 203→101, avīc 122→63, ussada 67→29). **1early, 3abh, 4para, 5comm, and
6tika are untouched.** No zero-vs-present headline moves: every compound support is still 0 in 1early; every
counter is still present early. Five terms drop 2late 1→0 (parittadīpa, antarakappa, pamāṇavemattaṃ,
asīti-anubyañjana, avīcimahāniraya); each is a single Milinda/Peṭaka row that survives in 4para via its
dedicated slug, so the term's verdict is unchanged (and several supports get cleaner). The census verdicts
in `COSMOLOGY-CENSUS.md` stand as written; the table's 2late column is the pre-dedup (fine) measurement,
with the de-duplicated magnitudes in `COSMOLOGY-COUNTS-FIXED.json`.

## Effect on the persons-domain paper (corrected)

- **carita temperament compound.** The recall-ladder count of **fifty-three** mula rows double-counted the
  Khuddaka: it listed the `pli-kn` lump (the "ten analytical Khuddaka") **and** the same works under their
  own slugs (the Niddesa, Nettippakaraṇa, Peṭakopadesa, Milindapañha, Paṭisambhidāmagga). Counting each row
  once gives **forty-three** mula rows (30 Visuddhimagga + 4 Netti + 3 Niddesa + 3 Peṭaka + 2 Milinda + 1
  Paṭis), still **zero in the four Nikāyas and zero in the Abhidhamma**. A fresh reproducible stem-count
  (`(rāga|dosa|moha|vitakka|saddhā|ñāṇa)carit`, mula, excluding `pli-kn` and the extra-canonical works)
  returns 41 with 29 Visuddhimagga; the ~2-row gap is stem disambiguation, not the de-dup. **Headline
  unchanged.** Corrected in §V of `FINDINGS-readable.md` + `ResearchView.jsx` (53→43; kammaṭṭhāna 148→147,
  one `pli-kn` dup row). `FINDINGS-v2.md`'s recall-ladder breakdown carries the old 53 and is reconciled in
  ITEM 3 (it is the carita-framing reconciliation target).
- **sabhāva.** The HARDENING-CENSUS 2late cell (42) included `pli-kn`=24; de-duplicated it is **18**. The
  paper does not cite the sabhāva 2late magnitude (it cites canon ≈ 0 and the commentary thousands, both
  unaffected), so only the `HARDENING-CENSUS.md` table is corrected.
- **ajjhāsaya / āsayānusaya / veneyya / upacāra-samādhi.** `pli-kn` contributes only to their 2late cells,
  which the paper does not cite (it cites the canon and aṭṭhakathā figures). No paper number changes.

## Reproduce

```
python research/individual-guidance/run_cosmology.py             # baseline (fine CASE, pli-kn in 2late)
python research/individual-guidance/run_cosmology.py --case fixed # pli-kn excluded via KN-STRATUM-MAP.json
```
