# Saṅkhāra translator sense-import

## Abstract

The question: when a Pali passage carries a saṅkhāra token, does the surrounding collocation field (the dependent-origination / kammic field, the five-aggregates field, or the impermanence / tilakkhaṇa field) predict which English head a translator reaches for (formations, fabrications, choices, aggregate, process)? The pre-registered endpoint is a translator-by-field confusion matrix built from blind four-class sense coding, a per-translator import-bias vector, and a mutual-information statistic that must survive a within-translator field-label shuffle.

The verdict is null in the strict sense that the finding is not established. The endpoint was never computed. The primary negative control (the field-label shuffle) was never run. The descriptive scaffolding was produced and is sound: per-character density by stratum, a translator coverage matrix, and a leak audit that comes back clean. None of the descriptive scaffolding bears on the thesis. The thesis is unevaluated, and as the data were instrumented it is close to unevaluable without a fresh coding pass on per-clause units. The result reported here is the pre-committed house-style outcome by default, not by demonstration: no sense-import claim is made in either direction.

## The question and why it is a fair test

Saṅkhāra is a known polyseme. That its English rendering shifts across the dependent-origination, aggregate, and impermanence contexts is established published lexicography, not a discovery. The narrow thing that would be new is a quantified, blind-coded, shuffle-surviving measurement that the Pali field genuinely imports a sense into a given translator's word choice, beyond fixed pericope strings and beyond house style.

The design is a fair test because it pre-commits both outcomes and gates the positive one behind a negative control. H1 (sense-import) requires that at least one translator show a swing of at least 0.30 in the probability of a volitional head between the kammic field and the impermanence field, and that the real-label mutual information between coded head and field exceed the 95th percentile of a 1000-iteration within-translator shuffle. H0 (house-style) is the pre-committed null: each translator picks a near-constant head, any apparent field-conditioning is a pericope or register artifact, and the real-label mutual information falls inside the shuffle null band. The protocol states plainly that H0 will be reported if it wins.

## What the canon shows (descriptive only)

The lexicon resolves cleanly and the strata size sensibly. Magnitude is reported per character, never as raw rows.

Core saṅkhāra (the abhi-prefixed form held out separately) sits at 38.257 per million characters in the early canonical layer, rising to 63.754 in the commentary (atthakatha) and 83.787 in the sub-commentary (tika). The abhi-prefixed form, which is inherently kammic, is rare in the early canon at 0.535 per million characters and climbs sharply in the commentarial layers to 6.952 (atthakatha) and 8.216 (tika). These are passage-presence densities (a row counts once regardless of token multiplicity), used only to size strata and confirm coverage.

One density figure must not be compared across layers: the 5comm mula slice reads 251.937 per million characters, but it rides a 1.2-million-character denominator (a thin canonical-quotation slice inside the commentary stratum), not a full layer. It is a slice artifact, not a layer rate.

The translator coverage matrix shows the test is power-starved. Of nineteen translators present, only two clear a working per-field floor: sujato (130 kammic, 368 aggregate, 292 impermanence, 496 total passage rows) and thanissaro (56, 121, 101, 150). Every other translator sits in single or low double digits. Bodhi, the pre-registered anchor for the house-style null, appears with n=2 and cannot be tested at all. So the only two translators with enough rows to test are exactly the already-documented divergent pair, and the anchor for the null is untestable. The H1-versus-H0 contest, as specified, cannot be adjudicated from this coverage.

The stratum label is a work_slug lookup, so any layer contrast above is register description only and is never cited as independent dating or doctrinal evidence.

## What the commentary does / the falsifiable core

The falsifiable core of this study is not the density gradient and not the collocation map. It is the coded confusion matrix and its survival of the shuffle. That core was not built.

The field-tagging endpoint query (per-stratum field co-occurrence) errored on an invalid character range in its regular expression and produced nothing. The coarse commentary-density substitute that did run is not the endpoint. The codable-rows query did return 729 passage-by-translator rows, but the four-class sense coding that turns those rows into a confusion matrix, and the mutual-information statistic computed from it, were never produced.

Two structural problems sit underneath the missing endpoint, and both re-derive from the 729 rows. First, the field tags are not separable. Of the 729 rows, 59.3 percent (432 rows) carry more than one field marker and 21.5 percent (157 rows) fire all three at once. Restricting to rows with exactly one field marker collapses the analysis set to 21 kammic, 54 impermanence, and 142 aggregate. The field anchors are pervasive words (the dependent-origination chain terms, the bare impermanence and suffering and not-self terms, the bare aggregate names) that co-occur constantly, so any head-by-field statistic built on these tags would be confounded by inter-field overlap. Second, the coding instrument cannot reliably see its unit: the supplied English snippet is the opening 400 to 600 characters of the whole discourse, and 61.9 percent of the 729 rows contain no candidate English head word anywhere in that window. A blind coder handed those snippets is handed text that often does not contain the token to be coded.

Three blind coders did code the codable-rows set, and inter-annotator kappa will be computed deterministically downstream. Agreement is high where the codings coincide. That supports only the reliability of coding the rows that do contain a head, and it cannot rescue the endpoint: with no confusion matrix, no import-bias vector, and no shuffle null band, there is nothing for the coding to be the input to. The protocol's own gate (kappa of at least 0.60 before any claim) is a precondition, not a result, and a passing kappa on a subset does not produce the uncomputed statistic.

## The negative-control result

The program rule is explicit: a finding stands only if its negative control did not move with the signal. Here the controlling fact is that the control was never run.

The primary control is a within-translator field-label shuffle, 1000 iterations, recomputing mutual information each time to build a null band. The query that was supposed to seed it returned an unshuffled pool of 729 rows whose shuffle_key is an md5 hash of the row identity (725 distinct keys across 729 rows, a deterministic ordering key), not a permutation of field labels. No null band exists. Because the gate is untested, no positive sense-import claim is permissible by construction.

The secondary control, the dhamma polyseme pass that would test whether any effect is generic register rather than saṅkhāra-specific, was also not run. The within-pericope invariance check was not run.

One control did run and it is clean. The asaṅkhata leak audit found 127 unconditioned-term passages, of which 43 also match the core pattern and 84 do not. The 43 are passage-level co-occurrence, not regex contamination: the two stems are disjoint (the unconditioned term ends in -khata, the core target requires -khara), so a both-match passage simply holds two distinct tokens. The column is named also_match_core_BAD in the protocol and the falsifier requires a halt on genuine overlap, so the disjointness reason is stated explicitly: this is a valid lexicon, and it is the single result that holds. It is reported as a clean instrument, not as evidence for any thesis.

## What it means and what it does not

It means the descriptive layer is trustworthy: the lexicon does not leak, the strata are sized, and the coverage is mapped. It means the sense-import thesis is neither supported nor refuted. The honest report is the pre-committed house-style outcome reached by default rather than by measurement, because the measurement was never made.

It does not mean translators do not import sense from the field. It does not mean they do. It does not license reading the coverage counts (sujato 130 / 292 / 368 / 496; thanissaro 56 / 101 / 121 / 150) or the 26 identical-collocation divergence rows as a result: those are passage-presence counts and raw whole-discourse snippets (several of the 26 are about powers or warriors with saṅkhāra incidental), not coded English heads, and they do not bear on the dispute. It does not license any doctrinal verdict; this study is corpus-linguistic only and cannot settle what saṅkhāra means or which translator is correct.

To make the call, three things must change: the field-co-occurrence query must be fixed and re-run; the coding unit must become the per-clause window that actually contains the head, not the discourse opening; and the field-label shuffle must actually permute labels for 1000 iterations to build the null band. Until then the endpoint is uncomputed and, as currently instrumented, uncomputable.

## Auditability

Every count above re-derives from the two committed files. The density figures, abhi-form figures, the slice-artifact denominator, the coverage matrix, and the leak triple come from the enumerated query results in _raw.json. The multi-field overlap (432 of 729; 157 firing all three), the pure-field collapse (21 / 54 / 142), and the snippet head-word coverage (451 of 729 rows, 61.9 percent, with no candidate head word in the window) re-derive deterministically by reading the f_do, f_khandha, f_pass, and en_snippet columns of the 03_codable_rows result. The shuffle-key claim re-derives from the 06_negctrl_shuffle_pool columns. The hypotheses, lexica, controls, and falsifiers are quoted from _protocol.json. The query meta records nine queries, eight ok, one errored (02_field_cooccurrence).