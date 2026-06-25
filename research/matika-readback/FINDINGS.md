# Matika read-back: does the Abhidhamma cross-classification grid get imported into matika-poor suttas?

## Abstract

This study asks a corpus-linguistic question, not a doctrinal one: does the frozen matika-register vocabulary (the paramattha / cetasika definitional idiom and the katame-dhamma / idam-vuccati question-answer frame, plus a windowed khandha x ayatana x dhatu co-occurrence) sit more densely in the commentary layer than in the canon, and does it do so MORE than ordinary sutta-native doctrine and more than a names-and-similes control? The house thesis (H1) predicts a sharp canon-to-commentary lift specific to the matika register; the pre-committed null (H0) says any lift is generic commentarial lengthening that lifts all vocabulary alike.

The headline per-stratum test fails its own negative control. The names-and-similes control rises by +289.94 per million characters from canon to commentary, which is larger than the best matika lift (+174.37) and roughly five times the positive-doctrine lift (+57.84). By the program rule that a finding stands only if its negative control did not move with it, the per-stratum read-back claim does not stand. A matched mula-to-attha pass (Prong B) does show the matika delta beating the positive-doctrine delta on all four nikayas, but that pass was never run against the names-and-similes control on the same pairs, and the canon-side denominator does not reproduce its published value, so Prong B cannot be reported as a surviving positive. Verdict: mixed, leaning null on the headline.

## The question and why it is a fair test

The design pre-registers a delta-of-deltas, which is the fair form of the question. Commentary is longer and more explicatory than canon, so almost any doctrinal vocabulary will read denser in the commentary layer. The test therefore is not whether the matika register rises from canon to commentary (it will) but whether it rises MORE than two yardsticks that also rise:

1. POSITIVE comparison lexicon: Four Noble Truths, paticca-samuppada, jhana. Unambiguously sutta-native, yet heavily glossed in commentary. This controls for "commentary expands all doctrine."
2. NEGATIVE control: proper names and simile frames (seyyathapi, upama, Ananda, Sariputta, Savatthi). Commentary adds names and similes freely, but that is elaboration, not grid importation. If this control rises as much as the matika register, the matika lift is a register or length artifact.

The protocol freezes the falsifiers in advance: the matika canon-to-commentary delta must exceed BOTH the positive delta AND the names-and-similes delta; the per-work concentration (Gini) of the matika register must materially exceed that of the positive lexicon; and Prong B must show matched-attha carrying the scaffold at higher density than its mula, beyond the positive lexicon's own commentarial expansion. All magnitudes are per character (per million characters, abbreviated per-Mchar), never raw rows. Stratum is a work_slug lookup, a register and role partition, never independent chronology.

## What the canon shows, and the denominator caveat

A halting check sits at the front of the protocol: query 00 must reproduce the published per-layer character totals (mula 53.543921, attha 29.488533, tika 28.357746 million chars) within rounding, or the dedupe or stratum mapping is wrong and the run halts. Two of the three reproduce exactly. The commentary side, attha 29.488533 and tika 28.357746, matches the published figures to six places. The canon side does not. Summing the is_primary mula characters across strata (1early 13.095668 + 2late 3.851892 + 3abh 7.576799 + 4para 1.212772 + 5comm-mula 1.202681) gives 26.94 million, against a published 53.54, a 1.99x shortfall. The most likely cause is an un-deduped sc/cst double-ingest or a canon-subset mismatch on the mula side only.

This is a flagged caveat on every canon-side magnitude. Because the canon denominator is roughly half its published size, the canon baselines (and the mula side of the Prong B deltas) are on a denominator the protocol says should have halted the run. The relative comparisons below are reported as the run produced them, with this caveat carried throughout.

## The falsifiable core: per-stratum deltas (queries 01 to 05)

Reading 1early mula as canon and 5comm attha as commentary, per-Mchar:

- MATIKA_PARAMATTHA (q01): 10.92 to 185.29, delta +174.37
- MATIKA_CETASIKA_DEF (q02): 72.77 to 168.44, delta +95.67
- MATIKA_KATAME_FRAME (q03): 73.08 to 36.39, delta -36.69 (INVERTS)
- POSITIVE doctrine (q04): 32.30 to 90.14, delta +57.84
- NEGATIVE control, names and similes (q05): 155.39 to 445.33, delta +289.94

The matika paramattha lift (+174.37) beats the positive lift (+57.84), which is what H1 wants for falsifier 2. But it does NOT beat the names-and-similes control (+289.94). The flagship structural marker, the katame-dhamma / idam-vuccati answer frame that the protocol calls the highest-signal read-back marker, INVERTS at this grain: it is denser in canon than in commentary (-36.69). Three of the four per-stratum falsifiers fire: the negative control moved more than the signal (falsifier 3), the structural frame contradicts the predicted monotone rise, and the concentration prediction (below) does not hold.

## The negative-control result (the call)

The program's non-negotiable rule is that a finding stands only if its negative control did not move with it. Here the names-and-similes control did not merely move; it moved MORE than every matika lift. The +289.94 names-and-similes delta exceeds the +174.37 best matika delta and dwarfs the +57.84 positive-doctrine delta. Under falsifier 3 this makes the per-stratum lift generic commentarial lengthening and register shift, not specific Abhidhamma-grid importation. The per-stratum read-back headline is reported null.

The structural (regex-independent) control built from passage_tags (query 06) cannot rescue or rebut this, because it returned only 1early mula rows (name 45.67, simile 44.92 per-Mchar) with zero commentary-side tagged rows. There is no tag-based commentary figure to compare, so the regex control stands unchallenged on the commentary side and the per-stratum failure holds.

## Concentration does not hold (queries 07, 08)

The house thesis predicts the matika register is unevenly clustered across mula works (Gini predicted around 0.6 or higher, materially above the positive lexicon) with Lorenz mass in the Sangiti / Dasuttara / Mahasatipatthana list-suttas. The per-work vectors give Gini(matika) 0.486 versus Gini(positive) 0.437, a gap of only +0.049, far short of the predicted level and barely above the positive lexicon. The matika mass sits in pli-abhidhamma (434.48 per-Mchar) and pli-sn (210.67), which is near-tautological since the lexicon IS the Abhidhamma register, while pli-dn, the home of the predicted list-suttas, sits near the floor at 18.94. Falsifier 1 leans null.

## Prong B: matched pairs survive only as untested (queries 10, 11)

Prong B compares matched mula-to-attha pairs per nikaya. On all four, the matika delta beats the positive delta:

| nikaya | matika delta | positive delta | scaffold delta |
| --- | --- | --- | --- |
| pli-dn | +93.64 | +63.16 | +12.95 |
| pli-mn | +86.41 | +52.26 | +14.63 |
| pli-an | +62.31 | +33.61 | +20.88 |
| pli-sn | +71.64 | +26.93 | +13.61 |

Within the matched-pair design this supports H1: the commentary carries the matika register and the 2-of-3 khandha/ayatana/dhatu scaffold at higher density than the sutta it comments on, and beyond the positive lexicon's own commentarial expansion. But Prong B was never tested against the names-and-similes negative control on the same pairs, because the structural control (query 06) returned only canon-side tag rows. An untested control is not a passed control. Prong B has no demonstrated artifact floor and cannot overturn the per-stratum control failure, and its mula side rests on the halved canon denominator. It is reported as untested-against-control, not as a surviving positive.

## Coding and the polysemy audit (queries 12, 13, 14)

The read-back judgment was meant to rest on 120 coded attha candidate rows (query 12). The query returned only 5 rows. Three blind coders coded those rows; agreement is high where their codings coincide, and inter-annotator kappa will be computed deterministically downstream. The richest exemplar, cst-s0519a.att-34, re-files the plain term mano of a commented verse into vinnanakkhandha, manayatana, vinnanadhatu, and manindriya, which is the clearest single instance of grid importation in the sample. But with 5 rows, not 120, the coding can support the read-back call only weakly and only to the extent the coders agree. The coded sample is consistent with importation in the instances seen; it is not a sufficient base to carry a density headline.

The sense audit (query 13) returned its 120 polysemy rows (60 vitakka, 60 dhatu), but no Cohen's kappa is yet computed on them. The MATIKA_CETASIKA_DEF numerator (q02, +95.67) depends on polysemous stems (vitakka, sanna, sankhara). Per the carita rule, these stems are uninterpretable for a density headline until kappa reaches 0.6 or higher. The raw rows already show both senses live: vitakka appears as the technical jhana-factor (cetaso abhiniropana, savitakkasavicaro) AND as ordinary defiled thought (kamavitakka, parivitakko udapadi); dhatu appears as the 18-element axis AND as relic (dhatukarandaka), the four primary elements, and a grammatical verbal root in the grammar texts. Until the audit is coded, q02 is provisional.

The embedding centroid corroboration (query 14) ERRORED on a statement timeout. The distributional falsifier (whether attha sits closer to the Abhidhamma centroid than mula) is untested, so no distributional cross-check supports the lexical signal.

## What it means and what it does NOT mean

What it means, corpus-linguistically: from canon to commentary, doctrinal and onomastic vocabulary alike inflate, and the names-and-similes inflation is the largest of all. The matika register rises, but not more than the elaboration baseline, and its flagship structural frame actually thins out in commentary. Concentration is not where the thesis predicted. The clearest positive signal, the matched-pair Prong B, has no tested artifact floor and a broken canon denominator beneath it.

What it does NOT mean: this is not a doctrinal verdict on whether the commentary is right to apply the grid, and not a claim about authorial intent or chronology. The qualitative idea behind the thesis (that commentary applies the fuller khandha/ayatana/dhatu classification to suttas that state it only partly, and that the Sangiti and Dasuttara suttas are proto-matika list-suttas) is established Theravada scholarship, not a discovery here; the per-character operationalization is the only candidate novelty, and the finding it produces does not stand as stated. Density alone cannot distinguish commentary IMPORTING a grid the sutta lacked from commentary CITING Dhammasangani or Vibhanga material the source already entails; only the coding could adjudicate that, and the coding sample came back at 5 rows.

## Auditability

Every count re-derives from _protocol.json (the 16 frozen queries and the 6 frozen lexica) and _raw.json (the result rows). Per-stratum deltas read off queries 01 to 05; the negative control off 05 (regex) and 06 (tags); concentration off 07 and 08; Prong B off 10 and 11; the denominator check off 00; the coding sample off 12; the sense audit off 13; the embedding error off 14; commentary keying off 15. The denominator caveat is reproducible directly: summing the is_primary mchar_primary for all mula strata in query 00 gives 26.94 million against the published 53.543921, while attha 29.488533 and tika 28.357746 match the published values to six places. All magnitudes are per million characters with is_primary dedupe; no raw-row count is used as a headline.

## Scope and limits

Corpus-linguistic only. Stratum is a work_slug lookup, never chronology. Canon-side magnitudes rest on a denominator roughly half its published size; the protocol's own halt rule was not honored. The coding that would separate importation from citation returned 5 of a planned 120 rows. The sense-audit kappa is uncomputed, leaving the cetasika-definition numerator provisional. The embedding distributional cross-check errored and is untested. Foreign-language parallels are out of scope (pli only). pli-vism is excluded from the canon numerator by construction.