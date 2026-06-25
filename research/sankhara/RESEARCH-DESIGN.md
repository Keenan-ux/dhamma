# Pre-registration — Saṅkhāra and the translator: does the rendering track the collocation field?

*Frozen 2026-06-25, BEFORE the full per-row enumeration and blind coding. dhamma-research method.
This study has a DISCLOSED SEED: the deep-research report `research/deep-research/sankhara.md` (DR-4) and a
structural exploration (`_explore.py` / `_explore2.py`, the only data seen before this freeze) already
showed the headline direction. Per Hard rule 1, the value of this pre-registration is therefore not
data-blindness but the frozen **decision rule + falsifiable predictions + audit protocol + codebook**. The
per-row coding, the blind inter-coder pass, and the verbatim scoring of every prediction happen AFTER this
freeze. Corpus snapshot: 194,710 passages (api/dbcheck, 2026-06-25). Internal doc; em-dashes allowed here,
NOT in the deliverable prose.*

## The question

The Pāli word *saṅkhāra* is built from *saṃ* + the root *kar* ("to do, make"), and it carries an
active/passive ambiguity by construction: the *constructing* (what volition does, the kammic activity) and
the *constructed* (what has been put together, conditioned things). The canon uses the word in several fixed
collocation fields that lean different ways:

- **the dependent-origination link** (*avijjāpaccayā saṅkhārā*, "ignorance conditions saṅkhārā") — the
  kammic/active sense;
- **the fourth aggregate** (*saṅkhārakkhandha*, glossed by the canon itself as *cha cetanākāyā*, the six
  classes of volition) — the active sense, with a wider compass;
- **the kāya / vacī / citta triad** (*kāyasaṅkhāra* etc., the bodily/verbal/mental "formations" co-listed in
  breath meditation and the cessation-attainment) — a process sense;
- **the impermanence maxim** (*sabbe saṅkhārā aniccā / dukkhā*, "all saṅkhārā are impermanent / suffering")
  — the passive, "all conditioned things" sense.

When a modern translator renders the whole canon into English, do they **disambiguate** saṅkhāra by
collocation field (choosing a different English word where the field leans active versus passive), or do they
**collapse** it to a single fixed word everywhere? This is a question about translator behaviour on
identical canonical text, not about the corpus's own chronology.

Sub-questions, on their distinct axes:
1. **Lexeme-by-field (objective):** for each high-coverage translator, what is the rendering lexeme in each
   collocation field, and does it vary across fields?
2. **The maxim switch (the falsifiable core):** does the translator's word at the *sabbe saṅkhārā* maxim
   differ from that translator's own default word elsewhere?
3. **Sense-tracking (interpretive, IAA-gated):** where a translator does switch, does the switch track the
   active/passive sense boundary, or is it idiosyncratic?
4. **Coverage:** which translators the corpus can actually place, and which it cannot (the binding limit).

## Hypotheses (H0 is pre-committed and will be reported if it wins)

- **H1 (the seed thesis):** translators differ systematically in field-disambiguation. **At least one**
  high-coverage translator disambiguates saṅkhāra by collocation field (its rendering lexeme is a function
  of the field, and in particular its maxim word differs from its default word), and **at least one**
  collapses it to a single fixed word across all fields including the maxim. The seed names the poles:
  **Sujato disambiguates** (default "choices" for the constructing fields; "processes" for the triad;
  "conditions" for the passive maxim) and **Thanissaro collapses** ("fabrications" everywhere).
- **H0 (the counter, pre-committed):** no high-coverage translator's rendering is field-conditioned. Either
  every high-coverage translator uses one dominant word across all four fields (uniform collapse across the
  board), OR whatever lexeme variation exists is **not** aligned to the collocation-field boundary (it is
  noise from verse paraphrase, drafting drift, or homograph contamination, not a principled field switch).

The two hypotheses make opposite, checkable predictions about the **translator × field lexeme matrix**.
Crucially, the field axis is coded from the **Pāli** original and the rendering axis from the **English**
translation, by independent rules (below); the matrix is therefore free to disconfirm H1 (e.g. Sujato could
turn out to write "choices" at the maxim too, or Thanissaro could turn out to switch). This is a genuine
test, not a partition of the rows by the thesis's own definition (forking-paths guard, SKILL rule 7).

## Falsifiable predictions (scored verbatim afterward, PASS and FAIL alike)

Let the **default** word for a translator be its single most frequent saṅkhāra-rendering lexeme across the
constructing fields (DO link + aggregate + triad), established before the maxim cell is read.

- **P1 (Sujato disambiguates).** On the fully-enumerated maxim cell, Sujato renders *sabbe saṅkhārā* with a
  passive-sense word ("conditions" / "conditioned (things)") that is **distinct from his constructing-field
  default** ("choices"). Additionally his triad rendering ("processes") is distinct from both.
  **Disconfirming-case leg (pre-committed):** if **2 or more** of Sujato's translated maxim rows render
  saṅkhāra with his constructing default ("choices"), P1 fails and H1 loses its Sujato pole.
- **P2 (Thanissaro collapses).** On the same maxim cell, **every** Thanissaro maxim row renders saṅkhāra
  with his constructing-field default ("fabrications"). **Disconfirming-case leg (pre-committed):** if
  **1 or more** of Thanissaro's translated maxim rows uses a distinct passive-sense word for saṅkhāra (not
  *paccaya*; the *paccaya* = "requisite condition" homograph is excluded by hand-alignment), P2 fails.
- **P3 (the contrast / the headline).** The two highest-coverage modern canon translators occupy **opposite
  poles**: one's saṅkhāra lexeme is field-conditioned (≥2 distinct sense-tracking words across the four
  fields) and the other's is field-invariant (1 word across all four). **Disconfirming leg:** if both
  high-coverage translators are field-invariant, or both are field-conditioned, P3 fails and the "opposite
  poles" headline is dropped.
- **P4 (corpus limit, stated not tested).** The corpus cannot place Horner (the documented context-splitter)
  or Bodhi (the fixed-word advocate) at usable coverage (predicted n ≤ ~2 own-text rows each). This is a
  scope disclosure, recorded so the study does not overclaim its translator panel; it is reported as
  measured coverage, not as a hypothesis.

A falsified prediction is a **logged deliverable**, not a silent fix (Hard rule 1c): each of P1–P4 is scored
verbatim in the dataset and the paper, and if the data overturns a leg the framing is corrected openly.

## What would force H0 / falsify the headline

- The maxim cell shows Sujato using "choices" (his constructing word) on the maxim (P1 disconfirming leg).
- Thanissaro switching words by field (P2 disconfirming leg).
- The apparent "switch" being an artifact: the maxim rows are a single repeated verse paraphrase (low type
  count), or the rendering counts are contaminated by the *paccaya* = "condition" / *saṅkhata* =
  "conditioned" homographs (so "conditions" is not actually rendering *saṅkhāra*). Both are checked by
  per-row hand word-alignment on the short maxim line, not by substring frequency.
- Both high-coverage translators behaving the same way (P3 disconfirming leg).

## Method (frozen)

1. **Collocation-field coding (from the Pāli `original`, regex, documented in `_enumerate.py`).** A primary
   own-text row (`work_role='mula' AND is_primary AND work_slug <> 'pli-vism'`) carrying the saṅkhāra stem
   (`saṅkhār|saṃkhār`) is assigned to a field by these markers (a row may match more than one; multi-field
   rows are flagged):
   - `do_link` — `avijjāpaccayā saṅkhārā` | `saṅkhārapaccayā` | `saṅkhāra-paccayā`;
   - `aggregate` — `saṅkhārakkhandh`;
   - `aggregate_enum` — the pañcakkhandha list `…saññā saṅkhārā viññāṇ…`;
   - `maxim` — `sabbe +saṅkhārā +(anicc|dukkh)` (the *sabbe dhammā anattā* third line uses *dhammā*, not
     *saṅkhārā*, and is correctly excluded);
   - `triad` — `(kāya|vacī|citta|mano)-?saṅkhār`.
   The field is a function of the Pāli, independent of any translation.
2. **Rendering coding (from the English `translations.text`).** The **maxim** field is coded per-row by hand
   word-alignment: the maxim is a single short line ("all X are impermanent / inconstant / suffering"), so X
   is read directly off the English and is the saṅkhāra rendering with certainty. The **constructing fields**
   (DO / aggregate / triad) are coded on a fixed set of canonical **exemplar loci** (frozen here: DO =
   SN 12.1, SN 12.2; aggregate = SN 22.48, SN 22.56, SN 22.79; triad = MN 44, MN 118) where the rendering is
   read in context, plus a **corpus-wide dominant-lexeme background count** (substring frequency over all of
   a translator's saṅkhāra rows) reported with its noise caveat (it over-counts the *paccaya* / *saṅkhata*
   homographs and is therefore directional, not the per-row evidence). The default word is taken from the
   exemplar loci, confirmed by the background count.
3. **Sense-family coding (the interpretive layer, IAA-gated).** Each distinct rendering lexeme is coded into
   a sense-family: `active-constructing` (choices, fabrications, determinations, activities, constructions,
   volitions, forces), `passive-conditioned` (conditions, conditioned things), or `neutral` (formations,
   processes, conceptions, the deliberately colourless renderings). This coding is interpretive; **k≥3 blind
   coders** classify each lexeme-in-context and Cohen/Fleiss κ is reported **scoped to the coded unit**
   (SKILL rule 9). The headline (lexeme-by-field variation, P1–P3) does **not** depend on this layer; it
   rests on the objective lexeme-identity-per-field observation, which any reader can re-check from the
   stored rows. The sense layer only adjudicates whether a switch is *principled* (tracks active/passive)
   versus idiosyncratic.
4. **Per-claim-granularity gate (SKILL rule 5).** Every coded rendering is read from the row's own English
   text, never assigned by a translator-level lookup. A category that comes out exactly equal to a
   translator's row-count is re-checked per row.
5. **Coverage census.** Distinct translators with ≥1 own-text saṅkhāra row, with counts, so the panel's
   limits (Sujato/Thanissaro high; Ñāṇamoli = Visuddhimagga commentary; Horner/Bodhi ~n=2) are reported as
   measured, not assumed.
6. **Auditability.** Every cell resolves to a real corpus id, opening in the live reader; both the Pāli and
   English evidence snippets are stored per row; the corpus counts re-derive from `_enumerate.py` (committed
   query→result).

## Scope limits and edition disclosure (stated up front)

- **This is a study of translation behaviour, not of saṅkhāra's meaning.** It cannot adjudicate which
  rendering is *correct* (Thanissaro would defend uniform "fabrications" as principled; the data shows
  divergence and consistency, not rightness). It settles each translator's dominant choice, its
  consistency, and whether it disambiguates by field; nothing about the word's true sense.
- **Coverage is the binding constraint (P4).** The instrument is mostly a **Sujato-versus-Thanissaro**
  comparison, with Ñāṇamoli for the Visuddhimagga (which is commentary, a different register, not canon) and
  thin support from Walshe, Buddharakkhita, Olendzki, Brahmāli. Horner (the one translator documented to
  split saṅkhāra by context, MN 44) and Bodhi (the fixed-word advocate) sit at ~n=2 own-text rows, too thin
  to place; ingesting their full SN/MN is the named future-work item, not a precondition for the
  Sujato/Thanissaro headline, which is already saturated.
- **No statistical power per cell.** The head-to-head maxim intersection is small (a handful of suttas
  carry the maxim AND have ≥2 translators). The study is reported as a **per-translator
  consistency-and-disambiguation profile with named exemplars**, a demonstration matrix, NOT inferential
  statistics. The per-translator profile (a translator's whole maxim set versus its own constructing-field
  set) is better powered than the head-to-head intersection and is the primary evidence.
- **Double-ingest.** The canon is ingested under both SuttaCentral and Chaṭṭha-Saṅgāyana ids; translations
  attach to both, so `is_primary` deduplication is applied throughout to count each text once (SKILL rule 4).
- **Edition of record for renderings.** Sujato = SuttaCentral (Bilara, 2018–, CC0); Thanissaro / Walshe /
  Buddharakkhita / Olendzki / Bodhi-extracts = the ATI offline edition (CC BY-NC 4.0); Ñāṇamoli = the BPS
  *Path of Purification* (Visuddhimagga). Each rendering carries its translator + source in the dataset.
- **No density headline.** This study makes no canon-versus-commentary magnitude claim; where a footprint
  count by layer is mentioned it is a row count for orientation, not a per-character density (SKILL rule 8
  applies only to magnitude claims, which this study does not make).

## Dataset schema (frozen)

`public/research/sankhara.json`: one record per **(passage, translator) rendering** —
`{id, citation, sc_id, field(s), is_primary, layer, translator, source, rendered_lexeme, sense_family,
sense_family_coders[], evidence_pali, evidence_en, multi_field}` — plus pre-computed aggregates: the
translator × field lexeme matrix, the per-translator disambiguation verdict, the fully-enumerated maxim
table, the coverage census, the IAA block (κ scoped), and the verbatim P1–P4 scoring. Versioned
`sankhara-census vX.Y`, corpus snapshot pinned, codebook + query log committed beside it.

## Stopping rule

Enumeration is saturated when (a) the maxim cell is fully enumerated (every own-text primary *sabbe
saṅkhārā* row with every public translator rendering), (b) the frozen exemplar loci for DO/aggregate/triad
are coded for both high-coverage translators, (c) the coverage census is complete, and (d) a second pass adds
no new maxim rows or translators. The interpretive sense-family layer stops when k≥3 coders have classified
every distinct lexeme and κ is computed and adjudicated.
