# Saṅkhāra across its three environments — position map, translation history, and what our corpus can settle

*Deep-research report (DR-4), 2026-06-25. The first `/deep-research` pass was gutted by API rate-limiting
(verified one source); this is the repaired version — four source-verified web agents + two corpus probes
against dhamma-pg. Every position is tied to a fetched source; deliverable (e) is answered against the
actual contents of the corpus. Probe scripts research/sankhara/probe.py + probe2.py were later removed by a
git clean; results below are preserved and the scripts are regenerable from the method described.*

## 0. Evidence base and confidence

| Source | How verified | Used for |
|---|---|---|
| Bodhi, *Connected Discourses* (CDB), Gen. Intro pp. 44–49; notes pp. 1071–72 | Primary — full PDF read | Position map, translation rationale |
| Bucknell, "Conditioned Arising Evolves," *JIABS* 22/2 (1999), pp. 311–342 | Primary — scan OCR'd | Bucknell position |
| Nyanaponika, *Abhidhamma Studies* (BPS) | Primary — PDF | Nyanaponika position |
| Hamilton, *Identity and Experience* (1996); *Early Buddhism* (2000) | Secondary-but-page-cited (Keown JBE 4 review + Piya Tan SD 17.6 + Jayarava) | Hamilton position |
| Brahmāli, "Understanding the Essence of Dependent Origination" (SC forum) | Secondary | Brahmāli position |
| Translator quotes (T.W. Rhys Davids DN 17; Horner MN 44; Sujato/Thanissaro rationales) | Primary / author's own words | Translation history |
| dhamma-pg corpus probes | Direct SQL via proxy | (d), (e), the (b) demonstration |

Two doctrinal corrections to flag up front:
- CDB lists **five** doctrinal contexts of saṅkhāra, not three (the "three" framing is Bodhi's popular Wheel #43 essay).
- The phrase is **"wider compass," not "wider range"** (CDB p. 45).

## 1. Position map — one concept or several, and is cetanā the shared core?

No one treats saṅkhāra as unrelated homonyms. The live disagreement is *where the unity sits* — in volition/cetanā (Bodhi–Sujato–Brahmāli) or in the active constructing function (Hamilton), with Bucknell declining the semantic question.

- **Bodhi** — one polyvalent word, varied renderings; active/passive duality of saṃ+karoti. **cetanā is the shared core, explicitly:** DO-link = "kammically active volitions"; aggregate = cha cetanākāyā, "all instances of volition and not only those that are kammically active"; aggregate "has a wider compass than the saṅkhārā of the dependent origination series" (CDB p.45). Does NOT extend cetanā to the passive "all conditioned things" sense.
- **Sujato** — one concept; core = intentional/ethical action = kamma ("choices"). "The idea that sankhārakkhandha includes a broad range of phenomena is entirely a product of Abhidhamma." Presses the breadth claim hardest.
- **Brahmāli** — shares Sujato's frame (kamma-producing activity tied to rebirth). CAVEAT: in the fetched source he does NOT himself write the cetanā equation; the "choices=kamma" partition is Sujato's, not provably Brahmāli's.
- **Nyanaponika** — khandha is the analytic home; cetanā a "most typical" general factor; DO-saṅkhārā = "kamma-formations." CAVEAT: the "widest/most heterogeneous aggregate" tagline is Bodhi's (CMA), not Nyanaponika's.
- **Hamilton** — unity is the active constructing / "formative principle," NOT bare Abhidhammic cetanā. saṅkhārā as 2nd link = "the individualising faculty or the formative principle" (1996 p.70); foregrounds abhisaṃkharoti. CAVEAT: the "wider compass / umbrella" line is Bodhi's; "most important/difficult khandha" superlative unverified.
- **Bucknell** — DECLINES the semantic question; renders neutrally "activities" (provisional). Thesis is structural-developmental (linear 12-link chain is a secondary regularization of an earlier branched form). saṅkhārā is NOT among his late-addition items. Citing him for "saṅkhāra's meaning varied across strata" over-reads him.

NET: near-consensus this is one concept with an active/passive polarity. Sharpest contest: **Bodhi/Sujato (cetanā is core; broad "conditioned things" sense secondary/Abhidhammic)** vs **Hamilton (core is the constructing function)**.

## 2. (a) Translation history of saṅkhāra, by translator

Arc: etymological glossing (Rhys Davids) → deliberate sense-splitting (Horner) → fixed single words defended as least-bad (Ñāṇamoli, Bodhi, Thanissaro, Sujato).

- **T.W. Rhys Davids** (1899–1910): "component things"/"compounds" (gloss "literally confections"). DN 17.
- **C.A.F. Rhys Davids**: "synergies"/"syntheses" (partial verify).
- **I.B. Horner** (1954–59): **splits by context** — "activities" (the triad) vs "habitual tendencies" (the khandha). MN 44. The one clear pre-computational case of a translator disambiguating.
- **Ñāṇamoli** (1956): "determinations" (Majjhima drafts) → "formations" (Vism, in practice; corpus shows 93/243 Vism saṅkhāra passages read "formations").
- **Bodhi** (2000–): "formations"/"volitional formations"; settled back from "determinations" ("colourless enough to take on the meaning from context"); rejected "activities" for DO to keep the connection to other contexts.
- **Thanissaro**: "fabrications" uniformly (incl. bodily/verbal/mental).
- **Sujato** (2018–): "choices" (DO/khandha) but "conditions" (the maxim) — encodes the active/passive split lexically.

Bodhi's catalogue of eleven renderings: formations, confections, activities, processes, forces, compounds, compositions, fabrications, determinations, synergies, constructions.

## 3. (b) "Translators import the wrong sense on identical text" — stated? tested? + corpus demonstration

Stated as a clean thesis: NO. Empirically tested: NO. Open ground (only forum-level partial statements exist).

**Corpus demonstration (the first concrete one).** On identical canonical maxim **Dhp 277 sabbe saṅkhārā aniccā**, three translators diverge by sense-family:
- Thanissaro: "All **fabrications** are inconstant" — active/constructing sense (his DO-word carried in).
- Sujato: "All **conditions** are impermanent" — passive/conditioned.
- Buddharakkhita: "All **conditioned things** are impermanent" — passive/conditioned.

Structural, not random: **Thanissaro uses "fabrications" uniformly** (DO link, aggregate, AND maxim — does not disambiguate); **Sujato disambiguates** ("choices" for DO/aggregate/triad, "conditions" for the maxim — his lexicon encodes Bodhi's active/passive split). Interpretive ceiling: Thanissaro would call it deliberate; the corpus shows divergence + (in)consistency, not correctness.

## 4. (c) Existing computational / lexical study — clean negative

No computational/WSD/collocation study of saṅkhāra exists. Nearest: Zigmond JOCBS (volume-level stylometry, no individual term); a WSD paper on Buddhist *Sanskrit* (wrong corpus); philological baselines (PED, Boisvert 1995, Hamilton 1996) are conceptual not quantitative. A translator-by-collocation-field study would be new.

## 5. (d) Collocation fields and loci (corpus-grounded; mula/own-text primary rows, incl. Vism as commentary)

| Field | Marker | Mula passages | Loci |
|---|---|---:|---|
| DO/kammic link | avijjāpaccayā saṅkhārā / saṅkhārapaccayā | 115 | SN 12.2, SN 12.46, Ud 1.1; triad sub-type AN 4.235 |
| Fourth aggregate | saṅkhārakkhandha | 113 | SN 22.48, SN 22.56/57 (cha cetanākāyā), SN 22.79, MN 109 |
| — aggregate enumeration | …saññā saṅkhārā viññāṇa… | 94 | the pañcakkhandha lists |
| Anicca-maxim | sabbe saṅkhārā aniccā/dukkhā | 34 | Dhp 277–278, Thag 15.1, SN 22.90 |
| kāya/vacī/citta triad | (kāya/vacī/citta/mano)saṅkhār | 175 | MN 44, SN 12.2, ānāpānasati, cessation-attainment |

Total footprint: 5,815 primary passages — 1,270 own-text (518 early-canonical, 83 late-canon, 303 Abhidhamma, 49 paracanon, 317 Vism), 1,937 aṭṭhakathā, 2,456 ṭīkā, 152 extra-canon.

## 6. (e) What a translator-by-collocation-field confusion matrix CAN and CANNOT settle

COVERAGE (binding constraint): 27 EN translators but lopsided — Sujato 4,693 rows, Ñāṇamoli 2,728 (mostly Vism), Thanissaro 844, Brahmāli 420, Bodhi 347, **Horner only 2**. Of 1,270 own-text saṅkhāra passages, only **178 carry ≥2 translators** (DO 21, triad 19, aggregate-enum 17, maxim 5, pure khandha 2).

Dominant-rendering signal (clean): Sujato → choice(s) 317/513 (+condit 8 = the maxim switch); Thanissaro → fabrication(s) 142/155; Ñāṇamoli(Vism) → formation(s) 93/243; Walshe → formations 14/18.

CAN settle: (1) each translator's dominant choice + consistency rate; (2) **whether a translator disambiguates by field** — corpus shows Sujato switches at the maxim, Thanissaro does not; (3) named cross-field sense-import exemplars (Thanissaro's "all fabrications are inconstant" on Dhp 277), valid where the locus is short enough that passage-co-occurrence = word alignment.

CANNOT settle: (1) no statistical power per cell (maxim n=5, pure khandha n=2 → demonstration matrix + exemplars, not inferential stats); (2) no word-level gold alignment for long suttas; (3) it is mostly a Sujato-vs-Thanissaro instrument + Ñāṇamoli for Vism — Bodhi (n=12) + Horner (n=2) too thin to place (so the corpus cannot reproduce Horner's documented context-splitting without ingesting his full SN/MN); (4) it cannot adjudicate correctness.

BOTTOM LINE: worth building as a per-translator consistency-and-disambiguation profile (novel — nothing like it exists), anchored by named exemplars on the maxim/DO loci. Single most valuable finding, already visible: **the two highest-coverage modern translators sit at opposite poles — Sujato lexicalises the active/passive split, Thanissaro collapses it** — which is the Bodhi-vs-broad-sense contest, now observable in translation behaviour.

## 7. Open questions / next moves
- Brahmāli's own voice on cetanā (his Dependent Origination series / Authenticity of the EBT).
- Hamilton "most important/difficult khandha" superlative — clean Identity and Experience pp.66-81.
- Ingest Bodhi's + Horner's full SN/MN to include the deliberate disambiguator (Horner) + fixed-word advocate (Bodhi).
- A real dhamma-research study is defensible: clean null (no prior computational work), enumerable dataset, sharp finding (Sujato-splits / Thanissaro-collapses).
- Regenerate research/sankhara/probe.py + probe2.py from the method above (deleted by a git clean; results preserved here).
