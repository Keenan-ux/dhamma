# The DN2 Vertical Slice — The First Empirical Number on the Staging Layer

*Auditable Translation project. REPORT_v10 records P0: the DN2 vertical slice
(TRANSLATIONS-AI.md prototype steps 1–5) and the machine-checkable
hallucinated-warrant audit — the first empirical number on the assumption the
whole product rests on. Artifacts: `out/dn2_slice.json`,
`out/dn2_workflow_result.json` (53 agents), `out/dn2_audit.json`,
`out/dn2_choicepoints.json`, `out/dn2_reader.html`; scripts
`scripts/{dn2_slice,prep_workflow_args,audit_warrants,build_schema}.py` +
`out/dn2_slice_run.js`.*

Date: 2026-06-13. Prod-free (local DPD SQLite + local bilara-data; no network,
no deploy). **Verdict: BUILD the staging layer — but only in grounded
(verified-extraction) mode. The product's load-bearing assumption is supported:
when the model drafts briefs from linked evidence, the hallucinated-warrant rate
is 0% and fabrication is near-zero; the same model in free-recall mode fabricates
69% of its primary-source warrants. The safety mechanism is the architecture,
not the model.**

---

## 1. What was built (one passage, all four lanes, end to end)

DN 2 Sāmaññaphalasutta opening, 10 segments (`dn2:1.2`–`2.5`) — the passage that
holds all five hand-gold choice-points (`pāsāda`, `uposatha`, `payirupāsati`,
`gaṇa`, `vedehiputta`; TRANSLATIONS-AI.md "Worked examples"). DN2 carries Sujato +
Thanissaro in the mirror, so all four detector lanes are live. **Firewall held:**
detectors read Pāli only; the two English translations were used as a
divergence *detector* and never as a warrant.

## 2. Detection (steps 1–2) — the granularity cliff, quantified

| lane | gold recovered (of 5) | how | granularity |
|---|---|---|---|
| **lexical within-lemma** (validated backbone) | **1/5** (`payirupāsati`) | 2 real senses fire | precise but blind |
| **commentary-presence** (falsified lane) | 5/5 | bold-gloss count ≥2 | **floods** — 10/10 segments, 81 fires (8.1/seg) |
| **divergence rung-2** (validated lane) | 3/3 gold-bearing segments | Sujato≠Thanissaro commitment | **7/10 segments** — readable |

The headline of detection is a **precision/recall cliff**, exactly the "live or
die" granularity problem TRANSLATIONS-AI.md names:

- The validated lexical backbone (corpus recall ~0.65) recovers only **1/5** on
  running text. The other four gold points are invisible to within-lemma
  polysemy because they are **monosemous** (`pāsāda`, `vedehiputta`) or **buried
  in compounds/sandhi** (`tadahuposathe`, `gaṇī`/`gaṇācariyo`). Corpus-level
  recall does not transfer to famous running text.
- Commentary-presence "recovers" 5/5 but only by **flagging everything** (every
  segment, 16 fires per real choice-point). It remains the falsified lane; its
  recovery is flooding, not detection.
- **The divergence lane is the one that works at readable granularity.** It flagged
  7/10 segments and hit **all three gold-bearing segments at 2/2 reps** (1.3
  register+reference, 1.6 lexical-sense+register, 2.2 lexical-sense) — cleanly
  recovering the register/lexical choices (`pāsāda` longhouse/palace, `uposatha`
  sabbath/observance, `payirupāsati`, `gaṇa`) that the lexical backbone cannot
  see. This is the complementary lane REPORT_v9 validated, now shown carrying the
  detection load on a real passage.

**The herd-consensus blind spot is live in the data.** `vedehiputta`→paṇḍitā
("wise woman", Buddhaghosa's reading) is recovered **only by the commentary
lane**: both Sujato ("princess of Videha") and Thanissaro ("Queen Videha") take
the Videha-lady reading, so divergence is silent on the doctrinal choice (it
flags only the milder princess-vs-Queen reference split). Exactly the failure
TRANSLATIONS-AI.md predicts — "when all translators are wrong the same way they
won't diverge" — and exactly why the commentary/critic lanes are load-bearing
even though commentary-presence floods as a *statistical* detector.

The completeness critics (3, translation-blind) surfaced **30 candidate
choice-points beyond the gold** (recurring: `komārabhacca`, `rattaññū`,
`titthakara`, `aḍḍhateḷasa`, `udāna`, `lakkhañña`) — confirming the 5-gold set is
not exhaustive, but also re-exposing the flood: a critic that finds 30 decisions
in a 10-segment opening needs the same granularity threshold the detectors do.

## 3. The hallucinated-warrant audit (steps 3–4) — THE HEADLINE

30 staging briefs (5 choice-points × 2 modes × 3 reps), 213 `evidence_ref`s, 156
checkable against the local `dpd.db` (`dpd_headwords` senses + sanskrit, 369K
`bold_definitions`, the 103 MB commentary corpus). Each ref classified: **valid**
(resolves + claimed content present) / **fabricated_sense** (row exists, claimed
content absent) / **hallucinated_warrant** (cites a non-existent row) /
**unverifiable** (parallel/grammar/cognate — reported, not counted).

| mode | refs | checkable | hallucinated-warrant | fabricated-sense | valid |
|---|---:|---:|---:|---:|---:|
| **A · grounded** (packet given, cite-only) | 101 | 95 | **0.0%** (0) | **≤8.4%** (≤8) | 87 |
| **B · ungrounded** (free recall) | 112 | 55 | 3.6% (2) | **69.1%** (38) | 15 |

**The result that de-risks the product:** verified-extraction discipline — the
architecture's rule that *every warrant must link to a real row* — collapses the
fabricated-sense rate from **69% to ≤8%** and the hallucinated-warrant rate to
**0%**. The safety comes from the architecture (link-the-evidence), not from the
model: the *same* Opus 4.8, asked the *same* question in free-recall mode,
fabricates **7 of every 10** primary-source warrants.

- **Grounded fabrication is an upper bound; the true rate is near-zero.**
  Spot-review of the 8 flagged grounded refs (HANDOFF §8 discipline — I re-ran the
  audit and eyeballed, did not trust the count): the majority are **auditor
  under-credits**, not model fabrications — real commentary my audit corpus
  (bolded glosses only) does not index (`gaṇanti bhikkhunisaṅghaṃ`), or real
  glosses lost to tokenization edge cases (`pāsādavarassa uparigato` and
  `mallagaṇabhaṭiputtagaṇādikaṃ` ARE in the corpus). Grounded agents cited the
  packet faithfully, including the DPD `sanskrit` field (`prāsāda`, `paryupāste`,
  `vaidehī + putra`).
- **Ungrounded fabrication is real and is the dangerous kind.** It is dominated
  by **DPD embellishment**: free-recall agents invent dictionary senses —
  "multi-storeyed flat-roofed building", "long communal timber hall",
  "tower-house" — and attribute them to DPD to manufacture support for the
  rendering they are arguing ("longhouse"). DPD actually says only "mansion;
  palace; building with pillars". This is precisely the un-audited-judgment-as-
  evidence failure the firewall exists to stop.
- **The audit confirmed the one true doctrinal warrant.** `vedehī`→paṇḍitā
  resolves as a **valid commentary** warrant (`DNa`/`SNa` bold-gloss "vedehīti
  pana paṇḍitādhivacanametaṃ") but **fabricated** when an agent cites it to DPD
  (DPD says only "family name of Ajātasattu") — the misattribution the audit is
  built to catch.

## 4. Schema + reader (steps 4–5)

All five choice-points (including the doctrinal `vedehiputta`) persist into the
`choice_point / option / commitment` model without contortion
(`out/dn2_choicepoints.json`): 5 choice-points, 10 options, 5 commitments. The
schema cleanly separates **`flagged_by`** (detectors, incl. human-translation
divergence) from the audited primary **warrants** — the firewall is structural,
not just a discipline. Commitments are left uncommitted (provisional defaults
only): the workbench is expose-don't-resolve, and no human has committed.
`out/dn2_reader.html` is the throwaway surface sketch to eyeball the flood.

## 5. The meta-pattern, tenth instance — on the audit tooling itself

The first-pass audit reported a 35.6% grounded hallucinated-warrant rate. Spot-
review showed it was an **artifact of my own auditor** (grounded agents cite
`ref`=ref_code with the gloss in `claim`; the resolver was checking the wrong
field; and it ignored the `sanskrit` field and 2-word/hyphenated glosses).
Re-running after the fix pulled grounded hallucination to its true **0%**. The
checks cut both ways again — this time the thing over-claiming was the
verification instrument, and the discipline (re-run yourself, eyeball the rows)
caught it. Tenth instance; first one inside the audit layer.

## 6. Verdict + honest bounds

**BUILD the staging layer, grounded mode only.** The product's central bet —
that linking every warrant to a real row prevents hallucinated evidence — is
**empirically supported** (0% hallucinated warrants, near-0 fabrication when
grounded). Free-recall mode is **unsafe** (69% fabrication) and must never be the
operating mode; the architecture's value is exactly that it forbids it.
Detection at readable granularity is the **divergence lane** (validated, 7/10,
all gold-bearing segments); the deterministic lexical lane is precise but
near-blind on running text, and commentary-presence floods.

Bounds, logged: (a) **n = 1 passage** (DN2) — a demonstration of the full
pipeline and a first number, not a distribution; (b) **famous text** — the
divergence judge's residual contamination route (it sees Sujato's public
English) is open, but the audit headline is **contamination-independent** (it
checks refs against the DB regardless of what the model "knows"); (c) **single
model family** (Opus 4.8) — cross-family staging is the obvious next control;
(d) the audit corpus indexes **bolded glosses only**, so grounded fabrication is
an **upper bound** (it under-credits real commentary outside that index);
(e) the auditor's content-match is a heuristic with spot-reviewed error, not a
proof — every fabricated/hallucinated verdict is dumped in `dn2_audit.json` for
review.

Next (see HANDOFF §5): widen the audit corpus to the full aṭṭhakathā; a second
passage (ideally obscure, to break the famous-text caveat on detection); a
cross-family grounded-staging cell; tune the divergence/critic granularity
threshold (the 7/10 and 30-candidate floods are the live tuning problem).
