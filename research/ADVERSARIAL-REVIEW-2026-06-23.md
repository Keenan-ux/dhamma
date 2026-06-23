# Adversarial review of the five live Dhamma research studies — 2026-06-23

*No-holds-barred peer review commissioned by the operator. 22 agents (5 studies × 3 hostile
lenses → per-study skeptic-of-skeptics verifier → 2 cross-cutting meta passes), then a
coordinator verification layer that independently re-checked the highest-stakes claims against the
live corpus (serial, via `research/_adv_db_check.py`). Internal doc — em-dashes allowed.*

Workflow run: `wf_fd14f07b-e12` (2.3M subagent tokens, 531 tool calls). Verification snapshot:
dbcheck 194,710 passages, `/api/ready` 200.

---

## 0. Bottom line

**Every central thesis survives.** All five studies rest their core on *present/absent 0-canon
negatives* (carita = 0 in the canon, hadayavatthu = 0 in the canon, the nāga awakening-ceiling
*named* in the canon) and on hand-verified close-reading spine cells. I independently re-confirmed
the load-bearing zeros against the live corpus; they hold. The qualitative direction "canon is
sparer/functional, commentary systematizes" is also corroborated by the field's standing consensus
(Cousins, Crosby, Ronkin) and, in one case, by the tradition's own admission in-corpus
(the heart-base sub-commentary's *Pāḷiyaṃ anāgata*, "not handed down in the text").

**What does not survive is the decorative quantitative apparatus around the theses.** Two systemic
defects, found independently by both meta passes and then verified by me, run through the whole
program:

1. **The "chronological stratum" axis is a `work_slug → stratum` lookup, not an independent
   coding** — so every "early-vs-late gradient" and every "N layer/stratum disagreements" integer is
   circular with the corpus's own shelving. *Verified locally:* stratum is a pure function of work in
   naga (0/24 works multi-valued) and awakening (0/10), near-pure in uttarakuru (1/35 = the KN
   catch-all); "disagree" == "not-early" for **299/299** awakening mula rows and **26/26** uttarakuru
   mula rows.

2. **The "commentary dominates" magnitude is a corpus-granularity artifact.** Commentary was
   subdivided into ~330-char paragraph rows while the canon stayed at ~2,975-char whole-sutta rows
   (9× larger), so "canon = 9% of *rows*" but **44% of the corpus by *character*.** *But the
   adversary over-corrected:* the cross-study agent's claim that the dominance "reverses, the canon
   is denser" is a per-row artifact and does **not** survive per-character normalization. The
   granularity-robust truth (below) is that the commentary is genuinely **3.5–5.5× denser per unit
   text** — the studies' qualitative direction holds; only the raw "85% commentarial" magnitude is
   wrong.

Per-study reliability grades (verifier-assigned, coordinator-confirmed):

| Study | Grade | Thesis verdict | Biggest single defect |
|---|---|---|---|
| Awakening | **B** | stands | buddha-vacana 17 rows / 9 recollections → **15 / 7** (2 rows are book-sized monoliths cataloguing third parties) |
| Individual-Guidance | **B** | stands w/ qualification | headline **H0=8/H1=7 is a definitional tautology**, not a test it could fail |
| Heart-base | **B** | stands w/ qualification | "posited, **never verified**" has no negative control (and the control partly defeats it) |
| Uttarakuru | **C** | stands w/ qualification | **CRITICAL: "6 of 26 mula early" double-counts 3 suttas as 6 rows** (SC+CST recension siblings) |
| Naga | **B** | stands w/ qualification | flagship "commentary most lopsided on power/habitat" **reverses** under normalization |

---

## 1. Independent verification (the credibility layer)

I did not take the agents' word for the corpus-dependent findings. Re-run serially against the live
DB (`research/_adv_db_check.py`, one connection, results below = the query→result snapshot the
program's own auditability standard asks for):

**Base-rate denominators (the decisive numbers):**

| layer | rows | chars | avg chars/row |
|---|---|---|---|
| mula (canon) | 17,996 | 53.5M | 2,975 |
| attha | 91,843 | 29.5M | 321 |
| tika | 81,841 | 28.4M | 346 |
| anya | 3,030 | 9.9M | 3,261 |

Canon = 9.2% of rows but **44% of the corpus by character.** Granularity-robust density
(topic per million characters), commentary÷canon:

| Study | raw split (canon/comm) | per-row | **per-character** |
|---|---|---|---|
| Awakening events | 14% / 86% | comm ~1.2× | **comm 5.1×** (attha alone 10.7×) |
| Naga serpent rows | 13% / 87% | ~1.0× | **comm 5.5×** |
| Naga claim-bearing | 16% / 84% | — | **comm 4.1×** |
| IG instances | 18% / 82% | — | **comm 3.5×** |

Reading: the raw 85/14 overstates (rides the 9× subdivision); the per-row "reversal" understates
(mula rows are 9× bigger); per-character — the right unit — says commentary is ~3.5–5.5× denser.
The honest claim is "the commentary dwells on this several times more densely than the canon," not
"85% of instances are commentarial" and not "the canon is actually denser." (Caveat: even
per-character partly measures genre — e.g. the commentary's stock mass-awakening formula
*desanāpariyosāne* occurs 0× in the canon, 206× in attha — so 5× is itself a soft upper bound.)

**Number-changing checks:**

- **Awakening sn4_1 / vin3_1** — both confirmed as monolithic work-level rows (311,658 and 243,393
  chars) containing the Buddha's self-claim AND a third party's awakening (Rāhula; Yasa). The
  buddha-vacana coding fired on "BV-text-somewhere-in-the-book." **17/9 → 15/7 is warranted.**
- **IG sabhāva** — independent count vism **84**, attha 1,548, tika **3,981**, mula 65. The page
  prints "vism 553" — a ~5–6× overcount (RECONCILIATION.md already flagged it; true ≈ 84–98).
  Qualitative peak-in-ṭīkā holds. ("Canon ≈ 0" rests on sense-disambiguating 65 raw mula stem-hits.)
- **IG carita = 0** — CONFIRMED 0 (diacritic-correct) in pli-dn/mn/sn/an mula, in the Abhidhamma,
  and in the Paṭisambhidāmagga. The program's strongest negative is solid; the JSON's `RUNG3 pli-ps:1`
  is a stray error (page's "carries none" is correct).
- **Heart-base** — hadayavatthu total **272**; **0** in four Nikāyas; **0** in seven Abhidhamma
  books. Silence tier CONFIRMED. Paṭṭhāna posit `yaṃ rūpaṃ nissāya` = 5 (page says 7; phrasing-
  sensitive, as flagged).
- **Heart-base negative control (the keystone test)** — verification-formula co-occurrence with
  `cakkhuvatthu` (a matched material support) = **0**; with `bhavaṅga` = 8; hadayavatthu+abhiññā = 10
  (matches the dataset). Result: a comparable material posit (the eye-base) is *also* never verified,
  so "the heart-base is posited, never verified" is partly a property of the grammatical category,
  not a doctrine-specific downgrade. **The agent's charge holds; soften the claim.**
- **Uttarakuru divine-eye** — exactly **5** mula rows co-occur with `uttarakur` (page's "five" is
  exact); pericope attested **176×** (page says ~124, conservative/different-string). Backbone
  CONFIRMED; the count should be cited from the corpus, not from the un-served FINDINGS figure.
- **Naga nāgadīpa** — mixed: `e0703n` is the genuine Mahodara/Cūḷodara nāga-king episode (correctly
  serpent); `e1001n` reads as a calendar/chronicle toponym. Smaller false-positive rate than feared.

---

## 2. The two systemic threats (detailed)

### T1 — Stratum circularity (CRITICAL, all five studies)
The method (`PROVENANCE-SIGNATURE.md` I.1) promises stratum "coded independently of structural
layer," then operationalizes it as "build a work→stratum lookup seeded from the citation prefix."
The builders do exactly that (`WORK_STRATUM[work_of(id)]`). Consequence: the per-row
`layer_stratum_disagree` flag fires iff stratum ≠ early-canonical, so "X rows read later than they
are shelved" is the same partition as "X rows are not early," counted twice and presented as
convergent evidence. The naga aid panel even tells readers "three readers coded each row's stratum
independently" — but a deterministic lookup has no inter-coder anything (κ would be a trivial 1.0).
This is the **same per-work-shortcut signature** the program already convicted as a publishable
defect on the attribution axis (the false buddha-vacana = 0), now living unexamined under the axis
that carries every headline — and the program's own A2 hardening audit looked straight at it and
*cleared* it.

**Fix:** relabel the axis honestly as a frozen `work_slug → stratum` reference table (a
recall/bucketing aid, not a per-row coding); drop the "coded independently" language; footnote that
"disagree" == "not-early-canonical" by construction. If a genuine within-canon chronology claim is
to be load-bearing (the IG sabhāva gradient, the uttarakuru "deepens inside the late canon"), code
at least the contested rows (Vism-as-mula, Vinaya nidāna, Thera/Therīgāthā) from per-row
philological features independently of work, report a real per-row κ on *that*, and quantify how
much of the gradient survives.

### T2 — Base-rate / granularity confound (refrained from the meta version above)
Settled in §1. The defect is real (raw 85/14 is granularity-inflated); the adversary's "reversal"
is not robust (per-row artifact). **Fix:** add a per-layer denominator to every census and report
topic density **per million characters** (or per dedup-narrated-event) next to every raw
canon-vs-commentary count. This single change both corrects the inflated magnitude and *vindicates*
the qualitative direction the studies argue.

### Secondary systemic patterns (both meta passes)
- **"Never verified" with no negative control** (heart-base, uttarakuru) — partially defeated by my
  control (cakkhuvatthu = 0). Run the matched control before either leg is leaned on.
- **Auditability uneven** — 0/5 `build_dataset.py` scripts run a live query; heart-base hardcodes
  every count as a literal behind a self-check that asserts the literals equal themselves; IG's
  `fine_full.json` and naga's `canon_serpent_candidates.json` are git-ignored. Commit per-study
  SQL + a query→result snapshot. (This review's `_adv_db_check.py` is a start.)
- **IAA scope mismatch** — published κ figures (uttarakuru 14/16 over *features*; naga 0.853 over 124
  ambiguous rows; awakening 1.0 over the 17 attribution rows) sit next to headlines they do not
  cover (the 26-row split; the facet distribution; the 9-bucket taxonomy). Scope each κ to its unit
  in the sentence that prints it; state where no per-row κ exists.
- **House-thesis confirmation risk** — all five reach "canon supple / commentary systematizes";
  "faithful... innovative in the apparatus" appears verbatim in IG and naga; two prereg seeds (naga,
  uttarakuru) bake the direction into the question. The result is also the field's standing
  consensus, so the contribution is *quantification*, not discovery. Strongest single antidote: run
  one study on a topic where the prior points the other way, and publish it whatever it shows.

---

## 3. Per-study correctable defects (verified findings only; false positives dropped)

### Awakening (B, stands)
- **[major] 17/9 → 15/7.** sn4_1 (Rāhula) and vin3_1 (Yasa) are book-sized monoliths; recode as
  redactor-frame and update the page wherever 17/9 renders. The false-zero correction and the
  early-floor framing survive (≥13 clean early-nikāya BV rows remain). *DB-confirmed.*
- [minor] FINDINGS-v2.md:133 still asserts the disproven "zero Buddha-vacana ... edition-neutral"
  (secondary artifact only; page is clean).
- [minor] "261 layer/stratum disagree" == "261 not-early" (T1); drop the redundant column.
- [minor] "canon is mostly late" rides one work (Apadāna = 54% of mula events) — already disclosed;
  add a clause that it is concentrated in, not distributed beyond, the Apadāna.
- [minor] cross-layer counts confounded by marker availability (*desanāpariyosāne* 0 mula / 206
  attha) and per-paragraph granularity — the 85/14 is an upper bound (T2).
- [minor] κ=1.0 scopes to attribution only, not the 9-bucket coding; 35 anya events omitted from the
  "85%/14%" summary.

### Individual-Guidance (B, stands w/ qualification)
- **[major] H0=8/H1=7 is a definitional restatement** of warrant-present vs warrant-absent (0
  identity violations; `build_dataset.py:452` hard-pins 8/7). Reframe as a descriptive coding output,
  not a test the data could have failed.
- **[major] page G1 prints superseded sabhāva sub-figures** (vism 553 / tika 3,951); census-of-record
  is vism ≈ 84–98 / tika ≈ 3,981–4,406. *DB-confirmed: vism 553 is a ~5–6× overcount.*
- [major] kammaṭṭhāna "technical = 0 in four Nikāyas" is a hand-override of 11 raw hits with no
  stored per-row audit. Store the per-row sense judgements.
- [major] the 208-row expansion (110/98) is labeled by the thesis's own object-vs-apparatus rule,
  then reported as corroborating it. Present as coverage, not confirmation.
- [minor] served JSON self-contradicts on Paṭisambhidāmagga (RUNG3 pli-ps:1 vs page 0); *DB says 0,
  page is right* — fix the JSON. 53-vs-43 double-count in the same family.
- [minor] RUNG3 documented query uses diacritic-stripped stems that would not reproduce the zero
  (the actual run used the correct forms; *DB confirms the zero*). Off-by-one (147 vs 148). "29 to a
  named person by present situation" overstates by ~⅓ (≈9 are generic-assembly/apadāna). Stale
  55-scoped aggregate maps in the JSON (latent; page recomputes from 263). No numeric warrant κ.

### Heart-base (B, stands w/ qualification)
- **[major] no count is locally re-derivable** — `build_dataset.py` runs zero queries; every figure
  is a literal behind a circular self-check. *DB re-derives the keystone: 272 / 0 / 0 confirmed.*
- **[major] "posited, never verified" over-reaches** — no negative control, and "0 in-window" is
  printed next to a recorded 70-char abhiññā co-occurrence (10 rows). *My control: cakkhuvatthu also
  never verified (0).* Soften to "shares the non-verified grammar of material supports generally";
  foreground the in-corpus harmonization witness (*Pāḷiyaṃ anāgata*) as the stronger support.
- [major] "rises with lateness" gradient never normalized for the ~20× commentary bulk (T2). (Not a
  *pure* artifact: attha has fewer bhavaṅga hits than ṭīkā despite more rows — some genuine signal.)
- [minor] "18 mūla hits, all Vism, plus one Niddesa and one Milindapañha" sums to 20, not 18;
  HB_BY_ROLE sums to 246 not 272. Abstract "one book" vs body two (Paṭṭhāna + Dhammasaṅgaṇī).
  Dropped Vibh 3 cite. Citeless "Present." control rows violate the study's own grounding rule.

### Uttarakuru (C, stands w/ qualification)
- **[CRITICAL] "6 of 26 mula rows early" double-counts 3 AN suttas as 6 rows** (each present once
  under a SuttaCentral id and once under a CST sibling). ≥8 of the 26 are such pairs. The dedup was
  documented internally and never applied to the shipped census; no on-page caveat. After dedup the
  early share is 3/17 ≈ 18% (still a clear minority — the finding survives, the integers do not).
- **[major] stratum IAA (14/16) is over 16 *features*, not the 26-row split** the headline turns on;
  no row-level agreement exists (and per T1 it would be a deterministic 1.0 anyway).
- **[major] divine-eye counts** (~124 attestations, 5 co-occurring rows, char-gaps) **absent from the
  served dataset.** *DB-confirmed: 5 mula co-occurring rows exact; 176 pericope attestations.* Surface
  them as a context block and cite 176, not 124.
- **[major] subtitle attributes "worst placed for awakening" to "the canon's own reckoning"** — the
  abstract itself says this verdict is commentarial and author-reconstructed. Fix the subtitle.
- [minor] within-canon gradient fully confounded with genre (early mula = 100% Aṅguttara); abstract
  states it more firmly than the body's "register-relative" demotion. "4 Milindapañha" = 2 passages
  ×2; "161 rows" = 152 distinct. "Thousand years to a creeper not the people" — *DB: such canonical
  rows do exist (kn10_1, kn18_2), but not in the served data.*

### Naga (B, stands w/ qualification)
- **[major] "commentary most lopsided on power/habitat, where there is most to invent" is a
  raw-volume artifact** — per serpent-row the canon is DENSER on power (195 vs 128), classification,
  ceiling, and birth-mode; only habitat, human-form, uposatha, ordination are genuinely attha-denser.
  Claim-bearing share is highest in mula (68%). Rewrite to normalized rates. *(Consistent with T2:
  the per-row picture is mixed; per-character the commentary is 5.5× denser overall — report that.)*
- **[major] "32% of genuine nāga-token rows"** uses a 3,910 denominator that includes 640 nonlexical
  (no-nāga-morpheme) rows; honest share is 1267/3270 = **39%**. The example tokens (samannāgata,
  anāgāmī) are filtered out by NOISE and not even in the base.
- [minor] "103 layer-stratum disagreements" = "not-early" by construction (T1); only 23 (Vism) are
  genuine shelf-vs-stratum disagreements. 56/159 early is padded by 26 non-claim-bearing filler
  (uddāna catchwords, growth-similes) — substantive split is 30/108 = 28%.
- [minor] κ=0.853 covers 124 ambiguous canon rows only; 41% of serpent rows are unchecked regex
  auto-codes; 87% commentary single-coded; facet coding has no κ. 23 mula rows hand-injected past the
  blind gate; 36 nāgadīpa rows auto-classed serpent (*DB: at least one is a genuine nāga-king story*);
  NOISE over-strips genuine compounds (lower-bound recall). "14 spine passages" vs 16 verified rows.
- The **strongest single contribution in the program**: the CANON names the soteriological ceiling
  (*nāgā aviruḷhidhammā*, Vin Kd 1, buddha-voice, verified) while the COMMENTARY supplies only the
  *abhabba* rationale — a present/absent text fact, correctly scoped, that runs mildly *against* the
  house thesis. (Caveat: the naming row is itself late-canonical + contested-confidence.)

---

## 4. Prioritized correction queue

**P0 — fix the framing that a referee could sink in one line (do before any further outreach):**
1. Add a per-million-character density column to every census; rewrite all "85% commentarial / most
   lopsided" sentences to normalized rates. (T2 — protects four of five headlines.)
2. Relabel the stratum axis as a work→stratum reference table; footnote "disagree == not-early";
   drop "three readers coded each row's stratum independently." (T1 — all five.)
3. Uttarakuru: dedup SC/CST recension siblings before computing 6/26 (→ 3/17); fix the IAA-unit
   sentence; fix the subtitle. (The only critical.)

**P1 — correct published integers / over-sold apparatus:**
4. Awakening 17/9 → 15/7 (+ fix the IAA harness to excerpt the catalogued span, not the whole book).
5. IG: replace vism 553 with ≈ 84–98; reframe H0=8/H1=7 as a descriptive coding output; fix the
   RUNG3 pli-ps stray and the 53/43 double-count.
6. Naga: 32% → 39% (relabel the denominator); rewrite the lopsidedness sentences; restrict to the
   genuinely attha-denser facets.
7. Heart-base: run the matched negative control (cakkhuvatthu/pasāda-rūpa/bhavaṅga) and soften
   "never verified" accordingly; foreground the *Pāḷiyaṃ anāgata* witness.

**P2 — method hardening (so the next study inherits the fixes):**
8. Patch `PROVENANCE-SIGNATURE.md` I.1 (the "independent of layer" contradiction) and add the stratum
   axis to the per-claim-granularity gate it was wrongly exempted from.
9. Extend the per-claim gate to audit the SPAN on monolithic/work-level rows; route hand-injected and
   prefix-rule rows through the blind gate.
10. Commit per-study SQL + query→result snapshots (heart-base first — it has none); un-ignore the two
    load-bearing artifacts; add a per-study data-availability line.
11. Scope every published κ to its unit; require a per-row κ for any headline that turns on a per-row
    split.
12. Restate the naga/uttarakuru prereg questions as hypotheses with explicit nulls; run one study
    where the prior points against the house thesis.

---

## 5. What is most defensible / what a hostile referee would say

**Most defensible:** the present/absent 0-canon negatives (carita, hadayavatthu, upacāra/appanā-
samādhi, jhānaṅga, cakkavāḷapabbata = 0 in the canon), GROUP-BY-reconfirmed and DB-re-confirmed
here, plus naga's "the canon names the ceiling, the commentary supplies the rationale." These are
text facts immune to T1 and T2 and corroborated by independent scholarship.

**A hostile referee's strongest line:** "You counted a canon-dense topic in a corpus that is 92%
commentary *by row* (but only 56% by character), called the commentary dominant, then coded
chronology by re-reading the shelf labels — so your two headline quantitative findings are
bookkeeping on the corpus's own filing, and your qualitative finding is the field's existing
consensus." The answer is to lead with the per-character density and the present/absent zeros, demote
the gradients and disagreement-counts to disclosed bookkeeping, and frame the contribution as
rigorous quantification of a known thesis.

## 6. Verification trail
`research/_adv_db_check.py` (this review's serial DB harness) + the workflow output
(`tasks/wt8q737hx.output`, full per-study lens + verifier JSON). Local stratum-circularity proof and
per-character density computations are reproducible from `public/research/*.json` + the per-layer
totals in §1. Nothing was edited on the live pages — this is a review, pending operator decisions on
the queue above.
