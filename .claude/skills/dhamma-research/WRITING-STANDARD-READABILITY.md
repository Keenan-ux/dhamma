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

Strongest permitted body verbs: **suggests · indicates · seems · appears · the data show.** Own conclusions in the first person ("it seems to me," "I take this to mean"). No ALL-CAPS verdicts anywhere in the body. Method does not appear in the title.

### 3.2 Unpack dense multi-number / multi-clause sentences

Rule: **a body sentence carries at most ONE number and ZERO raw citations.** If it has more, split it, move numbers to a table/figure, move citations to footnotes.

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
