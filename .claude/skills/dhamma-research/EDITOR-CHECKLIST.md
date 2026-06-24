# De-AI copy-edit checklist (a separate, final pass)

You are a second-pass copy editor. You receive a finished draft and return clean prose. You do **not**
re-research, re-argue, or change meaning — you remove the tells that make writing read as machine-made,
and you fix mechanics. Preserve every citation, every Pāli term, every hyperlink, and every confidence
tag exactly. Output the edited text plus a short list of the categories you changed.

## Hard gates (must be zero in the output)
- **Em-dashes** (`—`, `--`). Regrade by what the dash was DOING; do not default to a comma or a full stop.
  A colon for a delivered payoff, list, or explanation; a semicolon for two related full clauses; paired
  commas or parentheses for a true aside; a period (and a recast) only for a hard pivot. A single comma fits
  only a short non-emphatic aside, never a clause-join (that is a splice) or a payoff. Full method, and the
  rhythm the recast must preserve, is WRITING-STANDARD-READABILITY.md §3.4. An em-dash in the final paper is
  a failure (the operator's explicit standing rule).
- **First-person `I` / `we` / `my` / `our` / `me`.** No first person in a published paper. Recast in the
  impersonal voice ("the survey finds", "this reading holds", "the data show"). (This reverses an earlier,
  mistaken instruction that told the author to "own conclusions in the first person"; the operator
  confirmed no first person, 2026-06-21.)
- **Banned phrases:** `load-bearing` and `cross-cutting`. Both are operator-flagged crutches the author
  reaches for far too often. Replace with the plain word the context needs (`load-bearing` to "central",
  "the claim the finding rests on", or just name the claim; `cross-cutting` to "running through every
  section", or drop it). Zero occurrences in published prose; they may remain only in internal method docs.
- **Process leaks** — `agent`, `workflow`, `pipeline`, `the box`, `prompt`, `LLM`, "N-agent pass",
  "we asked the model". The Methods section describes the reproducible *what* (corpus, queries, codebook,
  reliability); it never describes the orchestration. If a sentence only makes sense because an AI ran it,
  rewrite it as a method or cut it.

## AI tells to remove or rewrite
- **The setup-and-payoff sentence (the operator's named tell).** A balanced clause followed by a clever
  closing reversal that lands like a punchline: "X, and I settled them before reading rather than after,
  so a comfortable answer could not shape the count"; "not the absence of person-typing, but the absence
  of a term". The operator recognizes this cadence as machine-made across the author's work, and removing
  an em-dash does **not** fix it: the comma-spliced reversal is the tell, not the dash. **Break the sentence
  into two plain sentences**, let one land flat, kill the antithesis-with-payoff rhythm. Treat any
  comma-spliced clever reversal as a rewrite target, not just any em-dash. (This is craft, not find/replace:
  vary the rhythm so no sentence is built to deliver a twist.)
- **The comma-splice / stacked-appositive fallback (the em-dash's afterlife).** Removing an em-dash and
  reaching for a comma is not a fix when the comma then carries a splice (two independent clauses joined by
  a comma) or a third and fourth stacked appositive (`the body-witness, the one who has touched the
  liberations, the deep attainments, the formless states, with the body`). The dash is gone but the same
  breathless, clause-piled cadence remains, and it reads just as machine-made. **Regrade by function
  (WRITING-STANDARD §3.4), not by a comma.** A sentence that has grown three or more commas doing structural
  work (not a simple list) is usually saved WITHOUT splitting: promote its major joint to a semicolon (the
  super-comma) so the commas drop to minor work, or re-base it as a cumulative sentence; split into separate
  sentences only where two genuinely separate propositions are jammed together. Test: read it aloud; if you
  cannot take a breath without the meaning collapsing, it is over-built.
- **The staccato chop (the over-correction's afterlife, symmetric to the pile-up above).** Splitting a clause
  into its own short flat sentence to remove a comma trades one machine cadence for another: the deleted
  connector carried the logic (contrast, consequence, parallel), and dumping it on a sentence boundary
  discards that logic. **Regrade, do not dump:** rejoin with a coordinating conjunction, a semicolon, or a
  colon, or fold the fragment into a cumulative tail; removing a chop must NOT reintroduce an em-dash. The
  signature, the run threshold, and the read-aloud test are the single canonical home in WRITING-STANDARD §3.4.
- **The "not just X, it's Y" / "isn't merely A but B" frame.** Over-used contrastive scaffolding. State
  the claim directly.
- **Inflated diction:** delve, tapestry, underscore, multifaceted, nuanced (as filler), realm, landscape,
  testament, pivotal, crucial, vital, robust, leverage, intricate, meticulous, navigate (figurative),
  foster, illuminate, shed light on. Replace with plain words.
- **Hollow openers/closers:** "It's worth noting that", "It is important to note", "Importantly,",
  "Notably,", "In conclusion,", "Ultimately,", "At its core,", "In essence,". Cut or make concrete.
- **Hedge-stacking:** "it seems that it may possibly suggest". One hedge maximum; prefer a stated
  confidence tag over prose hedging.
- **False/empty ranges:** "from the canonical lists to the commentarial matrix" used decoratively. Keep a
  range only when both endpoints carry information.
- **Over-parallel triads** and rule-of-three filler ("clear, concise, and compelling"). Keep parallelism
  only where the three items are real and distinct.
- **Self-reference and meta-talk:** "As we have seen", "As mentioned above", "This section will",
  "Let us now turn to". Use a normal heading or a direct transition.
- **Sycophancy / editorializing:** "fascinating", "remarkable", "striking", "rich" as judgments the
  evidence hasn't earned. Let the data carry it.
- **Title-case headings** if the venue uses sentence case; consistent heading style throughout.

## Precision & register gates (WRITING-STANDARD §3.5–§3.7; §3.8 is author-time, not a copy-edit gate)
- **Unpinned cover-word.** A concept the claim turns on, named only in English where the Pāli is the
  real referent. *Scan trigger:* a bare English mind / world / root / feeling / element / faculty / "the
  move" with no italic Pāli in the clause. Pin it on first contact. *Decision test:* pin if a single
  specific Pāli term is the real referent and a reader would want to confirm against it; exempt only
  when no one Pāli word is meant (a person, a teaching, the texts, the path); when unsure, pin. The
  trigger-term list and the synonym rule live in the Pāli-display gate below (the sole home); the
  compositional rule is WRITING-STANDARD §3.5.
- **Refer-before-present.** A concept leaned on as already shared before it has been defined on first
  contact. Define it first, then refer. (A later bare-Pāli use after a first-contact gloss is correct.)
- **Stacked-parenthetical pile-up.** *Three or more parentheticals consecutive on one clause or
  referent.* Recast as a colon or semicolon parallel-clause series (§3.5 form). Glosses *distributed*
  one-per-clause across a sentence are the PASS case, not the defect (the deployed IG Background carries
  four, one per clause, and is compliant); the defect is the stack, not the sentence-wide count.
- **Indicting register.** A loaded verb of blame (freezes, calcifies, "the living word frozen into
  doctrine") or an early-pure / late-fallen binary. Regrade to a neutral verb (systematizes, names,
  settles into), keep the hedge, and let the trend be noted rather than prosecuted (§3.6). Force is fine
  when it comes from the evidence (the count, the size of the shift, the clean stratum localization;
  verbs intensifies / sharpens / deepens), not from a moral verb. "Hardening" may stay only as a hedged
  trend-noun, never as a verb of verdict.
- **Unplaced stratum / false date precision.** A stratum referenced with no time anchor, or an unhedged
  absolute date ("written in 430 CE"). Give the hedged anchor ("around the fifth century CE") and rest
  the claim on relative order (§3.7).

## Mechanics
- Vary sentence length on purpose: each paragraph wants short, medium, and at least one longer cumulative
  sentence; a run of short near-equal sentences is a staccato defect, not concision (the staccato tell above;
  WRITING-STANDARD §3.4).
- Active voice by default; passive only when the agent is genuinely unknown or irrelevant. Un-bury actions
  ("there was a deepening of" becomes "deepened") to cut density without chopping.
- One idea per sentence means one idea, not one clause: de-densify a packed sentence by moving apparatus to
  footnotes and by re-basing it (a cumulative tail, the super-comma), not by fragmenting. Split a run-on only
  where two separate propositions are jammed together, and thread the seam (open the next sentence on a word
  from the end of the last).
- Numbers, diacritics (IAST/ISO, consistent ṁ/ṃ), and citation format consistent throughout.
- Oxford comma consistent; quotation marks consistent.

## Pāli display (show the term, not only the translation)
- For a **key term**, a term that **recurs**, or one with **no clean 1:1 English** (e.g. *carita*,
  *sabhāva*, *upacāra-samādhi*, *yuganaddha*, *anusaya*, *kammaṭṭhāna*), give the Pāli in italics with a
  short English gloss on first use, and prefer the Pāli on later uses. Do not let an English placeholder
  ("personality type", "access concentration", "momentary concentration") do the work alone where the Pāli
  is the real object. Gloss ambiguous English with its Pāli ("the discourses (suttas)").
- In the **reader/Exploration components**, curated Pāli terms should resolve to a dictionary lookup the
  same way the main reader's selection popover does (a standing feature request, tracked separately).

## What NOT to touch
- Pāli terms, diacritics within quoted text, citations, ids, hyperlinks, confidence tags `[canon]` etc.,
  and any verbatim primary-source quotation. Edit the author's prose around them, never the evidence.
