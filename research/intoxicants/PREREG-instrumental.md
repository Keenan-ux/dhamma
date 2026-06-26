# Pre-registration — §2a, the instrumental-precept / circularity corpus analysis

*Frozen before the full enumeration. Internal doc (unregulated prose; em-dashes allowed here, NOT in the
deliverable paper). Predictions below are committed as of 2026-06-26, before any §2a count was run; the
enumeration plan (the query set) is informed by the design fleet and may be refined, but the PREDICTIONS are
not edited after this freeze. Score every prediction verbatim after the run, including any falsified leg.*

## Mission of §2a

Establish, from the corpus, whether the fifth precept's grounding is **consequential / instrumental** — it
guards the other four precepts by guarding against the heedlessness (*pamāda*) that breaks them, so the
wrongness of a substance is contingent on its intoxicating effect — versus **intrinsic / purity-taboo** —
the substance is wrong in itself, a ritual impurity, independent of effect.

This is the textual anchor for the study's central interpretive contribution, the **circularity point**: an
instrumental precept condemns a substance only insofar as the consequential harms obtain. To call a thing
*majja* and condemn it "as an intoxicant" while the consequential harms (heedlessness and its cascade) do not
obtain is to assume the conclusion in the premise. The corpus must show that the precept is in fact grounded
consequentially, or the circularity argument has no canonical footing.

## Regression gate (must stay green)

- The v2 finding — *majja* is an **effect-based category** (intoxication defined by effect, not by a closed
  substance list) — stays green. §2a must not contradict it; it deepens it from "the category is effect-based"
  to "the precept that uses the category is instrumentally grounded."
- Reference values (v2 cluster, deduped, GROUP BY reconfirmed): `majja` net 227 · `surā` net 648 · `meraya`
  279 · cluster net 840 (mūla 273 / attha 294 / tika 206 / anya 67). Any §2a recount of these reconciles, or
  the discrepancy is logged as a finding.
- Deduped per-character density only (is_primary on both numerator and denominator); per-stratum Mchar per
  `DEDUPED-DENOMINATORS.json`. Stratum = the chronological axis (`stratum(work_slug)`), never `work_role`.

## Pre-registered predictions (FROZEN 2026-06-26)

**P1 — Consequential / instrumental rationale is dominant across strata.**
The precept's stated rationale is consequential (pamāda → concrete harm), not a purity declaration. The
precept-formula's own grammar carries it: `surāmerayamajja-pamādaṭṭhānā veramaṇī` = abstaining from *the
occasion of heedlessness that is* surā/meraya/majja — drink named as the **base of pamāda**, not condemned per
se.
- PASS if: (a) the consequential / effect framing is attested **early-canonically** and is the dominant
  register; (b) `pamādaṭṭhāna` co-occurs with the drink cluster densely (v2 rung-3 already counted
  `pamādaṭṭhāna` at 205 rows; the early-canonical named-triad loci dn31/sn14.25/an5.179/an8.39/snp2.14 all
  carry the pamāda frame); (c) the six-`ādīnava` consequential-harm enumeration of dn31 is present and is
  harm-of-drinking, not impurity-of-liquid.
- FAIL if: the dominant canonical register is the substance as intrinsic impurity / ritual taboo.

**P2 — A faculty / wisdom-weakening harm is the operative harm-claim, and it is canonical.**
The named harm is to the **cognitive faculty** — `paññāya dubbalikaraṇī` (weakening of wisdom, the sixth
drawback of dn31), `cittamohanī` (confusing the mind, an5.179), `ummādana` (ending in madness, snp2.14).
- PASS if: these faculty / cognition-harm terms are attested in canonical (mūla) rows and the harm they name
  is to clarity / wisdom / mind (not to ritual status). This is the bridge to the science (faculty
  degradation) and to the path-distinction (an intoxicant clouds the very *sati/sampajañña* insight needs).
- FAIL if: the wisdom-weakening claim is absent from the canon (commentarial only) or is not the operative
  harm.

**P3 — The instrumental mechanism (intoxication → breaking the other four precepts) exists; provenance pre-committed.**
A text links intoxication to the breach of the other precepts — the "one who drinks then kills / steals /
lies / commits sexual misconduct" exemplum — which is the explicit content of "the fifth precept guards the
other four."
- PASS (existence) if: ≥1 locus (canonical or commentarial) asserts that intoxication leads to breaking the
  other precepts or to "all manner of wrongdoing" (`pāpa`/`akusala` cascade).
- Provenance leg (direction pre-committed, matching the study's through-line): the **explicit** "guards /
  protects the other four" architecture is **commentarial** on a canonical seed (the canon operates the
  pamāda → akusala chain; the commentary states the precept-guards-precepts principle as a principle). PASS if
  the explicit linkage is denser in / originates in commentary, with a canonical seed identified. A finding
  that it is fully canonical is recorded as a refinement, not a failure.

**P4 — Other-protection / gift framing is present and early-canonical.**
The precept is framed as safety given to others: an8.39 makes abstaining from surāmeraya the fifth of five
great gifts (`mahādāna`) giving freedom from fear, enmity, and ill-will (`abhaya`/`avera`/`abyāpajjha`) to
countless beings — instrumental and other-directed, not self-purification.
- PASS if: the mahādāna / abhaya frame for abstaining-from-drink is attested early-canonically (an8.39 and
  any kin).

**P5 — STRUCTURED ABSENCE (the circularity anchor): drink is never an intrinsic impurity independent of effect.**
The canon never treats drink as an intrinsic impurity / purity-taboo / sin-per-se independent of its
intoxicating effect.
- Method (structured-absence protocol): climb the ladder first (the drink cluster is already enumerated to
  net 840); establish the expected-present frame across the **rival purity vocabularies** (`asuci` impure,
  `amedhya`, `mala`/`aṅgaṇa`/`kilesa` stain, `pāpa`/`akusala` predicated of the *liquid* rather than of the
  heedlessness); confirm the silence by SQL; rule out trivial explanations; name a contrast class.
- PASS if: the count of canonical rows treating drink as intrinsically impure **independent of effect** is 0
  (or de minimis and explicable), against a **present** contrast class — i.e. those purity vocabularies ARE
  used in the corpus (for the body, for defilements), and the consequential frame IS densely present for
  drink, so the absence is a patterned boundary, not a corpus gap.
- Positive control: the medicine effect-test (telapāka, cst-vin02m2.mul-vin3_6) — liquor permitted in a
  decoction only where colour/smell/taste are undetectable, i.e. only where it can no longer intoxicate.
  Permission keyed to the **effect vanishing** proves the prohibition tracks effect, not substance. If the
  prohibition were a purity-taboo, no amount of effect-removal would license the liquid.

## What confirmation licenses — and what it does NOT (scope gate)

- Licenses (descriptive): the precept is instrumentally grounded; its application to a substance is contingent
  on the intoxicating effect obtaining. This is a corpus fact.
- Licenses (interpretive, flagged): the circularity diagnosis — to condemn a substance "as an intoxicant"
  while the effect-cascade does not obtain assumes what it should show. The honest application of the
  effect-test is dose- and context-sensitive (this is where the science enters, scored both-sides).
- Does NOT license: a normative verdict that any particular substance is permitted. Corpus claims stay
  descriptive; the application to psychedelics is interpretation, flagged, weighed against the mixed-contested
  science, never asserted as a canonical ruling. The study is gated and interpretive, but rigor on the corpus
  side does not relax.

## Method controls (committed)

- Serial DB only (one connection); count-lock gate before any count enters the write-up: the exact pattern;
  the full original (+translation) text of ≥20 sampled matched rows actually read (≥30 for a load-bearing
  early-canonical cell, or ALL if fewer); for any homograph term, the exclusion mask AND a blind sense-coded
  sample with κ.
- Homograph / general-term masks pre-committed (refine from the fleet, never drop): `majja` (the 84%-false
  substring — use the v2 intoxicant-token regex), `surā` (deva/mid-word purge), and the **general-term
  precision controls** for the rationale vocabulary — `pamāda`/`appamāda`, `ādīnava`, and the purity terms
  `asuci`/`mala`/`pāpa`/`akusala` are large generic lexemes and must be **tied to the drink context**
  (co-occurrence with the cluster in the same row, or read-and-coded), never counted as a bare stem.

## Coding rules pre-committed (method; frozen before the run)

These are scoring decisions, committed before any §2a count is read, so the result cannot be reverse-fitted.

- **P3 causal-vs-list rule.** A drink + other-precept co-occurrence row counts as **instrumental-causal**
  (P3 evidence) ONLY if a connective of *leading-to* links drink → transgression in the same clause (a verb
  of becoming-heedless-then-doing: `pamatto … karoti/āpajjati`; a `hetu`/`paccayā`/`-tāya` causal; an explicit
  "having drunk, he then …"). A row that merely **co-lists** the five precepts (the pañcasīla / pañcavera
  enumeration, e.g. `surāmerayamajjapamādaṭṭhāyī` beside `pāṇātipātī … musāvādī`) is **list-enumeration**, NOT
  causal, and is reported as the baseline, not as P3 support. Every P3 co-occurrence count is sense-read and
  split list / causal before it is scored.
- **Niggahita rule.** SuttaCentral-id rows store the niggahita as ṁ (candrabindu); CST-id rows store it as ṃ
  (anusvāra). Every enumerand / compound pattern with a niggahita uses the class `[ṁṃ]` (e.g. `rogāna[ṁṃ]`,
  `kopīnanida[ṁṃ]san`, `cittamohani[ṁṃ]`) or it silently undercounts the cross-id-scheme restatements.
- **Drink-context tie.** General rationale terms (`ādīnava`, `pamāda`, `asuci`, `pāpa`/`akusala`, the moha
  family, `mahādāna`, the soceyya family) are large generic lexemes; they are counted ONLY tied to the drink
  cluster in the same row (co-occurrence) AND sense-read, never as a bare stem. The drink tie itself avoids the
  `majja` false-friends (`majjha`/`majjana`/`miñja`) by requiring intoxicant-specific tokens
  (`meraya`/`surā`/`majja[ṃṁ]`/`majjap`/`majje`/`madirā`/`pānānuyog`/`telapāk`).
- **P5 both-pass + contrast classes.** P5 is scored as a structured absence only with (a) an expected-present
  pass proving the rival impurity vocabulary IS in the corpus, (b) the drink co-occurrence near-zero, and (c)
  the affirmative contrast classes: the Āmagandhasutta substance-vs-conduct adjudication (`snp2.2`,
  `āmagandh`), the soceyya purity scheme (`an3.119`/`an10.176`, `soceyy`) from which the drink-precept content
  is absent while the other four's is present, and the categorical flesh-bar (`manussama[ṁṃ]s`) in the same
  Bhesajjakkhandhaka that has NO undetectability carve-out (vs the liquor permission that does).
- **Translation-column homograph (do not trip).** The English `translation` column renders BOTH existential
  `madā` (youth/health/life) and chemical `majja` as "intoxication"; the v2 purge was `original`-only. §2a
  takes NO translation-scope or Meaning-mode count without a sense-split. Work the Pali `original` side.

## Enumeration plan (query set)

Populated from the design fleet (`wf_1d678c29-fea`) + critic + orchestrator. Each query carries pattern, mask,
deduped per-stratum split, count-lock sample; load-bearing homograph/general terms sense-read with κ. The
runnable set is `research/intoxicants/_run_instrumental.py` (one connection, serial); evidence dumped to
`_instrumental_evidence.json`. Query families: P1 (pamādaṭṭhāna compound + dependency split, precept compound,
six-ādīnava union, apāyamukha, parābhava); P2 (paññāya dubbalikaraṇī, cittamohanī, ummādana, madanīya, the
cluster-gated moha family); P3 (drink × each other-precept verb, causal/list split; the five-vice baseline;
the Sāgata nidāna); P4 (mahādāna gift, abhaya/avera, the self-purification negative leg); P5 (the both-pass
purity cross-tab + Āmagandha + soceyya scheme + the flesh-bar / undetectability positive controls).

## SCORED (2026-06-26, after the run — predictions above NOT edited)

All five PASS. Full ledger + count-lock sense-reads in `INSTRUMENTAL.md`; data in `_instrumental_evidence.json`.

- **P1** consequential/instrumental dominant — **PASS (strong)**. pamādaṭṭhāna is a productive idiom (gambling,
  lodging, kingship; commentary: "heedlessness stands here", rationale stated in the ablative *pamādaṭṭhānato*);
  dn31 lists drink first among six *apāyamukha* with six consequential *ādīnava*; the canon categorizes drink as
  *apāyamukha*, structurally apart from the four *kammakilesā*. No intrinsic-impurity register.
- **P2** faculty/wisdom-weakening, canonical — **PASS**. *paññāya dubbalikaraṇī* is the culminating sixth
  *ādīnava* of dn31; *cittamohanī* (an5.179), *ummādana* (snp2.14). Exact phrase rare (disclosed).
- **P3** instrumental mechanism; explicit architecture commentarial — **PASS (both legs)**. Canonical seed *madā
  hi pāpāni karonti* (snp2.14); the explicit "intoxication breaks the other precepts → all akusala" is
  commentarial (cst-s0505a.att-31_p031); Kumbha Jātaka ja512 the narrative. The heedless-then-acts causal bigram
  near drink = 0 canonically (the co-occurrences are pañcasīla list-enumeration).
- **P4** other-protection/gift, early-canonical — **PASS**. an8.39 *mahādāna* (abhaya/avera/abyābajjha to
  immeasurable beings); the self-purification negative leg confirmed (70 co-occurrences all incidental, 0
  self-purity framing).
- **P5** no intrinsic impurity (structured absence) — **PASS (strong)**. 0 canon rows predicate impurity OF the
  drink (the 31/57 co-occurrences are all false positives — body/corpse contexts + the surā→asura leak, read);
  contrast classes present: Āmagandhasutta (taint = conduct not substance), the soceyya/dasakammapatha scheme
  (drink structurally excluded while the other four present), and the telapāka + *majje*-permutation
  effect-gating (permission/offence track the effect, never the substance).

**The sharp finding (beyond the prediction):** the canon's own taxonomy puts the fifth precept in a different
register from the other four (*pamādaṭṭhāna/apāyamukha* vs *kammakilesā/kammapatha/soceyya*). The fifth precept
is structurally instrumental in the canon itself; the explicit "it therefore breaks the other four" is the
commentary drawing the architecture out of a canonical seed. That is the textual footing for the circularity
diagnosis.
