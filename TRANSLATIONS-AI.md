# AI-assisted draft translations — process v0

**Status: design draft, not implementation. Expected to change as
we run the first experiments. Nothing in this document is the
final answer for any of the decisions below — they're the
starting points.**

This file captures the standardized process we'll use to generate
**machine-drafted translations** of untranslated passages in the
corpus (primarily CST commentary + sub-commentary, plus extra-
canonical works where no English exists). The goal is to give
scholars a *reading aid* for material that would otherwise be
inaccessible — explicitly not a substitute for a human translator's
work, and never rendered in a way that could be confused with one.

If a human translation exists for a passage (Sujato, Ṭhānissaro,
Bodhi, Walshe, Nyanaponika, et al.), this pipeline does not touch
it. AI drafts only fill gaps.

---

## The gap

| Layer | Passages | English available | Gap |
|---|---:|---:|---:|
| Tipiṭaka | 14,377 | 5,113 (35.6 %) | 9,264 |
| Commentary (Aṭṭhakathā) | 3,470 | ~80 (2.3 %) | 3,390 |
| Sub-commentary (Ṭīkā) | 5,109 | 0 | 5,109 |
| Extra-canonical (Anya) | 3,030 | small | ~3,000 |

The commentaries and ṭīkā together (~8,500 passages with
essentially no English) are the bulk of what we can't currently
make legible to non-Pali-reading scholars.

---

## Posture: draft, not translation

This is the most important rule and the rest of the design
exists to enforce it.

Every AI-generated rendering must:

- Be visually distinct from human translations on the page —
  bordered, badged, possibly italicised or in a different family.
- Carry an inline footer naming the model, the prompt version,
  the generation date, and the word **"machine-drafted."**
- Default to **hidden** in the reader. Scholars must opt in via
  a settings toggle.
- Never appear in citation-export output as if it were a
  scholarly translation.
- Never feed back into the FTS / Meaning indexes in a way that
  blurs it with translated text. (See "Indexing" below.)

If at any point a user could mistake a draft for a real
translation, the design has failed. Err on the side of *over-*
labelling.

---

## Why now is the moment to try

- **Bhikkhu Bodhi's commentary translations** cover at most ~10 %
  of the commentarial corpus even if BPS grants permission. The
  rest will never be human-translated at any tractable rate.
- **Compute cost** is no longer the constraint — the maintainer's
  Anthropic flat-rate plan absorbs the per-token cost. We can
  afford generous context (DPD glosses, parallel-passage hints,
  full commentarial chunks) and a high-quality model variant
  without budget pressure.
- **The model is competent at Pali.** Not perfect — it makes the
  Pāli-specific mistakes documented under "Known failure modes" —
  but the quality is now meaningfully above "useless gloss" and
  approaches "scholar's first-pass reading."
- **The labelling discipline above** is the only thing standing
  between this being a research aid and being epistemically
  harmful. The cost of getting that right is small; the cost of
  getting it wrong is large.

---

## Model

**Claude** (Anthropic), accessed via the maintainer's
flat-rate subscription. Specific model variant *pinned at
experiment start* — the schema records which version produced
each draft so we can identify which rows came from which model
when we later upgrade.

Pinning matters because translations should be *reproducible*.
A scholar who finds a confusing rendering and wants to
investigate needs to know the model couldn't have silently
changed under them. If we re-run with a newer model, that's a
batch operation that produces a fresh dated version, not an
overwrite.

**Why Claude and not a Pāli-specialised model:** there isn't a
production-grade Pāli-specialised model. Claude trained on a
generalist corpus that includes substantial Buddhist Studies
material. Its knowledge of canonical vocabulary is real; its
weaknesses are commentarial register and very long compounds
(see failure modes below).

---

## Process v0

The order matters. **Do not skip steps to move faster.**

### 1. Single-work pilot
Start with **one** Aṭṭhakathā work — probably the
Sumaṅgalavilāsinī (DN-A) commentary on **DN 1** specifically,
because that text already has Bhikkhu Bodhi's published English
translation of the same passage (*The All-Embracing Net of
Views*, BP209S). That gives us a human gold standard to compare
the machine draft against.

The pilot's purpose isn't to produce a usable translation; it's
to surface the failure modes of our prompt + model on a known-
hard passage with a known-good answer.

### 2. Show to one or two Pali-reading scholars
Hand the machine draft + Bodhi's translation + the source Pāli
to one or two people who actually read Pāli. Ask them, in writing:

- Is the machine draft useful as a reading aid for someone who
  doesn't read Pāli?
- Is it misleading anywhere in a way that's worse than no
  translation at all?
- What single change to the prompt would most improve it?

Their answers — not ours — drive the prompt revision.

### 3. Iterate prompt + post-processing
Run another pass on the same passage with the revised prompt.
Compare to v0. Decide whether the gains are worth the change.
Lock in the prompt version once a working baseline is reached.

### 4. Scale to one Aṭṭhakathā work
Run the locked prompt across the entire chosen work. Spot-check
random passages. Look for systematic failure modes that didn't
appear in the pilot passage (e.g., uddāna verses, abbreviated
lists, citations of other texts).

### 5. Scale to all commentary + ṭīkā
Only after step 4 has produced a result the reviewers are
comfortable shipping with the "machine-drafted" label.

---

## The prompt template

Recorded in the repo as `scripts/ingest/ai-translate.prompt.md`.
Versioned via filename suffix (`-v1`, `-v2`, …).

The prompt's shape (not final wording):

1. **Role framing** — "You are producing a draft English reading
   aid for scholars studying the Pāli text below."
2. **Hard constraints**:
   - Translate every sentence; do not skip difficult ones.
   - If a term has multiple defensible English equivalents, pick
     one and note alternatives in a footnote.
   - Mark phrases you are unsure of with `[?]` after the word.
   - Do not paraphrase; aim for a literal-but-readable rendering
     in the style of Bodhi or Ñāṇamoli, not Sujato.
3. **Anchored vocabulary** — inline DPD entries for any term the
   passage uses heavily, so the model is grounded against the
   dictionary the rest of the site uses.
4. **Context** — the previous passage's English (if any), the
   work's title, and the passage citation.
5. **Output schema** — JSON with `translation`, `notes` (free-
   text translator-style notes), `confidence` ("high" / "medium"
   / "low"), and `glossary` (chosen English for key Pāli terms).

Generation runs offline, batched, with cached context windows so
the same DPD anchors don't re-tokenise per call.

---

## Storage

New table:

```sql
CREATE TABLE IF NOT EXISTS ai_translations (
  passage_id    TEXT PRIMARY KEY REFERENCES passages(id),
  text          TEXT NOT NULL,
  notes         TEXT,                  -- model-generated translator notes
  glossary      JSONB,                 -- {pāli: chosen-english}
  confidence    TEXT,                  -- 'high' | 'medium' | 'low'
  model         TEXT NOT NULL,         -- e.g. 'claude-sonnet-4.7-pinned'
  prompt_ver    TEXT NOT NULL,         -- e.g. 'v1'
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'draft'  -- 'draft' | 'reviewed' | 'retracted'
);
```

Separate table from `translations` deliberately — never co-mingle
machine-drafted text with human-translator rows. The reader
queries both; the UI renders them differently.

`status='retracted'` exists so we can mark drafts that turned out
to be misleading without deleting the row (we want the audit
trail of "we did show this on these dates").

---

## UI rules

- **Off by default.** A settings toggle: "Show machine-drafted
  translations for passages without a human translation." Off.
  Until the user explicitly turns it on, they see "no translation
  available" placeholders where a human translation would
  otherwise appear.
- **Visually distinct.** When shown, AI drafts render with:
  - A subtle hatched left border (or similar non-content marker)
  - The translator attribution footer reads **"machine-drafted ·
    [model] · [prompt-version] · [date]"** in italics, in the
    tertiary text colour. No translator-style first-name-last-name
    rendering.
  - A persistent "this is a draft" chip or icon at the top.
- **Inline confidence indicator** — low-confidence passages get a
  more prominent warning ("the model flagged this passage as
  uncertain; treat with extra caution").
- **`[?]` markers preserved.** Anywhere the model marked a phrase
  with `[?]`, render it with a subtle underline so the user knows
  the model itself flagged it.
- **No FTS indexing.** AI translation text does **not** get
  written into the `passages.translation` or `translations.text`
  columns. It lives only in `ai_translations.text`. The default
  FTS index doesn't see it.
- **Optional Meaning-mode use** — *separately gateable* setting
  whether the meaning-mode vector search should include AI
  translations. Off by default. When on, results from AI drafts
  are visibly marked in the result card.

---

## Corrections workflow

Every AI-drafted rendering has a "this is wrong" affordance
(probably a small flag icon next to the draft footer). Clicking
it opens a small form:

- The passage and its current draft
- A field for "what's wrong" (free text)
- Optional field for "what it should say" (free text)

Submissions are stored in a `ai_translation_corrections` table
(passage_id, model, prompt_ver, user_email if provided, note,
suggested, created_at). The maintainer reviews these. Curated
corrections may:

- Promote a passage to `status='reviewed'` if the maintainer
  manually edits the draft based on the report
- Cause a passage to be `status='retracted'` if the draft is
  significantly misleading and no quick fix exists
- Feed back into prompt revisions for the next batch

---

## Known failure modes (document as they're discovered)

This list starts empty and grows as the pilot finds them.
Initial guesses for what we'll find:

- **Long compounds** — Pāli compounds of 5+ elements get
  partially analysed; the model picks an early-and-wrong
  bracketing and locks in.
- **Commentarial citation idiom** — "iti vuttaṃ hoti" and similar
  formulae get over-translated; the meta-structure of "this is
  what is said" disappears.
- **Uddāna mnemonics** — verse summaries of section contents
  are translated as if they were prose; the model doesn't
  recognise the genre.
- **Implicit subject continuation** — long passages with
  un-marked subject changes confuse the model; pronouns refer
  back wrong.
- **Sectarian vocabulary divergence** — words with different
  technical senses in Theravāda vs. Mahāyāna get the wrong sense
  applied.

Each documented failure mode becomes a candidate for
prompt-level mitigation in the next version.

---

## Open questions we haven't decided

Listed in no particular order. Most will get resolved during the
pilot.

- Do AI drafts of *verse* passages get a different prompt /
  presentation than prose? (Probably yes — verse demands
  different rendering.)
- Should the model see surrounding passages as context, or only
  the focal passage? (Surrounding = better quality, more cost.
  Cost not a problem here, so probably yes.)
- For passages where a human translation of an *adjacent* passage
  exists, should we feed that translation in as a style anchor?
- How do we handle passages that quote canonical text we *do*
  have a translation for? (Probably substitute the human
  translation inline rather than re-translate.)
- Per-translator style choices — do we mimic Bodhi (literal,
  footnoted) or Sujato (readable, modern)? My instinct is Bodhi-
  style, because the audience is scholars, not general readers.
- Should low-confidence passages be excluded from the dataset
  entirely rather than rendered with a warning?
- Should we expose a "regenerate this passage" button to the
  maintainer? Cheap to add, useful for iteration.
- Multiple drafts per passage at different temperatures —
  research aid for the scholar (show me three possible
  readings)?

---

## What we are explicitly NOT doing

- We are not producing translations of the canonical Pāli
  Tipiṭaka where existing human translations are available. The
  Sutta side is well-covered by Sujato + ATI; we don't replace
  human work.
- We are not running the model at request time. All drafts are
  generated offline, stored in the DB, served as static rows.
  No latency in the user-facing reader.
- We are not feeding AI-drafted text back into the model as
  training-like context for future passages. Each passage is
  generated independently against the pinned prompt + the
  source Pāli + DPD anchors only. (Avoids draft-quality drift
  compounding over a corpus.)
- We are not marketing this as "AI translation." The label is
  always "machine-drafted reading aid" or similar — the noun is
  not "translation."

---

## Next concrete step

When the maintainer is ready: pick the DN 1 commentary passage
(the one Bodhi covered in BP209S) and run a single one-shot
generation through Claude with the v1 prompt sketched above.
Hand the output to the maintainer alongside Bodhi's published
rendering. Iterate from there.
