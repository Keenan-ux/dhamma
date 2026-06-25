# Parallels-graph trio: commentarial load, relation-type stratigraphy, and coverage cartography

## Abstract

This study bundled three structural questions over the SuttaCentral parallels graph. (A) Within each root collection, does a sutta's commentarial load track how densely it sits in the cross-tradition parallel web after length and tag-richness are partialled out. (B) Does the share of loose re-tellings versus tight verbatim parallels order the long-discourse collections above the short-pericope ones. (C) Is the early canon more externally connected than the late canon, and does that ordering survive its own intra-Pali negative control.

Only sub-study (C) is evaluable. Its raw signal is large and in the predicted direction: foreign coverage is 0.3812 in the early stratum against 0.0620 in the late stratum, roughly a sixfold gap. But the pre-registered lead negative control, the PLI-only intra-Pali sub-graph, carries the identical early-over-late ordering (0.4025 against 0.2415). The protocol fixed in advance that this exact outcome falsifies the cross-tradition reading. The null is therefore reported: the coverage gradient is consistent with a cataloguing-completeness artifact, not with differential transmission history.

Sub-studies (A) and (B) cannot be adjudicated at all. The unit queries returned zero rows because the collection filters matched on a prefix the corpus does not use. They are untested non-results, not evidence for any null.

## The question and why it is a fair test

The house thesis is that the canon is supple while the commentary systematizes, and that the suttas the tradition glossed most heavily are also the ones most embedded in the cross-tradition transmission web. Each arm was given a pre-committed null and at least one negative control, so a positive reading could only stand if the control stayed flat.

Sub-study (C) was the arm built to be decisive. Coverage, density, breadth, and relation-mix were measured per stratum on the foreign (non-Pali) graph, then the entire measurement was re-run on the intra-Pali graph as a control. The logic is direct. If the early canon genuinely transmits across traditions more than the late canon, the gradient should live in the foreign edges and not in the purely internal Pali edges. If instead both graphs thin out together toward the late stratum, the most economical explanation is that SuttaCentral has simply catalogued the late material less completely, and the gradient says nothing about transmission.

## What the canon shows (sub-study C)

On the foreign graph the early-over-late ordering is present and large. Early-stratum coverage is 0.3812 (1704 of 4470 mula passages carry at least one foreign edge); late-stratum coverage is 0.0620 (88 of 1420). Foreign edge density is 444.882 edges per Mchar early against 111.332 late. The raw direction predicted by the house thesis is exactly what appears, and the magnitude is roughly sixfold on coverage and fourfold on density.

Two measured quantities already weaken the transmission reading before the control is consulted. Language breadth is flat at 3 distinct foreign languages in both strata, so there is no breadth gradient to corroborate a transmission story. And the granularity bound shows the coverage denominator itself thinning toward the late stratum: distinct SuttaCentral works fall from 12 to 8 and SuttaCentral rows from 4470 to 1420. A thinner late denominator is precisely the cataloguing-density confound the control was constructed to catch.

## What the falsifiable core decides (the negative-control result)

The pre-registered decisive falsifier was: sub-study (C) is falsified if the PLI-only control reproduces the early-over-late ordering. It does. Intra-Pali coverage is 0.4025 early (1799 of 4470) against 0.2415 late (343 of 1420), and intra-Pali density is 762.357 edges per Mchar early against 540.001 late. The control did not stay flat. It moves in the same direction as the foreign signal across both strata.

The control is in fact higher in absolute level than the foreign graph in both strata (0.4025 over 0.3812 early; 0.2415 over 0.0620 late). This trips a second pre-registered falsifier as well: the graph is predominantly intra-Pali, so the cross-tradition-embedding frame is the wrong lens for it. Absolute level is not effect size, however, and the steeper foreign decline is real: foreign coverage falls about 6.15-fold while the Pali control falls about 1.67-fold. That residual difference is not a rescue. No difference-in-differences salvage was pre-registered (the falsifier triggers on reproduced ordering alone), the breadth axis that could separate thinner transmission from thinner cataloguing is flat at 3 in both strata, and SuttaCentral itself documents its late-collection comparative cataloguing as incomplete, so the foreign edge type thinning faster where cataloguing is thinnest is consistent with the confound. The pre-committed null H0-C stands.

| Quantity (mula layer) | Early (1early) | Late (2late) | Early/late ratio |
| --- | --- | --- | --- |
| Foreign coverage (C1) | 0.3812 (1704/4470) | 0.0620 (88/1420) | about 6.15x |
| Foreign edges per Mchar (C1) | 444.882 | 111.332 | about 4.00x |
| PLI coverage, control (C2) | 0.4025 (1799/4470) | 0.2415 (343/1420) | about 1.67x |
| PLI edges per Mchar, control (C2) | 762.357 | 540.001 | about 1.41x |
| Foreign language breadth (C1) | 3 | 3 | flat |
| SC distinct works (C3) | 12 | 8 | denominator thins |
| SC rows (C3) | 4470 | 1420 | denominator thins |

## Sub-studies A and B: untested, not null

The unit tables for both sub-studies came back empty. A0, A1, A2, B1, and B2 all returned 0 rows. The cause is a query-construction defect, not an absence of data. The collection filters matched `work_slug LIKE 'dn%' / 'mn%' / 'sn%' / 'an%'`, but the corpus stores those collections under prefixed slugs such as `pli-an` and `pli-sn`, with the collection number living in the `id` column (for example id `an10.105` under work_slug `pli-an`). The C4 follow-up rows confirm this directly: 2798 rows surface under work_slug values like `pli-an`. Because the filter matched nothing, no per-collection partial Spearman (A) and no RetellShare (B) were ever computed.

These arms are therefore untested. They must not be read as nulls in favor of H0-A or H0-B. A clean re-run requires fixing the filter (matching `pli-dn%` and the rest, or matching on the `id` column) before any A or B claim is made.

The descriptive co-passes that did run cannot rescue or condemn (A). The register negative control A4 is not flat in raw mula density (NEG_REGISTER 104.718 hits per Mchar, DHAMMA_EPITHET 3.194, COMM_METHOD in the attha layer 99.089), but with par_density never computed there is nothing to calibrate it against, so the control has no association to flatten or fail. The COMM_METHOD count likewise cannot be treated as a systematization signal: the pariyaya sense-audit is unrun, and as delivered the audit sample is uncodeable. The KWIC column captured only the bare lemma (for example the literal string "pariyay" with no surrounding text; 189 of 200 rows the lemma, 11 null), because the SQL substring returned only the capture group and discarded the requested context window. Blind coders cannot separate the exegetical sense from the discourse-mode sense from a lone token, so the sample must be re-pulled with real context windows, blind-coded to stratum and work_role, and cleared at Cohen kappa at or above 0.67 before any COMM_METHOD figure is interpreted.

## What it means and what it does NOT

What it means, narrowly: on this corpus the early-versus-late external-coverage gradient is not interpretable as differential cross-tradition transmission, because its own intra-Pali control carries the same ordering. The cleanest reading is differential SuttaCentral cataloguing completeness by collection, corroborated by the thinning work and row denominators in the late stratum.

What it does NOT mean: it is not a chronological or transmission-history finding of any kind. The stratum label is a work_slug lookup, not independent dating, so an early-versus-late disagreement is true by construction and is never independent evidence. It is not a claim that the late canon has fewer parallels in reality, only fewer catalogued ones; absence of an edge is absence of cataloguing, not proven absence of a parallel, and the graph holds only edges, relation types, and languages, with no foreign text to verify. It is not a doctrinal verdict. And it says nothing for or against the house thesis in sub-studies (A) and (B), which were never tested.

The per-character density figures (the edges-per-Mchar values) carry a further caveat: their denominator uses a sum of distinct character lengths, which deduplicates equal-length passages and undercounts character mass unevenly across strata. They should be read as coarse magnitudes only. The coverage ratios, built on distinct-id counts, are the sound numbers.

## Auditability

Every count in this report re-derives from the two committed artifacts. The hypotheses, the frozen lexica, the twelve enumeration queries, the negative controls, and the pre-registered falsifiers are in `_protocol.json`. The result rows are in `_raw.json`: C1 coverage and density (rows under label C1_coverage_cartography_by_stratum), C2 control (C2_NEGCONTROL_pli_only_coverage), C3 granularity bound (C3_sc_mapping_completeness_bound), A3 COMM_METHOD density and A4 register densities (A3_comm_method_density_attha, A4_neg_register_density_mula), the empty A0/A1/A2/B1/B2 tables (rowcount 0), the 2798 C4 follow-up rows that expose the slug prefix, and the 200 pariyaya audit rows whose KWIC field shows the bare-lemma defect. The frozen layer denominators are mula 53.543921 Mchar and attha 29.488533 Mchar.

## Verdict

H0. The one testable claim, sub-study (C), is falsified by its own pre-registered negative control, so the pre-committed null wins. Sub-studies (A) and (B) are construction-blocked untested non-results pending a corrected re-run. The publishable result is a null with two open arms.
