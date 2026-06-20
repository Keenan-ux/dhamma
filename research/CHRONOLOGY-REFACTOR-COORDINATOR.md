# Chronology Refactor — living handoff

> Coordinator state for the campaign that re-organizes EVERY Dhamma research study so its primary spine is
> CHRONOLOGY (textual time-depth), earliest stratum to latest, instead of the current finding/idea spine.
> Update this doc IN PLACE as each study lands (snapshot, not an append log). A successor reads this in full,
> then the files in §2, runs §4's verification commands, reports the §5 key metric + any drift, then resumes.
> **Operator is UNAVAILABLE and has PRE-AUTHORIZED deploy. Make unilateral decisions. Do not wait for input.**

## 1. Mission

Reorganize all published research studies to read **diachronically**: the body walks the topic up the textual
strata in ascending time-depth (`archaic-canonical` → `early-canonical` → `late-canonical` →
`abhidhamma-canonical` → `paracanonical` → `classical-commentary` → `sub-commentary` → modern `reception`),
showing how the subject enters, thickens, systematizes, and is elaborated across the layers. This FOREGROUNDS
the chronological-stratum axis (PROVENANCE-SIGNATURE I.1) that every dataset already codes; it is a
**presentation refactor, not new research** (findings, counts, citations stay identical). It applies to each
study's three surfaces: the `FINDINGS-readable.md` paper, the live admin-gated `ResearchView.jsx` component
prose, and the data-bound JSON prose the component renders (rewritten in the builder, JSON regenerated).

## 2. File / artifact map (+ commands)

**The five published studies (PRIMARY scope) — each has a readable paper:**
- `research/awakening/FINDINGS-readable.md` · live `AwakeningStudy` (src/ResearchView.jsx ~L429) · datasets `public/research/awakening-events.json` (+ `awakening-beings.json`) · builder `research/awakening/build_dataset.py`. Already chronology-led ("late and narrated"); lightest refactor.
- `research/uttarakuru/FINDINGS-readable.md` · `UttarakuruStudy` (~L2608) · `public/research/uttarakuru.json` · `research/uttarakuru/build_dataset.py`. Already "deepens with lateness"; natural fit.
- `research/heart-base/FINDINGS-readable.md` · `HeartBaseStudy` (~L2123) · `public/research/heart-base-and-insight.json` · `research/heart-base/build_dataset.py`. Its three-tier (sutta → abhidhamma → commentary) IS chronological; make that the explicit spine.
- `research/individual-guidance/FINDINGS-readable.md` · `IndividualGuidanceStudy` (~L1017) · `public/research/individual-guidance.json` · `research/individual-guidance/build_dataset.py`. Has a "where it sits in the layers" section + a semantic-drift strip; promote that to the spine.
- `research/intoxicants/FINDINGS-readable.md` · NO live component, NO served JSON · builder `research/intoxicants/build_dataset.py`. **Paper-only**: refactor the `.md` + regenerate the PDF; no component/JSON work.

**SECONDARY / optional stretch (only after all five PRIMARY land):**
- `naga`: live `NagaStudy` (~L3022) + `public/research/naga.json` + `research/naga/build_dataset.py`, but NO readable paper (scaffolded). If time remains, reorganize its component prose by stratum.
- `translation-divergence`: has `FINDINGS-v2.md` + builder but no readable paper, no live component. Out of primary scope; produce a chronology-organized readable paper only as completeness if everything else is done.

**The standard + method (READ FIRST, in this order):**
- `.claude/skills/dhamma-research/WRITING-STANDARD-READABILITY.md` — the readable form (two lanes: plain hedged prose in the body, ALL apparatus in footnotes + appendices; hybrid one short Methods note; fewer tables, lean on inline typeset figures; ~15pp; zero em-dash; zero process-leak; measured voice; no self-grading). NON-NEGOTIABLE; the refactor changes the section ORDER, not these rules.
- `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md` — §I.1 chronological stratum (the coding values + the work→stratum map) and §6 "stratigraphy table organized by ascending stratum" + the mandatory "within-canon chronology" subsection. This refactor makes I.1 the organizing axis.
- `research/awakening/FINDINGS-readable.md` — the reference implementation of the readable form (voice, footnotes, the early→late dot-strip figure, appendices). Match it.

**Reference value (every dataset already carries the stratum coding):** each `public/research/*.json` v2/v3 block has the per-row `stratum` / `stratigraphy` / `class_strata` data. The chronology spine is built FROM that existing coding; do not re-derive it.

**Render + verify infra:**
- PDF: `python research/_render_pdf.py <study>/FINDINGS-readable.md <study>/_paper.html` then headless Chrome `--headless=new --print-to-pdf=<...>.pdf --user-data-dir=<unique-per-run>` (per-run profile dir or parallel renders collide). PDFs + `_paper.html` are gitignored (derived).
- Build: `npx vite build` (must stay green).
- Local visual verify: `npm run dev` (preview tools). In dev the `/research/*.json` are served statically but the Research TAB is client-gated, so the live research render cannot be seen without auth; verify the PAPER via its PDF, and the live component via build-green + careful review. (The contents-outline TOC mechanism can be visually confirmed on a PUBLIC exploration page, `#/explorations/wheel-turning-monarch`, since explorations are ungated.)
- DB lane (probably unneeded — data already coded): proxy `flyctl proxy 15432:5432 --app dhamma-pg`; runner `research/naga/sql.py`. Only if a stratum code is missing/ambiguous.

**Deploy (PRE-AUTHORIZED):** `git push origin master` then `flyctl deploy -a dhamma`; smoke `curl -s https://dhamma.fly.dev/api/dbcheck` (expect passages 194710) + `curl -s -o /dev/null -w "%{http_code}" https://dhamma.fly.dev/research/awakening-events.json` (expect 401 = admin gate working). Do ONE deploy at the very end, after all studies land + verify.

## 3. Sub-chat ledger

Single autonomous worker chat (the backlog is interdependent — all five edit the SHARED `src/ResearchView.jsx`, so it CANNOT be parallelized across chats without clobbering; one long-queue chat). Seed in §6.

| # | Study | Surfaces | Status |
|---|---|---|---|
| 1 | awakening | paper + component (builder unchanged) | **LANDED + committed e2186df** (+ citation-label/dead-link fix in 140ee02 from red-team) |
| 2 | uttarakuru | paper + component (builder unchanged) | **LANDED + committed e2186df** (incl. char-gap moved out of body); red-team CLEAN |
| 3 | heart-base | paper + component + builder | **LANDED + committed 140ee02** (builder: stratigraphy reordered ascending + gate name-lookup, CONSISTENCY PASS, numbers identical) |
| 4 | individual-guidance | paper + component (builder unchanged) | **LANDED + committed 140ee02**; red-team CLEAN; builder unchanged (already diachronic + drift strip ascending) |
| 5 | intoxicants | paper only | **LANDED + committed 0591565**; red-team CLEAN |
| 6 | naga (optional) | component + JSON | NOT STARTED (optional stretch; does not block stopping) |

**studies-remaining (primary 1-5) = 0.** All committed; ONE deploy pending. naga optional.

## 4. Verification commands (+ expected)

- `npx vite build` → `✓ built`, no errors (after each component edit).
- `grep -c "—" research/<study>/FINDINGS-readable.md` → 0 (every paper). Same for any builder prose string that renders.
- Process-leak scan on rendered prose (paper body + component prose + rendered JSON fields): `grep -niE "\b(agent|workflow|pipeline|LLM|retrofit|provenance signature|pre-registered|CONFIRMED|PASS|REJECTED|work-class|axis)\b"` → only inside footnotes/appendices/internal-non-rendered fields, never the body reading line.
- Builders rebuild clean: `python research/<study>/build_dataset.py` → `CONSISTENCY: PASS` (heart-base/individual-guidance/uttarakuru/awakening).
- **Regression (the refactor must not move a finding):** every count/verdict in each study stays identical to its pre-refactor value (the datasets' regression gates already enforce this; confirm each builder still PASSes and the headline numbers in the paper match the dataset). A moved number is a BUG unless it is a typo-fix logged here.
- Every citation in each paper/component resolves to a real corpus row (the existing `Cite`/warrant ids; do not introduce unresolved ids).
- TOC: after the component refactor, the contents outline auto-reflects the new stratum sections (it discovers `article h2`); confirm the section h2s are the strata.
- PDFs regenerate without tofu (Pāli diacritics + figure glyphs present).
- Live smoke after the single final deploy.

## 5. Open queue + the key metric + predictions

**Key metric: studies remaining to refactor = 6 (5 primary + naga optional).** Drive to 0 (primary) then deploy.

**Pre-registered predictions** (score in this doc after the run):
- PREDICT the refactor moves ZERO findings/counts (it is presentation-only); every builder stays `CONSISTENCY: PASS` and every headline number is unchanged. PASS if no regression value moves without a logged warrant.
- PREDICT chronology is a NATURAL fit for all five (each already codes stratum and several already lead with it), so no study needs its data re-coded, only its prose re-ordered. PASS if no `build_dataset.py` stratum LOGIC changes (only prose strings + section order change).

**SCORED 2026-06-20 (after the run):**
- **Prediction 1 — PASS.** All five builders print `CONSISTENCY: PASS`; every headline number is unchanged from the frozen pre-refactor papers (verified by numeric-multiset diffs of every paper body new-vs-frozen, plus the live datasets). No regression value moved. The only logged presentation relocations (value preserved in all): uttarakuru raw char-gap `7,200` moved body→footnote; intoxicants one rhetorical restatement of `2,115` dropped (still stated elsewhere); uttarakuru `976`/`KV 1.3` surfaced into the body (real, in original + dataset). Zero findings/counts changed.
- **Prediction 2 — PASS.** No `build_dataset.py` stratum CODING LOGIC changed in any study. The only builder edit was heart-base: a presentation REORDER (stable sort of the stratigraphy list by ascending stratum rank) plus a gate-robustness fix (index → element-name lookup). No stratum value, code, or coding rule changed anywhere. awakening/uttarakuru/individual-guidance/intoxicants builders untouched.

**Logged pre-existing nits (NOT refactor regressions; left frozen per the "findings frozen" rule; for a future quality pass):**
- heart-base paper §IV body states a raw char-gap "87,102 characters apart" (present in the frozen original; it is the proximity-guard argument's evidence, with the two closer near-misses softened to "about 120 / about seventy"). The sibling uttarakuru/IG keep their raw gaps in footnotes. A consistency nit, not introduced by this refactor.
- heart-base reader cites `cst-abh07t.nrf-135_p014` (Abh-pṭ §135, "half-handful of blood"); pre-existing in the component, not enumerated in the dataset JSON. RESOLVED: verified to resolve on the live corpus (HTTP 200, 2026-06-20), a real row. No action needed.

## 6. The delegation brief / autonomous worker seed (ten-field; paste into the new chat)

```
Work autonomously to completion. The operator is NOT present and will not respond. Do not wait for input, do
not stop to ask, do not end with a "ready?" check. Read the files under READ FIRST, then begin immediately at
QUEUE item 1 and work through to the STOPPING CRITERION. You are PRE-AUTHORIZED to deploy.

GOAL: studies-remaining = 0. Reorganize every published Dhamma research study so its primary body spine is
CHRONOLOGY (ascending textual stratum, earliest to latest), across all three surfaces (readable paper, live
ResearchView component, data-bound JSON prose). Presentation refactor only — findings/counts/citations stay
identical.

REGRESSION GATE: every builder still prints CONSISTENCY: PASS; every headline number in each paper/component
matches its dataset (unchanged); every citation resolves; `npx vite build` stays green; zero em-dash and zero
process-leak in any rendered prose; the contents-outline TOC still works (sections are article h2s).

QUEUE (one study per unit; PRIMARY first, in this order):
  1. awakening   2. uttarakuru   3. heart-base   4. individual-guidance   5. intoxicants (paper only)
  6. naga (OPTIONAL — only if 1-5 done; component+JSON, no paper)
For each study with a live component + JSON: refactor (a) FINDINGS-readable.md, (b) the ResearchView.jsx
component prose, (c) the builder's rendered prose strings + rebuild the JSON. intoxicants = paper only.

METHOD (per study):
  1. Read the study's FINDINGS-readable.md + its live component in src/ResearchView.jsx + its dataset's
     stratum coding (v2/v3 block). The stratum data ALREADY EXISTS; you are re-ordering presentation around it.
  2. Re-spine the BODY by ascending stratum. Make the main sections (h2) the time-layers in which the subject
     develops — e.g. "In the early discourses" / "In the late canon" / "In the Abhidhamma" / "In the
     commentaries" / "In the sub-commentaries and modern reading" (use only the strata the study actually
     touches; name them for the subject). Inside each, narrate how the topic appears AT that layer. The arc is
     diachronic: enters → thickens → systematizes → elaborates.
  3. Keep the readable standard EXACTLY (WRITING-STANDARD-READABILITY.md): human opening (now framed "we trace
     X across the layers, earliest to latest"), a numbered roadmap whose entries ARE the strata, one short
     visible Methods note, the early→late dot-strip as the central inline figure, at most 1-2 tables, ALL
     apparatus (ids, Pāli, signatures, IAA) in footnotes + Appendices A/B/C, measured voice, no self-grading.
  4. Mirror the same stratum spine in the live component: its section <h2>s become the strata (so the TOC
     auto-reflects them), prose rewritten to match the paper. Then rewrite the builder's rendered prose
     strings (v2/v3 title/subtitle/headline/verdict/claim/evidence/method_note) to the diachronic framing and
     rebuild the JSON. Apparatus/leak tokens stay only in non-rendered fields.
  5. Regenerate the PDF (research/_render_pdf.py + headless Chrome, unique --user-data-dir).
  6. Verify: vite build green; em-dash 0; leak scan clean (body); builder CONSISTENCY PASS; numbers unchanged
     vs the dataset; PDF renders clean. Commit (one per study) AND push.
  After ALL primary studies land + verify: ONE deploy (git push already done per study; flyctl deploy -a
  dhamma) + smoke (dbcheck 194710, research gate 401). Update research/CHRONOLOGY-REFACTOR-COORDINATOR.md §3
  status to LANDED per study as you go.

ANTI-PATTERNS:
  - Re-coding or re-deriving the stratum data (it already exists in every dataset; only RE-ORDER prose). WHY:
    this is presentation-only; touching the coding risks moving a finding.
  - Moving any count/verdict (a regression). WHY: faithful refactor; a moved number is a bug.
  - Leaving the section order idea-shaped or canon-vs-commentary-shaped. WHY: the whole task is chronology-FIRST.
  - Reintroducing em-dashes, process leaks ("retrofit"/"provenance signature"/"PASS"/axis-numbers) into body
    prose, or self-grading verdicts. WHY: violates the readable standard already enforced repo-wide.
  - Deploying without rendering/build verification first. WHY: blind CSS/prose deploys have shipped breakage
    twice this program; render the PDF and build green BEFORE deploy.
  - Breaking the TOC by using non-h2 section headers in the component. WHY: useStudyOutline discovers article h2.

DRIFT LOG: see research/CHRONOLOGY-REFACTOR-COORDINATOR.md §2/§4 and the readable-standard history — past
deploys broke layout because they skipped render-verify; the data-bound JSON prose (v2/v3) is rendered live
and must be cleaned too, not just the component JSX; composite citations have no single corpus row (keep them
short, full-on-hover).

STOPPING CRITERION: studies-remaining (primary 1-5) = 0, each across all its surfaces; all builders
CONSISTENCY PASS with unchanged numbers; vite build green; em-dash 0 and leak-free body in every study; all
PDFs regenerated; deployed once with smoke green. naga is optional and does not block stopping.

REFERENCE STANDARD: research/awakening/FINDINGS-readable.md (readable form) re-spined by stratum is the model
for the others; PROVENANCE-SIGNATURE.md §6 stratigraphy ordering is the spine spec.

READ FIRST (in order):
  1. research/CHRONOLOGY-REFACTOR-COORDINATOR.md (this doc, all sections)
  2. .claude/skills/dhamma-research/WRITING-STANDARD-READABILITY.md
  3. .claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md (§I.1, §6)
  4. research/awakening/FINDINGS-readable.md (the reference)
  5. src/ResearchView.jsx (the study components + useStudyOutline/StudyOutline + the shared styles)
  6. the target study's FINDINGS-readable.md + its build_dataset.py + its public/research/*.json

COMMIT CADENCE: one commit per study (per surface-set), pushed in real time; ONE deploy at the very end.
```

## 9. Coordinator run log (live — started 2026-06-20)

**Baseline verified before any edit (regression anchor):** all five builders print
`CONSISTENCY: PASS` and are idempotent (re-running dirties nothing). Papers all em-dash 0.
Authoritative numbers to hold fixed:
- awakening: 299 mūla (38 early / 261 late), Apadāna 162, buddha-vacana 17 (9 dedup), 2,214 events; recall [2, 914, 1488, 2214].
- uttarakuru: 161 census; voice {canonical 18, para-canon 23, commentary 120}; 16 features; h0h1 {canonical-seed 6, commentarial-innovation 5, commentarial-detail 2, split 3}; warrant {11, null 5}.
- heart-base: recall [240, 272, 283, 283]; named-heart canon 0; posit canon 7; three-tier rows 7.
- individual-guidance: sutta 46, commentary 212; H0/H1 8/7; drift 3 classes.
- intoxicants: verdict CONFIRMED + refined; open-category commentarial-only 2.

**VERIFIED per-surface scope (corrects the brief's generic "rewrite builder prose" step — checked against the actual JSX):**
| Study | Component renders v2/v3 PROSE? | Builder prose edit needed |
|---|---|---|
| awakening | NO — `data.v2.*` are numbers only; prose is hand-written JSX | NO (verdict/headline are internal QA, not rendered) |
| uttarakuru | NO — renders `data.aggregates/.reliability/.features`; prose hand-written | NO |
| heart-base | YES — renders `v.title/subtitle/headline/stratigraphy/method_note` | YES (rewrite + rebuild JSON) |
| individual-guidance | YES — `v.title/subtitle/headline/stratigraphy/drift_strip/method_note` | YES (rewrite + rebuild JSON) |
| intoxicants | n/a (no component) | n/a (paper only) |

So builder PROSE edits are needed ONLY for heart-base + individual-guidance. awakening/uttarakuru
builders are left untouched (numbers unchanged); re-run only to confirm the gate still passes.

**Component-spine design decision:** the live components are interactive data explorers (tables +
expandable cited lists), not papers. The chronology spine is applied as the component's primary
narrative sections (h2 = strata named for the subject) carrying the re-ordered prose; the existing
data tables / cited-lists are folded under the appropriate stratum section or kept as a trailing
"complete census" block. This satisfies h2=strata (TOC reflects the diachronic arc) without
destroying the tool.

**Execution model:** papers (disjoint files) + builder prose (disjoint) rewritten/red-teamed via
Workflow; the shared `src/ResearchView.jsx` component edits done serially in the main loop (one
study at a time, vite build between) to avoid clobber. Commit + push per study; ONE deploy at end.

## 7. Coordination / ownership rules

- ONE chat, serial queue. All five PRIMARY studies edit the SHARED `src/ResearchView.jsx`, so they cannot run
  in parallel chats (last-write-wins clobber). Do them one at a time in QUEUE order.
- Commit per study; PUSH per study (real-time, safe). DEPLOY once at the end (pre-authorized).
- Findings are frozen: the refactor re-orders prose, never changes a number. Any genuine error found becomes a
  separately-logged fix, not a silent change.
- Update §3 + §5 the moment each study lands. Keep this doc current; it is the successor's only ground truth.

## 8. Per-pending-item check (what to verify when each study lands)

(1) The body spine is ascending stratum (sections named for time-layers, diachronic arc). (2) Readable standard
intact (two lanes, em-dash 0, leak-free body, measured voice, apparatus in notes/appendices). (3) Live
component mirrors the paper, its h2 sections are the strata, TOC reflects them. (4) Builder CONSISTENCY PASS,
JSON regenerated, rendered fields leak-free; numbers unchanged vs pre-refactor. (5) Every citation resolves.
(6) PDF regenerated clean. (7) Record LANDED in §3; score the §5 predictions at the end. (8) After all five:
one deploy + smoke; then naga if time remains.
