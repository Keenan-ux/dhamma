# §2a — the instrumental-precept / circularity corpus analysis — internal log

Internal record for the §2a empirical core (the textual anchor for the circularity argument).
Unregulated internal prose (em-dashes allowed; this is NOT the paper). Predictions were frozen in
`PREREG-instrumental.md` before the run; this log scores them verbatim. Data artifact:
`_instrumental_evidence.json` (every count carries its pattern + a count-lock sample of full rows read).
Runners: `_run_instrumental.py`, `_run_instrumental2.py`, `_probe_diacritics.py` (one connection, serial).

## Posture

§2a is the one piece of genuinely new empirical work for the combined study. It tests whether the fifth
precept is **instrumentally** grounded (it guards the other four by guarding against the heedlessness that
breaks them; the wrongness of a substance is contingent on its intoxicating effect) versus **intrinsically**
grounded (the substance is a purity-taboo, wrong in itself). If instrumental, the circularity diagnosis has
canonical footing: to condemn a substance "as an intoxicant" while the effect-cascade does not obtain assumes
the conclusion. Outcome: instrumental thesis CONFIRMED on all five predictions, with a sharper structural
finding than predicted (the canon's own two-register categorization).

## Foundation (locked before the run)

- Diacritic convention: `passages.original` stores FULL diacritics; patterns are PG `~*` POSIX with real
  Unicode. The v2 handoff's ASCII forms (e.g. `'%pamadatthan%'`) were log shorthand; `~* 'pamadatthan'` -> 0,
  `~* 'pamādaṭṭhān'` -> 205. Niggahita splits by id scheme: SuttaCentral ids store ṁ (candrabindu), CST ids
  store ṃ (anusvāra); every enumerand pattern uses the class `[ṁṃ]`.
- Regression gate GREEN: v2 cluster substrings reconcile live (meraya 279, majja 1455, surā 926, union 2115);
  pamādaṭṭhān 205, madanīy 64; the open-list keystone is exactly 2 rows, both commentarial. Deduped
  denominators reconcile against DEDUPED-DENOMINATORS.json (1early 13.096 … 6tika 28.358). Corpus 194,710 /
  192,945 is_primary.
- Drink tie (for general-term co-occurrence): intoxicant-specific tokens
  `(meraya|surā|majja[ṃṁ]|majjap|majje[\s,.]|madirā|pānānuyog|surāpān|telapāk|madhupān|vāruṇī)`, which avoids
  the majja false-friends (majjha/majjana/miñja). NEW TRAP found and logged: `surā` leaks into `asura` /
  `asurinda` mid-word (the deva-noise the v2 purge already flagged for substring counts, here re-confirmed in
  co-occurrence ties — it accounts for several of the P5 impurity-of-drink false positives).

## SQL ledger + count-lock sense-reads (per prediction)

### P1 — consequential / instrumental rationale dominant — PASS (strong)

- pamādaṭṭhāna dependency split (`pamād[aā]ṭṭhān`, is_primary 150): with-drink 117, **without-drink 33**.
  Read the 33: pamādaṭṭhāna is a PRODUCTIVE idiom, not a drink-word — `jūta-ppamādaṭṭhāna` (gambling, dn1/dn2),
  `senāsanaṃ pamādaṭṭhānaṃ` (a fine lodging), `rajjaṃ … pamādaṭṭhānaṃ` (kingship; Māra's temptation). The
  commentary glosses the form itself: *"Pamādo ettha tiṭṭhatīti pamādaṭṭhānaṃ"* ("heedlessness stands here,
  hence occasion-of-heedlessness", cst-s0101a.att-dn1_1_p251) and gives the rationale in the ablative —
  *"majjavaṇijjā pamādaṭṭhānato"* (trade in drink is avoided *because* it is an occasion of heedlessness,
  cst-s0403t.tik-an5_p313). So the precept condemns drink AS a pamādaṭṭhāna; drink is one instance of a general
  consequential category.
- dn31 (early-canonical, read in full): drink is FIRST among the six `bhogānaṁ apāyamukhāni` (drains on
  wealth): *"Surāmerayamajjappamādaṭṭhānānuyogo … bhogānaṁ apāyamukhaṁ"*. The six `ādīnavā` of drink, verbatim:
  *sandiṭṭhikā dhanajāni · kalahappavaḍḍhanī · rogānaṁ āyatanaṁ · akittisañjananī · kopīnanidaṁsanī · paññāya
  dubbalikaraṇī* — all six consequential harms.
- adīnava-of-drink 42 (canon 17); apāyamukh 29 (canon 6); six-drawbacks-union 32 (canon 5 / comm 26 — the
  commentary restates the drawbacks). No intrinsic-impurity register anywhere in the consequential frame.

### P2 — faculty / wisdom-weakening is the operative harm, canonical — PASS

- `paññāya dubbalikaraṇī` ("weakening of wisdom") is the culminating sixth `ādīnava` of dn31 (canonical). The
  exact phrase is RARE as a string (panna-dubbala 2 rows; reported honestly), but it is the named terminal harm
  at the load-bearing locus, echoed by `cittamohanī` ("confuses the mind", an5.179; cittamohan 1 row, that
  sutta) and `ummādana` ("ends in madness", snp2.14; ummādan 39). The named harm is to the cognitive faculty,
  not to ritual status. This is the bridge to the science (faculty degradation) and the path-distinction.

### P3 — instrumental mechanism exists; explicit "guards the four" is commentarial — PASS (both legs)

- Existence (canonical seed): snp2.14 Dhammikasutta (early-canonical) carries the verse *"madā hi pāpāni
  karonti"* ("for the intoxicated do evil deeds"); the seed is canonical (1 early + 1 late mūla row).
- The drink × other-precept co-occurrences are HIGH (killing 205, lying 143, sexual 118, stealing 103) but the
  count-lock read shows they are **pañcasīla list-enumeration**, NOT causal: an9.63/an9.83 `sikkhādubbalya`
  (the five trainings-weakened), the five-vice agentive `surāmerayamajjapamādaṭṭhāyī`, the five `vera`/
  `veramaṇī`. The explicit heedless-then-acts bigram near drink (`pamatto … karoti/āpajjati`) = **0**. So the
  canon does not carry an explicit "drunk → kills/steals" causal formula; it carries the seed + the structural
  register-split.
- Provenance (explicit architecture = commentarial): cst-s0505a.att-31_p031 (Khuddakapāṭha-aṭṭhakathā /
  Paramatthajotikā on the Dhammika verse, classical-commentary) states it outright: *"majjapānameva
  saṃkilesakarañca **bhedakarañca** [of the preceding precepts] dassetvā … 'madā hi pāpāni karontī'ti … pāpāni
  karontīti **pāṇātipātādīni sabbākusalāni karonti**"* ("intoxication is precisely what defiles and BREAKS the
  preceding precepts … 'do evil deeds' means they do killing and ALL the unwholesome"). The narrative exemplum
  is the Kumbha Jātaka (ja512, the origin-of-liquor story). Pre-committed direction confirmed: the canon seeds
  it, the commentary states the precept-guards-the-precepts architecture explicitly.

### P4 — other-protection / gift framing, early-canonical — PASS

- an8.39 Abhisanda (read): abstaining from each precept gives *"aparimāṇānaṁ sattānaṁ abhayaṁ deti averaṁ deti
  abyābajjhaṁ deti"* (to immeasurable beings, freedom from fear, enmity, affliction) — a `mahādāna`. The
  precept's value is other-directed safety, instrumental and relational.
- Self-purification NEGATIVE leg: self-purification-drink 70 (canon 36). Read: ALL incidental — `visuddh` is
  the divine eye (`dibbena cakkhunā visuddhena`, dn14/dn23/mn12…), the jhāna mind (`parisuddhe pariyodāte`,
  mn94), recitation purity (pvr17), purification-of-beings (mn51). NONE frames abstaining-from-drink as the
  drinker's bodily/ritual self-purification. The precept is not a self-purity status.

### P5 — STRUCTURED ABSENCE: drink is never an intrinsic impurity independent of effect — PASS (strong)

- Expected-present pass (the rival impurity vocabulary IS in the corpus): asuci/amedhya 545 (canon 102);
  stain (aṅgaṇa/kiliṭṭha/upakkilesa/malina) 3462 (canon 383). So an absence near drink is a patterned boundary.
- The absence: impurity-of-drink 31 (canon 18); stain-of-drink 57 (canon 19). **Read every canon row: ZERO
  predicate impurity OF the drink.** They are co-occurrence false positives — `asuci`/`amedhya` of the body/
  corpse/excrement (dn30 marks-of-a-great-man, dn23 Pāyāsi's cesspit, mn129 hells, an8.19 "the ocean tolerates
  no dead body") + the `surā`→`asura/asurinda` leak (an8.19 Pahārāda the asura-lord). papa-akusala-of-drink 221:
  read — `pāpa`/`akusal` is predicated of the PERSON/conduct (dhp235-255 *"pāpadhammā … mūlaṁ khaṇati attano"*,
  the addict "digs up his own root"), never of the liquid as intrinsically impure.
- Contrast classes (affirmative, the canon's own purity adjudication):
  1. **Āmagandhasutta (snp2.2)** — the canon EXPLICITLY rejects substance-purity-taboo: *"Pāṇātipāto …
     theyyaṁ musāvādo … paradārasevanā, esāmagandho **na hi maṁsabhojanaṁ**"* (killing, theft, lying, adultery
     — THIS is taint, not the eating of meat). Taint = conduct, not substance. `asuci` there is predicated of
     the greed (*rasesu giddhā asucibhāvamassitā*), not the food.
  2. **The soceyya / kammapatha purity scheme (an10.176 Cunda; an3.119 kammanta)** — the Buddha reframes
     `soceyya` (purity) away from ritual washing into the tenfold `kammapatha`. The content of the OTHER FOUR
     precepts is present (killing/stealing/sexual under bodily purity; lying under verbal), but **drink is
     structurally ABSENT** from the kammapatha. Confirmed by SQL: kammapath 585 total, only 25 co-occur with
     drink, and reading shows drink is never a member, only nearby; the standard dasakammapatha never lists
     surāmeraya.
  3. **dn31's own split** — the four other precepts are `cattāro kammakilesā` (defiled actions, intrinsic
     wrong); drink is a `bhogānaṁ apāyamukhaṁ` (a drain on wealth, consequential). Same two-register
     categorization as the soceyya scheme.
- Positive control (effect-gating in the rule itself): telapāka (cst-vin02m2.mul-vin3_6) permits liquor in a
  decoction ONLY where *"majjassa na vaṇṇo na gandho na raso paññāyati"* (colour/smell/taste undetectable),
  i.e. only where it can no longer intoxicate; over-strength batches forbidden, re-designated for external
  rubbing. And the Pc 51 permutations: offence on `majje` (the intoxicant) regardless of perception, NON-offence
  for *"amajjañca hoti majjavaṇṇaṁ majjagandhaṁ majjarasaṁ taṁ pivati"* (it is NOT an intoxicant but has the
  colour/smell/taste of one). Permission/prohibition track the EFFECT (can-it-intoxicate), never the substance
  as such. If the prohibition were a purity-taboo, no de-intoxication would license the liquid. (Secondary
  contrast: the categorical `manussamaṃsa` bar in the same Bhesajjakkhandhaka, pli-tv-kd6, has no
  undetectability carve-out — barred for being human, a different reason; noted lightly, not leaned on.)

## The Sāgata nidāna (P1, the rule's consequential origin)

pli-tv-bu-vb-pc51 (read): Sāgata, a monk of the five higher knowledges (`pañcābhiñña`), subdues the
fire-dragon at Ambatittha with his own `tejodhātu`. Honored by the townsfolk, he drinks `kāpotikā pasannā`
(clear liquor; commentary: `surāmaṇḍa`), gets drunk, lies senseless. The Buddha's verdict (Sp,
cst-vin02a1.att-56_p002): *"pañcābhiññassa sato majjapānaṃ nāma na anucchaviyaṃ"* (for one of the five higher
knowledges, drinking intoxicants is unsuitable). The rule's origin is consequential — drink reduced a master
of psychic power to a heap — not a declaration of the liquid's impurity.

## Scoring (verbatim against the frozen pre-registration)

| Prediction | Verdict | Decisive evidence |
|---|---|---|
| P1 consequential/instrumental dominant | **PASS (strong)** | pamādaṭṭhāna productive idiom + ablative rationale; dn31 six ādīnava + apāyamukha-first; apāyamukha/kammakilesā register-split; no impurity register |
| P2 faculty/wisdom-weakening, canonical | **PASS** | paññāya dubbalikaraṇī the sixth ādīnava (dn31); cittamohanī (an5.179); ummādana (snp2.14). Exact phrase rare — disclosed |
| P3 instrumental mechanism; explicit arch. commentarial | **PASS (both legs)** | canonical seed `madā hi pāpāni karonti` (snp2.14); the explicit "breaks the other precepts → all akusala" is commentarial (cst-s0505a.att-31_p031); Kumbha Jātaka (ja512). `pamatto-does`=0 canonically |
| P4 other-protection/gift, early-canonical | **PASS** | an8.39 mahādāna (abhaya/avera/abyābajjha); self-purification negative leg confirmed (70 incidental, 0 self-purity) |
| P5 no intrinsic impurity (structured absence) | **PASS (strong)** | 0 canon rows predicate impurity OF drink (31/57 co-occurrences all false-positive, read); Āmagandha + soceyya/kammapatha exclusion + telapāka/majje effect-gating contrast classes |

## The sharp finding (the contribution, beyond the prediction)

The thesis predicted "consequential, not purity-taboo." The corpus delivers something more precise and more
load-bearing for the circularity argument: **the canon itself categorizes the fifth precept in a different
register from the other four.** The other four are `kammakilesā` / members of the `dasakammapatha` / `soceyya`
(intrinsic defiled action, the purity scheme); drink is `pamādaṭṭhāna` / `apāyamukha` (an occasion of
heedlessness, a drain on wealth). The fifth precept is structurally instrumental in the canon's own taxonomy,
not merely "described consequentially." The explicit statement that intoxication *therefore* breaks the other
four ("madā hi pāpāni karonti → pāṇātipātādīni sabbākusalāni karonti") is the commentary drawing the
instrumental architecture out of a canonical seed — the study's through-line, here at the precept's own root.
This is the textual footing for the circularity point: an instrumentally-grounded precept condemns a substance
only insofar as the heedlessness-cascade obtains.

## Honest limits

- Counts are CST/SuttaCentral-segmentation-relative and edition-relative; the structural facts (register-split,
  the commentarial provenance of the explicit architecture, the effect-gating of the rule) are edition-neutral.
- P2's exact phrase `paññāya dubbalikaraṇī` is rare as a string; the faculty-harm claim rests on its position
  as the named sixth ādīnava and its kin (cittamohanī, ummādana), not on frequency.
- The drink co-occurrence ties carry the `surā`→`asura` mid-word leak; every load-bearing P3/P5 count was
  sense-read from the dumped sample, so the leak is disclosed, not hidden.
- This is descriptive corpus work. The circularity DIAGNOSIS and any application to specific substances are
  interpretive (the study is gated/interpretive); they are flagged as such in the paper and weighed against the
  mixed-contested science, never asserted as a canonical ruling.

## Deliverables

- `_instrumental_evidence.json` (31 probes + 1 split + 21 loci, each with count-lock samples)
- `_run_instrumental.py`, `_run_instrumental2.py`, `_probe_diacritics.py` (serial runners)
- `PREREG-instrumental.md` (frozen predictions + coding rules), scored here
- This log
