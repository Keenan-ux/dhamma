# Count reconciliation across the project's documents

*ITEM 3, 2026-06-22. The same term is sometimes reported with different numbers in different docs. The
differences are not errors; they come from three things: (1) the corpus carries two grouping columns,
`work_slug` (the ingest bucket: `pli-vism`, `*-attha`, `*-tika`) and `work_role` (the structural tag:
`mula` / `attha` / `tika` / `anya`), and the **Visuddhimagga is `work_slug='pli-vism'` but
`work_role='mula'`** (structurally mula-tagged though commentarial in stratum), so it lands in different
buckets under the two; (2) some older figures predate the per-paragraph subdivision of the commentary and
sub-commentary, so they are lower; (3) the `pli-kn` Khuddaka double-ingest (ITEM 2). The headline of each
finding is invariant under every framing.*

## carita (temperament compound) — "53/30" vs "40/49/59"

- **Census of record (de-duplicated, ITEM 2):** **43** structurally-mula rows, **30 Visuddhimagga**, zero
  in the four Nikāyas and zero in the Abhidhamma. The "53" in earlier drafts double-counted the `pli-kn`
  Khuddaka re-ingest (see `KN-REBUCKET.md`).
- **By `work_slug` (fresh):** attha 41 · Visuddhimagga 29 · ṭīkā 73 · structural-mula-canon 21 (12 after
  de-dup) · anya 6.
- **By `work_role` (fresh):** mula 50 (Visuddhimagga folds in here) · attha 41 · ṭīkā 73 · anya 6.
- **DISCOVERY-PASS "40/49/59" (attha/vism/tika)** predates the ṭīkā per-paragraph subdivision (ṭīkā was 59,
  is now 73) and splits the Visuddhimagga out of `mula`; it is superseded by the figures above.
- **Invariant headline:** 0 in the four Nikāyas, 0 in the Abhidhamma; first at the para-canonical Khuddaka;
  fixed in the Visuddhimagga.

## sabhāva (own-nature) — "2000/4000" vs "1906/553/3951"

- **By `work_slug` fine-stratum (HARDENING-CENSUS, census of record):** 5comm **2004** (= aṭṭhakathā 1906 +
  Visuddhimagga 98) · 6tika **4406**. (The "2000/4000" shorthand.)
- **By `work_role` (fresh, purisabhāva excluded):** attha 1883 · ṭīkā 4370 · mula 172 (Visuddhimagga folds
  in) · anya 276.
- **The "1906/553/3951" split** is the older work_role-plus-pre-subdivision framing (it tagged the
  Visuddhimagga separately at ~553 and the ṭīkā at ~3951 before the ṭīkā subdivision raised it toward 4400).
- **Invariant headline:** canon ≈ 0 (the few canonical hits are *purisabhāva* / *ekaṃsabhāvita*), thousands
  in the commentary, peak in the sub-commentary. The paper cites only canon ≈ 0 and the commentary
  thousands, both stable across framings.

## access-concentration (upacāra-samādhi) — "38/39" vs "135" vs "64"

These are **different scopes**, all of the one compound, all **zero in the canon and the Abhidhamma**:

| figure | scope | source |
|---|--:|---|
| 38 | the aṭṭhakathā alone | paper §VII |
| 22 | the Visuddhimagga alone (`work_slug='pli-vism'` ≡ `work_role='mula'`) | fresh |
| 58 | the ṭīkā alone | fresh |
| 64 | aṭṭhakathā + Visuddhimagga (the 5comm combine) | HARDENING-CENSUS |
| 135 | all commentary layers combined (attha + vism + tika + anya) | HANDOFF-SAMADHI-EXHAUSTIVE |

The paper's "39 in the Visuddhimagga" is a stale/loose count; the reproducible Visuddhimagga figure for the
solid compound is **22**. The paper is corrected to the reproducible scope (38 aṭṭhakathā, 22 Visuddhimagga),
with the multi-scope reconciliation here. **Invariant headline:** the term is a commentarial coinage, zero
in the canon, present only from the aṭṭhakathā onward.
