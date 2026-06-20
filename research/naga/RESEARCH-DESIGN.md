# Research Design & Pre-registration — The Nāga as a Class of Being in the Pāli Canon

**Study:** What the Pāli canon holds a *nāga* to **be** — ontologically and soteriologically — and how the
Aṭṭhakathā and Ṭīkā systematize, harden, or soften that picture. The cross-cutting axis throughout is
**canon vs commentary** (`layer` ∈ mula/attha/tika/anya).

**Status:** **FROZEN pre-registration, 2026-06-19.** The hypotheses, codebook, referent gate, and stopping
rule below are fixed *before* the full census, so classifications are not fit post-hoc. Corpus snapshot at
freeze: **194,710 passages** (`/api/dbcheck`, 2026-06-19; postgres 16.14, pgvector true).

> This is the *internal* design + methods artifact (operator-facing, unregulated prose). The public-facing
> paper (process-free) and the auditable dataset (`public/research/naga.json` + the `NagaStudy` renderer)
> are separate deliverables. The internal methods/handoff log is `research/naga/HANDOFF.md`.
>
> Derived from the operator seed `research/PREREG_naga_seed.md` (scope decided interactively 2026-06-19:
> referent = serpent-being + ontology; rigour = rigorous admin-gated study; breadth = full picture, all
> three analytical segments kept distinct, enumeration boundary fully inclusive).

---

## 1. Master question

> *What does the Pāli canon hold a **nāga** to be — as a class of being (its mode of birth, its place in
> the cosmos, its lifespan and powers, the karma that makes one) and as a soteriological subject (it keeps
> the uposatha, hears the Dhamma, can take human shape, yet cannot win the path) — and how do the
> Aṭṭhakathā and Ṭīkā systematize, harden, or soften that picture relative to the sutta and Vinaya layers?*

A prior, enabling question must be answered first, because the word itself is a trap: **what counts as a
nāga at all?** `nāga` is a canonical **heteronym**, and separating its senses is the study's first coded
step (§4.1) and a reportable finding in its own right (§7).

## 2. Sub-question groups (each = one analysis chapter + one slice of the dataset; kept on distinct axes)

- **§A — Granular ontology (the spine).** A systematic enumeration of what a nāga *is*: (A1) the four
  *nāgayoni* — *aṇḍaja* / *jalābuja* / *saṃsedaja* / *opapātika* (egg-, womb-, moisture-, spontaneous-born;
  SN 29); (A2) **classification** — the nāga as *tiracchāna-yoni* (the animal destination), the
  load-bearing ontological fact that fixes it *below* the human and deva planes; (A3) realm & habitat;
  (A4) lifespan; (A5) powers — shape-shifting (incl. assuming human form), weather/rain-making, venom,
  *iddhi*; (A6) the karma that causes rebirth as one (SN 29's conduct-plus-aspiration mechanics); (A7)
  diet & predation — the nāga's place in the cosmic food-chain under the *garuḷa / supaṇṇa*.
- **§B — The soteriological paradox.** Every text bearing on the ceiling: a nāga keeps the uposatha
  (B1), hears the Dhamma and reveres the Buddha (B2), can take human form (B3) — *yet cannot attain
  magga-phala* (B4). The decisive locus is the Vinaya **ordination bar**: the *manusso'si?* ("are you a
  human being?") question and its nāga-infiltration origin story (Vin Mahāvagga, Mahākhandhaka) (B5).
  A separate datum that sharpens the paradox: the **bodhisatta is himself reborn a nāga** in the
  nāga-king Jātakas and keeps the precepts there (B6).
- **§C — Canon → commentary divergence (contrastive method over §A/§B, not a third pile of texts).**
  For *each* finding in §A and §B: what does the commentary **add** (new ontological detail with no sutta
  basis), **regiment** (turn a narrative datum into a rule/figure), or **quietly shift** (soften or harden
  the sutta picture)? Operationalised as the per-cell H0/H1 warrant test (§3).

## 3. Hypotheses (pre-registered, falsifiable)

- **H_lex (the heteronym hypothesis).** The raw lexical footprint of *nāga* is dominated by **non-serpent**
  referents; a naive substring search is unfit for the enumeration. Predicted, quantified at freeze
  (§7): the serpent-being sense is a minority of word-initial `nāg-` tokens, and the bare substring is
  swamped by morphological false friends (*samannāgata*, *anāgata*). *Falsified if* the serpent sense
  turns out to be the clear majority of raw hits.
- **H_A (ontology is canonically fixed but thinly specified).** The canon already fixes the two
  load-bearing facts — the **four births** (SN 29) and **animal-destination status** (*tiracchāna-yoni*) —
  but supplies little of the fine apparatus (numbered lifespans, realm geography, an enumerated powers
  taxonomy). *Falsified if* the suttas already carry the detailed apparatus, or if they do **not** class
  the nāga as *tiracchāna*.
- **H_B (the ceiling is enacted, not argued).** The canon establishes the soteriological ceiling
  **narratively and legally** (the ordination bar) rather than by stated doctrine; the *rationale* (why an
  animal-born being is *abhabba*, incapable of the path) is a **commentarial** supply. *Falsified if* a
  sutta gives an explicit doctrinal reason for the nāga's incapacity, or if no canonical bar exists.
- **H_main (the cross-cutting divergence test) — H0 vs H1, decided per cell.**
  - **H0 (faithful systematization):** every commentarial ontological/soteriological claim-cell has a
    traceable canonical **warrant**; commentarial moves are presentational (regimenting, numbering,
    glossing) not substantive.
  - **H1 (innovation):** the commentary adds claims with **no** canonical warrant (e.g. specified
    lifespans, realm cartography, a doctrinal *abhabba* rationale, powers absent from the suttas).
  - **Decision rule:** per decidable cell, a warrant test; H0 is rejected for any cell with **zero**
    canonical attestation. The reported result is the **quantified split** (count of H0 vs H1 cells), not a
    single winner. Prior expectation: *"faithful on births + animal-status + the bare ceiling; innovative
    on the fine ontological apparatus and the doctrinal rationale."*

## 4. Codebook (frozen — what gets coded, and how)

### 4.1 The referent gate (the first coded step; the H_lex instrument)

Every candidate row is first classified by the **sense** of its `nāg-` token(s). `referent` ∈:

| value | sense | disposition |
|---|---|---|
| `serpent` | the serpent-being / nāga as a class of being (incl. nāga-kings, nāga-maidens, the nāgayoni) | **carried forward** to the census |
| `elephant` | the noble tusker; *nāga* as "bull-elephant" + elephant similes (*nāgavanika* elephant-hunter, *nāganāsūru* "elephant-trunk thighs") | excluded, counted |
| `epithet` | *nāga* as honorific of the Buddha / an arahant (the folk etymology *na + āgu*, "one who does no wrong"; *mahānāga*) | excluded, counted (but flagged: see note) |
| `tree` | *Mesua ferrea* (ironwood) / *nāgalatā*-betel | excluded, counted |
| `person` | a proper name built on *nāga-* borne by a **human** (Nāgasena, Nāgita, Nāgasamāla, Nāgadatta, the elder Nāga…) | excluded, counted |
| `nonlexical` | morphological false friend — the string contains no *nāga* morpheme (*samannāgata* = *saman-āgata*; *anāgata* = *an-āgata*; *nāgghati* = *na agghati*; *nāgacchati* = *na āgacchati*) | excluded, counted |
| `ambiguous` | genuine nāga token, context insufficient to fix serpent vs elephant vs epithet | held; adjudicated; reported separately |

**Rule:** only `serpent` records enter the ontology/soteriology census. The other classes are logged with
counts (the exclusion ledger) — they are the H_lex evidence, not a footnote. **Note on `epithet`:** where a
passage is *deliberately polysemous* (the Buddha called *nāga* punning on serpent/elephant/"sinless one"),
it is coded `epithet` with a `polysemy=true` flag and quoted in §A's discussion, but it does **not** enter
the serpent-being ontology counts.

### 4.2 Per-instance fields (for every `serpent` record)

- `id`, `citation`, `sc_id`, `pts_ref` — the audit handle; every `id` must resolve to a live corpus row.
- `layer` ∈ {`mula`, `attha`, `tika`, `anya`} (= the corpus `work_role`); `voice` ∈ {`buddha`,
  `commentary`, `narrator`, `other`}.
- `segment` ∈ {`A_ontology`, `B_soteriology`}. (§C divergence is *computed across* A/B via `warrant`,
  not a third segment.)
- `facet` — the controlled sub-question tag:
  - ontology: `birth_mode` (nāgayoni) · `classification` (tiracchāna / plane) · `realm_habitat` ·
    `lifespan` · `power` · `karma_cause` · `diet_predation`.
  - soteriology: `uposatha` · `hears_dhamma` · `takes_human_form` · `magga_phala_ceiling` ·
    `ordination_bar` · `bodhisatta_as_naga`.
- `power_kind` (when `facet=power`): `shapeshift_human` · `shapeshift_other` · `weather_rain` ·
  `venom` · `iddhi_other`.
- `claim` — a one-line statement of what the row asserts about the nāga (the codeable proposition).
- `warrant` (commentarial rows only): the canonical `id` that warrants the claim, or `null` (→ counts
  toward H1). For mula rows, `warrant` = self.
- `evidence_pali` (verbatim, from the fetched row), `evidence_en` (Sujato/ATI if present, else the
  **author's own gloss**), `tr_provenance` ∈ {`sujato`, `ati:<translator>`, `author`}.
- `verification` ∈ {`verified` (quote confirmed in the independently re-fetched passage), `exists`
  (passage fetched, quote not auto-matched — e.g. folded diacritic / cross-row), `exists-quote-unconfirmed`,
  `unresolved`}.
- `notes`.

**Coding reliability.** The `referent` gate and the `facet` / `warrant` coding are done by **k ≥ 3 blind
coders**; inter-coder agreement (IAA, Cohen/Fleiss κ as appropriate) is reported per field; disagreements
are adjudicated and the adjudication logged.

## 5. Methodology

- **Corpus & edition.** CST/VRI (Chaṭṭha Saṅgāyana) as ingested into `dhamma-pg`; SuttaCentral ids as the
  cross-walk and the **preferred citation** for Nikāya suttas (e.g. `sn29.1`, not the coarse CST volume row
  `cst-s0303m.mul-sn3_8`); DPD/PED/DPPN/MW for lexis. CST is used because it is the only layer carrying the
  full Aṭṭhakathā + Ṭīkā the canon-vs-commentary axis requires. CST ≠ PTS pagination; PTS vol.page added
  per citation where available.
- **Search method = direct SQL first, the search service second, everything logged.** The candidate frame
  is built by **PostgreSQL `~*` (case-insensitive regex) over `passages.original`**, run through the
  `flyctl proxy 15432:5432 --app dhamma-pg` tunnel — *not* the app's search lane, which caps at ~200 rows
  and over/under-matches (it has been wrong before: the `kammaṭṭhāna` and `surā`/`majja` cases). The
  serpent anchor is the **word-initial `\mnāg-`** pattern (the bare substring is 70% morphological noise;
  §7). The app's `/api/search` (`exact`/`stem`), `/api/passage/:id`, and `/api/passage/:id/commentary` are
  used for per-row reading, the canon→commentary jump, and as a secondary recall lane — driven **serially**
  (the single 4 GB box has no concurrency guard; fan-out crashes it — intoxicants P7). Every query is
  recorded: `term · mode · scope · pitaka · layer · endpoint · result-count` (a required deliverable).
- **Load-bearing negatives by SQL.** Any "the canon never says X about the nāga" claim is a `GROUP BY
  work_role` count through the proxy, never a search impression.
- **Citation apparatus.** SuttaCentral id (primary) + PTS vol.page + CST row-id. Variant readings flagged;
  diacritics IAST/ISO 15919, ṃ as in the corpus.
- **Translation provenance.** The Vinaya Mahākhandhaka, the Jātaka prose, and *all* commentary carry **no
  English in the corpus**; every such rendering is the **author's own gloss** (`tr_provenance=author`),
  checked against the standard published translations — Horner (*Book of the Discipline*, Mahāvagga),
  Sujato / Bodhi (SN 29), the PTS *Jātaka* (Cowell ed.), and the Udāna (Ireland / Ānandajoti) for
  Mucalinda.
- **Scope & limits.** Pāli / Theravāda only (Tipiṭaka + Aṭṭhakathā + Ṭīkā + extra-canonical *anya*).
  Cross-tradition nāga material (the *Mahāvastu*, Sanskrit *Bhaiṣajyaguru*, the Sarvāstivāda Vinaya
  nāga-ordination, Sinhalese/SE-Asian nāga cult) is a **bounded secondary horizon** reached only through
  secondary scholarship, flagged, never treated as a primary witness.
- **Literature engaged** (so results *confirm/quantify*, not rediscover): Vogel, *Indian Serpent-Lore*
  (1926) — the foundational nāga study; Bloss, "The Buddha and the Nāga" (*History of Religions* 13.1,
  1973) — the ambiguous-status reading this study tests against the corpus; DeCaroli, *Haunting the Buddha*
  (2004) — the absorption of spirit-deity cult; Appleton, *Jātaka Stories in Theravāda Buddhism* (2010) —
  the bodhisatta-as-nāga datum; Horner (1951) and the Vinaya-studies tradition on the *manussa* ordination
  requirement; Malalasekera, *DPPN*, the nāga / Nāgasena / Mucalinda entries; and the cosmology surveys
  (Gethin on the *bhava* scheme; Collins, *Nirvana and Other Buddhist Felicities*, on the destinations).

## 6. Stopping rule (saturation — engineered for "zero missed", honestly bounded)

Target: no serpent-being instance left on the table. Procedure: (1) **structural enumeration first** —
start from the canon's own closed loci (SN 29 Nāgasaṃyutta; the Mahākhandhaka ordination section; the
named nāga-king Jātakas — Bhūridatta, Campeyya, Saṅkhapāla; Mucalinda Ud 2.1; the *garuḷa/supaṇṇa*
material), not free search alone; (2) **exhaustive multi-modal search** — the `\mnāg-` frame plus the
serpent-specific vocabulary (`nāgarāja`, `nāgayoni`, `nāgakaññā`, `nāgabhavana`, `nāgaloka`, `phaṇa`-hood,
`āsīvisa` viper, `ahi`/`sappa` snake where co-referential, `bhujaga/uraga` poetic snake), every term ×
mode/scope/pitaka/layer, all logged; (3) **loop-until-dry** — add strategies until **2 consecutive rounds
surface zero new instances**; (4) **reconcile against external lists** — DPPN's nāga entries, Vogel's and
Bloss's cited passages, the SuttaCentral parallels for SN 29 / the Mahākhandhaka; each accounted for;
(5) **k ≥ 3 blind coders** sweep and union the finds. **Stopping criterion = saturation** (no new instance
across all strategies + all external lists accounted for). **Honest limit (stated in the paper):** this
drives recall to saturation and *measures* the residual; it cannot *prove* zero unknown-unknowns in an open
corpus, especially for nāga material carried under the snake words (`ahi`, `sappa`, `āsīvisa`) where the
referent is a literal animal, not the nāga-being. The distinctive deliverable is the **auditable referent
ledger** (§4.1) and the SQL-grounded negatives.

## 7. Frozen findings at design time (the reconfirmation the method requires)

All figures by direct SQL through the proxy, 2026-06-19, corpus snapshot **194,710** passages. (Numbers
here are the *design-time gate*; the census refines them.)

- **The bare substring is mostly not a nāga.** Rows whose `original` contains the substring `nāga`, by
  layer: **mula 2,282 · attha 4,655 · tika 2,828 · anya 409** (10,174 total). But in the canon, only
  **851** of the 2,282 mula rows carry a **word-initial `\mnāg-`** token: **1,599 rows (70%) are pure
  morphological noise** — `samannāgata` ("endowed with", *saman-āgata*; 5,114 token-hits in mula alone),
  `anāgata` ("future", *an-āgata*), `vedanāgata`, `adhunāgata`, all built on *āgata* ("come"), not *nāga*.
  **H_lex is supported at the gate.**
- **Word-initial `\mnāg-` candidate rows by layer:** **mula 851 · attha 1,671 · tika 407 · anya 237**
  (3,166 total) — the candidate universe *before* the referent gate strips elephant / epithet / tree /
  personal-name / negated-verb senses. Full mula token frequency saved to
  `research/naga/data/mula_naag_tokens.json` (323 distinct word-initial forms).
- **The genuine `\mnāg-` set is itself ≥ 5 referents** (mula token sample): serpent — `nāgo` (619),
  `nāgarājā` (120), `nāgassa` (116), `nāgayoni-` (16), `nāgakaññā-` (22), `nāgāvāsa-`, `nāgabhavana-`;
  elephant — `nāgavanika` (14, elephant-hunter), `nāganāsūru` (10, elephant-trunk thighs); **persons** —
  `nāgasena` (1,412, the Milinda monk), `nāgita` (≈155), `nāgasamāla` (≈42), `nāgadatta` (8); **negated
  verb** — `nāgghati`/`nāgghanti` (91, *na agghati* "is not worth"), `nāgacchati`/`nāgacchanti` (27,
  *na āgacchati* "does not come"). The personal-name class (esp. Nāgasena) is numerically the largest
  single `\mnāg-` block in the canon and is **not** a nāga-being — a referent the seed under-weighted.
- **The spine resolves to live rows** (design-time reconfirmation; every id fetched):
  - SN 29 Nāgasaṃyutta — `cst-s0303m.mul-sn3_8` ("8. Nāgasaṃyuttaṃ") **and** clean SC ids `sn29.1`
    (Suddhikasutta), `sn29.2` (Paṇītatarasutta) … (the four-nāgayoni taxonomy).
  - Four-yoni commentary — `cst-s0201a.att-mn1_2_p136` ("Catuyonivaṇṇanā"); SN 29 Aṭṭhakathā —
    `cst-s0303a.att-sn3_8_p002` (Spk-a).
  - Vinaya ordination — `pli-tv-kd1` / `cst-vin02m2.mul-vin3_1` (Mahākhandhaka); its commentary
    `cst-vin02a2.att-36_p002` ("Tiracchānagatavatthukathā" — the animal-infiltration story) + ṭīkā
    `cst-vin06t.nrf-335_p002`, `cst-vin12t.nrf-275_p002`.
  - Mucalinda — `cst-s0503m.mul-kn3_2` ("2. Mucalindavaggo", Udāna).
  - Saṅkhapāla nāga-king Jātaka — commentary `cst-s0512a.att-24_p002` ("Saṅkhapālacariyāvaṇṇanā").

## 8. Dataset & deliverables

- **`public/research/naga.json`** — one record per serpent-being instance (schema = §4.2) + the exclusion
  ledger (§4.1 counts) + pre-computed aggregates: `referent × layer` (the disambiguation table),
  `facet × layer` (ontology + soteriology footprints, canon vs commentary), the **H0/H1 per-cell warrant
  tally**, and the canon-vs-commentary instance counts. Versioned `naga-census vX.Y`, corpus-snapshot
  pinned, codebook + query log published alongside (data-availability statement).
- **`NagaStudy`** renderer in `src/ResearchView.jsx` (sibling to `AwakeningStudy` /
  `IndividualGuidanceStudy`): hyperlinked canon/commentary + cross-tab tables, the referent-ledger table,
  the H0/H1 delta table, expandable verbatim evidence; clickable citations (`#/read/<id>`). Admin-gated as
  a standalone Research-tab topic.
- **The paper** (`research/naga/FINDINGS.md` → ingested article) — process-free, hyperlinked, full
  apparatus, the four editorial passes applied (de-AI; adversarial peer review; process-leak scrub;
  whole-document coherence).
- **Internal methods/handoff log** (`research/naga/HANDOFF.md`, separate) — orchestration, tool friction,
  the raw query log, IAA tables. Never bleeds into the paper.

### Honesty commitments (carried into the paper)

Confidence-tag every claim; keep canon / commentary / secondary scholarship rigorously separate; state
scope + limits; **no normative practice claims**. When the tool is unavailable, say so — never dress an
unfound result as a proven negative. The nāga's status is reported as the texts give it (an animal-born
being barred from the path in this life), not editorialised.
