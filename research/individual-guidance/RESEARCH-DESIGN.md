# Research Design & Pre-registration — How an Individual Is Guided

**Study:** How the Pāli tradition guides an individual toward awakening — the modes of guidance (a bare
statement, an elaborated teaching, step-by-step leading, an assigned meditation object), the criteria of
assignment, the meditative function (samatha / vipassanā), the sequence, and the regularities connecting
*person* ↔ *discourse* ↔ *object* — with **canon vs commentary** as the cross-cutting axis.

**Status:** FROZEN pre-registration, 2026-06-14. Hypotheses, codebook, and stopping rule below are fixed
*before* the full census, so classifications are not fit post-hoc. Corpus snapshot at freeze:
**194,710 passages** (`/api/dbcheck`, 2026-06-14).

> This is the *internal* design + methods artifact. The public-facing paper (process-free) and the
> auditable dataset are separate deliverables; see the execution plan
> `~/.claude/plans/clever-bubbling-wozniak.md`.

---

## 1. Master question

> *How does the Pāli tradition prescribe the guiding of an individual toward awakening — across the full
> range from a bare statement, through an elaborated teaching, to being led step-by-step with an assigned
> meditation object — and what regularities connect the kind of person, the kind of discourse given, and
> the object or instruction assigned? How, throughout, does the canon differ from the commentary?*

## 2. Sub-question groups (each = one analysis chapter + one slice of the dataset)

- **A. Person & mode of guidance (unified spine).** A1 the four guidance modes (statement → *ugghaṭitaññū*;
  brief-then-elaborated → *vipañcitaññū*; led step-by-step / object-assigned → *neyya*; no-breakthrough →
  *padaparama*; AN 4.133 names, Puggalapaññatti §§148–151 defines). A2 the *distinct* person-axes —
  *carita* temperament (Vism III), three "patients" (AN 3.22), *indriya* capacity — and whether they
  cross-walk (expected: only in commentary, the lotus→four-type map, SN 6.1 / MN 26). A3 **agency:** who
  may guide and how they know whom to give what (canon: the Buddha's *indriya-paropariya-ñāṇa*, MN 12).
- **B. The full enumeration (census core).** Every guidance-toward-awakening instance, coded per §4.
- **C. Similarities / patterns.** Over the enumeration, test for regularities: person-features × mode,
  person × object, occasion × object. Report which hold vs are absent (a finding either way).
- **D. Function — samatha vs vipassanā.** **D0 (load-bearing conclusion):** does the canon prescribe
  samatha and vipassanā as *separate* practices/paths, or only yoked/integrated (yuganaddha, AN 4.170)?
  Reach an explicit verdict and contrast with the commentarial *samatha-yānika* / *vipassanā-yānika*
  ("dry-insight") two-vehicle split. D1 per-object function (calm / insight / both), canon vs commentary.
  D2 the *directness* axis (insight *saññā* anicca→anatta→nibbāna) distinguished from calm-vs-insight.
- **E. Sequence / progression.** Does a person's guidance/object change over time (graded Rāhula MN 62;
  ānāpānasati's 16 steps)? Canonical vs commentarial sequence (Vism sīla→samādhi→paññā; seven
  purifications; insight-*ñāṇa*s). *Pre-registered expectation:* the canon gives pairings + situational
  sets, not a fixed ordering; sequence is largely a commentarial addition.
- **F. Canon vs commentary (contrastive method over A–E).** Plus the para-canonical bridge
  (Nettippakaraṇa / Peṭakopadesa / Paṭisambhidāmagga / Niddesa), which ties teaching-mode to person-type.

## 3. Hypotheses (pre-registered, falsifiable)

- **H_A.** Identification of who-gets-what is canonically a *Buddha's* perceptual faculty
  (*indriya-paropariya-ñāṇa*); operational, applicable-in-advance criteria are commentarial.
- **H_B.** The canon matches by **defilement-antidote + situation**; the **temperament (carita) matrix**
  is a commentarial addition (the word *carita* does not carry the temperament sense in the suttas).
- **H_D.** The canon presents samatha and vipassanā predominantly **yoked / mutually conducive**, not as
  two separate vehicles; the **two-vehicle ("dry-insight") split is commentarial** (testing Cousins).
- **H_E.** The canon supplies antidote-pairings and situational sets, **not a fixed object-ordering**;
  sequence is a commentarial systematization.
- **H_main (the cross-cutting test) — H0 vs H1, decided per cell:**
  - **H0 (faithful systematization):** every commentarial *object × criterion* assignment cell has a
    traceable canonical warrant; commentarial divergences are presentational (e.g. 9→10 asubha recount;
    light-for-consciousness kasiṇa substitution).
  - **H1 (innovation):** the commentary adds objects/criteria/diagnostics with **no** canonical warrant
    (*carita*-as-temperament; the closed "40"; the teacher-diagnosis machinery).
  - **Decision rule:** per cell, a warrant test; H0 is rejected for any cell with zero canonical
    attestation. The reported result is the *quantified split*, not a single winner. Prior expectation:
    "faithful in principle, innovative in apparatus."

## 4. Codebook (frozen — what gets coded, and how)

A **guidance instance** = a passage in which a teacher (the Buddha, or in commentary another) directs a
*specific* person or class toward awakening/progress, by any of the modes below. Generic doctrinal
exposition with no addressee-directed guidance is **excluded** (and logged as excluded with reason).

Per-instance fields:
- `mode` ∈ {`statement` (awakens/penetrates on a bare utterance), `elaboration` (a brief saying then
  expanded), `leading` (staged instruction without a single named object), `object` (a specific
  meditation subject assigned)}.
- `object` (when present): the meditation subject (e.g. *asubha*, *mettā*, *ānāpānasati*, a *kasiṇa*,
  *aniccasaññā*, the four-element analysis…), normalized to a controlled vocabulary.
- `criterion` ∈ {`defilement` (rāga/dosa/moha/vitakka…), `situation` (illness, grief, fear…),
  `temperament` (carita), `capacity` (indriya/understanding-type), `unstated`}.
- `recipient` + `recipient_features` (named person / class; any stated trait: a monk "of lustful temperament",
  a layperson, a dying monk, a brahmin…).
- `occasion` (the trigger/setting, when stated).
- `function` ∈ {`samatha`, `vipassana`, `both`, `unstated`} — by what the *text* says the object is for.
- `layer` ∈ {`mula`, `attha`, `tika`, `anya`}; `voice` ∈ {`buddha`, `commentary`, `other`}.
- `warrant` (for commentarial cells only): the canonical passage id that warrants the assignment, or
  `null` (→ counts toward H1).
- `evidence_pali` (verbatim), `evidence_en` (Sujato/ATI if present, else **author's gloss**,
  `tr_provenance` ∈ {`sujato`, `ati:<translator>`, `author`}), `id`, `citation`, `sc_id`, `pts_ref`.

**Coding reliability:** the `mode` / `criterion` / `function` / `warrant` coding is done by **k≥3 blind
coders**; inter-coder agreement (IAA) reported per field; disagreements adjudicated and logged.

## 5. Methodology

- **Corpus & edition.** CST/VRI (Chaṭṭha Saṅgāyana) as ingested into `dhamma-pg`; SuttaCentral ids as
  cross-walk; DPD/PED/DPPN for lexis. CST is used (over PTS or the SC/Bilara mūla-only stack) because it
  is the only layer carrying the full Aṭṭhakathā + Ṭīkā the canon-vs-commentary axis requires. CST ≠ PTS
  pagination; PTS vol.page added per citation where available.
- **Search method = documented + fully logged (a first-class deliverable).** Every query is recorded:
  `term · mode · scope · pitaka · layer · endpoint · result-count`. The paper's Methods section narrates
  *how the site's tools accomplished the enumeration* — `exact`/`scope=original` for Pāli object terms;
  `meaning`/`scope=translation` for concept discovery; `/api/passage/:id/commentary` for the canon→
  commentary jump; `/api/compare-stats` for frequency; direct SQL via the proxy for load-bearing counts.
  This doubles as a human-readable demonstration of the tool's research utility.
- **Citation apparatus.** SuttaCentral id (primary) + PTS vol.page + CST row-id (e.g.
  `cst-abh03m2.mul-014`). Variant readings flagged (the kasiṇa-list divergence; Vimuttimagga 38 vs Vism
  40; *anicca* vs *anicchā*). Diacritics: IAST/ISO 15919; ṁ as in the corpus.
- **Translation provenance.** Commentary + Abhidhamma carry **no English in the corpus**; every Vism /
  Puggalapaññatti rendering is the **author's own gloss** (`tr_provenance=author`), checked against
  Ñāṇamoli's *Path of Purification* (Vism) and B.C. Law's *Designation of Human Types* (Puggalapaññatti).
- **Scope & limits.** Pāli / Theravāda only (Tipiṭaka + Aṭṭhakathā + Ṭīkā + the para-canonical bridge).
  The Vimuttimagga is reached **only via Bapat's study of the Chinese** — flagged, not treated as a
  primary witness. Cross-tradition (Sarvāstivāda, *Yogācārabhūmi*) is a bounded secondary horizon only.
- **Literature engaged** (so results confirm/quantify, not rediscover): samatha–vipassanā — Bronkhorst
  *Two Traditions* (1993), Vetter (1988), Gethin, Cousins (two-*yāna* split commentarial), Anālayo, Stuart
  (2015), Shaw (2006); the 40 / Vimuttimagga — Bapat (1937), Ñāṇamoli (1956), Crosby/Skilton/Kyaw
  *Contemporary Buddhism* 20.1–2 (2019), Kuan (2008); typologies — Puggalapaññatti (Law 1922), Ledi
  Sayadaw (reception), Nyanaponika–Bodhi.

## 6. Stopping rule (saturation — engineered for "zero missed", honestly bounded)

Target: no guidance/object-assignment instance left on the table. Procedure: (1) **structural enumeration
first** — start from the canon's own closed lists (the finite object set; the assignment discourses), not
free search alone; (2) **exhaustive multi-modal search** — every object term × every guidance-marker ×
every mode/scope/pitaka/layer, all logged; (3) **loop-until-dry** — add strategies until **2 consecutive
rounds surface zero new instances**; (4) **reconcile against external lists** — the Vism's own 40, the
secondary scholarship's cited passages, the awakening census's overlapping discourses; each accounted for;
(5) **k≥3 blind coders** sweep, union the finds. **Stopping criterion = saturation** (no new instance
across all strategies + all external lists accounted for). **Honest limit (stated in the paper):** this
drives recall to saturation and *measures* the residual; it cannot *prove* zero unknown-unknowns in an
open corpus. The distinctive deliverable is the **auditable negatives** (see §7).

## 7. Frozen findings at design time (the reconfirmation the plan required)

- **Corpus snapshot:** 194,710 passages, 2026-06-14.
- **`kammaṭṭhāna` reconfirmation (corrects the prior study).** By layer: mula 148, attha 1,073, tika 787,
  anya 18. The 148 mula hits are 134 Visuddhimagga + a residue in the four Nikāyas (AN 7, MN 2, DN 2,
  KN 1, Dhp 1, Pe 1). **Inspection of those canonical hits shows the *ordinary* sense, not the technical
  meditation-subject sense:** `yena kammaṭṭhānena jīvitaṁ kappeti — yadi kasiyā, yadi vaṇijjāya, yadi
  gorakkhena…` ("by whatever **livelihood** he lives — farming, trade, cattle-herding…"; AN 8.54
  [an8.54], AN 8.55 [an8.55], AN 8.76 [an8.76], AN 8.2.x, AN 10.46 [an10.46]); `gharāvāsa-kammaṭṭhāna`
  ("the **household occupation**"; MN 5, MN 99 [mn99]); a sectional topic-heading *vedanā-kammaṭṭhāna*
  (DN 21 [dn21]); plus a Dhp-commentary *vatthu* title and a late-Khuddaka use. **Corrected claim
  (matching Crosby/Skilton/Kyaw 2019):** *kammaṭṭhāna* **is** canonical, but only in its ordinary
  "work/occupation/topic" sense; its technical "meditation subject" sense in the mula layer is essentially
  the Visuddhimagga. The prior FINDINGS' "zero Tipiṭaka-mula hits" was an overstatement; this is the
  defensible form. *(This is itself a recorded finding — and a demonstration of why the SQL reconfirm step
  exists.)*
- **Seed object-term attestation by layer** (ILIKE on `original`; collisions flagged for disambiguation):
  kasiṇa mula 207 / attha 398 / tika 606; asubha 254 / 388 / 448; ānāpāna 131 / 165 / 184; anussati(anussar-)
  454 / 563 / 326; brahmavihāra 42 / 176 / 153; *carita* 824 / 1,860 / 1,187 (**collides with the verb
  *caritā* — must disambiguate**); ugghaṭitaññū 19 / 48 / 65; vipañcitaññū 16 / 36 / 42; padaparama 6 / 26 / 20.
  Read: the objects and the understanding-types are well-attested in the canon and findable; *carita*
  needs sense-disambiguation; the technical 40-scheme vocabulary skews commentarial.

## 8. Dataset & deliverables

- **`public/research/individual-guidance.json`** — one record per guidance instance (schema = §4) +
  pre-computed aggregates (object × layer; mode × layer; object × criterion; object × function;
  person-features × mode/object; the H0/H1 per-cell warrant tally). Versioned `v1.0`, corpus-snapshot
  pinned, codebook + query log published alongside.
- **`IndividualGuidanceStudy`** renderer in `src/ResearchView.jsx` (sibling to `AwakeningStudy`):
  hyperlinked canon/commentary + cross-tab tables, expandable evidence, the H0/H1 delta table, and a
  reader **decision-aid** (the canonical defilement→antidote map as self-applicable `[canon]`; the
  *carita* matrix shown descriptively `[comm]` with its teacher-assigned caveat; **never a single
  "your object is X" verdict**). Admin-gated as a standalone Research-tab topic.
- **The paper** (`FINDINGS.md` → ingested article) — process-free, hyperlinked, full apparatus.
- **Internal methods/handoff log** (separate) — orchestration + tool friction live here, not in the paper.
