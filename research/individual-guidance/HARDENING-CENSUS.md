# The systematization trend: is the hardening multi-jump or one-jump?

*A stratum-distribution census testing whether the canon's function-language is hardened into
fixed essence at EVERY inter-stratum jump, or only at the famous sutta→commentary one. Built
2026-06-22 against the live corpus (194,710 rows). Method: fine 6-stratum count-harness (the
granularity rule), truncated stems (positives re-verifiable), technical compound not bare simplex.*

## Hypothesis

- **H1:** the function→essence hardening recurs at every jump (early → late-canonical → Abhidhamma →
  para-canonical → commentary → sub-commentary).
- **H0 (pre-committed null):** hardening is concentrated at one jump (sutta→commentary); other jumps
  show none; OR counter-currents (early canonical system + late softenings) are numerous enough that
  "universal" is false.

## The fine stratum code (work_slug → stratum)

- **1early** (early-canonical): pli-an/sn/mn/dn/vinaya + early Khuddaka (dhp, ud, iti, snp, thag, thig, kp)
- **2late** (late-canonical): ap, bv, cp, pv, vv, nd (Niddesa), **ps (Paṭisambhidāmagga)**, ja, kn
- **3abh** (abhidhamma-canonical): pli-abhidhamma (the 7 books)
- **4para** (para-canonical): ne (Netti), pe (Peṭakopadesa), mil (Milinda)
- **5comm** (classical-commentary): *-attha + pli-vism
- **6tika** (sub-commentary): *-tika

## The data (rows per stratum)

| transition (Pāli stem) | early | late | abh | para | comm | ṭīkā | jump → | verdict |
|---|--:|--:|--:|--:|--:|--:|---|---|
| jhāna factor-list (*jhānaṅga*) | 0 | 1 | **12** | 1 | 113 | 211 | early→**Abhidhamma** | support |
| change-of-lineage citta (*gotrabhū*) | 6 | 4 | **210** | 0 | 143 | 196 | early→**Abhidhamma** | support |
| one-pointedness universalized (*ekaggatā*) | 23 | 14 | **41** | 6 | 218 | 238 | early→**Abhidhamma** densify | support |
| progress-of-insight ladder (*udayabbaya/bhaṅga/saṅkhārupekkhā-ñāṇa*) | 0 | 2–4 | 0 | 0 | 30–83 | 71–93 | **late(Paṭis)→commentary** | support |
| temperament compound (*rāgacarita*) | 0 | 12 | 0 | 9 | 58 | 43 | late/para→commentary | support |
| design vocab (*āsayānusaya / veneyya*) | 0 | ~11 | 0 | ~1 | ~140 | ~170 | late→commentary | support |
| access/absorption tiers (*upacāra/appanā-samādhi*) | 0 | 0 | 0 | 0 | 64 | 48 | canon→commentary (skips Abh) | support |
| the forty subjects (*kammaṭṭhāna*) | 12 | 1 | 0 | 1 | 1207 | 792 | canon→commentary | support |
| three vehicles (*samatha/vipassanā/sukkha-yānika*) | 0 | 0 | 0 | 0 | 78 | 104 | canon→commentary | support |
| seven purifications architecture (*sattavisuddhi*) | 0 | 0 | 0 | 0 | 4 | 9 | canon→commentary | support |
| definitional formula (*lakkhaṇa-rasa-paccupaṭṭhāna*) | 0–2 | 0–6 | 0 | 0–2 | 26–308 | 28–368 | canon→commentary | support |
| basis-jhāna (*pādaka-jjhāna*) | 0 | 0 | 0 | 0 | 131 | 134 | canon→commentary | support |
| kasiṇa disc + counterpart-sign (*paṭibhāga-nimitta*) | 0 | 0 | 0 | 0 | 38 | 117 | canon→commentary→ṭīkā | support |
| design-noun (*ajjhāsaya*) | 4 | 17 | 0 | 4 | 709 | 679 | canon→commentary | support |
| own-nature (*sabhāva*) | 6 | 42 | 5 | 29 | 2004 | **4406** | **every jump, peaks ṭīkā** | support |
| heart-blood temperament physiology (Vibh-a §70.58) | — | — | — | — | qual. | qual. | commentary→**sub-commentary** | support (qual.) |
| — STRAYS — | | | | | | | | |
| declared person-difference (*puggalavemattatā*) | **15** | 1 | 0 | 0 | 4 | 2 | INVERSE: peaks early, fades late | **stray** |
| present-root sort carried verbatim (Yamaka *saragaṃ cittaṁ*) | (canon) | 2 | 12 | 0 | 4 | 5 | early→Abh = PRESERVATION | **stray** |
| seven noble persons / four learners | (fully built, early, Buddha-voiced) | | | | | | early system | **stray** |
| *anusaya* (closed list already in canon) | (canon) | | | | | | non-transition | **stray** |
| Vism disowns its diagnostic (*na sārato paccetabbaṃ*) | — | — | — | — | self | — | LATE REGRESSION | **stray** |
| eight functional *cariyā* preserved at Paṭis hinge | — | (Paṭis) | — | — | — | — | non-monotonic preservation | **stray** |

Recall caveats: *saragaṃ cittaṁ* early=0 is an artifact (the canonical refrain inserts *vā*: "sarāgaṃ
vā cittaṃ"), so the early refrain is present but not contiguous-matched; this cell is preservation, not
absence. Heart-blood physiology is a single vivid Vibhaṅga-aṭṭhakathā/ṭīkā passage, not a distributed
countable term (absence of a term-count ≠ absence of the passage).

## The count

Of ~27 distinct transitions: **~17 support** a jump-localized hardening · **~8 stray** (early system /
preservation / regression / inverse) · **~2 mixed** (16-step ānāpāna, the Abhidhamma mātikā: canonical
content given a late meta-label / sorting-structure). ≈ **63% clean support, 70% if mixed counts.**

Crucially, the supports land at **four distinct jumps**, not one:
1. **early-canonical → Abhidhamma** — *jhānaṅga* (0→12), *gotrabhū* (6→210), *ekaggatā* universalized.
2. **late-canonical → commentary** (the Paṭisambhidāmagga as seedbed) — the progress-of-insight *ñāṇa*
   ladder; *carita*'s temperament-sense (Cūḷaniddesa).
3. **canon → commentary** (the bulk) — the concentration tiers, the forty *kammaṭṭhāna*, the vehicles,
   the seven-purification architecture, the definitional formula, the kasiṇa disc.
4. **commentary → sub-commentary** — *sabhāva* nearly doubles again (2004→4406); the heart-blood
   physiology; *jhānaṅga* / nimitta / definitional formula all densify further. **The latest layer
   hardens the hardest.**

## Verdict

H1 is **substantially supported but not universal**, and H0 is **partly true**. The systematization is
genuinely **multi-jump** (operator's core intuition confirmed: it is NOT confined to the famous
sutta→commentary leap), with the Abhidhamma and the sub-commentary each hardening real things. But it
is **not a monotonic law**: the canon already carries fully-built systematic typologies, later layers
sometimes preserve the function-reading unchanged, the commentary occasionally walks its own
systematization back, and at least one signature (*puggalavemattatā*) runs the other way. The honest
shape is **a strong multi-jump hardening trend against a backdrop of early canonical system and
occasional late preservation/regression** — which is exactly the body's §VII "divergence / addition /
regression" trichotomy, now quantified and jump-localized.
