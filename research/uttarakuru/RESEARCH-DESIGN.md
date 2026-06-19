# Research Design & Pre-registration — The Uttarakuruka as a Class of Being

**Study:** What the Pāli tradition holds the people of **Uttarakuru** to be — the northern *mahādīpa*
within the four-continent cosmology — and why these most materially and morally fortunate humans in the
cosmos are, by the canon's own reckoning, *worse placed for awakening* than the humans of Jambudīpa. The
cross-cutting axis is **canon vs commentary**: how much of the Uttarakuru picture is canonically seeded,
and how much the Aṭṭhakathā / Ṭīkā / Visuddhimagga build on a thin frame.

**Status:** FROZEN pre-registration, 2026-06-19. Hypotheses, codebook, scope, and stopping rule below are
fixed *before* the full coded census, so classifications are not fit post-hoc. Corpus snapshot at freeze:
**194,710 passages** (`/api/dbcheck`, 2026-06-19: connected, postgres 16.14, pgvector true, 17 tables).

> This is the *internal* design + methods artifact. The public-facing paper (process-free) and the
> auditable dataset (`public/research/uttarakuru.json`) are separate deliverables. The internal
> orchestration/handoff log is `research/uttarakuru/HANDOFF.md`.

**Sibling study.** Uttarakuru is the designed *inverted mirror* of the nāga
([PREREG_naga_seed.md](../PREREG_naga_seed.md)). The nāga is blessed-but-barred **from below** — an animal
nearly a deva, shut out of the path. The Uttarakuruka is blessed-but-barred **from above** — a human so
effortlessly virtuous and long-lived he is nearly a deva, and that very comfort is the bar. Same
soteriological paradox, opposite pole.

---

## 1. Master question

> *What does the Pāli tradition hold the people of Uttarakuru to be — the northern continent's spontaneous
> rice, ownerless and unmarried life, fixed thousand-year span, and fixed heavenly destiny — and why are
> the cosmos's most fortunate humans, by the canon's own three-fold reckoning (AN 9.21), worse placed for
> awakening than the humans of Jambudīpa? Throughout: how much of this picture is canonical, and how much
> is the commentary building an ethnography onto a thin canonical frame?*

## 2. Sub-questions — three analytical segments, kept distinct in the dataset (not blended)

- **§A — Granular ethnography (the spine).** What an Uttarakuruka *is*, at the finest granularity the
  corpus supports: the northern *mahādīpa* in the four-continent schema (Jambudīpa / Aparagoyāna /
  Pubbavideha / Uttarakuru) and its measure (8,000 yojanas, Vism); the spontaneous unploughed
  self-ripening rice (*akaṭṭhapāka-sāli*); the absence of ownership and mine-making (*amama*, *apariggaha*,
  no *pariggaha*); the fixed lifespan; the wish-/cloth-tree (*kapparukkha*); the absence of fixed marriage /
  guarded women; the climate; and the continent as the iddhi-possessor's **alms-larder** (the Buddha and
  arahants travel there by psychic power for *piṇḍapāta*).
- **§B — The soteriological paradox (the hinge).** **AN 9.21 (Tiṭhānasutta)** runs a *triangular*
  comparison: the Uttarakurukas surpass the Tāvatiṃsa devas and the Jambudīpa humans in three respects
  (*amama*, *apariggaha*, *niyatāyuka* — selfless, unpossessive, fixed-lifespan); the devas surpass in
  three (divine span, beauty, happiness); and the Jambudīpa humans surpass *both* in three — courage
  (*sūra*), mindfulness (*sati*), and **that the holy life is lived here** (*idha brahmacariyavāso*).
  Uttarakuru has the *fruits* of virtue (non-grasping comes automatically) without the *path*. Tie to the
  Kathāvatthu's *Suddhabrahmacariya-kathā* (which quotes AN 9.21), the *pakati-sīla* ("natural virtue")
  classification (Vism), the fixed *sugati* destiny, and the *aṭṭhakkhaṇā* (the inopportune births where
  the holy life cannot be lived). The hinge is: **comfort as anti-renunciation**.
- **§C — Canon → commentary divergence (the dominant segment).** For each §A/§B feature, a warrant test:
  does the feature have a **canonical** attestation (Tipiṭaka mūla), or is it a **commentarial**
  construction (attha / tika / the para-canonical Vism + Milinda)? Preliminary scoping already shows the
  canon is *thicker* than "the commentary is the whole subject": DN 32 (Āṭānāṭiya) carries *amama*,
  *apariggaha*, and the self-ripening rice **in verse**, and AN 9.21 carries the fixed lifespan and the
  soteriological frame. So §C is a *quantified split*, not a foregone "commentary invents it." This segment
  carries the analytical weight precisely because the canonical frame is thin enough to watch the
  commentary build on it.

## 3. Hypotheses (pre-registered, falsifiable, with explicit H0/H1)

- **H_A (ethnographic source split).** The *detailed* ethnography — the specific thousand-year lifespan,
  the *kapparukkha*, the no-marriage / unguarded-women custom, the climate, the named post-mortem destiny —
  is predominantly **commentarial**; the **canon** supplies only a thin seed (the continent's location and
  measure, *amama* / *apariggaha*, the *akaṭṭhapāka* rice, the fixed lifespan as a bare qualifier).
  *Falsifiable:* if a feature lands in mūla canon, it is canonical, not commentarial. Coded per feature
  (§4 `warrant`), reported as the §C split. *Prior expectation given scoping:* a genuine mix — canonical
  seed, commentarial elaboration.

- **H_B (the paradox is canonically seeded, commentarially systematized).** The soteriological bar is
  **already in the canon**: AN 9.21 structurally encodes it (Uttarakuru's three superiorities are material/
  karmic comforts; Jambudīpa's third superiority is *that the holy life is lived here*), and the
  Kathāvatthu debates it. The commentary then **systematizes** it (the *pakati-sīla* category; the
  inopportune-birth / *akkhaṇa* machinery; the "no Buddhas arise there" gloss). *Falsifiable:* if the
  canon nowhere ties Uttarakuru to a soteriological deficit and only the commentary does, H_B is rejected
  in favour of a "commentarial invention" reading.

- **H_main — H0 vs H1, decided per feature (the §C core).**
  - **H0 (faithful systematization):** every commentarial Uttarakuru feature has a traceable canonical
    warrant; commentarial divergences are presentational (filling in a figure, naming a category,
    harmonizing a list).
  - **H1 (innovation):** the commentary adds features with **no** canonical warrant.
  - **Decision rule:** per feature, a warrant test (the canonical passage id that licenses it, or `null`).
    H0 is rejected for any feature with zero canonical attestation. The reported result is the **quantified
    split**, not a single winner. *Prior expectation:* "faithful in frame, generative in detail."

- **H_locus (the canonical footprint is thin, oblique, and not soteriological-by-default).** "Uttarakuru"
  is a low-frequency, commentary-skewed term whose **canonical** occurrences are dominated by (a) a *name*
  in protective-verse and cosmological **lists** (DN 32 Āṭānāṭiya; the four-*mahādīpa* enumerations) and
  (b) the **iddhi-larder** alms motif (Vinaya Mahākhandhaka; the Apadāna; echoed in the para-canonical
  Milinda) — with the explicit *soteriological* reflection concentrated in a **single** sutta, AN 9.21,
  plus its Abhidhamma echo (Kathāvatthu). *Falsifiable by the layer/locus counts in §7.*

## 4. Codebook (frozen — what gets coded, and how)

The study has two coded tables; both resolve every citation to a live corpus row.

### 4a. Feature matrix (the analytical core — §A/§B/§C)

A **feature** = one discrete claim the tradition makes about Uttarakuru (e.g. "self-ripening unploughed
rice"; "fixed thousand-year lifespan"; "no Buddhas arise / holy life not lived there"). The closed feature
list is frozen in the dataset's `features[]`. Per feature, a cell for each **layer band**:

- `canon` — Tipiṭaka mūla (DN/MN/SN/AN/KN/Vinaya/Abhidhamma), **voice = canonical**.
- `para-canon` — work_role=mūla but post-canonical **voice = commentary/para-canon**: Visuddhimagga
  (pli-vism), Milindapañha (pli-mil / the KN-filed Milinda rows). *Flagged distinctly — this is the
  layer≠voice case the corpus forces and the study must not blur.*
- `attha` — Aṭṭhakathā (work_role=attha).
- `tika` — Ṭīkā (work_role=tika).

Each cell carries: `present` (∈ attested / absent / oblique), `text` (a one-line scholarly summary),
`cites[]` (`{id, label}`, each resolving to a real row), and — for the feature as a whole — a `warrant`:
the **canonical** id that licenses the feature, or `null` (→ counts toward **H1**). Each feature is tagged
with its `segment` (§A / §B / §C-salient) and an `h0h1` verdict (`canonical-seed` / `commentarial-detail` /
`commentarial-innovation`).

### 4b. Passage census (the audit trail — every Uttarakuru-bearing row)

One record per enumerated row: `id, citation, sc_id, pts_ref, work_slug, layer` (mula/attha/tika/anya),
`voice` (canonical / para-canon / commentary), `motif` (controlled vocab: `cosmology` / `ethnography` /
`larder-iddhi` / `soteriology` / `simile` / `name-in-list`), `features[]` (which feature-rows the passage
attests), `evidence_pali` (verbatim window), `evidence_en` (Sujato/ATI if present, else **author's gloss**,
`tr_provenance` ∈ {`sujato`, `ati:<translator>`, `author`}), and `excluded` + `exclude_reason` for rows
carried only to *document* the disambiguation (the Kuru janapada, the *kuru-dhamma* observance, the bare
"like-Uttarakuru" simile when it concerns the Kuru country, not the continent).

**Coding reliability.** The load-bearing judgments — each feature's `warrant` (canonical id or null), its
`h0h1` verdict, and each census row's `voice` + `motif` + `excluded` — are coded by **k≥3 blind coders**
working from the pre-fetched verbatim evidence; inter-coder agreement (IAA) is reported per field;
disagreements are adjudicated and logged.

## 5. Methodology

- **Corpus & edition.** CST/VRI (Chaṭṭha Saṅgāyana) as ingested into `dhamma-pg`; SuttaCentral ids as the
  cross-walk; DPD/PED/DPPN for lexis. CST is used because it is the only layer carrying the full
  Aṭṭhakathā + Ṭīkā the canon-vs-commentary axis requires. CST ≠ PTS pagination; PTS vol.page is added per
  citation where available. The corpus carries **both** a CST row and a SuttaCentral row for many
  canonical passages (e.g. DN 32 = `cst-s0103m.mul-dn3_9` *and* `dn32`); the census records the unique
  passage once, preferring the id that carries an English translation, and notes the parallel id.
- **Search method = documented + fully logged (a first-class deliverable).** Every query is recorded:
  `term · mode · scope · pitaka · layer · endpoint · result-count`. The primary lane is **direct SQL**
  against `dhamma-pg` (via `flyctl proxy 15432:5432`), because the headline finding is a load-bearing
  **count split** (canon vs commentary) and the FTS search lane over/under-matches inflected Pāli — see
  §7, where exact-FTS finds 15 rows but substring finds 144. The live API (`/api/passage/:id`,
  `/api/search`, `/api/passage/:id/commentary`) is used for spot-checks, the canon→commentary jump, and to
  confirm every cited row resolves. The API is driven **serially and gently** (the box has no concurrency
  guard).
- **Disambiguation gate (mandatory, run first).** Three referents the term blurs are separated and the
  exclusion counts reported: **(i)** *Uttarakuru* — the northern continent (target); **(ii)** *Kuru* — the
  *janapada* in Jambudīpa (Kammāsadhamma; "Kurūsu viharati", where Satipaṭṭhāna / MN 10 / DN 22 / MN 75
  are taught); **(iii)** *kuru-dhamma / kuru-vatta* — the moral observance of the Kurudhamma Jātaka. The
  commentary itself plays on the resonance (Ps-pṭ 1 §928 calls the Kuru country "like Uttarakuru" by the
  latent force of the *kuru-vatta* — all three referents in one sentence); this slippage is a reported
  finding, not a footnote.
- **Citation apparatus.** SuttaCentral id (primary) + PTS vol.page (where available) + CST row-id. Variant
  readings flagged (e.g. AN 9.21 *visesaguṇā* / *visesabhuno* (sī. syā. pī.); *uttarakuruvho* /
  *uttarakurū rammā*). Diacritics: IAST/ISO 15919; ṁ/ṃ as in the source row.
- **Translation provenance.** Where the corpus has English (the SuttaCentral mūla rows: AN 9.21, DN 32,
  the Vinaya, Milinda) the rendering is **Sujato** unless an ATI translator is shown. The Aṭṭhakathā / Ṭīkā
  and the Pāli-only Vism rows carry **no English in the corpus**; every such rendering is the **author's
  own gloss** (`tr_provenance=author`), checked against Ñāṇamoli's *Path of Purification* (Vism) and the
  standard renderings where they exist.
- **Scope & limits.** Pāli / Theravāda only (Tipiṭaka + Aṭṭhakathā + Ṭīkā + the para-canonical Vism /
  Milinda). The Sanskrit/Sarvāstivāda *Uttarakuru* (the Abhidharmakośa cosmology, the *Lokaprajñapti*) and
  the wider Indic *Uttarakuru* (the Mahābhārata's northern paradise) are a **bounded secondary horizon**
  named in the literature review, not primary witnesses.
- **Literature engaged** (so results confirm/quantify, not rediscover): the Buddhist cosmology — Kloetzli
  *Buddhist Cosmology* (1983), Gethin "Cosmology and meditation" (1997), Sadakata *Buddhist Cosmology*
  (1997); the four continents / *cakkavāḷa* — Reynolds & Reynolds *Three Worlds According to King Ruang*
  (1982); the *akkhaṇa* / inopportune births — Anālayo on rebirth and the human realm; Uttarakuru in
  Indic myth — the *Mahābhārata* / Purāṇic Uttarakuru and its relation to the Greek Hyperboreans
  (secondary horizon only).

## 6. Stopping rule (saturation — engineered for "zero missed", honestly bounded)

Target: no Uttarakuru-bearing passage and no distinct feature left on the table. Procedure: **(1)
structural enumeration first** — the four-*mahādīpa* schema, the closed protective-verse geography (DN 32),
and the known loci (AN 9.21, the Vinaya larder, Milinda) bound the universe before free search; **(2)
exhaustive substring + multi-modal search** — `uttarakuru` and every inflection/compound by SQL substring,
plus the four-continent frame (`aparagoyāna` / `pubbavideha` / `mahādīpa` / the cakkavatti dominion) to
catch concept-hits the bare term misses, all logged; **(3) loop-until-dry** — add strategies (feature
terms: *akaṭṭhapāka*, *kapparukkha*, *amama*, *niyatāyuka*; the simile *uttarakuru viya*) until **2
consecutive rounds surface zero new passages or features**; **(4) reconcile against external lists** — the
secondary cosmology scholarship's cited loci, the *aṭṭhakkhaṇa* list, the Vism cosmology chapter; each
accounted for; **(5) k≥3 blind coders** sweep and union the finds. **Stopping criterion = saturation.**
**Honest limit (stated in the paper):** this drives recall to saturation and *measures* the residual; it
cannot *prove* zero unknown-unknowns in an open corpus. The distinctive deliverable is the **auditable
enumeration + the disambiguation negatives**.

## 7. Frozen findings at design time (the reconfirmation the method requires)

- **Corpus snapshot:** 194,710 passages, 2026-06-19. work_role counts: mula 17,996; attha 91,843;
  tika 81,841; anya 3,030.
- **Target term — `original ILIKE '%uttarakuru%'` (all inflections/compounds): 144 rows.** By layer:
  **mula 20, attha 64, tika 46, anya 14.** This is the honest superset. The **exact-FTS** token search
  (`/api/search?q=uttarakuru&mode=exact`) returns only **15 rows** — a real undercount, because FTS
  tokenizes and misses *uttarakurūsu* / *uttarakuruka* / *uttarakurudīpa* / the compounds. *This
  exact-vs-substring gap is itself a recorded methodological finding (why the SQL reconfirm step exists).*
- **The 20 layer-mula rows split by voice (the layer≠voice case):** **14 Tipiṭaka-canon** rows (with
  CST+SC duplicate representations of single passages — Kathāvatthu, AN 9.21, DN 32, Apadāna, a KN book,
  Vinaya) + **2 Visuddhimagga** (pli-vism) + **4 Milindapañha** (pli-mil and the KN-filed Milinda rows),
  the last six being **para-canonical in voice** though `work_role=mula` structurally.
- **Canonical loci confirmed at freeze** (full text fetched, verbatim): AN 9.21 (the triangular hinge —
  Uttarakuru *amama/apariggaha/niyatāyuka*; Jambudīpa *sūra/sati/idha-brahmacariyavāsa*); DN 32 Āṭānāṭiya
  (*amama, apariggaha, akaṭṭhapāka-sāli*, no sowing/ploughing — the rice ethnography **in canon**);
  Kathāvatthu *Suddhabrahmacariya-kathā* (quotes AN 9.21 to debate where the holy life is lived); Vinaya
  Mahākhandhaka + Verañjakaṇḍa (the Buddha / Moggallāna and the alms-trip to Uttarakuru — the larder
  motif); Apadāna (arahants travel by iddhi to the continents); Vism §6.29 (*uttarakurukānaṃ ... avītikkamo
  pakatisīlaṃ* — the automatic-virtue classification); Vism §73.57 (Uttarakuru = 8,000 yojanas); Milinda
  3.7.9 (*Uttarakurukādigamana-pañha* — going there in this very body by iddhi).
- **Disambiguation negatives (frozen):** bare `kuru` **not** `uttarakuru` = **977 rows** (the Kuru
  janapada + misc — *excluded* from the continent census, *reported* as the blur); `kurudhamma` /
  `kuruvatta` = **26 rows** (the moral observance — excluded); the four-continent **frame** (other
  continents present, bare term absent) = **~29 rows** (triaged for genuine Uttarakuru relevance and folded
  in where they concern the schema); the cakkavatti `cāturanta` epithet = 125 rows (excluded as an
  epithet, "four-ended earth"; the DN 17 / DN 26 four-continent **conquest narrative** folded in
  selectively).

## 8. Dataset & deliverables

- **`public/research/uttarakuru.json`** — `meta` + `disambiguation` (the exclusion counts) + `features[]`
  (the §A/§B/§C feature matrix with per-layer cells, `warrant`, and `h0h1` verdict) + `census[]` (every
  Uttarakuru-bearing row, coded per §4b) + `aggregates` (feature×layer presence; the H0/H1 warrant tally;
  locus×motif). Versioned `uttarakuru-census vX.Y`, corpus-snapshot pinned, codebook + query log published
  alongside. A deterministic `uttarakuru-consistency` check guards every count the paper renders.
- **`UttarakuruStudy`** renderer in `src/ResearchView.jsx` (sibling to `HeartBaseStudy` /
  `IndividualGuidanceStudy`): hyperlinked canon/para-canon/attha/tika feature tables, the H0/H1 split, the
  disambiguation panel, expandable verbatim evidence (`#/read/<id>`), admin-gated via the existing Research
  tab + `/api/research`.
- **The paper** (`research/uttarakuru/FINDINGS.md` → optionally an ingested article) — process-free,
  hyperlinked, full apparatus, the four editorial passes applied.
- **Internal methods/handoff log** (`research/uttarakuru/HANDOFF.md`, separate) — orchestration, the raw
  query log, IAA tables, tool friction; never bleeds into the paper.

## 9. Honesty rules (binding)

Confidence-tag every claim; keep canon / para-canon / commentary / secondary rigorously separate. State
scope + limits. **No normative practice claims.** Where the tool was unavailable or a row failed to
resolve, say so; never dress an unfound result as a proven negative. The Uttarakuru material is descriptive
cosmology, not a practice instruction — the paper presents what the sources hold, and flags the
later/Sanskrit horizon as outside the warranted Pāli frame.
