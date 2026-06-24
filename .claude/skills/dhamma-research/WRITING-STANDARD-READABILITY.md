<!-- ACTIVE STANDARD (operator-approved 2026-06-19 after the awakening pilot). Imported by dhamma-research SKILL.md as @WRITING-STANDARD-READABILITY.md; governs the written FORM of every paper. Decisions baked in: (1) HYBRID structure (idea-shaped body + one short visible Methods note); (2) fewer tables, lean on inline figures. Reference implementation: research/awakening/FINDINGS-readable.md (+ .pdf via research/_render_pdf.py). The benchmark exemplar text is kept locally and gitignored (third-party copyright). -->

# WRITING-STANDARD-READABILITY.md

*The readable-paper architecture for dhamma-research. Pairs with the rigor harness in the `dhamma-research` skill (pre-registration, provenance signature, IAA, recall ladder, full enumeration). That harness says how we KNOW; this standard says how we WRITE it so a comparative-Buddhist-studies reader, or a serious old student, can read straight through. The benchmark is Anālayo, "The Development of Insight" (2011), `research/_exemplar_devinsight.txt`. The rigor is non-negotiable; its PLACEMENT changes.*

---

## 0. The one idea this whole document encodes

A readable paper has **two physical lanes**: a **reading lane** (the body — ideas in plain hedged English, organized by finding) and an **apparatus lane** (footnotes + appendices + the linked JSON — every Pāli string, corpus id, provenance signature, IAA cell, char-gap, parallel, SQL artifact). Anālayo's whole trick is that a non-specialist reads the top of every page and never looks down; a specialist reads down. **Our papers currently have one lane: everything is fused into the body.** This standard splits the lanes. Nothing is deleted. The rigor moves down; the reading line clears.

We keep tables, but few. Anālayo uses zero; the operator's call is fewer tables, leaning on inline typeset figures (dot-strips, proportion bars), with full tables reserved for one or two categorical breakdowns the reader needs cell by cell. Every table that survives must ARGUE, not dump (governed by §4). The body is mostly prose and inline figures, not a table deck.

One structural call the operator made (the HYBRID): the body is idea-shaped, but it carries ONE short, visible **Methods note** (a named subsection, roughly 200 to 300 words: corpus scope, base edition, the recall floor in one line, the headline IAA agreement). The fuller method register still lives in the appendix. The method is on display, briefly, not buried; only its machinery is relocated.

The litmus test, stated once and referenced throughout:

> **A reader who skips every footnote, table, and appendix must still finish with the data's highlights. A peer reviewer who follows any footnote must still reach the full provenance signature.**

---

## 1. The page / section budget

Target: a **~15-page paper = ≈13 pp body + ≈2 pp notes-on-the-page + appendices/refs beyond that.** Academic prose runs ~450–500 words per printed page (matches the exemplar's ~13 pp / ~6,000-word body). So the body budget is **≈6,500 words**, plus the apparatus lane (footnotes, unbudgeted, typically 30–50% of physical page height) and appendices (extra pages, not counted in the 13).

Sections are named for **what the data says about the subject**, never for an analytic axis. The headings below are *shapes*; the deep-research run fills the subject in. One exception, per the operator's HYBRID call: a single short **Methods note** subsection inside §II is allowed and required (a plain "how these were found" heading, 200 to 300 words). Otherwise forbidden heading words in the body: "Methodology," "Triage," "Recall ladder," "Inter-annotator agreement," "Provenance signature," "Stratigraphy," "The corrected headline," any bare axis number ("I.6," "3.4"). The Methods note states corpus scope, base edition, the recall floor in one line, and the headline IAA agreement; everything fuller goes to Appendix B/C.

| § | Section (idea-shaped) | Single job | Body budget | Where our rigor lives for this section |
|---|---|---|---|---|
| **I** | **Introduction + roadmap** | One human/contextual opening paragraph on the subject itself (what the thing IS, why a reader cares), then the question as H1 + the explicit H0, then a numbered one-line preview of every section. | **~1.25 pp / ~600 wd** | Epistemic grade stated once here ("a triage-grade descriptive finding, not a proof"). Pre-registration link → footnote. |
| **II** | **The frame** (split II.1/II.2 if two halves) | Set the doctrinal/definitional ground; describe the object of study in plain English. | **~2 pp / ~1,000 wd** | Edition note + corpus-scope declared once here (Methods-in-prose). Recall ladder introduced as ONE sentence ("all counts are floors; what each query rung recovers is in Appendix C / the ladder figure"). |
| **III** | **The core mechanism** (III.1 survey rival readings → III.2 connect to our finding) | Survey the central term's contested readings, then attach our result to it. | **~3 pp / ~1,500 wd** | Rival positions as a bullet list. Every corpus id, Pāli string, parallel → footnotes. The first headline table lands here. |
| **IV** | **The detailed walk** (IV.1 principle → IV.2 a/b/c/d the cases) | The longest, most granular section: establish a principle, walk it across each sub-case. | **~3.5 pp / ~1,750 wd** | One bullet list + one concrete image per leaf. Per-claim provenance signatures → footnotes (one per backed sentence). A selection table here; full enumeration → Appendix A. |
| **V** | **The sharpening + the worked examples** (V.1 the deepening sequence → V.2 named cases) | V.1 the gradient/sequence; V.2 one or two NAMED worked examples carrying it as narrative. | **~2.5 pp / ~1,250 wd** | The gradient shown as an inline figure (dot-strip / descending bars), not a 26-row table. IAA + parallels for the examples → footnotes. |
| **VI** | **What this means + limits** | Plain-language "why a non-specialist should care," then an honest limits paragraph (what the data does NOT support), close on the question. | **~1.25 pp / ~600 wd** | The consolidated Limitations live here (≤1 pp): edition-relativity, recall floor, measured-not-proven, effective-n, model-family bounds. |
| | **BODY TOTAL** | | **≈6,500 wd / ≈13 pp** | |
| **—** | **Footnotes** (on every page) | Pāli strings · corpus ids · parallel/edition sigla · per-claim provenance signature · single-claim `[SQL-confirmed]` · hedged technical disputes · "cf. in more detail" recall/extension pointers. | unbudgeted (~30–50% of page) | This is where today's inline apparatus MOVES. |
| **App. A** | **Full enumeration** | Every row with per-row stratum / layer / speaker / edition; resolves to live corpus ids. | extra pp | The contribution, in full, auditable without leaving the paper. |
| **App. B** | **Method register** | 11-axis triage worksheet · recall ladder at every rung · exclusions/disambiguation register · pre-registration text. | extra pp | All "process" sections that today sit in the body. |
| **App. C** | **IAA** | Complete inter-annotator matrix, κ per axis, adjudication notes. | extra pp | |
| **—** | **Linked JSON** | The machine-checkable, consistency-gated census; every row resolves to a corpus id. | — | Cited once in Methods-prose + once per appendix table ("full data: census.json"). |

**Per-paper calibration (the four are wildly uneven — same target, different operations):**

- **uttarakuru** (~12,300 body words today): **relocate-and-condense.** Roughly half the current body is apparatus that moves to footnotes/appendices. Cut the 15 inline signature blocks, 97 CST-ids, 115 `[tag]` blocks, the Abstract↔"corrected headline" duplication. Target ≈6,500 body words.
- **awakening** (~4,850), **intoxicants** (~4,750): **body-expand by ~+1,900 / +2,000 reader-facing words** — add the human opening, roadmap, 1–2 worked examples, signposts, bullet relief, "what this means." No new data; new READABILITY.
- **heart-base** (~1,860): **genuinely thin — expand ~+4,600 words.** It is the proof that ids are removable (it has zero), but it removed rigor instead of relocating it. Bring its rigor up to the others' level AND keep its readability: full enumeration in Appendix A, signatures in footnotes, worked example in body.

### 1.1 The body consolidates, then sweeps — narration is for the abstract (Phase A / Phase B)

The body is organised by **ascending chronological stratum** (the I.1 output), but ordering is not the whole structure. A stratum section that states its upshot in one graceful paragraph is **narration**: it presumes the conclusion and points at one anchor row. The body's job is **consolidation** — at each stratum, *assemble the case the corpus holds there* (every row that does work, the rival vocabularies the discovery sweep surfaced, the readings that fit and the ones that resist) so the pattern emerges from the mass rather than being asserted over it. Consolidation is what earns the synthesis; narration belongs in the abstract.

So the body runs in two phases (§§II–V carry Phase A; the late section carries Phase B):

- **Phase A — per-stratum (earliest to latest).** One section per stratum, each answering *by what mechanism, in what grammatical mode, under whose warrant does THIS layer treat the subject?* Surface the layer's internal structure: what is **consistent** within it, what is **inconsistent** (the tensions, the rows that resist), what **develops** even inside the one layer. **Evidence is stated once, here, at its home stratum.** The stratum carrying the most evidence gets the most room — do not let the richest layer collapse to one paragraph because narration needs only one example (the commentary stratum holding 80% of the instances must not get the same space as a one-row sub-commentary note).
- **Phase B — the sweep (chronology-blind).** With every stratum's evidence already on the table, drop the partition and read the *whole* field at once for the patterns only visible across layers: **divergence** (one function splits into many forms), **addition** (late material with no early seed), **regression** (the tradition walks something back / disowns it). Phase B **references** Phase A's evidence; it must not re-argue a stratum. If Phase B is re-walking rows, Phase A was too thin.

The skill's single-source rule ("counts stated once, one canonical home") becomes structural here: a row's evidence lives in its Phase-A stratum; Phase B cites it across. A datum stated and drifting in both phases is exactly the seam the coherence pass exists to catch.

---

## 2. The apparatus rule (mechanical placement)

Apply this as a checklist to every sentence. It is deterministic — there is a right bin for every artifact.

| Artifact | Body? | Goes to | Mechanical rule |
|---|---|---|---|
| **Raw corpus id** (`cst-s0302m.mul-sn2_1`) | **never** | footnote | Body carries the human handle only ("the Kaccānagotta, SN 12.15"). Footnote carries `SN 12.15 · CST sibling cst-s0302m.mul-sn2_1`. |
| **Duplicate / CST dup ids** (`(dup cst-…)`) | never | appendix only | Dup-id bookkeeping never appears in body OR footnote — it is dataset-level. Appendix A column. |
| **Pāli / Sanskrit string** | only if it IS the object of study | footnote | If the claim is *about* the word, a short gloss may sit in body ("majja, the effect-based 'intoxicant' category"); the full string + inflection → footnote. Otherwise all Pāli → footnote. |
| **Provenance signature block** `[stratum \| layer \| speaker \| register \| edition]` | **never inline** | footnote (per claim) + appendix (enumeration) | Pipe-delimited records are not sentences. One signature → a footnote on the sentence it backs. The full set → Appendix A, one row per claim. |
| **`[canon, SQL-confirmed]` / `[comm]` / `[late-canon]` tags** | never | one Methods sentence + footnote convention | State once in Methods: "Each claim is tagged in the dataset with layer and verification status; in the text a superscript ᶜ marks a commentarial source." Then never repeat the bracket inline. |
| **SQL artifacts** (char-gaps, co-occurrence offsets, exact substring counts) | never | appendix (the mechanism) + footnote (one pointer) | Body states the FINDING the SQL proves ("the divine-eye verification formula is never applied to the continent"); the char-gaps (`4,909 / 5,101 / …`) → Appendix B with a one-line footnote pointer. |
| **Parallel sigla** (SĀ / MĀ / Tibetan / Sanskrit fragment) | never | footnote | Body names one source in English ("a Chinese Āgama parallel"); footnote lists `SĀ 1248 at T 2, 342b…`. |
| **PTS / precise citation** (`MN I 226,25`) | never | footnote | Body cites the work by name; locus → footnote. |
| **IAA scores / κ** | never (except one summary line allowed in Methods) | Appendix C | One Methods sentence may state the headline κ; the matrix → Appendix C. |
| **Recall ladder rungs** | as ONE inline figure (§4.5) | Appendix B (full rungs) | Body shows the descending-bar figure once + "counts are floors"; per-rung yields → Appendix B. |
| **Pre-registration text / prediction-scoring (PASS/REJECTED)** | **never** | Appendix B + footnote | QA process is not a published section. State the outcome in measured prose ("the earlier reading holds, with two qualifications"); the pre-registered prediction + its scoring → Appendix B. |
| **The headline table** | **yes** | body | Kept — but ≤8 rows / ≤5 cols, captioned-to-the-point (§4). The full enumeration it selects from → Appendix A. |
| **Named worked example** | **yes** | body (prose) | The one thing that should GROW in the body. |

The single highest-leverage line: **every `> *[locus … | … | speaker …]*` blockquote currently in the body becomes a footnote on the sentence it backs.** That one move recovers most of the readability.

---

## 3. Voice & signposting rules

Register: a careful person thinking aloud, not a test harness reporting verdicts. The data can be strong; the prose stays modest and trusts the reader to feel the force.

### 3.1 De-assert (do / don't with rewrites)

| Don't (current) | Do (measured) |
|---|---|
| "The verdict is **CONFIRMED and sharpened**." | "The earlier reading holds, and gains two qualifications." |
| "Status: **REJECTED**, the claim is false." | "The data do not support this; on the contrary, the canon does present a small floor of such cases." |
| "The pre-registered prediction scores **PASS** on both legs." | "What we expected to find, we found — with one caveat about ordering, noted below." (scoring → Appendix B) |
| Title: "*How a Northern Continent Deepens With Lateness While the Canon Never Stakes It as Verified Knowledge*" | Title: "*Uttarakuru in the Pāli Canon and Commentaries: a survey of how the northern continent is described across textual layers*" |
| "The single largest canonical class is the Apadāna…" | "Most of these events come from one late stratum, the Apadāna…" |

Strongest permitted body verbs: **suggests · indicates · seems · appears · the data show.** **No first person** (`I`, `we`, `my`, `our`): own conclusions in the impersonal voice ("the survey finds", "this reading holds", "on the evidence here"), never "it seems to me" or "I take this to mean" (operator-confirmed 2026-06-21; this reverses the earlier first-person allowance). No ALL-CAPS verdicts anywhere in the body. Also banned from published prose: the crutch phrases **load-bearing** and **cross-cutting** (see EDITOR-CHECKLIST.md). Method does not appear in the title.

### 3.2 Unpack dense multi-number / multi-clause sentences

Rule: **a body sentence carries at most ONE number and ZERO raw citations.** If it has more, unpack it: move the numbers to a table or figure and the citations to footnotes, then re-base what remains as one clean sentence rather than fragmenting it (this is density relief; for how to recompose the residue without chopping, re-base, do not break, see §3.4).

*Before (awakening, the worst sentence found — ~9 clauses, 3 Pāli strings, 9 citations, an inline κ):*
> "…are the Buddha asserting his OWN awakening in the first person: the bodhisatta-before-awakening frame (`pubbeva me…`), the claim-of-awakening (`anuttaraṁ…`), and the bodhi-night autobiography (`ayaṁ kho me…`), in MN 4, MN 19, MN 36, MN 85, MN 100, AN 8.11, SN 54.8, SN 35.13, and the Vinaya bodhi-narrative [canon, IAA kappa=1.0]."

*After (body):*
> "A small set of these passages is different in kind: here the Buddha narrates his own awakening in the first person. He speaks as the bodhisatta before the night, declares the awakening itself, and recounts the third watch to a named brahmin listener.¹⁴ These first-person accounts are the early-canonical floor of the whole census."

*Footnote 14:* the three Pāli strings, the nine loci (MN 4, MN 19, …), and `[canon · IAA κ=1.0]`.

*Before (intoxicants — nine numbers in one parenthetical):*
> "(majja 1,455 to 227, with 1,228 purged; surā 926 to 648, with 278 purged; meraya 279 clean; cluster net 840)"

*After:* one sentence + Table — "Once homographs are removed, only one of the three drinking-words is a clean anchor (Table 2)." The nine numbers live in the captioned table; meraya's cleanness is the point.

### 3.3 Signpost every section seam

Each section CLOSES with an "In sum" recap and the next OPENS having been handed off. One transition sentence per seam, Anālayo's cadence:

- "Hence I now turn in more detail to…"
- "Having shown the disagreement is in the reception and not the text, I turn to the one apparent exception."
- "To the progression from impermanence to dukkha and beyond I now turn."

Don't end a section on a signature block and open the next cold. Don't make the reader synthesize alone — hand them the takeaway ("In sum, …") before turning.

### 3.4 Rhythm and the cumulative sentence (de-densify without chopping)

Removing a connector is not the same as deleting its work. An em-dash, a semicolon, or a colon carries a load: the relation between two parts of one thought, a payoff or a pivot or a parallel. Strike the mark and let that load fall onto a comma, and the sentence piles up; let it fall onto a full stop, and the prose chops into staccato. Both read as machine-made for one reason: the connector was removed without being regraded by function. So regrade it; do not dump it. (This is the root of the two failures this project has hit. The em-dash purge dumped the load onto commas and produced pile-ups; the comma purge dumped it onto sentence boundaries and produced the staccato chop. One error, seen twice.)

**Regrade a removed em-dash by what it was doing.** The marks form a scale of break-strength (comma, then semicolon, then colon, then period); match the mark to the size of the break.

- The second part *delivers* the first (a payoff, a list, an explanation): use a **colon**.
- Two related *full clauses* stand as equals: use a **semicolon**, which keeps them in one breath.
- A true mid-sentence *aside*: use paired **commas** or **parentheses**.
- A hard *pivot* to a separate thought: use a **period, and recast** so the twist is gone.

A single comma fits only a short, non-emphatic aside. It cannot join two independent clauses (that is a splice) and it cannot announce a payoff. The comma and the period are the two ends of the scale; reaching straight for them, and skipping the semicolon and the colon in the middle, is precisely what produces the pile-up and the chop.

**De-densify by re-basing, not by fragmenting: the cumulative sentence.** When a sentence is clause-piled, find its kernel (the subject, the verb, the one essential idea), set that first as a clean main clause, then hang the rest off the right edge as trailing modifiers: a participle, an appositive, a "where …" or "so that …" tail. The sentence can stay long and still flow, because the reader is handed the anchor at once and each added phrase is one comprehensible step. This is parse cost, not preference. A reader pays for the unfinished grammatical dependencies held open at one time (Gibson's dependency-locality), so a long right-branching tail is cheap while a clause jammed between subject and verb is dear. Length is not the cost; center-embedding is. The repair for a dense sentence is usually to re-base it, not to break it. A cumulative tail earns its place only when each trailing phrase adds information; a modifier that adds only music is padding, and the de-AI pass cuts it (the inflated-diction list in EDITOR-CHECKLIST still applies). The aim is a long sentence that is load-light, not an ornate one.

**A comma-piled sentence can often be saved without splitting** by promoting its major joint to a semicolon, the "super-comma": the semicolon marks the big break, the commas drop to minor work, and one sentence carries a clear two-level structure. Try this before reaching for the period.

**Variance is the testable target.** A paragraph wants an audible mix of short, medium, and at least one longer cumulative sentence. A run of three or more short, near-equal, single-clause sentences is a staccato defect, not concision. The anaphoric stutter is the loudest signature ("It may answer … It may answer …"; "In the early discourses … In the Abhidhamma …"), but the run need not be anaphoric: three short, same-length sentences in a row is the defect even when each opens differently ("This study began … It asked … That question opened …"). Repair it by rejoining (a coordinating conjunction for a light parallel join, a semicolon for a heavier parallel, a colon for an assertion and its unpacking) or by folding a fragment into a cumulative tail, and keep one longer breath per cluster. The short sentence remains a tool, the deliberate landing after a dense passage; the defect is the *run* of them, not the single one.

**Land the stress.** A sentence is weighted at its end; put the word worth remembering there, and never let a throwaway phrase ("in this context", "over time") hold that slot. An em-dash often existed precisely to throw a term into that final position; a colon or a cumulative tail preserves the arrival, where a chopped pair scatters it. When rejoining a chopped pair, prefer the mark that also lands the stress: a colon keeps an assertion's payoff last, where a semicolon between equals or a flat recast can bury it. When a dense sentence genuinely must split, thread the seam: open the second sentence on a word or idea from the end of the first, so the rhythm carries across the period.

**Academic prose is not short copy.** The benchmark here is Anālayo, not a landing page. Scholarly sentences run longer and carry more subordination, so the controlling targets are flow, right-branching, and variance, not a word-count ceiling. The global design.md governs published user-facing copy (marketing, landing pages, store listings); a scholar-facing paper falls outside its remit. Its long-form guidance tunes to a 14-to-18-word average with a 22-to-28-word complex-clause band, and a paper benchmarked to Anālayo legitimately sits above that average: scholarly sentences run longer and carry more subordination, so the controlling targets here are flow, right-branching, and variance, not the average. The well-built cumulative sentence is the house style, and the short sentence is an occasional landing, not the default.

**The closing gate is the ear.** Read each edited paragraph aloud, or sub-vocally. If it sounds like a list of clipped commands, it is chopped: rejoin and re-base. If it forces a breathless run with nowhere to rest, it is over-dense: re-base or break. The ear catches both failures the eye skims past. This is the two-directional form of the older "can you take a breath" test, which flags only over-density and is blind to the chop.

### 3.5 First-contact precision (a named concept is a citation; it must be auditable)

The rationale is auditability, not hand-holding. A named concept must be confirmable to its source, exactly like a citation. A vague English label ("the root", "the mind", "the world") cannot be audited: the reader cannot check it against anything. Even a scholar wants the Pāli pinned so the claim is confirmable. On first contact with a concept:

- **Present before you refer.** Define a thing the first time; never lean on it as already shared *on first contact*. Once a term is defined with its gloss, a later bare-Pāli use is correct and preferred (the Pāli-display gate). An early individual-guidance abstract asserted "The move is real" before the move had been named; the fix defines "the recurring move" first, then refers to it.
- **Pin a Pāli word when the claim turns on its precise sense**, and especially the cover-words that hide a specific term: mind = *citta* (not *mano* / *viññāṇa* / *ceto* where *citta* is meant), world = *loka*, feeling = *vedanā*, element = *dhātu*. The dangerous word is the one that looks ordinary while covering a precise, often multiple, Pāli referent. **Test for pinning:** pin it if a single specific Pāli term is the real referent and a reader would want to confirm the claim against that term (*citta*, *loka*, *indriya*, *anusaya*); exempt it only when no one Pāli word is meant, where the English ranges over several or none ("a person", "a teaching", "the texts", "the path"). When unsure, pin: a needless gloss costs a parenthetical, a missing one costs auditability.
- **Hand over the precise referent, not a synonym.** Enumerate or give the function: root → *akusala-mūla* (greed, hate, delusion); faculties → *indriya* (faith, energy, mindfulness, concentration, wisdom); seven noble persons → *satta ariyapuggalā* (graded by leading faculty and depth of attainment). A looser English synonym ("the underlying tendency" for *anusaya*) is not a referent; the reader still cannot audit it.
- **Plain, concrete diction for the rest.** Kill the oblique or precious word ("register", "ripened") where a plain one carries the sense.

**Form, so precision does not re-chop the rhythm (§3.4).** A pinned Pāli gloss is *not* a §3.2 citation: §3.2 governs raw corpus ids and loci, which still go to footnotes, while first-contact pins ride in the body. Pins still cost reading, so the Pāli rides a *skimmable parenthetical* the fluent reader glides past, and the conceptual handhold is *woven as a clause*, not bolted on. The defect is parentheticals **stacked on one referent or jammed into one clause**, not their count across a sentence. Test: at most one parenthetical per clause; distribute a run of glosses across parallel verb-clauses, or carry them on a colon or semicolon series, never as three or more consecutive parentheticals on one clause.

  - **PASS (the deployed IG Background, the texture this standard is benchmarked to):** "they name which unwholesome root (*akusala-mūla*: greed, hate, or delusion) is active in a mind (*citta*) at a given moment, weigh how far a person's five spiritual faculties (*indriya*: faith, energy, mindfulness, concentration, and wisdom) have matured, and locate the whole world (*loka*) within present experience" — four glosses, one per clause, skimmable.
  - **FAIL:** "the mind (*citta*) (*mano*) names a root (*akusala-mūla*) (greed) (hate) ..." — stacked on one referent; recast as a colon series.

If a paragraph already carries a parallel-clause series of glosses (the exemplar Results paragraph sits at the readable maximum), pin only the terms the next claim audits against, and let the rest ride on a prior gloss or the Pāli alone. The mechanical half of this rule is the EDITOR-CHECKLIST "Pāli display" gate, which owns the trigger-term list and the synonym rule; this subsection is the compositional half.

### 3.6 Measured register (describe the systematizing; do not indict it)

The finding across these studies is an observable trend of systematization and hardening, not a fall from grace. Describe it; do not prosecute it. (The operator's calibration: "not the move from Christ to the Mormon church, not THAT alienated"; the wanted tone is "warm but mainly academic.")

- **Drop the early-pure / late-fallen binary.** No "supple teaching" against "closed systems", no "the living word frozen into doctrine". The Visuddhimagga is a masterwork, not a degradation, and systematizing is what a living scholastic tradition does.
- **Neutral verbs, not loaded ones.** systematizes, organizes, names, settles into, is resolved into, comes to be read as; not freezes, calcifies, fixes-into, turns-into. ("Hardening" survives as a named, hedged noun for the trend, not as a verb of blame.)
- **Keep the hedges and name the counter-currents.** A tendency, not a law; count the cases that run the other way rather than waving them away (the individual-guidance paper keeps *puggalavemattatā* as a counted counter-trend). The trend is noted without reproach.
- **Measured is not toothless.** A strong, counted trend may be stated at full strength through the magnitude and the data, not through a verb of blame: name the size of the shift, the count, the clean localization to one stratum jump. Force-carrying verbs that stay neutral: intensifies, sharpens, deepens, recurs, and "hardens" used as the hedged trend-noun's verb where the count supports it. The test is whether the force comes from the evidence or from a moral verb; the former ships. *Before:* "the living teaching freezes into closed commentarial doctrine." *After (the deployed IG):* "the later literature increasingly systematizes ... settles open or hyperbolic formulations into fixed lists and measured quantities", with the internal tension "noted without reproach".
- This sharpens, it does not replace, §3.1 (de-assert / no forced thesis): §3.1 governs how hard a claim is pressed; §3.6 governs the moral colour of the verbs that carry it.

### 3.7 Timeline precision (place each stratum, hedged)

The auditability of §3.5 applied to time: a reader must be able to place each stratum, with concrete hedged anchors. The agreed frame is rendered in full in the deployed individual-guidance abstract (the Background paragraph): the *suttas* ascribed to the Buddha (~5th c. BCE); the First Council of some five hundred arahants near the *parinibbāna*; some four centuries oral; written down ~1st c. BCE in Sri Lanka; the commentaries (*aṭṭhakathā*) largely redacted by Buddhaghosa ~5th c. CE; so roughly a thousand years between the oldest stratum and the commentary. Reuse those anchors rather than restating them here (single source, §1.1), and always hedge: exact dates are contested, and the findings rest on relative order, not absolute date.

- **FAIL:** "the commentaries, written in 430 CE, ..." (false precision, unhedged).
- **PASS:** "the commentaries (*aṭṭhakathā*), largely redacted by Buddhaghosa around the fifth century CE."

### 3.8 Question-sharpening (name the real spine) — author-time, not a copy-edit gate

Name each study's spine for the axis its *frozen* finding actually turned on; do not ship a question that misses a lot while saying little. This re-describes a settled result, it does not re-choose the hypothesis after seeing the data. (For individual-guidance the spine is *function → essence*: a teaching given as a present function, which unwholesome root is active now, how ripe a person's faculties are, where the world stands in present experience, is recast over the strata as a standing property, a fixed character-type, a named tier, a measured quantity; the question is then how far that one move reaches.) The subtitle and the abstract carry the sharpened question, not the seed's first guess.

**This is presentation only.** The H1/H0 split was frozen at pre-registration (SKILL.md); §3.8 sharpens how that frozen axis is *named* in the title and abstract, never which axis was tested. If sharpening the spine would change what was tested, that is a forking-paths violation, not a writing edit. Because §3.8 acts at framing time, the EDITOR copy-edit pass does not apply it to finished prose.

---

## 4. The table standard

We keep tables; each must make ONE point. The difference between a table a reader reads and one they skip is **point-per-table**.

### 4.1 Count and size
- **1 to 2 display tables in the whole paper** (operator's call: fewer tables). Reserve a full table for a categorical breakdown the reader genuinely needs cell by cell (the one headline census split, the per-voice attribution count). Everything else that wants to be a table is either an inline figure (§4.5) or an appendix table. Three or more body tables is a sign the paper is dumping, not arguing.
- **Inline figures carry the gradients and proportions** (§4.5): dot-strips for early-to-late gradients, descending bars for the recall floor, proportion bars for one dominant split. These are the default visual; tables are the exception.
- **A body table is ≤8 rows, ≤5 columns, and fits with its caption in under half a page.** Bigger = it's an enumeration → Appendix A. The body table is a *selection* chosen to make the point; its caption says "6 of N; full set in Appendix A."
- **One finding per table.** If it needs two captions to explain, it is two tables.

### 4.2 Caption = the finding (chart-title discipline)
The caption ASSERTS the takeaway; a sub-line gives the scaffolding. **Reading only the table captions in order should tell the paper's argument.**

> **Table 2. Once homographs are removed, only *meraya* is a clean drinking-word; *majja* is 84% noise.**
> *Three candidate terms, raw substring hits vs. retained after homograph purge. "Purged" = hits that were not the intoxicant sense.*
> *[table]*
> *Full per-segment purge log: Appendix B. Recall floor: §VI.ⁿ*

Forbidden: a bare label-row caption (`| lane | gold recovered | how |`) with the finding recovered only in the prose after the table.

### 4.3 De-jargon the column headers
Headers are read by people who haven't read Methods. Plain words; ≤1 technical term per table, glossed in the sub-line.

| Method-internal (don't) | Plain (do) |
|---|---|
| `hallucinated-warrant` | False citations |
| `fabricated-sense` | Invented meanings |
| `divergence rung-2` | Translators disagree on commitment |
| `layer/stratum disagree` | Tagged early but reads late |

### 4.4 Sentence beats a table when
≤2 data rows · a single A-vs-B comparison · a 2–3-number result. ("69% of free-recall warrants were fabricated; verified extraction cut that to ≤8% and false citations to zero." That sentence beats a 2×6 table — drop the table, send the matrix to the appendix.) Rule of thumb: if a reader scans it left-to-right once and never returns, it's a sentence.

### 4.5 Inline figure beats a table for gradients/proportions (the shape IS the finding)
Three lightweight, typesettable devices — no charting dependency:
- **Stratum dot-strip.** An early→late axis with rows as dots (filled = literal, open = figurative). Shows the "deepens with lateness" gradient in one glance; a 26-row table hides it.
- **Recall-ladder descending bars.** Recall at each query rung (exact → stem → periphrasis → vector) as 4 inline bars — makes "this is a floor, not a ceiling" *visible*. Used once per paper, in §II or §VI.
- **Spark-fraction proportion bar.** `canon ▓▓▓▓▓▓▓▓░░ commentary` for one dominant split. One per finding, sparingly.

Reserve full tables for categorical breakdowns where the reader needs exact cells (IAA, per-class census). Reserve inline figures for gradients/proportions.

### 4.6 The body/appendix split for the wide tables
The 5–6-column audit tables (the absence/co-occurrence table with char-gaps; the 6-column stratigraphy table with the disagree-column) → Appendix A. The body keeps a 3-column "this is the surprising shape" selection. Move the punchline OUT of the 6th column: if "tagged early but reads late" is the thesis, it is the body table's headline, not its last column.

---

## 5. Mandatory readability elements

Every paper MUST contain all seven. They are the difference between "passes peer review" and "a scholar reads it through and enjoys it."

1. **Human / contextual opening.** Open on the subject itself — what Uttarakuru is, what the fifth precept forbids, what an awakening looks like in the texts — with a hook, BEFORE any methodology. Never open with "An earlier pass scored each X on a single axis." The reader meets the thing, then the question, then (much later, in footnotes/appendix) our process.

2. **Numbered roadmap.** The intro's framing paragraph ends with "This study proceeds as follows:" then a one-line preview of every section, each quoting the section's subject and stating its job in a sentence. This is the cheapest, highest-leverage onboarding device and we currently lack it entirely.

3. **≥1 named worked example** (1–2 per paper, in prose). Promote a row from the enumeration to a told mini-narrative with a name: Bāhiya; the Tisaraṇagamaniya elder ("In the city of Candavatī I supported my mother…"); the Buddha's alms-flight to Uttarakuru as a scene; Sāgata at Kosambī for intoxicants; one SN 6.1 *nibbāna* → "extinguishment"/"Unbinding" trace. Tell it the way Anālayo tells Sāriputta and Mahāmoggallāna. The material already exists in our enumerations as list-rows — develop it.

4. **Bullet relief.** Convert inline enumerations into short bulleted lists set off from prose: rival readings of the central term; the four narrating voices; the absence-legs; the three perceptions. One or two per major section. Bodies must not be paragraph-walls.

5. **"In sum" closers.** Each major argument ends with an explicit one-sentence recap before the seam. The reader never synthesizes alone.

6. **Plain-language "what the data says" lead-in per section** — a single declarative apparatus-free sentence BEFORE each table/figure, stating what it shows. ("The headline of detection is a precision/recall cliff." "Most of these events sit in one late stratum.")

7. **"By the numbers" pull-stat** — once per major finding, one bolded number with its meaning, set off like a pulled quote:
   > **0** — false citations under verified extraction, down from a 3.6% rate in free recall.
   > **6 of 8** — divergence suttas where the Pāli is settled, so the disagreement is reception, not text.

   A reader skimming reads only roadmap + section lead-ins + captions + pull-stats and comes away with the whole story. That is the "easy to ingest" target.

8. **A standing "Findings of general importance" section — the last section of every paper.** The discovery sweep's serendipity lane (method core §3.6) surfaces patterns of importance *beyond this study's question* (a cognitive, sociological, or text-historical regularity a scholar of another field would want). These are **walled off** from the study's own thesis in a clearly-titled final section — title it for what it is, e.g. *"Findings of general importance (beyond this study's question)"* — so the operator can find them at a glance and they are never mistaken for the paper's argument. Each find carries its own provenance: **what** it is (one plain sentence), **where** (the corpus ids / loci that ground it), **whence** (the study and date it surfaced from), and a confidence tag. **A find that asserts a strong word** (a "law", "always", "never", "universal", even "principle") **earns its own sense-audit on the load-bearing term before that word ships**: confirm the count rests on the intended sense and not a homonym, or downgrade the word to a hedged "tendency" / "lead" (the homophily find G2 kept "principle" only because the *dhātu* audit confirmed the disposition sense against the eighteen-element technical sense in the same Saṃyutta; an un-audited "law" would have over-claimed on a word the collection itself uses two ways). The section is **append-only** across a study's life: a later pass adds finds, never silently drops them. This is the durable capture that keeps a genuinely general discovery from being lost inside a narrow paper. (It is not a Limitations dump and not a "future work" gesture; every entry is a found, evidenced pattern.)

---

## 6. The fill-in template

A literal markdown skeleton for the deep-research run. One-line guidance under each heading. Footnotes use markdown `[^id]` syntax; the apparatus lane is real footnotes, not inline brackets.

```markdown
# [Subject]: [a neutral topic subtitle — NO method, NO verdict]
<!-- e.g. "Uttarakuru in the Pāli Canon and Commentaries: how the northern
continent is described across textual layers." Method must NOT appear. -->

## I. Introduction
<!-- ~600 wd. Para 1: open on the SUBJECT with a human hook (what it is, why it
matters) — never on our prior pass. Para 2: the question (H1) + the explicit H0
+ one sentence of epistemic grade ("a triage-grade descriptive finding, not a
proof"[^prereg]). Para 3: "This study proceeds as follows:" then a one-line
bulleted preview of §§II–VI. -->

- **II** [subject of frame] — [one-line job]
- **III** [subject of mechanism] — [one-line job]
- **IV** [subject of the walk] — [one-line job]
- **V** [subject of the sharpening] — [one-line job]
- **VI** [what it means] — [one-line job]

## II. [The frame, named for its subject]
<!-- ~1,000 wd. Doctrinal/definitional ground + plain description of the object
of study. One Methods-in-prose sentence: corpus scope + edition note[^edition] +
"all counts are floors; the recall ladder (Fig. 1 / App. B) shows what each query
rung recovers." One-idea paragraphs. Close: "In sum, …" -->

[Fig. 1 — recall-ladder descending bars, optional here or in §VI]

## III. [The core mechanism, named for its subject]
<!-- ~1,500 wd. III.1 survey rival readings of the central term as a BULLET LIST.
III.2 attach our finding. Lead-in sentence → Table 1 (captioned-to-the-point) →
pull-stat. Every Pāli/id/parallel → footnotes. Signpost into IV. -->

### III.1 [Rival readings]
- [reading A] — [one line]
- [reading B] — [one line]

### III.2 [Our finding]
<!-- declarative lead-in BEFORE the table. -->

**Table 1. [Assertive finding sentence].**
*[scaffolding sub-line]*

| [plain header] | [plain header] | [plain header] |
|---|---|---|
| | | |

> **[N]** — [what this number means].

<!-- "Hence I now turn to …" -->

## IV. [The detailed walk]
<!-- ~1,750 wd. Longest section. IV.1 principle; IV.2 a/b/c/d cases. Per leaf:
one bullet list + one concrete physical image. Per-claim provenance signatures →
footnotes[^sig]. A SELECTION table (≤8 rows); full enumeration → App. A. -->

### IV.1 [The principle]
### IV.2 [The cases]  <!-- a / b / c / d as needed -->

## V. [The sharpening + the worked examples]
<!-- ~1,250 wd. V.1 the gradient/sequence as an INLINE FIGURE (dot-strip), not a
big table + a bullet list of the sequence. V.2 ONE or TWO NAMED worked examples
told as prose mini-narratives; all parallels/IAA → footnotes. -->

### V.1 [The gradient]
[Fig. 2 — stratum dot-strip: early→late, filled=literal, open=figurative]

### V.2 [Named example: <Person/Scene>]
<!-- A told story carrying the generalization. Body = clean English; the Pāli,
loci, and parallels for this scene → footnote[^example]. -->

## VI. What this means, and what it doesn't
<!-- ~600 wd. Para 1: plain-language "why a non-specialist should care" —
about the SUBJECT, not about the provenance method. Para 2: the consolidated
Limitations (≤1 pp): edition-relativity, recall floor, measured-not-proven,
effective-n, model-family bounds — ONE place. Close on the question, hedged.
Optional closing primary-text quotation. -->

## Findings of general importance (beyond this study's question)
<!-- The discovery sweep's serendipity lane, walled off from the study's own
thesis. The LAST reading-lane section (after VI, before the apparatus), so the
operator finds it at the bottom of the page. One sub-entry per find; append-only;
never silently dropped. Each: **what** (one plain sentence) · **where** (corpus
ids / loci) · **whence** ([study], [date]) · confidence. -->

### G1. [Plain title of the find]
<!-- what it is in one sentence; the evidence ids; the field it matters to;
whence (study + date); confidence. -->

---

## Footnotes
<!-- The apparatus lane. Every corpus id, Pāli string, parallel siglum, PTS
citation, per-claim provenance signature, single-claim SQL pointer, hedged
technical dispute, and "cf. in more detail" pointer lives here. -->

[^prereg]: Pre-registration: research/PREREG_*.md. Frozen [date].
[^edition]: All readings relative to the CST apparatus as ingested; base text is
the SuttaCentral Mahāsaṅgīti reading text.
[^sig]: [stratum: … | layer: … | speaker: … | register: … | edition: …]; corpus
row cst-… ; full row in Appendix A.
[^example]: Pāli string; loci (MN …, SN …); parallels (SĀ …, D …); IAA κ=…

---

## Appendix A — Full enumeration
<!-- Every row: human title · SC id · CST id (+ dup) · stratum · layer · speaker
· edition · verification status. Resolves to live corpus rows. "Full data:
<census>.json." This is the contribution, in full. -->

## Appendix B — Method register
<!-- 11-axis triage worksheet · recall ladder at every rung · exclusions /
disambiguation register · pre-registration text · prediction-scoring (PASS/etc).
Everything "process" that today sits in the body. -->

## Appendix C — Inter-annotator agreement
<!-- Full matrix, κ per axis, adjudication notes. -->

## References
```

---

## 7. What stays the same (non-negotiable rigor, relocated not removed)

None of the readability moves weakens rigor. Every artifact below survives in full and stays auditable; it simply moves to the apparatus lane.

- **Full enumeration** — every instance, complete, in Appendix A. The body shows a selection; the appendix shows all. Nothing dropped.
- **Every citation resolves** — every corpus id in the footnotes and Appendix A resolves to a live row; every JSON row resolves to a real passage. The consistency gate stays.
- **Provenance signature** — preserved verbatim per claim (footnote) and per row (Appendix A). A reviewer following any body sentence to its footnote reaches the same `[stratum | layer | speaker | register | edition]` block we put inline today.
- **IAA** — full matrix + κ per axis in Appendix C. One headline κ may appear in a Methods sentence.
- **Recall floor** — shown once as a figure, stated once in Methods ("counts are floors"), discussed once in Limitations, full rungs in Appendix B. Honest about what is not recovered.
- **Pre-registration** — frozen, linked, with prediction-scoring in Appendix B. Outcomes are reported in measured prose, not as PASS/REJECTED stamps in the body.
- **Honest limitations** — kept, consolidated into ≤1 pp in §VI: edition-relativity, recall floor, measured-not-proven / triage-grade, effective-n, model-family bounds.
- **No em dashes** (per the global writing rule; note the spaced construction and "to" ranges used throughout this spec).
- **No AI-leak / no forced thesis** — hedged register throughout; no assertive headline verbs; the paper does not grade itself; the operator's "do not force a thesis" rule is enforced by §3.1.
- **No LLM synthesis presented as findings** — the writing is human/relocated reporting of machine-checkable data, not model-generated interpretation.

**The net:** the body reads like Anālayo (plain, hedged, organized by finding, signposted, with named examples and almost no inline citations); the 3–6 tables ARGUE (point-stating captions, one finding each, spread not dumped); and the full rigor is intact, one glance below the line or one page back in an appendix — auditable, just not in the reading lane.
