# Research-expansion slate — 2026-06-24

*Output of a 72-agent sweep (12 domain finders → consolidate → per-candidate method-design + adversarial
skeptic → ranked synthesis; 65 raw candidates, 29 distinct, 25 survived, 5.2M tokens). Goal: groundbreaking
open problems in early-Buddhist / Pali studies that OUR corpus (Pali text + parallels graph + multi-translator
table + dictionaries + embeddings) has a real chance of MOVING. Internal doc; em-dashes allowed here.*

## The honest ceiling (read this first)

Every top study graded **groundbreaking = medium**, not high. That is not pessimism, it is the structural
truth of our toolkit:

- The field's *great* disputes are either (a) **interpretive/phenomenological** (what jhana *is*, whether
  anatta is ontological) — a distribution cannot adjudicate them — or (b) **redactional**, needing
  **foreign-language parallel TEXT** (Pali-vs-Chinese content comparison) which we do NOT hold (we have the
  parallels *graph* only, `parallel_have=false` for lzh/san).
- What we CAN do, and what nobody else has, is give these disputes their **first quantitative measurement**:
  per-character density of a contested sense-lexicon across the 6 strata, and translator-disagreement maps.
  We turn "X is common / late / amplified" (asserted for decades) into a measured number with controls.

**The one move that breaks the ceiling into "high":** ingest the **foreign-language parallel text** SuttaCentral
already publishes (Chinese Agamas etc. in sc-data/bilara-data). The parallel IDs are already in
`passage_parallels`; BGE-M3 is multilingual, so cross-lingual Pali↔Chinese semantic comparison is feasible
*without* translation. That converts the entire structural-parallels lane (ranks 4, 10, 11) into content-level
comparative philology — Analayo's whole method, at corpus scale. This is the highest-leverage capability
investment on the board and is logged as its own candidate below.

## The recurring shapes (how to read the 12)

1. **Gloss/sense-shift dating** — when did the *technical* reading of a contested term crystallize, by
   per-character density across strata. Ranks 1 (vitakka), 6 (abhinna narrowing), 7 (sabhava realist drift).
   Exercises the program's core canon-vs-commentary machinery on doctrinally load-bearing words.
2. **Translator-divergence** — measure how expert translators disagree on a contested word = a map of
   interpretive contestation, on the English side, fully in-hand. Ranks 8 (sati), 9 (sankhara), a lane in 3
   (anatta). The most *distinctive* lane: it uses the multi-translator table few others have assembled.
3. **Parallels-graph structural** — exploit our unique asset honestly (structure, not content). Ranks 4
   (commentarial load vs parallel density), 10 (relation-type stratigraphy), 11 (coverage cartography).
4. **Abhidhamma/scholastic read-back** — rank 2 (matika grid imported into matika-poor suttas).
5. **Construction census** — rank 3 (anatta predicative vs existential), measuring an asserted distribution.
6. **Orality** — rank 5 (unsupervised corpus-wide pericope-reuse budget).

## Top 12 (ranked)

| # | Study | Shape | Data | Tract. | The open dispute it measures |
|---|---|---|---|---|---|
| 1 | Vitakka/vicara gloss-shift: dating the "application" (abhiniropana) reading | gloss-shift | in-hand | 4 | discursive thinking (suttas) vs technical mental-application (commentary); the move that seals first jhana into absorption. Sujato/Brahm vs Thanissaro vs Bucknell/Polak |
| 2 | Matika read-back: does commentary re-describe matika-poor suttas through the Abhidhamma grid | read-back | partial-gap | 4 | Hamilton (cross-classification "only in the Abhidhamma") vs Heim (principled naya) vs continuity |
| 3 | Anatta predicative not-self vs existential no-self: construction census | census | in-hand | 4 | Wynne's distributional leg ("predicative common, existential late") — asserted, never measured |
| 4 | Commentarial load vs cross-tradition parallel density | parallels | partial-gap | 4 | does exegesis concentrate on shared (important) or parallel-poor (distinctive) suttas? Never measured |
| 5 | Formulaic budget: unsupervised per-character pericope-reuse map + Digha-distinctiveness | orality | in-hand | 4 | Allon (fixed verbatim) vs Shulman (literary) vs Cousins (oral-performative); Manne's Digha-as-propaganda |
| 6 | Where the supernatural lives: iddhi/abhinna density + dating the fixed six-abhinna list | gloss-shift | in-hand | 5 | Fiordalis/Analayo (miracle set-pieces late/commentarial) vs Gethin/Clough (integral); PED's uncounted "9 times in 10" narrowing |
| 7 | Sabhava realist-drift seam: does the realist frame crystallize at the commentary boundary | gloss-shift | in-hand | 4 | Ronkin (atthakatha crystallization) vs Karunadasa vs Harvey; + the novel comm→tika gradient |
| 8 | Sati translator-drift: memory→mindfulness at the translator boundary | translator | in-hand | 4 | the single most consequential word-dispute in modern Buddhism (Levman/Analayo/Sharf/Gethin) |
| 9 | Sankhara translator sense-import: wrong sense on identical collocations | translator | in-hand | 4 | DO-link vs khandha breadth (Brahmali/Bodhi); "translators import the wrong sense" made measurable |
| 10 | Relation-type stratigraphy: parallel-type mix by collection, length-controlled | parallels | in-hand | 4 | Manne (Digha embellished) vs Allon; uses relation_type (edge label, escapes the stratum-by-construction trap) |
| 11 | Parallel-coverage cartography: decompose the inherited stratification | parallels | in-hand | 4 | Sujato/Brahmali (attestation tracks antiquity) vs Schopen (can't project back); PLI-only control is the headline |
| 12 | Theravada self-label: vada-sense collocation profile across strata | census | in-hand | 5 | Gethin/Skilling (school-sense modern) vs Analayo (vada = doctrine not school) |

### Standouts (my read)
- **Best novelty×fit: the translator-divergence lane (8, 9, + anatta's lane in 3).** Genuinely under-explored
  in the field, fully in-hand, and it uses an asset (the multi-translator table) almost no one else has built.
  A "where do the experts most disagree, and is the disagreement generationally ordered" map across the whole
  contested lexicon would be a distinctive, citable contribution and a natural *cluster* (like cosmology was).
- **Best single study: #1 (vitakka).** Cleanest exercise of the house machinery on a dispute that is still
  being rebutted point-by-point in 2024, with a strong negative control (piti must stay flat).
- **Highest strategic value: the foreign-text ingest** (see "ceiling" above) — unlocks ranks 4/10/11 to "high".

## Honorable mentions (real, parked — reshape notes preserved)

1. **Three-life paticcasamuppada** — reshaped to "does commentary amplify the rebirth-literal gloss-lean +
   translator divergence"; but the headline prong is pre-conceded by all sides (Bodhi: "expository device").
   Park behind #1 (same machinery, less circularity).
2. **Antarabhava (in-between state)** — salvageable slice is the gandhabba sense-split (transition-being vs
   musician) across strata; the rest is published (Analayo, Bodhi n65) or close-reading. Scope a tight
   standalone around gandhabba if pursued.
3. **Past-Buddhas roster diffusion** — accretion direction is flat consensus; the one structural test rests on
   a FALSE premise (Dipankara/Sumedha is parallel-RICH, not local). Descriptive register study only.
4. **Dhammata birth-template (DN14 vs MN123)** — skeptic caught a factual error (they do NOT share the stamp;
   MN123 is first-person eyewitness). Reshaped to "two registers, one marvel-set"; overlaps #5.
5. **Continuity-vehicle vinnana (substance vs process) + translator reification** — real Harvey-vs-Collins
   axis but lives in a handful of rare passages where a frequency census is silent; overlaps 8/9 machinery.
6. **Garudhamma reception/read-back** — the live interpolation case is content/cross-recension (out of reach);
   reshaped reception study sits beside the philology, not on it. High stakes, over-reading dangerous.
7. **Deva-encounter register vs cosmological-coordinate vocabulary** — sound and novel; parked on portfolio
   grounds (overlaps the seeded cosmology lane + heteronym `deva`). Strong backup if a slot opens.
8. **Hell/heaven elaboration curve (anchored to MN130)** — growth direction settled; headline signal likely
   an ASCII-regex artifact (misses samsara). Lemma-resolve first; becomes a clean confirmatory inventory.
9. **Human vs superhuman Buddha (Gombrich apotheosis), within-mula** — Analayo already established it by
   comparative philology (the method we can't run); within-mula version is corroboration, not adjudication.
10. **32 marks (mahapurisa-lakkhana)** — Brahmanical origin settled; salvageable bits are the lakkhana
    polysemy-contamination number + spatial disjointness of condemnation vs dramatization. Low-medium.

## Cut (killed by the skeptic — proof the vetting bit)

- **sukkhavipassaka / "dry insight" as commentarial coinage** — settled by the candidate's OWN authorities
  (Nanamoli, Bodhi); Wen's PhD already did the per-stratum count. The open part (was jhana required) is the
  absence-of-term/concept gap we cannot cross.
- **brahmana out-group slur vs prestige term (McGovern vs Gombrich)** — the live axis is cognitive STANCE,
  adjudicated by cross-recension comparison the no-foreign-text rule forbids.
- **Atthakavagga lexical anomaly** — category error: the AV debate is about cognitive ATTITUDE toward ditthi,
  not lexical absence of scholastic terms; a depleted profile fits both sides. DPD already ships a stratified
  frequency tool.
- **citta/mano/vinnana synonymy vs distinction (SN12.61)** — inverts the scholarly state (the distinction
  reading IS consensus) and Johansson (1965) already did the distributional survey of 240+ passages.

## Recommended launch order
1. **#1 vitakka** (cleanest house-machinery study) as the first new build.
2. **The translator-divergence cluster** (#8 sati + #9 sankhara + anatta's lane) as a coordinated workstream,
   the way cosmology was a cluster — this is our most distinctive lane.
3. In parallel, scope the **foreign-text ingest** decision (it gates the high-groundbreaking comparative tier).

Promote a chosen row to `PREREG_<slug>_seed.md` per the program workflow when ready to kick off.
