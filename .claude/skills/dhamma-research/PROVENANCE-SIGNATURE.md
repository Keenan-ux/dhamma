# PROVENANCE-SIGNATURE.md

A methodology core for the `dhamma-research` skill. It replaces the single
"canon vs commentary" axis with a *provenance signature*: a small, triaged set
of independent dimensions that together answer where a claim comes from, how
original it is, how authoritative it is, and how literally it was meant. The
skill imports this file and invokes its triage at study-design time.

This is an internal method standard. It is written for the operator and for the
skill's own design step, not for publication. The studies it *produces* must
still obey the skill's writing standard.

---

## 1. The diagnosis

The skill currently has one depth axis: **canon vs commentary** — the
`mūla / aṭṭhakathā / ṭīkā / anya` structural layer, plus a binary
buddha-voice / commentary-voice tag. It treats that one bit as if it answered
the whole provenance question. It does not. Canon-vs-commentary is *one
projection* of a richer object, and it silently conflates several independent
dimensions:

- **Structural layer is not chronological time.** A `mūla` row can be
  late-canonical. The structural column tells you where a passage sits in the
  edited corpus; it does not tell you when the formulation entered the
  tradition.
- **Structural layer is not epistemic status.** The texts themselves grade
  their own claims: some are staked under a "directly verified" formula, others
  are stated flat as assumed background. A single `mūla` bit is blind to this.
- **Structural layer is not communicative purpose.** A protective chant
  (*paritta*) and a doctrinal analysis make claims at different literalness.
  Both are `mūla`.
- **Structural layer is not provenance-outside-Pāli.** Much canonical material
  is inherited pan-Indian furniture, not Buddhist innovation.

**The Uttarakuru study is the paradigm failure.** A canon-vs-commentary study
concluded "a small canonical frame, a large commentarial superstructure; the
commentary supplies the soteriological verdict." True but incomplete. Deeper
reading found four things the skill never coded:

1. **Chronology inside the canon.** The literal-place reading deepens
   monotonically with lateness. Core Nikāya prose (AN 9.21, AN 3.80) has
   Uttarakuru as a bare *name* in a list or comparison. The *described* place
   (DN 32, a late paritta) and the *visited* place (Apadāna verse, Vinaya
   frame-narrative — the Buddha flies there for alms) are late-canonical. Only
   *then* does the commentary measure and materialise it. The gradient is
   invisible to a `mūla/attha/ṭīkā` split.
2. **Epistemic marking.** The canon's stereotyped "directly verified" formula
   (the divine eye: *dibbena cakkhunā ... I see beings reborn by kamma*) is
   attested hundreds of times and *always* verifies rebirth-destiny, *never*
   the four continents. The continental geography is stated flat. The texts
   assign different epistemic status to rebirth-cosmology and
   continental-geography; the skill codes content, not epistemic status.
3. **Recall failure.** The first enumeration searched the string `uttarakuru`
   (short final *u*) and missed the long-*u* declined forms
   (`uttarakurū-naṁ / uttarakurū-su`) that carry the four-continent cosmology
   (144 → 161 rows with the honest stem). Recall is a measured variable, not an
   assumption.
4. **Reception overlay.** The standard English renders *lokadhātu*
   (world-system) as "galaxy" — a modern frame the Pāli does not carry.

**The individual-guidance study is the second paradigm failure — a different
blind spot.** A study of how the Pāli tradition matches a person to a meditation
practice searched essentially one word-family (*carita*, the six-temperament
compound) and read it as "person-typing is a late commentarial habit": *carita*
is 0 in the four Nikāyas and the Abhidhamma. Every *carita* count was correct;
the conclusion was still incomplete, because the **search was the cage**. A
wide-recall sweep across the *rival* vocabularies the question never named found
the canon individuates persons robustly and early — by present-mind root-sort
(*sarāgaṃ cittaṁ*), faculty-maturity (*indriyaparopariya*), receptivity-speed
(the *ugghaṭitaññū* tetrad), and a fully systematized liberation-mode roster (the
seven *ariya-puggala*, every term long-ā **ASCII-invisible** to a diacritic-naive
search). The axis the data actually cleaves on was not chronology but
**function-vs-essence**: the canon reads what a person presently *does / leans
toward*, the commentary freezes it into a fixed *type*; *carita* is one local
instance of a corpus-wide late *nominalization*. The original question was not
false but **demoted to a special case** of a larger one the framing could not
see — and a serendipity lane (a pass told to ignore the question) surfaced two
findings of general importance the study would otherwise never have reported (an
early canonical homophily law, SN 14 *dhātuso sattā saṁsandanti*; a corpus-wide
essentialization drift, *sabhāva* ~0 in canon then thousands in commentary).

**The capstone defect is that the skill is question-blind.** It applies the
same single lens to every research question, regardless of which provenance
dimensions that question is actually load-bearing on. The fix is a *triage*:
map the research-question's load-bearing claims to the axes they depend on, and
mandate coding only those. The framework is a flexible diagnostic, not a
checklist. Coding all axes on every instance would bury a study; the triage is
what keeps it tractable.

**The companion defect is that the skill is question-bound.** Where the triage
fixes question-*blindness* (it codes only the load-bearing axes), it still trusts
the question to name the right vocabulary and to assume the right primary axis.
Both can be wrong, and the data can say so. The fix is a discovery front-end
(§3.6), run *before* the vocabulary and the spine are fixed: cast recall
horizontally across rival apparatus, cross-read the signature axes to find where
the data actually clusters, keep a serendipity lane open, and treat the question
itself as demotable. The triage then clamps onto whatever survived. **Recall must
exceed the question; the spine is discovered, not assumed.**

---

## 2. The provenance signature — the axis set

After merging redundant candidates and adding the genuinely missing
dimensions, the set is **eleven axes** in three clusters, plus a thin set of
process disciplines (§3) and standing methods rules. Each axis carries a
**cost tier** (see §5): **CHEAP** axes are SQL-derivable from corpus metadata
and run on every study; **EXPENSIVE** axes need per-claim close reading or
external corpora and run only when triaged in.

The signature is coded **per claim**, not per row. A single passage interleaves
speakers, registers, and epistemic statuses; the unit of coding is the
load-bearing claim, with its supporting passage and char-window cited.

> **Per-claim-granularity guard (enforce, don't just state).** A work→code
> lookup (a `WORK_ATTRIBUTION[work]` / work→register map) is a **recall aid for
> seeding candidate codes**, *never* the recorded per-claim code. The recorded
> code must be a function of the *row's own* content, verified by reading the row.
> Before any per-claim count (attribution, epistemic, harmonization) is frozen,
> spot-audit ≥8 coded rows across work-classes and confirm each code matches that
> row, not its work-class; a category that comes out exactly 0, or exactly equal
> to a work's row-count, is the diagnostic signature of a per-work shortcut and
> must be re-coded per row. **Failure case on record:** the awakening census R1
> retrofit coded attribution by work-class (`nikāya-prose → redactor-frame`
> wholesale), which hard-zeroed `buddha-vacana` and published a false "0 of 299"
> headline; per-claim re-coding found 17 rows (9 deduplicated recollections) of
> the Buddha asserting his own awakening. The rule below existed; the *verification
> step* did not. This guard is that step.

> **Axes considered and rejected** (per the Step-5 discipline, exclusions are
> justified in writing, not silently dropped):
> *regional transmission* = recension (I.4) + edition (I.7);
> *named-commentator* = attribution (I.2) × chronological stratum (I.1);
> *metrical archaism* = chronology (I.1) + genre/register (I.3);
> *ritual performativity* = genre/register (I.3) × epistemic marking (II.7);
> *polysemy* = the semantic-drift strip (output of I.1) + recall RUNG-4;
> *redactional seams* = attribution (I.2) + genre/register (I.3) + the
> formulaic-composition discipline;
> *standalone doctrinal-coherence* = analyst-imposed; replaced by the
> harmonization status axis (I.8), which makes the tradition's *own* flagging
> of a tension the evidence.

### Cluster I — Provenance layers (where the claim comes from)

---

#### I.1 — Chronological stratum  ·  CHEAP

**Definition.** The relative time-depth of a passage within the textual history
of the tradition, coded *independently* of its structural layer. A canonical
row is not chronologically flat; a commentary is not a single moment. This axis
answers *when* a formulation entered, using the consensus relative
stratigraphy of Pāli philology, and explicitly distrusts the structural layer
as a proxy for time.

**Diagnostic question.** When, in the tradition's own development, did this
formulation enter — and is its structural layer misleading me about its age?

**Coding values.** `archaic-canonical` · `early-canonical` · `late-canonical` ·
`abhidhamma-canonical` · `paracanonical` · `classical-commentary` ·
`sub-commentary` · `reception` · `indeterminate`

**Operationalisation.** Do *not* derive stratum from the `mūla/attha/ṭīkā`
column — that is the conflation this axis breaks. Code from the **work +
position**:
- Build a work→stratum lookup seeded from the citation prefix. AN/SN/MN/DN
  prose → `early-canonical`; Sn (Aṭṭhaka-/Pārāyana-vagga = Snp 4–5) and archaic
  SN verse → `archaic-canonical`; DN 32 (Āṭānāṭiya), DN 30, Buddhavaṁsa,
  Cariyāpiṭaka, Apadāna, Vimāna-/Petavatthu, Niddesa, Paṭisambhidāmagga, the
  Vinaya frame-narratives (nidāna) → `late-canonical`; the seven Abhidhamma
  books → `abhidhamma-canonical` (a parallel late branch, *not* merged with
  Nikāya "early"); Nettippakaraṇa / Peṭakopadesa / Milindapañha →
  `paracanonical`; Aṭṭhakathā (Buddhaghosa / Dhammapāla, c. 5th c. CE redaction
  of older Sīhala material) → `classical-commentary`; Ṭīkā → `sub-commentary`;
  modern translation/note → `reception` (overlaps I.6).
- **Within** a work, refine by position/genre: a nidāna-frame or uddāna sits
  later than the doctrinal body it wraps. SQL sketch:
  `SELECT id, citation, layer, position FROM passages WHERE original ~* 'X'`,
  then JOIN the work→stratum map; **flag any row whose structural layer and
  stratum disagree** (e.g. `layer='mūla' AND stratum='late-canonical'`) as the
  analytically interesting case.
- **Bind the count-harness to this stratum set.** When recall runs as a batched
  count (a `CASE`/bucket over `work_slug`), the bucket definition *is* a coding
  decision: declare it as a frozen, reviewable artifact (`work_slug → stratum`)
  and check it for hidden lumping *before* the run. **Always carry the full
  stratum set above** (sutta-piṭaka / Vinaya / `abhidhamma-canonical` /
  `late-canonical` / `classical-commentary` / `sub-commentary` / Vism), rolling
  up to a coarse canon-vs-commentary split *only for the headline*. A
  `1canon = AN/SN/MN/DN/Vinaya/Abhidhamma` lump hides sutta-vs-Abhidhamma (it put
  `gotrabhū` at 216 "canon" when it is ~0 sutta, heavy in Abhidhamma+commentary);
  a `para` lump hides early-vs-late-canon. Backstop: a term the field treats as
  late over-counting in a rolled-up canon bucket means the bucket is hiding a
  boundary — split one stratum finer and file the split.
- Where Pāli-internal dating is contested, downgrade confidence and defer to
  I.4 (recension) rather than asserting.

**Trigger.** Load-bearing whenever the question is "is X canonical / how old /
how original to the earliest teaching?" or whenever a finding rests on a
canon-vs-commentary contrast — because if the canonical instances are
themselves late-canonical, the contrast collapses and the real story is
monotonic chronological deepening.

**Failure mode / honesty guard.** The dominant failure is reading the
structural layer as the timeline. A second is importing absolute BCE/CE dates
the Pāli cannot support. Stratum is **relative and contested**: code it with an
explicit confidence and a one-line philological warrant (archaic verse metre,
Apadāna/Buddhavaṁsa membership, frame-narrative position). Where the field
disagrees, code `indeterminate` rather than picking a side. Never let a single
late-canonical instance be averaged into "the canon says."

**Paper implication.** Drives the **stratigraphy table** as a first-class paper
object (rows = instances; columns = work, structural layer, stratum, with
layer/stratum disagreements highlighted). The narrative is organised by
ascending stratum so the reader sees the gradient. A "within-canon chronology"
subsection becomes mandatory whenever any canonical instance codes
late-canonical. When a single term is tracked across strata, the axis also
emits the **semantic-drift strip** (§3.3).

---

#### I.2 — Attribution / speaker  ·  EXPENSIVE

**Definition.** *Who* the text presents as the source of a claim — the
illocutionary owner — as distinct from who composed or redacted the row. A
sentence in a `mūla` passage can be voiced by the Buddha, a named disciple, a
deva or Māra, an opponent (sometimes only to be corrected), or the anonymous
redactor of the frame. Authority depends on the attributed speaker; the
structural layer does not encode this.

**Diagnostic question.** Whose mouth does the text put this claim in — the
Buddha asserting it, or a frame-narrator, a deity, or an interlocutor the text
will overturn?

**Coding values.** `buddha-vacana` · `named-disciple` · `deva-or-mara` ·
`opponent-uncorrected` · `opponent-then-corrected` · `redactor-frame` ·
`reported-speech-hearsay` · `indeterminate`

**Operationalisation.** Code per claim, since a passage interleaves speakers.
Search the Pāli `original` for quotative markers: Buddha-vacana —
`bhagavā etadavoca`, `evaṁ vutte bhagavā`, vocative `bhikkhave`, first-person
`ahaṁ/mayā` in a sutta body; named-disciple — `āyasmā ... etadavoca`,
`thero āha`; deva/Māra — `devatā`, `māro pāpimā`, verses introduced by a named
yakkha/deva (DN 32 is dense with these); opponent —
`paribbājako/brāhmaṇo ... evamāha` followed by a corrective `na kho ... evaṁ`
or `bhagavā ... paṭikkhipi`; redactor-frame — the nidāna itself
(`evaṁ me sutaṁ`, `tena samayena`, place/audience setup) and the uddāna
mnemonics; reported-speech — embedded `iti` clauses and `sutaṁ` flagged as
merely heard. A regex pass for `etadavoca|etaṁ avoca|āha|sutaṁ|iti` locates
speaker boundaries. **The honest default for a flat background statement with no
quotative owner is `redactor-frame`, not `buddha-vacana`.**

**Trigger.** Load-bearing whenever the question is "did the *Buddha* assert X?"
(not merely "does the canon contain X?"). Pairs tightly with II.7 (epistemic
marking): attribution says whose claim it is, epistemic marking says how that
owner pitched it.

**Failure mode / honesty guard.** The classic failure is laundering
frame-narrative or deva-speech into Buddha-vacana. A subtler one is missing the
opponent-then-corrected pattern and coding a view the text introduces only to
refute as endorsed. Require an explicit quotative warrant to code
`buddha-vacana`; absent it, code `redactor-frame` or `indeterminate`. For
opponent material you **must** scan forward for the corrective move before
coding `opponent-uncorrected` vs `opponent-then-corrected`.

**Paper implication.** Adds a **speaker column** to the per-claim signature and,
where speaker mix is the story, a "who is speaking" section. Forces "the
Āṭānāṭiya frame, voiced by the yakkha Vessavaṇa, describes…" rather than "the
canon describes…". Opponent-then-corrected instances get their own treatment so
a refuted view is never reported as canonical doctrine.

---

#### I.3 — Genre & register  ·  CHEAP

*(merges the former "functional register" and "genre & structural position"
axes; they always co-fire on literalness questions.)*

**Definition.** The literary form, structural position, and communicative
purpose of the unit carrying the claim — what *kind* of speech-act it performs,
independent of content and structural layer. Two coded facets:
- **(a) Form / position** — verse (*gāthā*) vs prose; and *where* in the
  architecture: nidāna-frame, doctrinal body, uddāna mnemonic, simile-vehicle;
  question-elicited vs spontaneous.
- **(b) Communicative register** — doctrinal-analytical, ritual-protective
  (*paritta*), narrative-hagiographic, disciplinary-legal, scholastic-polemic,
  gnomic-verse.

Register and position govern how literally a statement was meant: ritual and
narrative registers tolerate vivid concretisation that doctrinal register would
not assert; an uddāna names a topic for recall rather than asserting it.

**Diagnostic question.** What is this passage *trying to do* — analyse,
protect/bless, edify-by-story, regulate conduct, or win an argument — at what
structural position, and does that purpose license reading its claims literally?

**Coding values.**
Form/position: `verse-gatha` · `prose-doctrinal-body` · `prose-nidana-frame` ·
`uddana-mnemonic` · `simile-vehicle` · `question-elicited` ·
`spontaneous-udana`.
Register: `doctrinal-analytical` · `ritual-protective` ·
`narrative-hagiographic` · `disciplinary-legal` · `scholastic-polemic` ·
`gnomic-verse` · `indeterminate`.
Also carries the **stock/unique** sub-classification (see §3.5):
`stock-pericope` · `unique-composed` · `semi-formulaic-slotted`, with a
recurrence count.

**Operationalisation.** Mostly a work→register/position lookup with mid-work
refinement, derivable from `citation`, `position`, `work_slug`.
- *Form:* verse rows carry metrical line-breaks and hemistich marks in the CST
  `original`, citations ending in verse-numbers, and the KN verse-collections;
  prose is the default. The 25 CST volume-header uddāna rows match
  `^cst-[a-z0-9]+m\.mul-(dn|mn|sn|an|kn)\d+$` with `position=1` and are hidden
  from `/api/corpus` — re-include them deliberately when coding genre, and
  note the handling.
- *Register:* a work→register map covers most rows (paritta corpus =
  DN 32 Āṭānāṭiya, Khp Maṅgala/Ratana/Metta, Bojjhaṅga, Aṅgulimāla; Vinaya
  piṭaka; Apadāna/Jātaka; Kathāvatthu). Refine by structural cues: doctrinal —
  `katamo/katamā`, numbered factor-lists, the four-truths / dependent-origination
  templates; ritual — benediction formulae `sotthi te hotu`, `rakkhaṁ`,
  recitation metre; narrative — Apadāna/Jātaka, `atīte`, biographical past
  tense; disciplinary — `anāpatti/āpatti`, `na bhikkhave`, case-and-ruling;
  polemic — Kathāvatthu `... ti? Āmantā. ... ti? Na hevaṁ vattabbe`.
- *Stock/unique:* take the unit's distinctive opening string and search it
  across the corpus (exact, then stem for inflected joints); classify
  `stock-pericope` at ≥5 near-verbatim hits across multiple works,
  `unique-composed` for a (near-)hapax, `semi-formulaic-slotted` for a stock
  skeleton with a slotted variable. Record the recurrence count.

**Trigger.** Load-bearing whenever the question is "how literally was X meant?",
"is X a doctrinal commitment?", or "is this core teaching or incidental
scene-setting / mnemonic?". Pairs with II.7: register sets the default
literalness, epistemic marking can override it.

**Failure mode / honesty guard.** Failures: flattening register (quoting a
paritta benediction or a Jātaka flourish as doctrine); **uddāna-as-teaching**
(never cite an uddāna as the warrant for a claim's content); **frame-as-doctrine**
(reading a claim in a frame-narrative as a teaching about its content); **verse
literalism** (taking a verse claim at prose-literal face value when it may be
*metri causa*); **recurrence-inflation** (citing a stock formula's N
occurrences as N independent thematic endorsements — they are one redactional
unit deployed N times; the formula's *boundary* may be cited as a redactional
fact, its raw count may *not* be cited as proportional emphasis). Tie each
literalness claim to its register with a marker citation; flag "register-only"
claims that exist *only* in protective/hagiographic register and never in
doctrinal-analytical register.

**Paper implication.** Adds **register** and **structural-position** columns and
motivates a "how literally" discussion keyed to register rather than to
canon/commentary. Enables a "within-canon stratigraphy" subsection
(bare-name-in-prose → described-in-verse-paritta → visited-in-frame-narrative).
Separates doctrinal-body claims (load-bearing) from frame-narrative
(scene-setting) and uddāna paratext (excluded with a note). The stock/unique
flag and recurrence count enter the per-claim signature, so a reader can tell
whether a frequency statistic is about a theme or a transmission artefact.

---

#### I.4 — Cross-recensional attestation  ·  EXPENSIVE

**Definition.** Whether a formulation is attested *only* in the Pāli Theravāda
recension or also in independent parallel transmissions (Chinese Āgamas,
Sanskrit fragments, Gāndhārī, Tibetan) — and therefore whether it plausibly
predates the sectarian split (pre-sectarian core) or is a Theravāda-local
development. Multiple-recension attestation is the strongest available proxy
for antiquity that does *not* depend on contested Pāli-internal dating.

**Diagnostic question.** Does this formulation survive in transmissions
independent of the Pāli line — pointing to a pre-sectarian core — or is it
Pāli-only and possibly a Theravāda-local elaboration?

**Coding values.** `multi-recensional-pre-sectarian` ·
`pali-plus-external-partial` · `pali-only-parallels` · `pali-unique` ·
`feature-not-in-parallel` · `untested`

**Operationalisation.** The corpus is Pāli-only, so bridge out via the ingested
SuttaCentral parallels (~30,741 rows). (1) Resolve the passage to its
SuttaCentral id. (2) `SELECT * FROM parallels WHERE source_id = :scid`;
classify targets as in-corpus (Pāli) vs external (Chinese SA/MA/EA/DA, Sanskrit,
Gāndhārī, Tibetan) by id prefix. (3) Code `multi-recensional` if ≥1 external
parallel exists in a different line, `pali-only` if parallels are Pāli-internal
only, `pali-unique` if none. **Distinguish container from feature:** a sutta can
have an Āgama parallel that lacks the cosmological detail at issue — code
`pali-plus-external-partial` / `feature-not-in-parallel` accordingly. Where the
tool lacks the parallel text, code the *container* and flag the feature-level
claim as `untested`; use WebFetch to SuttaCentral to confirm an external
parallel's content when the claim hinges on it.

**Trigger.** Load-bearing whenever the question is "is X part of the earliest /
pre-sectarian teaching?" or "is X distinctively Theravāda?". The antidote to
over-reading Pāli-internal chronology; it cross-checks I.1.

**Failure mode / honesty guard.** (a) The container-vs-feature error — treating
"has an Āgama parallel" as proof the contested *feature* is ancient. (b) Coding
`pali-unique` from absence in an incomplete parallel table. Treat absence of a
parallel row as `untested` unless affirmatively checked; never assert
pre-sectarian status without feature-level confirmation in the external
witness.

**Paper implication.** Adds a **recension column** to the stratigraphy table and
a "cross-recensional attestation" subsection that can corroborate or undercut
the within-canon chronology — e.g. "the bare-name uses have Āgama parallels
(plausibly pre-sectarian), but the materialised-continent description is
Pāli-only."

---

#### I.5 — Pre- / extra-Buddhist provenance  ·  EXPENSIVE

**Definition.** Whether a concept is a Buddhist innovation or an element
*inherited* from the surrounding pan-Indian culture (Vedic/Brahmanical, Jain,
Ājīvika, general Indian cosmology and folklore) that Buddhism absorbed,
repurposed, or merely failed to discard. The structural axis treats everything
in the canon as "Buddhist"; this axis asks whether the Buddha-ness of a
canonical element is original or merely inherited.

**Diagnostic question.** Did Buddhism *invent* this or *inherit* it from the
pre-existing Indian religious world — and is its canonical presence therefore
evidence of Buddhist doctrine or of shared cultural furniture?

**Coding values.** `buddhist-innovation` · `inherited-repurposed` ·
`inherited-unmodified-background` · `contested-provenance` · `untested`

**Operationalisation.** Code against controls from the non-Buddhist Indian
corpus and comparative attestation. Markers of inherited material: terms/figures
shared with Vedic/Brahmanical cosmology (Meru/Sineru, the continents, Sakka/
Indra, Brahmā, Yama, the cakkavatti ideal), Jain parallels, and elements the
texts frame as pre-existing (`brāhmaṇā āhaṁsu`, `porāṇā`, "as said of old").
Markers of innovation: terms with no pre-Buddhist attestation in the relevant
sense (*paṭiccasamuppāda*, the *anattā* analysis, the four-truths framing,
*nibbāna* redefined). Tactic: (1) check pan-Indian attestation independent of
Buddhism; (2) check whether the canon *repurposes* vs merely *repeats* (the
cakkavatti is inherited-in-form but doctrinally repurposed; the four continents
are largely repeated background); (3) combine I.4 with external Indic
attestation — inherited material tends to be both multi-recensional *and*
attested outside Buddhism. **This axis requires external (non-Buddhist)
evidence; WebFetch / scholarly cross-reference is mandatory** — never code
`inherited` or `innovation` from the Buddhist corpus alone.

**Trigger.** Load-bearing whenever the question is "is X *original* to
Buddhism?" as opposed to "is X in the canon?". Prevents crediting Buddhism with
(or indicting it for) what it merely inherited.

**Failure mode / honesty guard.** Treating canonical *presence* as Buddhist
*endorsement/origination*; conversely over-claiming inheritance for genuinely
repurposed concepts. Cite the Vedic/Jain/comparative warrant or code `untested`.
Distinguish `inherited-unmodified` from `inherited-repurposed` explicitly — the
difference is whether Buddhism did doctrinal work on it.

**Paper implication.** Adds a **provenance column** and an "inherited vs
innovated" discussion. A claim coded `inherited-unmodified-background` cannot
bear the weight of "Buddhism teaches X." Separates the pan-Indian cosmological
skeleton Buddhism absorbed from whatever it did doctrinally with that skeleton.

---

#### I.6 — Reception / translation overlay  ·  CHEAP

**Definition.** The modern interpretive stratum laid over the Pāli — translator
word-choices, editorial framing, popular and scholarly glosses — that readers
experience as if it were the text but which the Pāli does not carry. This is a
provenance layer like any other, at the *shallow* end of the timeline: it has
an author (the translator/editor), a date (modern), and a tradition (reception
history). (The reflexive "declare your own analytic vocabulary" job is *not*
coded per claim here; it is a standing methods rule — see §6.)

**Diagnostic question.** Is this feature in the *Pāli*, or an artefact of the
translation/edition/modern framing I am reading through — and whose modern
choice introduced it?

**Coding values.** `in-pali-faithful` · `translation-frame-imported` ·
`translator-divergent` · `editorial-framing` · `untested`

**Operationalisation.** Compare the Pāli `original` against the English
`translation` field. (1) For any load-bearing English word, retrieve the Pāli it
renders and check whether the English imports a frame absent in Pāli (the
canonical case: *lokadhātu* = world-element/world-system rendered "galaxy"). Pull
the aligned `passage_sentences` halves, or hit `/api/passage/:id` (carries both
fields + translator chip). (2) Where multiple translators exist (Sujato + ~15
ATI), a feature present in one and absent in others is reception, not text.
(3) Flag editorial framing: section titles, paragraph breaks, the citation
scheme, interpretive footnotes. Absent the Pāli check, code `untested`, never
`faithful`.

**Trigger.** Load-bearing on **any** study that reads through English, and
especially when the finding rests on a specific English word or modern category.
The bookend to I.1: chronology guards the deep end, reception guards the shallow
end.

**Failure mode / honesty guard.** Quoting the translation as the text — letting
"galaxy", "consciousness", "sin", "soul" do analytical work the Pāli never
licensed. Trace every load-bearing English term to its Pāli; check
multi-translator divergence where available; quote Pāli for load-bearing terms
with the English as gloss, not the reverse.

**Paper implication.** Adds a **reception column / footnote lane** and a
"reading through translation" caveat. Disciplines the paper to quote Pāli for
load-bearing terms with English as gloss.

---

#### I.7 — Manuscript & edition provenance  ·  CHEAP

**Definition.** *Which* textual witness the row **is**. The Pāli here is
overwhelmingly CST (Burmese Chaṭṭha Saṅgāyana digital edition, VRI), not
PTS/Sinhalese/Thai; the English is a specific modern edition (Sujato or one of
~15 ATI translators). This sits **above** the text-critical apparatus discipline
(§3.4). The apparatus operates *within* a chosen edition — it reads the
sī./syā./pī./ka. sigla *those* editors printed and picks among the variants they
surfaced. This axis asks the prior question: the base text is one recension's
editorial reconstruction; the sigla present are the ones CST editors chose to
record; section divisions, paragraph breaks, per-paragraph granularity, and
which uddāna rows exist are CST editorial artefacts.

**Diagnostic question.** Whose edition, and whose segmentation, is the *ground*
of this study — and could the claim vary under PTS / Sinhalese / Thai readings
or a different segmentation?

**Coding values.** `cst-burmese-base` · `sujato-en` · `ati-translator-N` ·
`segmentation-dependent` · `edition-relative-claim` · `edition-neutral`

**Operationalisation.** Tag each row's source-edition. Flag any claim whose
truth could vary with edition or segmentation as `edition-relative` — in
particular: (a) any per-passage **count** (the per-paragraph subdivision turned
8,579 monolithic commentary rows into 173,684 paragraph rows, redefining what a
"passage" is); (b) any structured-absence / char-gap finding (a "never
co-occurs" claim is relative to segmentation; the Uttarakuru divine-eye char-gap
evidence is computed over CST monolithic Vinaya rows, an edition+ingest
artefact); (c) the absence of a variant that may exist in an un-ingested
edition. Defend an `edition-relative` claim only after considering whether PTS /
Sinhalese / Thai readings would disturb it.

**Trigger.** Load-bearing whenever a claim rests on segmentation, on a count that
depends on row boundaries, on the absence of a variant the corpus may not hold,
or whenever the paper quotes "the canon" as edition-neutral.

**Failure mode / honesty guard.** Writing "the canon reads X" when the truth is
"the CST Burmese edition reads X." Declare the base edition once, up front; flag
counts and absences as edition-relative; never present a segmentation-dependent
statistic as edition-neutral.

**Paper implication.** A one-line **edition declaration** in Methods, and an
`edition-relative` / `edition-neutral` flag in the per-claim signature so a
reader sees whether a count or absence stands on firm or edition-specific
ground.

---

#### I.8 — Harmonization / reconciliation status  ·  EXPENSIVE

**Definition.** Whether a claim is one the tradition's *own* harmonising
machinery treats as a problem requiring reconciliation — versus one it states
without strain. Theravāda has explicit reconciliation apparatus: the Kathāvatthu
adjudicates controverted points by reductio; commentaries deploy harmonising
formulae (`na viruddhaṁ` = "not contradictory"; `idha pana ... tattha pana` =
"here ... but there"; `tasmā ... veditabbaṁ`); the neyyattha/nītattha device is
itself a reconciliation tool. "The tradition explicitly works to reconcile X" is
distinct from "X is debated" (II.7's `debated-controverted`) and from "X is
provisional": a claim can be undebated and definitive yet still be the object of
a commentarial harmonisation that betrays a felt tension. This is what the
rejected "doctrinal-coherence" candidate should become — coherence taken
seriously via the tradition's own flagging, not the analyst's imposed verdict.

**Diagnostic question.** Does the tradition itself *work* to reconcile this
claim with the core teaching — and is that reconciling labour the real finding?

**Coding values.** `harmonization-flagged` · `unstrained` ·
`reconciled-by-reductio` · `reconciled-by-distinction` ·
`reconciled-by-neyyattha` · `untested`

**Operationalisation.** Search `passages.original` (attha/ṭīkā rows) for the
reconciling formulae above to detect rows doing reconciliation; check whether the
claim sits inside a Kathāvatthu sakavādī/paravādī dispute (the
`reconciled-by-reductio` case). Cite the reconciling formula and locus. Code
`unstrained` only after confirming no harmonising apparatus is attached.

**Trigger.** Load-bearing on doctrinal-coherence questions (converts "does X
cohere?" from analyst judgment into the measurable "does the tradition treat X
as needing reconciliation?") and on divergence questions (a harmonisation is a
specific commentary-adds move).

**Failure mode / honesty guard.** Manufacturing incoherence the tradition never
felt, or missing a reconciliation that is *itself* the evidence of perceived
strain. A `harmonization-flagged` code must cite the reconciling formula/locus;
`unstrained` requires a confirmed absence of apparatus, not mere silence.

**Paper implication.** Adds a **harmonization column** and lets the paper report
"the tradition reconciles X via the *na viruddhaṁ* move at [locus]" as positive,
datable, in-corpus evidence of a perceived tension — replacing any
analyst-imposed coherence verdict.

### Cluster II — Illocutionary force (how the claim is made)

---

#### II.7 — Epistemic marking  ·  EXPENSIVE

**Definition.** The epistemic / speech-act status a passage assigns to a claim,
as marked by the text's *own* formulae — independent of *who* says it (I.2) and
*what* it says (content). The same speaker, in the same text, marks different
claims with different epistemic force: staked under a verification formula;
stated flat as background; hedged inside a simile; named as rejected hearsay;
flagged as requiring-interpretation; carried as a controverted point. **This is
the keystone of the framework.** It cuts across the canon-vs-commentary layer:
the texts themselves stratify their own claims into asserted-as-verified vs
assumed-as-given, and the single structural bit is blind to it. It turns "the
Buddha says X" into the sharper, answerable "the text marks X as
{verified / background / illustrative / hearsay-rejected / provisional /
debated}."

**Diagnostic question.** With what epistemic / illocutionary force does the text
itself frame this claim — staked as directly verified by supernormal knowing,
stated flat as background, hedged in a simile, named as rejected hearsay,
flagged neyyattha, or carried under debate?

**Coding values.** `asserted-verified-direct-knowing` ·
`flat-background-assertion` · `illustrative-simile` · `hearsay-reported-rejected`
· `explicitly-provisional-neyyattha` · `definitive-nitattha` ·
`debated-controverted` · `unmarked-indeterminate`

**Operationalisation.** Marker-driven coding over `passages.original`, then human
adjudication of *force* (markers are signposts, not verdicts — a verification
verb can appear in a simile *about* verification). **Code the window around the
target claim; proximity matters.** Require marker and claim in the same
pericope/sentence-window, not merely the same monolithic row; report the
char-gap. Marker inventory by status:
1. **Asserted-as-directly-verified** — the supernormal-knowing formulae:
   `dibbena cakkhunā` (divine eye), whose stock object is rebirth-by-kamma
   (`satte ... cavamāne upapajjamāne ... yathākammūpage`);
   `sayaṁ abhiññā sacchikatvā`; `abbhaññāsiṁ` (first-person aorist);
   `ñāṇadassana`; `sacchikatvā`; `yathābhūtaṁ pajānāti`.
2. **Flat background-assertion** — declarative cosmological/ethnographic
   statement with *no* epistemic formula in-window. Coded by the **absence** of
   any (1)/(3)/(4)/(5)/(6) marker around an assertoric claim. **This is the
   default and must be coded positively, not as residue** — it is the
   load-bearing finding for cosmology.
3. **Illustrative / simile** — `seyyathāpi`, `upamā`, `opammaṁ`, `viya`/`iva`.
4. **Hearsay / reported-rejected** — `anussava(-ena)` (in the Kālāma/Sandaka
   rejection list: AN 3.65, AN 3.66, MN 76), `itihītiha`, `sutaṁ` *flagged as
   merely heard*. Note: the redactor-frame `evaṁ me sutaṁ` is **not** this — it
   is the canonical attestation frame (code under I.2).
5. **Explicitly-provisional** — the `neyyattha`/`nītattha` distinction (source
   AN 2.3.5–6): requiring-further-drawing-out vs already-definitive.
6. **Debated / controverted** — Kathāvatthu sakavādī/paravādī dispute; verdict
   supplied by reductio.

A passage can carry several claims at different statuses; code each claim.

**Trigger.** Load-bearing whenever the question turns on the *force* of a claim —
"did the Buddha/tradition *assert* X?", "how seriously/literally is X meant?",
"is X claimed as known or merely assumed?". **Not** load-bearing (coding it would
bury the study) for pure enumeration/frequency or pure provenance-layer
questions where chronology + recension carry the weight.

**Failure mode / honesty guard.** Three failures. (1) **Proximity illusion** —
coding a row "verified" because a verification formula appears *somewhere* in it.
Require marker and claim in the same window; report the char-gap. (The Uttarakuru
case: 5 rows carry both `dibbena cakkhunā` and `uttarakuru`, but the gaps are
4,909 / 5,101 / 43,133 / 45,573 / 227,578 chars — the divine eye verifies
rebirth-destiny in a wholly separate pericope, never the continents.) (2)
**Marker-as-verdict** — human adjudication of force is required; markers are
recall aids. (3) **Flat-as-residue** — failing to code `flat-background-assertion`
positively, so the most consequential epistemic fact disappears into an uncoded
default. The absence of a verification formula is positive evidence of
background-status only when the claim is genuinely assertoric *and* the
verification register is otherwise present in the same corpus stratum (so the
silence is patterned — a measured structured-absence, §3.2). Say "stated flat,
never under the verification formula," never "the text doubts X." Never upgrade
flat-assertion to "denied" or downgrade verified to "mere claim."

**Paper implication.** Drives a per-claim **epistemic-status column** in the
stratigraphy table and a dedicated "epistemic stratification" section reporting
claim-counts *by status*. The headline sharpens: instead of "canon frame +
commentary superstructure", the paper states "the cosmology is
asserted-as-verified for rebirth-destiny but stated-flat for continental
geography (0× under the formula); the soteriological verdict is canonically
*debated* before it is commentarially hardened" — a three-status claim no
single-axis study could make. The structured-absence is reported as a measured
negative with its char-gap evidence.

### Cluster III — *(the substantive-finding member of the old Cluster III,
re-filed)*

Structured-absence is a *finding*-producing axis, not a pure process discipline,
so it is coded like the other axes and lives here. The genuinely process-only
disciplines (recall ladder, text-critical apparatus, formulaic detection,
semantic-drift strip) are in §3.

---

#### III.10 — Structured-absence analysis  ·  EXPENSIVE

**Definition.** Treating a *non*-occurrence as data — distinguishing a
meaningful, patterned, falsifiable silence (positive evidence about how the
tradition thinks) from a mere gap (the corpus is small, or the term was not
searched well). The worked exemplar: the divine-eye verification formula
*always* verifies rebirth-destiny and *never* the four continents; the
continental geography is stated flat, never once under the formula. That absence
is **structured** (a large attested frame with a sharp boundary), not accidental,
so it positively licenses "the tradition claims rebirth-cosmology as verified but
assumes continental-geography as given." An absence is evidence only when its
*expected presence* is established first.

**Diagnostic question.** Is this silence *patterned* (a thing that should appear
by the tradition's own conventions does not, across a large attested frame) or
merely *absent* (not searched, or the corpus too thin)? And what does the
patterned silence positively license?

**Coding values.** `structured-absence-licenses-inference` ·
`thin-corpus-gap-no-inference` · `recall-artifact-fix-not-finding` ·
`expected-frame-attestation-N` · `contrast-presence-paired` · `SQL-confirmed-zero`

**Operationalisation.** Run *only after* the recall ladder (§3.1) is climbed.
**Step 1** — establish *expected presence*: name the frame in which the thing
should appear and SQL-count its attestation (a baseline of 1–2 is too thin).
**Step 2** — search the target *within* that frame, at full ladder depth, and
confirm zero/near-zero co-occurrence by SQL, reporting the exact query.
**Step 3** — rule out trivial explanations: not a recall miss (ladder climbed),
not corpus-size (frame is large), not a synonym hiding the hit (periphrasis rung
run). **Step 4** — state what the silence licenses, as a bounded inference with
its own confidence tag, and what it does *not* license (absence of evidence vs
evidence of absence). A **contrast class is mandatory**: pair the silence with
the matched presence it patterns away from (rebirth-destiny IS under the formula;
continents NEVER).

**Trigger.** Load-bearing on negative and boundary-drawing questions ("did the
tradition hold/assert/verify X?", "is X assumed vs argued?", "where is the
epistemic boundary?") and whenever a study's headline is a divergence (the
canon's silence is half the finding). The natural partner of II.7.

**Failure mode / honesty guard.** The cardinal sin is arguing from silence
without establishing expected presence. An absence claim is **inadmissible**
until (a) the recall ladder is climbed, (b) the expected-presence frame is
SQL-counted and robust, and (c) the trivial explanations are explicitly ruled out
in print. Tag every absence claim `structured` / `thin-gap` / `artifact`, and
where you license an inference, state the bound ("licenses: assumed-as-given;
does NOT license: the Buddha denied it").

**Paper implication.** Earns an **absence table**: columns = the silent claim,
the expected-presence frame + its attestation count, the SQL-confirmed
co-occurrence (≈0), the licensed inference, the confidence tag. Any
"never/always/only" statement in the prose is footnoted to its absence-table row.
Lets the paper have a section explicitly about what the corpus does *not* do.

---

## 3. Process disciplines

These are not coding axes — they produce no per-claim controlled-vocabulary code
that competes with the signature. They are mandated procedures (or, for the
drift strip, an output artefact of I.1). They are listed separately so the triage
never double-counts them against the per-claim axis budget.

### 3.1 — Recall-completeness protocol (the search-depth ladder)  ·  CHEAP · ALWAYS-ON

The procedure for converting a count into an auditable, morphology-aware,
concept-independent enumeration. Recall is a **measured variable** with a known
floor and a reported residual risk, never the silent assumption "I searched the
word, so I found the instances." **Run a four-rung ladder and report the yield at
every rung** as a strictly non-decreasing count N1 ≤ N2 ≤ N3 ≤ N4:

- **RUNG 1 — naive surface string.** Exact mode, the form a non-specialist types
  (`uttarakuru` → 15 rows on the live corpus, verified 2026-06-19).
- **RUNG 2 — morphological / declension-aware.** Stem mode (FTS alias +
  prefix-stem expansion) *and* explicit enumeration of inflected and sandhi forms
  (acc. `uttarakuruṁ`, nom.pl. `uttarakurū`, gen.pl. `uttarakurū-naṁ`, loc.pl.
  `uttarakurū-su`, vocative, the `-ka` derivative, compound-medial
  `-uttarakuru-`). This is the rung that recovered the long-*u* forms the
  short-final-*u* exact search dropped (144 → 161 in the original audit).
- **RUNG 3 — concept / periphrasis search, independent of the name.** Search the
  frame the concept lives in without the name (`cattāro mahādīpā`, `catudīpa`,
  the northern-quarter formula, the cakkavatti four-continent conquest) to catch
  rows that describe the target while never naming it.
- **RUNG 4 — sense-disambiguation / false-positive purge.** Subtract homograph and
  simile hits the prior rungs over-collected (Kuru the janapada in Jambudīpa;
  `kuru-vatta`/`kuru-dhamma`; the "like Uttarakuru" simile), reporting the
  exclusion count separately so N_net is auditable.

**Then reconfirm every load-bearing count by SQL `GROUP BY work_role`**, *not* by
the flaky search lane (the search lane over/under-matches). Publish the ladder as
a Methods table: one row per rung, columns = rung · query/strategy ·
mode·scope·layer · yield · delta-over-prior · residual-risk note.

**RUNG 5 — counting hazard: the corpus double-ingests the canon.** Canonical content
is ingested under *two* id schemes, the SuttaCentral bilara-data ids and the CST ids,
so a single early sutta is *two* passage-rows (the 84,000-yojana Sineru measure of
AN 7.66 is `an7.66` **and** `cst-s0403m3.mul-an7_3`; the whole Khuddaka is re-ingested
a second time under the `pli-kn` catch-all slug, duplicating the dedicated `pli-dhp` /
`pli-nd` / `pli-mil` / … slugs). Counts are passage-rows, so two consequences bite:
(a) **early-stratum counts are inflated ~2× by the SC+CST duplication**, while the
commentary and sub-commentary strata are CST-only — so the duplication *understates*
the canon-vs-commentary contrast rather than overstating it, never moves a
zero-vs-present headline (a 0 stays 0), and where it bites it only thins the real
canonical presence further, *strengthening* a "commentarial" verdict (the IG cosmology
supports got cleaner once this was named). (b) **the `pli-kn` catch-all mixes strata
and double-counts** — it holds the whole Khuddaka (early Dhp/Ud/… *and* late
Niddesa/Apadāna *and* para Milinda/Netti), each sub-work also under its own slug, so
re-bucketing `pli-kn` by sub-work would double-count against the dedicated slugs. The
right fix is to **exclude it** and freeze the per-id disposition as a reviewable
artifact (`KN-STRATUM-MAP.json`); the IG carita compound fell 53→43 once de-duplicated,
headline (0 four-Nikāyas / 0 Abhidhamma) untouched. And `work_slug` **≠** `work_role`:
the **Visuddhimagga is `work_slug='pli-vism'` but `work_role='mula'`** (structurally
mula-tagged though commentarial in stratum), so the same term reports different
attha/vism/tika splits under the two columns. Pick one grouping, declare it, and
reconcile the other in a short note (the IG `RECONCILIATION.md` is the worked example).
A passage-row count whose double-ingest you have not accounted for is not yet a count.

**Honesty guard.** Never assert unprovable completeness; claim only "saturated +
measured", and publish the ladder so the residual recall risk between the last
rung and true totality is visible. Reconfirm every negative by SQL. A skipped
rung is a stated limitation, not a silent zero. The gap between RUNG 1 and
RUNG 4 is often itself a finding.

**Per-family rule.** RUNG 4 is not run once on the headline term and skipped for
the rest: *every* term-family that enters the study as evidence — including every
rival vocabulary the §3.6 sweep promotes — climbs its own ladder and earns its own
sense-audit on sampled rows before its count is load-bearing. A high count of an
abstract term is a category / doctrinal-list / homograph lexeme until sampled rows
prove the individuating sense; an ASCII substring over-recalls (`%carita%` = 224
canon-mūla rows, all *sucarita / duccarita* conduct, 0 temperament) and
under-recalls (blind to the long-ā *ariya-puggala* roster) in the same pass. A
count whose sense you have not read is not yet a count.

**Enumeration-matrix traps (fixed-stem batch runs).** Two leaks sit beneath the
ladder and bite a programmatic stem-matrix specifically, where the keys are
generated, not hand-typed.

(1) **Test the compound, not the bare simplex**, for a concept the tradition
lexicalises as a compound. The head-word keeps a live everyday sense that
inflates a bare count with the wrong meaning: `upacāra` = 34 canon (vicinity)
but `upacāra-samādhi` (access-concentration) = 0; `appanā` = 119 (fixing of
applied thought) but `appanā-samādhi` = 0; likewise `paritta` (protection vs
limited), `padaka` vs `pādaka-jjhāna`. Search the compound and its joints; read
the bare hits as a separate sense. Conditional: fire only where the technical
sense *is* a compound; where the bare word is the object (`jhāna`, `nibbāna`,
`sati`, `vedanā`) the simplex is correct and forcing a compound under-counts.
The compound answers only the TERM question; a 0 on it proves the label absent,
not the phenomenon (pair with RUNG 3).

(2) **Inflection-final keys undercount; re-verify positives before citing.** A
key ending in an inflectional vowel (`samadhisamvattanika`) is an
`ILIKE '%key%'` substring that silently drops declined siblings (`-ikehi`,
`-ikāni`) — the generated key, not just a user's search, is the leak (matrix
said 44 canon; true count 92). Enumerate keys truncated to the morpheme
boundary: the shortest root still *unambiguous* (stop before it re-merges a
homograph — `upacar` would re-collapse the vicinity sense the compound test just
separated). The asymmetry that makes this cheap: a truncated root matches a
superset, so truncating can only *raise* a count. Therefore **a 0 is robust only
on the correctly-truncated root** (no sibling hides below it); a 0 on an
inflection-final key is **not** safe. So negatives need no inflection re-check
once the root is right, but **every nonzero matrix count is a floor that must be
re-queried with the truncated root, then RUNG-4 sense-audited, before it is
cited** — the positive-side mirror of the "reconfirm every negative by SQL" rule
above.

**Cross-time reconciliation.** A recount that disagrees with a prior deployed or
published number is an audit trigger, not an overwrite: trust neither until you
know why (the 44-vs-92 split was an inflection artifact; the deployed 92 was
right). Reconcile every carried-forward count against the study's own prior live
figure; usual causes of a delta are this truncation trap, a homograph/compound
split (RUNG 4), a coarse layer bucket hiding a boundary, or an edition re-cut
(I.7). Checkpoint a bulk run per batch to a stem-keyed artifact
(`stem → {strata}`) so one stem is re-queryable and the run resumable without
re-running the matrix.

This discipline is **never optional** — every other axis depends on the
enumeration being real.

### 3.2 — Structured-absence

The procedure for III.10 above. Listed here as a cross-reference: the *axis*
(III.10) carries the per-claim code and the absence table; the *procedure* is the
four-step protocol in its operationalisation, run only after §3.1.

### 3.3 — Semantic-drift strip (output artefact of I.1)

*Not a separate axis* — it is the mandated output of chronological stratum (I.1)
**when a single term is tracked across strata** (i.e. the same term attested in
both canon and commentary). Build a **drift strip**: one column per stratum in
order — early-canon-prose | late-canon | attha | ṭīkā | modern-translation — and
in each cell record the term's sense at that stratum with a verbatim anchor quote
(Pāli + provenance tag) and citation. Mark the **drift points** (stratum
boundaries where the sense changes) and classify each: `DRIFT-enrichment` /
`DRIFT-narrowing-specification` / `DRIFT-reframing` / `DRIFT-nominalization` (a
process / verb-or-participle sense hardening into a fixed noun-type — the
*function-to-essence* event, e.g. the present-state *sarāgaṁ cittaṁ* sort frozen
into the fixed *rāgacarita* type; *carita* the conduct-verb becoming the
temperament-compound; the spread of *sabhāva* own-nature language) / `stable-no-drift` /
`stratum-cell-empty`. Track the strip on **grammatical mode and ontological status**,
not only lexical sense: the most consequential drift is often the moment a verb of
*doing* becomes a noun of *being*, datable to the stratum where the compound first
appears, and it is the signature of the function-vs-essence master axis (§3.6). The
modern-translation column is mandatory and reuses I.6's
output.

**Honesty guard — anti-anachronism.** Every cross-stratum sense claim must name
the stratum it is drawn from and carry that stratum's confidence tag; the anchor
quote must come from that *same* stratum, not a later one. An empty early cell
may *not* be filled from a later cell. The signature failure is back-projection:
quoting the ṭīkā's measured ethnography to gloss the Nikāya's bare name ("the
canon says Uttarakurukas live 1,000 years" when the *commentary* says it).

### 3.4 — Text-critical apparatus (variant readings as load-bearing)  ·  EXPENSIVE

Treat the edition's variant apparatus — the sī. / syā. / pī. / ka. sigla in the
CST text — as **evidence**, applied to every *quoted* reading a claim depends on
(not to every word). The corpus preserves sigla inline (the live DN Āṭānāṭiya row
shows `(uttarakurū rammā (sī. ...))`). **Step 1** — scan the row's apparatus for
sigla on the target word or neighbours. **Step 2** — classify the variant's
bearing: `orthographic-trivial` (ṁ/ṃ, vowel length with no sense change — note
and move on), `morphological` (a different inflection), `substantive` (a
different word/sense). **Step 3** — for morphological/substantive variants,
record all readings with sigla; if the argument needs one reading, defend the
choice: prefer the reading attested across more recensions, and where balanced
invoke *lectio difficilior potior* with an explicit rationale; never silently
pick the convenient reading. **Step 4** — where a variant would change the claim,
down-tag confidence and report the reading as contested. Cross-link with I.4: a
reading confirmed across recensions earns a higher provenance grade. Coding tags:
`editions-agree` · `variant-orthographic-trivial` · `variant-morphological` ·
`variant-substantive-claim-bearing` · `lectio-difficilior-chosen` ·
`reading-contested-claim-downtagged` · `no-apparatus-present`. Output:
**text-critical notes** attached only to claim-bearing quotes.

### 3.5 — Formulaic-composition (stock vs unique)

The **classification** (stock / unique / semi-formulaic) and the **recurrence
count** live inside the genre/register axis (I.3); see its operationalisation.
The one separable contribution preserved here is a **standing honesty guard**: a
recurrence-based thematic claim must state whether it is counting *independent
assertions* or *deployments of one formula*. A stock formula's stable *boundary*
(what it never slots — e.g. the divine eye never slotting the continents) may be
cited as a redactional fact at high confidence; its raw *count* may **not** be
cited as proportional emphasis. State the near-verbatim matching criterion so the
count is reproducible.

### 3.6 — Wide-recall discovery sweep (horizontal recall + master-axis discovery)  ·  CHEAP · run BEFORE the vocabulary and spine are fixed

The recall ladder (§3.1) widens *vertically* on one **named** term. This discipline
widens *horizontally*, across the **rival vocabularies the question never named**,
and lets the primary axis and even the question be revised by what comes back. It
runs as a discovery phase between structural enumeration (Step 2) and the
pre-registration freeze; its job is to make sure the study is built on the real
field, not on the one word the framing happened to pick.

**Recall must exceed the question.** A study that searches only the term in its
title can only confirm the pattern it already hypothesised; a pattern carried by
other vocabulary is structurally invisible. Generate breadth by procedure, not by
guessing a longer list:
- **Concept-neighbourhood expansion.** Enumerate *every* way the corpus could
  encode the phenomenon, not the one the question names (for person-individuation:
  not just *carita* but *adhimutti / anusaya / dhātu / indriya /* the *ugghaṭitaññū*
  tetrad / the seven *ariya-puggala* / *bhabba-abhabba / puggalavemattatā*). Each
  rival apparatus is a different way of doing the same work.
- **ASCII-invisibility check.** A diacritic-naive substring is blind to long-ā /
  retroflex families (the seven *ariya-puggala* roster: *saddhānusārī,
  ubhatobhāgavimutta, kāyasakkhi, diṭṭhippatta*). Enumerate the inflected and
  romanised variants of every candidate, in both directions.
- **Co-text bootstrapping.** Harvest the vocabulary that co-occurs with the seed
  rows; search those; repeat. The corpus tells you what to search next.
- **Meaning-mode as a recall instrument.** The vector lane surfaces conceptual
  neighbours with zero lexical overlap; use it to widen the field, not only to rank
  a known one (sparingly, per the API-load rule).
- **Negative space.** Search where the tradition *refuses* to sort / universalises /
  says one practice fits all — the refusals bound the pattern.

**Cross-read the axes to find the master axis (don't pre-pick the spine).** The
signature axes (§2) are not just honesty metadata; they are the **pattern
substrate**. Code the wide field on every cheap axis, then look for structure
*between* axes — the spine is the axis (or axis-pair) the data actually cleaves on,
discovered, not the one the question assumed. (Individual-guidance: reading the
*stratum* axis down its length said "carita is late"; cross-reading
*grammatical-mode × stratum* revealed the real cleavage was **function-vs-essence** —
verb / participle / present-state early vs fixed-compound-type late — which subsumes
the chronology question as one projection. See the I.1 drift strip, §3.3,
`DRIFT-nominalization`.)

**The question is demotable — that is a first-class result.** Pre-register the
*space* (the candidate axes + the rule for choosing the spine: "the spine is the
axis with the sharpest data split; rivals reported as runners-up"), not a single
answer-axis. This stays un-bucket-fittable (the selection rule is frozen) yet open
(the answer-axis is not). If the wide field shows the question was malformed or is a
special case of a larger one, **say so and re-spine** — "demoted to a special case"
and "the real unit is X" are findings, not failures.

**Keep a serendipity lane open by design.** Run at least one pass whose explicit
brief is to *ignore the question* and report whatever is structurally striking and
of **general importance to some other field** — a pattern a scholar of cognition,
sociology, or textual history would want, that the study's own question would never
surface. (Individual-guidance: the SN 14 homophily law and the *sabhāva*
essentialization drift came from exactly this lane.) These finds are walled off in
the paper's standing general-importance section (writing standard §5.8), never
folded into the study's own claims.

**Scale to an enumeration fleet — for the headline question AND for every
sub-question or clarification that arises mid-study.** The sweep is not a one-shot
on the main question; the same exhaustiveness applies to *any* contested or
high-value point that surfaces while researching (a forty-item list to audit, a
single Pāli phrase to chase, a "how much X is enough" debate). When a point earns
it, fan out a **reasoning fleet**: ~12–20 agents, each a distinct lens (lexical,
doctrinal, by-person-taxonomy, cross-recensional, negative-space, concept-as-fruit,
the scholars-as-search-targets, and deliberately orthogonal inference lanes), whose
*only* job is to **enumerate** — hundreds to thousands of exact Pāli search stems,
the loci they already know bear, and an explicit **inference path per avenue**
(what a hit, a near-absence, or a co-occurrence would license, including from
related and orthogonal subjects). The limited-samādhi pass produced **3,045 terms
across 317 avenues** this way. **Take advantage of every avenue, not a decisive
subset** — partial execution under-reports; the enumeration is the contract for
what gets run.

> **The reason/execute split (load-safe, and it is a hard rule).** The fleet
> agents **reason about WHAT to search; they do NOT query** — not the DB and
> especially not the live app `/api/*` (which cold-starts at ~38 s/call and has no
> concurrency guard, [[dhamma-concurrency-wedge]]). The **orchestrator executes**
> the consolidated term list **serially** against `dhamma-pg` via the
> `flyctl proxy 15432:5432` path (`research/naga/sql.py`, batched `count(*) FILTER
> (WHERE original ILIKE …)` with the layer CASE), then **sense-audits every count**
> (§3.1 per-family rule) and **reads the priority loci in full** before believing a
> reading. *Failure on record:* a planner agent in the limited-samādhi workflow
> overstepped into live `/api/search` calls, hit the 38 s latency, and stalled
> (went "yellow"); the recovery was `TaskStop` → edit the script to drop the
> planner → resume from the run-id (the cached reasoning lenses return in
> milliseconds). Never let a fleet hit the slow API; the orchestrator is the single
> serial executor.

**Honesty guard — the per-family sense-audit is mandatory (see §3.1).** Every new
term-family the sweep promotes into evidence climbs its *own* ladder and earns its
*own* RUNG-4 sense-audit before any count is believed. A high canon count of an
abstract "psychological" term is a **category / doctrinal-list / homograph lexeme
until proven otherwise**: individual-guidance's two largest apparent "early
individuation" counts, *anusaya* (119) and *cetopariya* (121), are mostly the fixed
seven-latent-defilement roster and the *cetopariyañāṇa* abhiññā list-item — *universal*
to all beings, not inter-personal difference; counting them as person-typing doubled
a false early mass. The sweep over-collects on purpose; the sense-audit is what makes
the surviving field real.

---

## 4. The triage

The triage maps a research question to the axes its load-bearing claims actually
depend on. It runs in **two passes**, because the question's surface grammar is
knowable at design time but the load-bearing *claims* are only knowable after the
corpus is enumerated.

### 4.0 — Default-core axes (always run, no triage needed)

Every study codes these three, plus the always-on recall discipline. They are all
CHEAP (SQL/metadata-derivable) and each catches a failure mode that demonstrably
bit a prior study:

1. **Layer + voice** — the existing structural canon-vs-commentary bit. Never
   dropped, but **demoted to one signal among many**, not the whole provenance
   answer.
2. **§3.1 Recall-completeness ladder** — recall is a measured variable; a study
   with no documented ladder is unauditable regardless of its question.
3. **I.1 Chronological stratum** — code the full I.1 stratum set, not a coarse
   early/late tag, and bind the count-harness bucket-`CASE` to it (never a
   canon/para/comm/tika lump that folds Abhidhamma into "canon" or late-Khuddaka
   into "para"). "Layer" is structural role and silently swallows time.

(And the CHEAP automatic checks fire freely whenever a load-bearing English term
appears: I.6 reception word-check; I.7 edition flag on any count or absence.)

### 4.1 — Scope / shape gate (Step 0.5, run first)

Before typing the question, two checks:
- **(a) Is this a provenance/corpus question at all**, or a normative / practice /
  predictive question the corpus cannot adjudicate? If the latter (e.g. "what
  meditation object should an angry temperament use?"), the triage output is
  *reframe to the descriptive question the sources can answer* (what the texts
  license / how *carita* is assigned) and flag the normative gap. This wires the
  triage to the skill's "no normative practice claims" rule.
- **(b) Does the question presuppose a contested category** that is itself analyst
  metalanguage (e.g. "mythical", "literal")? If so, **I.6 reception is
  auto-required** to make the presupposition explicit.

### 4.2 — Question-type priors (PASS A, design-time)

Restate the question as one (or several) of the canonical shapes and seed a
*provisional* codebook from the table below. **These are priors, not
requirements** — a hypothesis about which axes will be load-bearing, frozen in
the pre-registration *together with* a named commitment to run PASS B.

| Question type | Required axes (prior) | Optional axes (promote by trip-wire) |
|---|---|---|
| **Origin / canonicity** ("is X canonical / where from") | I.1 chronology (fine) · I.4 recension · layer+voice | I.5 pre-Buddhist · I.3 stock-pericope · I.1 drift strip |
| **Authenticity — textual** ("does the text present X as Buddha-vacana asserted-as-true") | II.7 epistemic · I.2 attribution | I.3 genre/position · I.4 recension (only if "historical") |
| **Authenticity — historical** ("is X plausibly the historical Buddha's word") | II.7 epistemic · I.2 attribution · I.4 recension · I.1 chronology | I.3 genre · I.5 pre-Buddhist |
| **Originality / borrowing** ("is X original to Buddhism vs inherited") | I.5 pre-Buddhist · I.4 recension · I.1 drift strip | I.1 chronology · I.3 stock-pericope |
| **Literalness / register** ("how literally was X meant") | I.3 genre/register · II.7 epistemic | I.6 reception · I.1 chronology |
| **Canon-vs-commentary divergence** | layer+voice · I.1 chronology (within *both* layers) · I.1 drift strip | II.7 epistemic · III.10 absence · I.8 harmonization · 3.4 text-critical |
| **Typology — lexical** (counting word-tokens) | §3.1 recall (promoted to a chapter) · III.10 absence · I.1 chronology | I.3 stock-pericope · I.2 attribution |
| **Typology — category** (members are asserted entities) | §3.1 recall · III.10 absence · I.1 chronology · **II.7 epistemic** | I.3 genre · I.2 attribution |
| **Dating** ("is X early or late") | I.1 chronology (real markers, not layer) · I.4 recension · I.3 stock-density | I.3 genre/position · I.1 drift · I.5 pre-Buddhist |
| **Doctrinal coherence** ("does X cohere") | **I.8 harmonization** · I.3 register · I.2 attribution · II.7 epistemic | I.1 chronology · I.3 position · I.1 drift |
| **Comparative / relational** ("X vs Y, or relation of X and Y") | §3.1 recall **run symmetrically on both arms** · I.1 chronology + I.3 register + I.3 stock-status as **matching controls** | II.7 epistemic per-arm · III.10 absence |

Two refinements baked into the table:
- **Authenticity splits** into *textual* (does the text *depict* him asserting
  X — epistemic + attribution, no recension needed) and *historical* (is X the
  historical Buddha's word — recension + chronology required). Conflating them is
  itself a provenance error.
- **Typology splits** into *lexical* (word-tokens; epistemic not load-bearing)
  and *category* (cosmological/ethical/psychological entities; epistemic +
  register load-bearing). The Uttarakuru continents are a category-enumeration
  whose headline was an epistemic asymmetry; mis-routing it as lexical would have
  missed the finding.
- **Comparative** questions mandate **matched controls**: the two arms must be
  matched on stratum, register, and formula-status before any differential is
  read, or the difference is confounded with provenance. Report both recall
  ladders.

### 4.3 — Trip-wire tests (PASS A and again PASS B)

For each optional axis, ask the trip-wire; if yes, promote it to
required-for-this-study. **The trip-wires are claim-property tests, so they are
re-evaluated in PASS B on discovered claims, not only at design time:**

- **(a) Recension** (I.4): does any claim rest on "X is early / authentic /
  pre-sectarian"? → check Chinese Āgama / Sanskrit / Gāndhārī parallels;
  single-recension "early" is unproven.
- **(b) Pre-Buddhist** (I.5): is the concept one Buddhism plausibly *inherited*
  (cosmology, deva-names, ritual forms, social categories)? → code
  Vedic/Jain/Ājīvika provenance with controls.
- **(c) Epistemic** (II.7): does the question or a discovered claim contain
  "assert", "believe", "really hold", "literally", "as fact", or otherwise turn
  on the *speech-act status* of a claim? → code epistemic marking.
- **(d) Reception** (I.6): does the study quote or rely on a modern English
  translation for interpretive weight? → code the translation overlay.

And four **evidence-shape promotions** (also re-evaluated in PASS B):
- **III.10 structured-absence** whenever a load-bearing claim is a *negative*
  ("X never appears under formula Y").
- **3.4 text-critical** whenever a single word/reading carries the claim.
- **I.3 stock/unique** whenever the claim depends on a passage being unique vs a
  stock pericope.
- **I.1 drift strip** whenever the same term is tracked across strata.
- **I.8 harmonization** whenever a discovered commentarial reconciliation formula
  attaches to the claim.
- **§3.6 wide-recall discovery sweep** whenever the question names a *vocabulary*
  or a *category* whose boundary is contestable (any typology, origin/canonicity,
  or canon-vs-commentary-divergence question) — run it *before* the spine is fixed,
  because the question may be searching one corner of a wider field.
- **I.1 `DRIFT-nominalization`** whenever a single term carries both a process /
  verb sense and a fixed-noun-type sense, or whenever a "fixed type" is claimed
  late against an early "function" — track the drift on grammatical mode, not only
  lexical sense, and test whether function-vs-essence is the master axis.

### 4.4 — PASS B: re-triage on enumerated claims (the spine)

Question-type is a lossy proxy: the axes are load-bearing on the *evidentiary
properties of the answer's claims*, which the question's surface only weakly
predicts. So after Step 2 structural enumeration, **before coding**, re-triage on
the *actual* claims found. For each load-bearing claim, run the four trip-wires
and the four evidence-shape promotions; **add any axis they fire, with a logged
warrant.** This is not bucket-fitting: the promotion *rules* were pre-registered
in PASS A, even though the specific claim was not. (The Uttarakuru
epistemic-asymmetry finding was a *discovered* property invisible from the
question's grammar; PASS B is what catches it.)

The pre-registration freezes the PASS-A codebook **and** the named commitment to
run PASS B and log its additions.

### 4.5 — Compound and comparative questions: per-claim-cluster budget

Real studies are almost always compound, so "union all required axes and cap the
study at 8" is internally contradictory (a routine three-part question unions to
9 axes before any trip-wire). **Resolve it with a per-claim-cluster budget, not a
per-study cap:**

- Decompose the study into **claim-clusters** (e.g. "the rebirth-mechanism
  claims", "the four-continents claims", "the soteriological-verdict claims").
- Each cluster gets *its own* small axis set from the triage.
- The dataset carries the **union** of all clusters' axes as columns, with
  not-applicable / NULL cells for instances outside a cluster's scope.
- **The 5–8 budget applies per cluster, not per study.** A compound study
  legitimately has more total axis columns than 8, but **no single instance is
  coded on more than ~6 axes**.

### 4.6 — Justify exclusions, then freeze

**Step 5 — justify the exclusions in writing.** In RESEARCH-DESIGN.md, list the
axes you did *not* code and one sentence each on why this question is not
load-bearing on them. This is the discipline that keeps the framework a flexible
diagnostic, not a 13-box checklist: a reviewer can challenge an omission, and "I
coded all the axes" is itself a red flag of a study that buried its signal.

**Step 6 — freeze and propagate to segmentation.** The chosen axis set becomes
(i) columns in the auditable dataset schema, (ii) the per-claim provenance
signature in the paper, (iii) the section structure. The triage output *is* the
paper's skeleton.

---

## 5. Tiering — keeping a study tractable

The real coding burden is the number of **expensive** axes, not the raw count.
Budget against the expensive tier.

**CHEAP / automatic** (SQL-derivable from corpus metadata; near-zero marginal
cost; run on every study or fire freely): layer + voice · **I.1 chronological
stratum** (work→stratum lookup) · **I.3 genre & register** (work→register/position
lookup) · **I.6 reception word-check** (original vs translation diff) · **I.7
edition flag** · **§3.1 recall ladder** (queries + `GROUP BY`).

**EXPENSIVE / gated** (per-claim close reading or external corpora; only when a
trip-wire fires): **II.7 epistemic marking** (per-claim window adjudication) ·
**I.2 attribution** (per-claim quotative scan) · **I.4 cross-recensional**
(parallels bridge + SuttaCentral fetch) · **I.5 pre-Buddhist** (non-Buddhist
comparanda + WebFetch) · **III.10 structured-absence** (expected-frame SQL count
+ ruling out trivial explanations) · **I.8 harmonization** (reconciliation-formula
scan) · **3.4 text-critical** (per-quote sigla triage).

**The budgeting rule:** *always run the ~5 cheap floor axes; add 1–3 expensive
axes only by trip-wire (per claim-cluster); if more than 3 expensive axes fire on
a single cluster, re-type the question — you have probably failed to decompose a
compound.* A 13-box checklist nobody runs is worse than the single canon-vs-
commentary bit it replaces.

---

## 6. Paper segmentation

The triage output drives a richer, more segmented paper than the single-axis
skill could produce.

**Per-claim provenance signature.** Every load-bearing claim in the paper carries
a compact signature drawn from its coded axes, e.g.:

> *[stratum: late-canonical | layer: mūla | speaker: redactor-frame | register:
> narrative-hagiographic / frame | epistemic: flat-background | recension:
> pali-only | provenance: inherited-unmodified | edition: cst-burmese]*

**The stratigraphy table** (first-class paper object). Rows = instances; columns
= the coded axes (work · structural layer · chronological stratum · genre/register
· speaker · **epistemic status** · recension · provenance · edition-flag), with
layer/stratum disagreements highlighted. The narrative is organised by **ascending
stratum** so the reader sees the gradient.

**Standing sections, included when their axis was coded:**
- a **within-canon chronology** subsection (mandatory if any canonical instance
  codes late-canonical);
- an **epistemic-stratification** section reporting claim-counts by status, with
  each verification-formula attestation hyperlinked;
- an **absence table** (the silent claim · expected-frame attestation · SQL-zero ·
  licensed inference · confidence tag), with every "never/always/only" footnoted
  to a row;
- a **semantic-drift strip** anchoring a chapter when a term is tracked across
  strata;
- **text-critical notes** attached only to claim-bearing quotes;
- a **reading-through-translation caveat** and a one-line **edition declaration**.

**Standing methods rules (stated once, in Methods/Limitations, not coded
per-claim):**
- **Declare your own analytic vocabulary as a reception layer.** The study's
  categories ("myth", "cosmology", "literal vs symbolic") are modern frames; name
  them as such rather than smuggling them in as neutral.
- **State the recurrence-counting convention** (independent assertions vs formula
  deployments).
- **Declare the base edition and diacritic convention** up front.

The result is a paper segmented by load-bearing axis, with the provenance of each
claim visible at the point of use — replacing the flat "canon sketches, commentary
builds" narrative with a graded, auditable stratigraphy.

---

## 7. Worked example — one Uttarakuru claim

**Claim:** *"The Buddha travels to Uttarakuru for almsfood."*

A canon-vs-commentary study codes this as **`layer = mūla`, `voice = canon`** and
stops — it reads as "the canon reports the Buddha visiting Uttarakuru." The full
signature changes the conclusion.

| Axis | Code | Warrant |
|---|---|---|
| Layer + voice | `mūla` / canon | structural column |
| **I.1 chronology** | `late-canonical` | the alms-flight sits in a **Vinaya frame-narrative (nidāna)** and an **Apadāna verse** — both late-canonical genres; structural layer (`mūla`) and stratum **disagree**, the flagged interesting case |
| **I.2 attribution** | `redactor-frame` | the compiler *narrates* the Buddha's act (`tena samayena ... `); it is **not** Buddha-vacana asserting the geography |
| **I.3 genre / register** | `prose-nidana-frame` (Vinaya) + `verse-gatha` (Apadāna) · `narrative-hagiographic` · `stock`-leaning frame | occasioning-story + biographical verse, not doctrinal-analytical treatment |
| **I.4 recension** | bare four-continent scheme `multi-recensional`; the *alms-flight feature* `feature-not-in-parallel` / `untested` | the continents appear in Sarvāstivāda Abhidharma and Chinese sources; the specific Pāli flight needs feature-level checking |
| **I.5 pre-Buddhist** | continent itself `inherited-unmodified-background`; the alms-flight narrative `untested` | Uttarakuru as a blessed northern land predates Buddhism in Indian geography |
| **II.7 epistemic** | `flat-background-assertion` | the geography is stated flat; the divine-eye verification formula is **never** in-window (nearest co-occurrence gaps 4,909–227,578 chars) — a **structured absence** |
| **III.10 absence** | `structured-absence-licenses-inference` | expected-presence frame (the verification formula) is large; SQL-confirmed zero co-occurrence with the continents; contrast = rebirth-destiny IS verified |
| **I.6 / I.7 reception / edition** | neighbouring *lokadhātu* → "galaxy" `translation-frame-imported`; `cst-burmese-base`, char-gap evidence `edition-relative` | the gap counts are computed over CST monolithic Vinaya rows |

**How the signature changes the conclusion.** The bare reading — "the canon
reports the Buddha visiting Uttarakuru" — is replaced by a precise, segmented
claim:

> *The visit is a **late-canonical** development (Vinaya nidāna + Apadāna verse),
> **voiced by the redactor** as hagiographic frame-narrative, **not** Buddha-vacana
> asserting a doctrine. The place is **inherited pan-Indian** furniture; the
> specific alms-flight is plausibly **Pāli-local** (feature-level unconfirmed in
> any Āgama parallel). The geography is **stated flat**, **never** under the
> canon's own "directly verified" formula — a measured structured absence. The
> "galaxy" reading is a **modern translation frame** the Pāli does not carry.*

The original study's headline — "a small canonical frame, the commentary supplies
the verdict" — was true but credited to "the commentary" a materialisation that
**begins inside the late canon**. The signature shows the literal-place reading
deepening *monotonically with lateness within the canon itself*, before the
commentary measures it. That is the finding the single canon-vs-commentary axis
structurally could not see.

---

## 8. Integration — how `dhamma-research` SKILL.md imports this

The skill imports this core and invokes its triage as the **first design step**,
between question intake and pre-registration. Concretely:

1. **Import.** SKILL.md adds `@PROVENANCE-SIGNATURE.md` to its design section
   (alongside the existing coherence/editor checklists), so the axis set and
   triage are always in context.

2. **Invoke at design time.** Before writing RESEARCH-DESIGN.md, the skill runs
   the triage:
   - run the **scope/shape gate** (§4.1) — reframe normative questions, auto-add
     reception for contested-category presuppositions;
   - lay down the **default core** (§4.0);
   - type the question and seed the **PASS-A** codebook (§4.2);
   - apply the **trip-wires** (§4.3);
   - decompose compounds into **claim-clusters** with a per-cluster budget
     (§4.5);
   - **justify exclusions in writing** (§4.6).
   The frozen pre-registration records the PASS-A codebook **and** the named
   commitment to run PASS B.

3. **Re-triage after enumeration.** After the skill's structural-enumeration step
   and before coding, run **PASS B** (§4.4): re-evaluate the trip-wires and
   evidence-shape promotions on the *discovered* claims; add any fired axis with
   a logged warrant. (This operationalises the skill's existing "an
   obviously-missing axis is a root gap to close before continuing" rule.)

4. **Propagate to the dataset and paper.** The chosen axis set becomes dataset
   columns (per-claim, with NULL outside a cluster's scope), the per-claim
   signature, and the section skeleton (§6). The **stratigraphy table** and, where
   epistemic marking was coded, the **epistemic-status column** are mandatory
   paper objects.

5. **Honour the budget.** Always-on: the ~5 cheap floor axes (§5). Expensive axes
   only by trip-wire, ≤3 per cluster; more than 3 means re-type the question.

6. **Coding crew.** The per-claim signature is coded by the skill's existing
   k ≥ 3 blind coders with IAA; controlled vocabularies in this core are the
   codebook. Epistemic marking and attribution (the two expensive per-claim axes)
   are the ones most needing IAA, since they require human adjudication of force
   and speaker beyond the marker search.

The single canon-vs-commentary bit is not removed — it is the first row of the
default core. This core demotes it from "the answer" to "one signal," and gives
the skill the triage that decides which of the other ten axes a given question
actually needs.
