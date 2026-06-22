# Peer-review synthesis — "From Function to Essence" (individual-guidance)

*Run 2026-06-22, autonomously, while the operator was away. A 10-agent de-comma sweep, then a
12-reviewer critical peer review (each a distinct lens), then a DB-grounded cosmology census were
run against the de-comma'd readable. This doc records what was fixed and what is flagged for the
operator to decide. Raw outputs: `PEER-REVIEW-RAW.json` (129 findings), `COSMOLOGY-CENSUS-RAW.json`
(47 candidates, DB-measured).*

Review tally: **12 lenses, 129 findings** — 1 blocking, 46 major, 60 minor, 22 nit; 106 fix-now, 23
flag-later. The person/samādhi spine was judged genuinely strong; the criticism concentrated on the
cosmology arm, count-reconciliation, missing scholarship, and a few doctrinal/lexical glosses.

## Fixed this pass (deployed, committed 6163fac)

Accuracy and clarity corrections that were clearly correct, applied to both `FINDINGS-readable.md`
and `src/ResearchView.jsx`:

1. **Cosmology folded from the real census + factual corrections.** `yojana` is heavily *canonical*
   (379 early rows): narrowed to the late systematic *dimensioning* of cosmic architecture, not
   yojana-counting per se. `cakkavāḷa`: "named twice in the four Nikāyas; the bounding rim-wall
   (`cakkavāḷapabbata`) has no canonical warrant; the sphere blooms in commentary (>500 rows)."
   `kappavināsa`: "absent from the four Nikāyas and the Abhidhamma," not "the entire canon."
2. **`appamāṇa` gloss hedged** (the philology lens was right): it is the boundless pole vs `paritta`,
   not "a refusal of the infinite." Added the canon's own infinite (`ākāsānañcāyatana`) and the
   cosmology counter-cases (the *avyākata* AN 10.95; MN 127's measured-vs-measureless sorting; exact
   early numbers DN 14 / DN 26) — so Axis-2 reads as a tendency with counter-currents, like Axis-1.
3. **`nibbāna` made even-handed**: privative (Ud 8.3) plus the positive epithets of the
   Asaṅkhata-saṃyutta (SN 43).
4. **Eight-liberations gloss corrected** (§II and §VII): the eight *vimokkhā* run from the
   form-contemplations through the formless states to cessation, not "the deep absorptions/formless."
5. **`cittekaggatā` number reattributed**: the 64 rows are the broad `ekaggatā` stem; the compound
   `cittekaggatā` is rarer (the reviewer caught this against SAMADHI-COUNTS.json).
6. **Rows-not-occurrences + a normalization caveat + the hedged ≈2-in-3 verdict** carried into §VII.
7. **Two disclosures added** to §VII: the stratum gradient is partly definitional; and what marks
   essentialization off from ordinary scholastic elaboration (present/relational → standing-property).
8. **Symmetry rebalanced** (abstract + conclusion): the world register is "a thinner sample that
   points the same way," not a co-equal proven result.
9. **The §III setup-and-payoff AI-tell recast** (it was almost verbatim the editor-checklist's bad
   example).
10. **Scholarship-positioning paragraph added** (the one *blocking* finding): Cousins, Gombrich,
    Gethin, Shankman, Brahmāli/Sujāto/Anālayo on the jhāna question; Ronkin on `sabhāva`/substantialism;
    Allon/Wynne on oral transmission; Cousins on the `kammaṭṭhāna` — with the contribution stated as
    the reproducible cross-stratum count, not the direction.

## Flagged for the operator (judgment calls / larger efforts — NOT done unilaterally)

These are real and several are major, but they are structural decisions or efforts that should be the
operator's call, not an autonomous rewrite:

- **Scope inflation (major, recurring).** The two concentration subsections (calm/insight + "how much
  concentration the lower path requires") run ~a third of the paper and are effectively a second study
  (the jhāna-requirement argument), and the concentration-floor finding is a doctrinal-underdetermination
  result, not a function-to-essence one. **Options:** subordinate it to one worked exhibit and cut by
  half, or split it into a companion study and reference it. Recommend the latter eventually.
- **Cosmology as its own pre-registered census (major).** The fold now gives it real DB counts and
  counter-cases, but it is still not the gated, sense-audited HARDENING-CENSUS the persons domain has,
  and it is not in FINDINGS-v2. If the world register is to keep title billing, it wants its own
  pre-registered census (the `COSMOLOGY-CENSUS-RAW.json` 47-candidate run is the seed).
- **Khuddaka-slug bucketing artifact (major, methodological).** `pli-kn` is a catch-all holding the
  earliest Khuddaka (Dhp/Ud/Iti) and the latest (Mahā/Cūḷaniddesa, Nettippakaraṇa) under one slug, and
  the Niddesa/Netti are double-ingested under two slug systems (`pli-nd`/`pli-ne` and `pli-kn`). The
  late-canonical bucket in the fine harness may therefore be slightly contaminated. A clean re-bucket
  by sub-work id would tighten the late-canonical/para-canonical jumps. Affects magnitudes, not the
  zero-vs-present headlines.
- **Count reconciliation across the doc set (minor-major).** `sabhāva` (2000/4000 vs 1906/553/3951 vs
  DISCOVERY-PASS), `carita` (53/30 vs 40/49/59), access-concentration (38/39 vs 135 vs 64) are each
  reported under different framings (structural-mūla tag vs work_role vs fine-stratum). They are not
  errors but need one reconciling note each so a reader moving between the docs is not confused.
- **G2 (homophily "law") needs its own dhātu sense-audit** before being called a law; **G3 (the
  search-trap) is a method lesson** sitting oddly among substantive findings — move to the method
  apparatus.
- **Reproducibility pointer**: the footer points to DISCOVERY-PASS / the JSON, not HARDENING-CENSUS
  (the actual source for §VII); add it.
- **Background "They…" anaphora and G2 "It is…" anaphora** (prose): flagged as AI-cadence; left for
  the deferred body-wide de-comma/de-AI sweep.
- **The de-comma sweep itself reached only §§II–VIII + general-importance** via the recast agents;
  a final read-through is still owed.

## Bottom line

The reviewers confirmed the person/samādhi core is strong. The cosmology arm was the weak point; the
census fold plus the factual corrections substantially repair it and make it honest about being the
thinner sample. The remaining majors are structural (split the concentration study; give cosmology its
own census; re-bucket the Khuddaka slug) and are yours to direct.
