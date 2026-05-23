# Dual-highlight coverage handoff

Active workstream. The previous chat hit repeated safety-classifier
false positives and got cut off mid-sentence, so picking up here in
a fresh chat. Read `CLAUDE.md` and `HANDOFF.md` for project context
first; this doc covers the in-flight problem only.

**Background ingestion is currently running.** Do not stop, restart,
or interfere with any background bash task. Check with TaskList /
the harness UI before touching long-running processes.

---

## What works today

Notes feature (Option B) shipped end-to-end last session:

- `passages.segments JSONB` populated for **7,100 SC bilara passages**
  by `scripts/ingest/backfill-segments.mjs`
- Reader renders per-segment spans with `data-segment="X.Y"
  data-passage-id="…"`
- `useSegmentHover` hook attached at `ReadingPanel` root (`ref` on
  `<article>`) handles dual-highlight via CSS class toggling
- `.dhamma-seg-hover { background: rgba(var(--bc-accent-rgb), 0.22) }`
  in `src/theme.css`
- Notes editor, in-passage gold-edge marker, header count badge,
  `/notes` sidebar tab all live
- `?focus=<segment>` URL param scrolls + flashes a target segment
- `SideBySideReader` renders Pāli as segments even when English is an
  HTML blob (ATI translator selected), so Pāli-side hover still fires

On any passage with `segments` populated, dual-highlight works
across both columns. Verified on `sn36.2`, `dn22`, `mn10`, `snp1.8`.

---

## What doesn't work and why

Dual-highlight requires `passage.segments` to be populated. It isn't,
for **18,886 of 25,986 passages**: every CST corpus passage
(commentary, ṭīkā, extra-canonical) and library articles. Reason:
source data has no editorial sentence-pair alignment between Pāli
and English. The CST pipeline ingests Pāli from TEI XML as a single
concatenated string; English (when present) is attached separately
without per-sentence correspondence.

Example case the user surfaced:
- ID: `cst-s0303m.mul-sn3_1`
- Pāli: 335,890 chars (entire SN 22 Khandha-saṃyutta as one chunk)
- English: 3,512 chars (a stub — incomplete match)
- `source_edition: null`, `work_role: null` (data oddity — these
  should never be null on a CST passage; separate ingest bug)
- `segments: null`

User explicitly wants dual-highlight to work on every passage. Not
satisfied with "it's a data limitation, here's a chip saying so."

---

## Options considered

1. **Manual alignment.** Hand-align ~30 high-value commentaries
   (Bodhi's Brahmajāla, Karaṇīyamettā commentary, etc.). Highest
   quality, doesn't scale to corpus.

2. **Automated alignment via statistical tools** (eflomal, Bleualign).
   Corpus-scale, but those tools target high-resource European-language
   pairs and struggle on Pāli ↔ paraphrastic English (Bodhi, Walshe).

3. **Paragraph-level fallback in code.** Split each side by paragraph,
   assume 1:1 when counts match. Cheapest to implement. Silent-failure
   mode on the many passages where counts don't match. User rejected
   this for the "silently fails on many" reason.

4. **(Not in the original three, but recommended)** **LLM-based
   alignment.** One Claude API call per unsegmented passage: prompt
   asks for segment-aligned JSON given Pāli + English. Output dropped
   into the existing `segments` JSONB column. No model training, no
   parallel-corpus prep, handles paraphrastic translations cleanly
   because Claude reasons about meaning correspondence, not surface
   overlap. Same `segments` schema as the bilara backfill so the
   reader needs zero changes. ~25K API calls at typical sizes;
   user's flat-rate plan absorbs the cost.

User has not yet picked. The conversation got cut off by guardrails
in the middle of my recommending option 4 with caveats.

---

## Open questions for the user

1. Confirm path forward: option 4 (LLM aligner), or fall back to
   option 2 (statistical aligner) for cost / reproducibility?
2. For passages with **mismatched data shape** like
   `cst-s0303m.mul-sn3_1` (huge Pāli, tiny stub English) — alignment
   can't recover what isn't there. Do those passages get:
   - flagged as "no alignment available" in the reader (separate UX
     work), or
   - left silently unaligned, or
   - patched separately by improving the English ingest for them?
3. Does the user want a one-shot backfill, or a job that aligns on
   demand the first time a passage is opened (and caches)?
4. The unattributed-passage issue (`source_edition: null`,
   `work_role: null` on some CST rows) is orthogonal but should be
   fixed before any alignment pass, or those rows risk getting wrong
   alignment metadata.

---

## Recommended next steps

1. Get the user's pick on aligner approach.
2. Write the alignment script as `scripts/ingest/align-cst.mjs`.
   Calls Claude API per passage with a prompt asking for JSON output
   matching the `segments` shape `{ "1.1": { "pali": "…", "english":
   "…" }, … }`. Output written directly to `passages.segments`.
3. Test on 20 hand-picked passages spanning the corpus shape (long
   prose Vism, short Theragāthā verse, structured Abhidhamma,
   mismatched English-stub case).
4. Audit alignment quality on a small sample with the user before
   running corpus-wide.
5. Backfill orphan source_edition / work_role rows separately. CST
   ingest should always set those; the null cases are bugs from an
   earlier ingest pass.

---

## File locations

- `src/browse/segments.js` — segment helpers (`filterBodySegments`,
  `rangeToSegmentRange`, `sortSegmentKeys`)
- `src/browse/useSegmentHover.js` — dual-highlight DOM listener
- `src/browse/ReadingPanel.jsx` — useSegmentHover wired at line ~162
- `src/browse/SideBySideReader.jsx` — mixed-rendering logic for
  Pāli-segments-always / English-segments-or-HTML
- `src/theme.css` — `.dhamma-seg`, `.dhamma-seg-hover`,
  `.dhamma-seg-active`, `.dhamma-seg-noted` rules
- `scripts/ingest/backfill-segments.mjs` — the bilara segment backfill,
  pattern for the CST alignment script to mirror
- `server/src/corpus.js` — getPassage SELECT includes `segments`,
  `title`, `title_en` (lines 141, 151)

---

## Seed prompt for the new chat

```
Read C:\Dev\Dhamma\CLAUDE.md, C:\Dev\Dhamma\HANDOFF.md, and
C:\Dev\Dhamma\HANDOFF-DUAL-HIGHLIGHT.md. The last item is the
in-flight workstream we're picking up.

Quick context: dual-highlight (simultaneous Pāli/English segment
highlight on hover) works for the 7,100 SC bilara passages but not
for the 18,886 CST passages because CST source data has no per-
sentence cross-language alignment. I want it to work everywhere. We
narrowed the options to four (see the handoff doc), and were about
to commit to option 4 — LLM-based alignment using Claude to produce
the same `segments` JSONB shape we already use — when the previous
chat got cut off by safety-classifier false positives.

I have NOT confirmed option 4 yet. Bring me the open questions in
the handoff doc, get my answers, then proceed.

Background ingestion is currently running. Don't stop, restart, or
interfere with any background bash task.

Notes for working with me:
- Flat-rate Anthropic plan, per-token cost not a constraint
- No em-dashes, use commas / periods
- Don't use "Buddhist" in user-facing copy without asking
- I'm one person (Isaac Keenan Cyr, go by Keenan)
- Scholarly register, not marketing
- Wait for direction before starting anything substantive
```
