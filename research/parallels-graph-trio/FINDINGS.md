# Parallels-graph trio: the one testable claim fails its own negative control

## Abstract

This study bundled three structural readings of the SuttaCentral parallels graph over the Pali mula canon: (A) whether commentarial load on a root sutta tracks its foreign-parallel density, (B) whether loose-retelling share orders the long-discourse collections above the short-pericope ones, and (C) whether the early stratum carries higher external-parallel coverage than the late stratum, with a strict requirement that the gradient be carried by the foreign graph and not reproduced by an intra-Pali control. Only sub-study (C) returned evaluable numbers. Sub-studies (A) and (B) returned zero rows from a slug-prefix filter mismatch and are untested non-results, not nulls. On (C), the raw early-over-late ordering predicted by the house thesis is present and large: foreign coverage 0.3812 early versus 0.0620 late, foreign edges per Mchar 444.882 versus 111.332. But the pre-registered lead negative control, the PLI-only intra-Pali sub-graph, reproduces the same early-over-late ordering on both axes: pli coverage 0.4025 versus 0.2415, pli edges per Mchar 762.357 versus 540.001. The protocol pre-committed to falsifying (C) if the control reproduced the ordering. It did. The pre-committed null H0-C is reported: the early-over-late external-coverage gradient is consistent with a SuttaCentral cataloguing-completeness pattern and is not interpretable as differential cross-tradition transmission.

## The question and why it is a fair test

The house thesis (H1) reads the early canon as more deeply embedded in the cross-tradition transmission web than the late canon, and predicts that this embedding shows up as higher external-parallel coverage in the early stratum. The fair-test design recognized one obvious confound: SuttaCentral is a catalogue, and a catalogue that maps the four main Nikayas in fine per-sutta detail while mapping late and post-canonical material coarsely would produce an early-over-late coverage gradient for purely bibliographic reasons, with no claim about transmission history at all.

The protocol handled this by pre-registering a negative control before any number was seen. Sub-study (C) asks two things at once. First, does foreign-parallel coverage run early over late. Second, and decisively, does that same ordering appear in the intra-Pali (PLI-only) sub-graph, where no cross-tradition transmission is involved and any gradient must be a cataloguing pattern. The pre-registered falsifier states plainly that (C) is falsified if the PLI-only control reproduces the early-over-late ordering at comparable effect size, in which case H0-C is reported and the chronology reading is withdrawn. The control was predicted to stay roughly flat or reverse. Whether it stayed flat was named in the protocol as the load-bearing measured quantity that decides H1-C versus H0-C.

Two scope rules sit under every number. The stratum label is a work_slug lookup, not independent dating, so an early-versus-late split is a label and never independent chronological evidence. And a parallel here is a catalogued structural edge, not held foreign text (parallel_have is false for non-pli), so an absent edge is absence of cataloguing, not proven absence of a parallel.

## What the canon shows

On the foreign graph (C1), the raw ordering the house thesis predicted is present and large. The early stratum covers 4470 mula passages, of which 1704 carry at least one foreign edge, for a foreign coverage of 0.3812. The late stratum covers 1420 passages, of which 88 carry a foreign edge, for a coverage of 0.0620. Foreign edge density runs 444.882 edges per Mchar early against 111.332 late. The raw early-over-late direction holds on both axes, and the magnitude is steep: coverage collapses about 6.1x from early to late, density about 4.0x.

Two of the supporting measures give the house thesis nothing further to stand on. Language breadth is flat at 3 distinct foreign languages in both strata (C1), so there is no breadth gradient to add to the coverage story. And the per-Mchar density figures should be read as soft magnitudes: the density denominator is SUM of distinct char_length (distinct length values, deduped to avoid CST and SC double-count), not a distinct-passage sum, so absolute density is approximate. This soft denominator applies identically to the foreign graph and the control, so it does not affect the comparison that matters. Coverage, the lead metric, is unaffected by this.

## The falsifiable core and the negative-control result

The decisive question is whether the PLI-only control (C2) stayed flat. It did not. The intra-Pali sub-graph reproduces the identical early-over-late direction on both axes. PLI coverage runs 0.4025 early (1799 of 4470) against 0.2415 late (343 of 1420). PLI edge density runs 762.357 per Mchar early against 540.001 late. The control is neither flat nor reversed; it carries the same direction as the foreign signal, and at higher absolute coverage and density than the foreign graph in both strata.

The honest reading of the magnitudes is same direction, shallower gradient. The foreign graph collapses about 6.1x on coverage and 4.0x on density from early to late. The control collapses about 1.67x on coverage and 1.41x on density. So the control moves in the same direction but at a materially shallower relative gradient. This is not a rescue for the house thesis. The pre-registered falsifier triggers on reproduction of the ordering, which is unambiguous here, not on equality of magnitude. The shallower control gradient does change one piece of wording: the result should be described as the control reproducing the direction at shallower magnitude, not as comparable effect size, and the higher control numbers are higher only in absolute per-stratum level, not in the early-over-late effect the falsifier tests.

The granularity bound (C3) corroborates the cataloguing reading and shows the confound operating in the predicted direction. SuttaCentral distinct works fall from 12 early to 8 late, and SuttaCentral rows fall from 4470 early to 1420 late. The coverage denominator itself thins toward the late stratum, which is the exact cataloguing-density confound the control was built to catch. The foreign graph and the control share that same shrinking denominator, so the early-versus-late contrast inside each graph is confounded by cataloguing granularity by construction.

One further measurement note bears on whether the residual foreign excess (roughly 6x over a 1.67x cataloguing baseline) could be promoted to a positive cross-tradition signal. It cannot, for two reasons. The cataloguing confound is demonstrably live and directional here (C3), so any residual carries the burden of beating it. And no bootstrap confidence intervals were computed anywhere, although the density method states that nothing is read as significant on point estimates alone. The residual-excess argument is therefore an uncosted point estimate and is not promoted.

| Sub-study (C) measure | 1early | 2late | early-to-late ratio |
|---|---|---|---|
| Foreign coverage (C1) | 0.3812 (1704/4470) | 0.0620 (88/1420) | about 6.1x |
| Foreign edges per Mchar (C1) | 444.882 | 111.332 | about 4.0x |
| PLI coverage (C2 control) | 0.4025 (1799/4470) | 0.2415 (343/1420) | about 1.67x |
| PLI edges per Mchar (C2 control) | 762.357 | 540.001 | about 1.41x |
| Language breadth (C1) | 3 | 3 | flat |
| SC distinct works (C3) | 12 | 8 | thins |
| SC rows (C3) | 4470 | 1420 | thins |

## Sub-studies (A) and (B): untested non-results, not nulls

Sub-studies (A) and (B) cannot be adjudicated. The unit tables A0, A1, A2 and the RetellShare passes B1 and B2 all returned zero rows. The cause is a query-filter mismatch, not an empty corpus. Those queries filter on work_slug LIKE 'dn%', 'mn%', 'sn%', 'an%', but the corpus slugs are prefixed pli-, so the real values are pli-dn, pli-mn, pli-sn, pli-an. The C4 follow-up rows confirm this directly: every flagged mula row carries a work_slug such as pli-an. The LIKE 'an%' filter cannot match a pli- prefix, so the join produced nothing.

Because of this, no per-collection partial Spearman exists for (A) and no RetellShare exists for (B). H1-A and H1-B are untested. They contribute zero evidence in either direction and must not be read as support for the null.

The register control A4 cannot rescue or condemn (A) either. Its raw mula densities are not flat: NEG_REGISTER runs 104.718 hits per Mchar, COMM_METHOD (attha) runs 99.089, and DHAMMA_EPITHET runs 3.194. But the control only means something against a par_density association to calibrate, and A1 (par_density) returned zero rows, so there is nothing to calibrate against. A4 neither rescues nor condemns (A).

The COMM_METHOD systematization angle is separately blocked as delivered. The pariyaya sense-audit (CODE_pariyaya_sense_rows) needs surrounding context to let blind coders split the polysemous lemma into exegetical-method versus discourse-mode senses. The KWIC column captured only the bare lemma: 189 of 200 rows hold the token alone, 11 are null, and the longest window is 7 characters. No sense judgement is possible from a lone lemma, so no Cohen kappa exists. The A3 COMM_METHOD density (99.089 per Mchar) must not be treated as an exegesis or systematization signal until the sample is re-pulled with real KWIC windows and sense-coded to kappa at least 0.67, with coders blind to stratum and work_role.

## What it means and what it does not

The one testable claim in this trio is sub-study (C), and on its own pre-registered terms it fails. The early-over-late external-coverage gradient is real in the raw foreign graph, but the negative control reproduces the same ordering on the intra-Pali sub-graph, and the granularity bound shows the coverage denominator thinning toward the late stratum exactly as a cataloguing-completeness pattern would predict. Per the protocol falsifier, H0-C is reported. The early-over-late coverage gradient is consistent with SuttaCentral cataloguing completeness and is not interpretable as differential cross-tradition transmission.

What this does not say. It does not claim the early canon was transmitted less or more than the late canon; the design cannot reach transmission history at all, and the stratum split is a label. It does not claim there are no foreign parallels in the late canon; an absent edge is an absent catalogue entry, not a proven absent parallel. It does not refute the house thesis broadly, because two of its three legs were never tested. The early-over-late ordering itself is broadly consistent with already-known SuttaCentral correspondence structure, where the four main Nikayas carry dense Agama parallels and late and post-canonical works do not, which supports reading the result as a cataloguing pattern rather than a new discovery about transmission. The finding is corpus-linguistic throughout: a statement about catalogue structure and edge density, not a doctrinal or historical verdict.

## Auditability

Every count re-derives from the two committed artifacts. The protocol enumeration SQL and the negative-control register live in _protocol.json. The result rows live in _raw.json: C1 at the C1_coverage_cartography_by_stratum block, C2 at C2_NEGCONTROL_pli_only_coverage, C3 at C3_sc_mapping_completeness_bound, the empty A0/A1/A2/B1/B2 blocks at their labels with rowcount 0, A3 and A4 at their density blocks, the C4 rows that expose the pli- slug prefix, and the 200-row pariyaya sample whose kwic column shows the bare-lemma capture. The early-to-late ratios are arithmetic on the C1 and C2 point estimates and round as stated. No number in this report is computed outside those two files, and no bootstrap interval is claimed because none was computed.

## Verdict

H0. On the single evaluable claim, the early-over-late external-coverage gradient is reproduced by its own pre-registered negative control and tracks a thinning cataloguing denominator, so the pre-committed null wins and the gradient is not read as transmission history. Sub-studies (A) and (B) are untested non-results from a slug-prefix filter bug and support neither hypothesis.