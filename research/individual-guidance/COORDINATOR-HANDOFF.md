# Coordinator handoff — "From Function to Essence" cleanup campaign

*Living doc. The coordinator's state. A successor reads this in full, then the files in §2, runs the
§4 verification, then executes the §5 queue autonomously. Update this doc IN PLACE as items land
(it is a snapshot, not an append log). Created 2026-06-22.*

## 1. Mission
Bring the cosmology arm of the individual-guidance study ("From Function to Essence", slug
`individual-guidance`) up to the persons-domain rigor, fix one stratum-bucketing artifact, reconcile
the count framings across the doc set, and finish the prose de-AI sweep — closing the operator-approved
peer-review findings. The study is live at https://dhamma.fly.dev (admin-gated Research tab) and is the
deployed JSX `src/ResearchView.jsx` mirrored by the readable `research/individual-guidance/FINDINGS-readable.md`.

## 2. File / artifact map (READ FIRST, in this order)
- **This doc.**
- `research/individual-guidance/PEER-REVIEW-SYNTHESIS.md` — what was fixed and what is flagged (the 3 items below).
- `research/individual-guidance/PEER-REVIEW-RAW.json` — all 129 reviewer findings (the source of truth for the fixes).
- `research/individual-guidance/COSMOLOGY-CENSUS-RAW.json` — a 47-candidate DB-grounded cosmology census (the seed for ITEM 1; not yet gated/sense-audited).
- `research/individual-guidance/HARDENING-CENSUS.md` — the persons-domain census of record (the rigor bar ITEM 1 must match) + the fine 6-stratum CASE.
- `research/individual-guidance/SAMADHI-COUNTS.json` — the 3,045-stem matrix (carita/upacara/cittekaggata source counts; note inflection-final-stem undercount caveat in §6).
- `research/individual-guidance/FINDINGS-readable.md` and `src/ResearchView.jsx` — the study; the two MUST stay in sync (MD is the readable/PDF source, JSX is deployed).
- `research/individual-guidance/DISCOVERY-PASS.md`, `research/individual-guidance/FINDINGS-v2.md` — the rigor lane + discovery method; carita/sabhava counts live here too (the reconciliation targets).
- Skill: `.claude/skills/dhamma-research/{SKILL.md,PROVENANCE-SIGNATURE.md,WRITING-STANDARD-READABILITY.md,EDITOR-CHECKLIST.md}` — the method + writing gates. ITEM 3 adds a rule to EDITOR-CHECKLIST.
- `research/naga/sql.py` — the serial SQL runner. `research/individual-guidance/run_samadhi.py` / `analyze_samadhi.py` — the temp-table+trigram bulk-count pattern to copy.

**Corpus-access recipe (Git Bash; serial only — see §6):**
```bash
cd /c/Dev/Dhamma; export PYTHONIOENCODING=utf-8
curl -s --max-time 90 https://dhamma.fly.dev/api/dbcheck >/dev/null   # WAKE the app; it auto-stops between calls
RAW="$(flyctl ssh console -a dhamma -C 'printenv DATABASE_URL' 2>/dev/null | tr -d '\r' | grep -o 'postgres[^[:space:]]*' | head -1)"
export DATABASE_URL="$(printf '%s' "$RAW" | sed -E 's#@[^/]+/#@localhost:15432/#')"   # NEVER echo this (DB password)
# proxy must be up: flyctl proxy 15432:5432 --app dhamma-pg   (note the explicit :5432)
python research/naga/sql.py "<SQL>"
```
**The fine 6-stratum CASE (current — `pli-kn` lump is the ITEM-2 bug):**
```sql
CASE
  WHEN work_slug IN ('pli-an','pli-sn','pli-mn','pli-dn','pli-vinaya','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-kp') THEN '1early'
  WHEN work_slug IN ('pli-ap','pli-bv','pli-cp','pli-pv','pli-vv','pli-nd','pli-ps','pli-ja','pli-kn') THEN '2late'
  WHEN work_slug='pli-abhidhamma' THEN '3abh'
  WHEN work_slug IN ('pli-ne','pli-pe','pli-mil') THEN '4para'
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN '5comm'
  WHEN work_slug LIKE '%-tika' THEN '6tika' ELSE '7other' END
```

## 3. Sub-chat ledger

**ITEM 1 — DONE (2026-06-22, committed 8d8e3e7, pushed + deployed, smoke green).**
- Prereg frozen first (`COSMOLOGY-PREREG.md`, commit b64429b) then scored verbatim.
- Census run by `run_cosmology.py` (serial: one connection, temp table + trgm, fine 6-stratum CASE +
  per-slug breakdown for ITEM 2). Output `COSMOLOGY-COUNTS.json`; samples `_COSMOLOGY-SAMPLES.json` (gitignored).
- `COSMOLOGY-CENSUS.md`: 24 transitions (14 support / 4 mixed / 6 counter), each with 7-stratum counts +
  read-rows sense-audit note + verdict. Supports land at four distinct jumps. Prereg scored (P1 PASS with
  one falsified leg, P2-P5 PASS).
- **Correction produced:** AN 7.66 gives Sineru's 84,000-yojana measure in the four Nikāyas — the paper's
  "Sineru height is sub-commentarial" flipped to a counter-case. §VII (MD + JSX) rewritten census-backed;
  abstract + reproducibility pointer updated. New citations an7.66 + snp1.8 curl 200.
- **INCIDENT (logged, do not repeat):** the adversarial verification *workflow* was aborted mid-run. The
  default workflow agents have full tool access and tried to re-measure against dhamma-pg with their own
  concurrent psycopg2/flyctl connections, leaving ~36 zombie full-scan backends (oldest 19 min) and forming
  the concurrency wedge. Killed the workflow (TaskStop), terminated the stale backends
  (`pg_terminate_backend` on age>100s), confirmed app health (dbcheck 194710 / 401 / 200), and deleted the
  agents' scratch files (including a `_pgurl.txt` DSN dump). The verdicts rest on the coordinator's own
  direct serial row-audit; the two agents that did complete confirmed the coding and surfaced the
  double-encoding caveat. **Lesson: for any verification workflow on this project, agents must NOT have DB
  access — forbid Bash/flyctl/psycopg2 explicitly or use a read-only agentType. Reason-only over inlined
  data.** Gitignore hardened (`research/individual-guidance/_*`, `server/_*`, `server/dipa_*`).
- **Double-encoding caveat** (recorded in the census): canonical content is ingested under both SuttaCentral
  and CST id schemes, so early-stratum row counts double-count unique suttas (the 2 early 84k-Sineru rows are
  one AN 7.66 verse). Commentary strata are CST-only, so the contrast is understated, not overstated; no
  zero-vs-present headline affected. Relevant to ITEM 2 (pli-kn is also double-encoded).

## 4. Verification commands + EXPECTED outputs
- `curl -s https://dhamma.fly.dev/api/dbcheck` → `passages: 194710, pgvector: true`.
- `curl -s -o /dev/null -w '%{http_code}' https://dhamma.fly.dev/api/research` → `401` (admin-gated; expected).
- `curl -s -o /dev/null -w '%{http_code}' https://dhamma.fly.dev/` → `200`.
- `npm run build` → `✓ built` (must be green before any deploy).
- After prose edits: `flyctl deploy -a dhamma` then re-run the smoke + `curl .../api/passage/<id>` for every NEW citation (expect 200).
- A cosmology count, e.g. `cakkavāḷapabbata`, should be ~0 in early strata and heavy in `5comm` (the ITEM-1 pattern).

## 5. Open queue (the 3 approved items; concentration-split is DENIED — see §6)

**ITEM 1 — Cosmology pre-registered census (research-grade). ✅ DONE — see §3 ledger (8d8e3e7, deployed).**
GOAL: a gated, sense-audited `COSMOLOGY-CENSUS.md` matching HARDENING-CENSUS rigor, then folded into §VII.
- (a) Freeze a pre-registration (`COSMOLOGY-PREREG.md`): H1 (figurative/open → literal/measured recurs,
  jump-localized) + the explicit H0 (concentration is one-jump / counter-cases dominate) + falsifiable
  predictions, BEFORE running.
- (b) From the 47 candidates in COSMOLOGY-CENSUS-RAW.json, build the census: run the fine 6-stratum
  harness serially, and SENSE-AUDIT every term on sampled rows for homographs (flagged in the raw file:
  saṅghāta/tāpana hell homonyms, avīci qualifier-vs-hell, dhātu senses, the appamāṇa/ananta domain-general
  spread). Every citation must resolve to a real row.
- (c) Write `COSMOLOGY-CENSUS.md` (table: term · 6-stratum counts · sense-audit note · support/stray/mixed),
  score the pre-registration, and replace §VII's cosmology prose with census-backed prose (keep the
  counter-cases). Add COSMOLOGY-CENSUS.md to the reproducibility pointer.
- STOP WHEN: COSMOLOGY-CENSUS.md holds ≥15 sense-audited transitions each with stratum counts + a read-rows
  note + a verdict; prereg scored; §VII + both files updated and synced; build+deploy+smoke green.

**ITEM 2 — Re-bucket the Khuddaka `pli-kn` slug.** GOAL: the late-canonical bucket no longer mixes strata.
- Investigate what `pli-kn` (267 rows) actually contains by citation/id, and check the Niddesa/Netti
  double-ingest (`pli-nd`/`pli-ne` vs `pli-kn` kn15/kn16/kn19). Re-code the harness CASE to assign by
  sub-work: early Khuddaka → 1early, late Khuddaka (Niddesa/Paṭis/Apadāna/Bv/Cp/Vv/Pv) → 2late,
  Netti/Peṭaka/Milinda → 4para — without double-counting.
- Freeze the corrected mapping as an artifact (work_slug+id → stratum). Re-run every count whose
  late-canonical bucket touches pli-kn (the census terms) and correct any shifted MAGNITUDE in the paper.
- STOP WHEN: CASE re-coded + frozen; affected counts re-run; shifted magnitudes corrected in both files;
  the change documented in this doc. (Zero-vs-present headlines must NOT change; if one does, that is a
  finding — log it.)

**ITEM 3 — Reconciliations + G2/G3 + de-comma §§II–VI.**
- Reconcile cross-doc count framings with a one-line note each: sabhāva (structural-mūla-tag vs work_role
  vs fine-stratum: 2000/4000 vs 1906/553/3951), carita (53/30 vs 40/49/59), access-concentration
  (upacāra-samādhi compound 38/39 vs the 135 HANDOFF floor vs the 64 HARDENING split). Make the paper and
  its source docs agree or explain.
- G2 (homophily "law", SN 14.14): add the dhātu sense-audit (SN 14 mixes the 18-element technical sense
  with the disposition sense). Earn "law" or downgrade to a flagged lead.
- G3 (the diacritic/substring search trap): move from "Findings of general importance" to the method/limits
  apparatus (it is a method lesson, not a finding about Buddhism).
- De-AI/de-comma sweep over §§II–VI (the older prose the recast pass did not finish) + the Background "They…"
  and G2 "It is…" anaphora. Add the comma-dependency rule to EDITOR-CHECKLIST: *removing an em-dash and
  reaching for a comma-splice or stacked appositive is not a fix; recast with a period, a semicolon, or a
  restructured sentence.*
- STOP WHEN: reconciling notes in place; G2 audited; G3 moved; §§II–VI de-comma'd; EDITOR-CHECKLIST updated;
  both files synced; build+deploy+smoke green.

## 6. Standing principles / decisions (non-negotiable)
- **Serial DB only.** dhamma-pg crashes under concurrent load and cannot self-recover (the concurrency
  wedge). NEVER fan agents out onto the DB. Agents REASON about what to query; the coordinator EXECUTES
  serially via the proxy, never the live `/api` (cold-start ~38s, no concurrency guard). Bulk counts:
  one connection + a temp table + a pg_trgm index (copy run_samadhi.py).
- **Counts are floors; truncate inflection-final stems; a 0 is robust only on the truncated root.** Test
  the technical COMPOUND, not the bare simplex. Sense-audit every positive count on sampled rows.
- **Counts are passage-rows, not occurrences; normalize or report the contrast, not the magnitude.**
- **Both files stay in sync** (MD readable + JSX deployed). Commit per item; push to master (project pattern);
  deploy + smoke after any prose change; gitignore scratch and large dumps (research/cosmology/, *.jsonl).
- **Writing gates** (EDITOR-CHECKLIST + WRITING-STANDARD): no em-dashes, no first person, no "load-bearing"/
  "cross-cutting", no setup-and-payoff punchline cadence, show key Pāli italic+gloss, hedged register,
  tendency-not-law, every citation resolves.
- **DECIDED, do not re-open:** the concentration material (calm/insight + "how much concentration the lower
  path requires") is NOT to be split into a companion study — operator denied 2026-06-22. Leave it in place.
- The study is a tendency-with-counter-currents, not a law; keep the strays counted and the cosmology arm
  honest about being the thinner sample.

## 7. Coordination / ownership
Single working tree on master. This campaign's three items touch overlapping files (FINDINGS-readable.md,
ResearchView.jsx), so run them SEQUENTIALLY (ITEM 1 → 2 → 3), not in parallel chats — last-write-wins would
clobber. Within an item, use ultracode workflows for the parallelizable parts (candidate enumeration,
sense-audit reasoning, per-section de-comma recasts) but apply edits yourself and keep the DB serial.

## 8. Per-pending-item: what to check when it lands
- ITEM 1 ✅: COSMOLOGY-CENSUS.md every row resolves; the prereg is scored verbatim; §VII no longer says
  "spot-check" (it never did; "freshly-counted sample" upgraded to "now counted the same way" + census
  pointer); smoke + new-citation 200s (an7.66, snp1.8). The 84k-Sineru correction is logged as a falsified
  prereg leg, not a silent fix.
- ITEM 2: re-run a known cosmology term under the old vs new CASE and confirm only late-canonical magnitudes
  move; headlines stable; mapping artifact committed.
- ITEM 3: grep the paper for the reconciled numbers (consistent); G3 no longer under "general importance";
  EDITOR-CHECKLIST carries the comma rule; a spot read of §§II–VI shows no comma-splice/stacked-appositive runs.
