# Uttarakuru study — internal methods / handoff log

The "how the sausage was made" artifact. Orchestration, the raw query log, the reliability tables, the
adversarial checks, the peer-review memos and responses, and tool friction. **None of this bleeds into the
paper** (the process-free rendered study is `UttarakuruStudy` in `src/ResearchView.jsx`; the dataset is
`public/research/uttarakuru.json`).

Status: **v1.2 built + rendered + verified, NOT deployed.** Admin-gated Research tab (slug `uttarakuru`).
Snapshot 194,710 passages (2026-06-19).

> **v1.2 correction (the important one).** The operator flagged that enumerating a low-frequency proper name
> and declaring everything not adjacent to it "commentarial" is near-circular, and that an obvious-missing
> research step is a root gap, not a Limitations line. Two fixes: (a) the name search itself was
> diacritic-incomplete: `ILIKE '%uttarakuru%'` (short final u) does NOT match the long-ū declined forms
> `uttarakurūnaṃ` / `uttarakurūsu`, which carry the **canonical** four-continent cosmology. Switched to the
> stem `%uttarakur%`: **144 → 161 rows** (+17; the canonical recoveries are AN 3.80 / AN 10.29, the
> thousandfold-world lists). (b) Ran the **concept-independent / periphrasis passes** I should have run
> before shipping: each no-warrant feature searched WITHOUT the name. Result: the wish-tree is canonical only
> as an Apadāna merit-fruit (never at Uttarakuru); the self-ripening rice is a canonical idyll (DN 27, DN 32,
> JA 547 Vessantara); no canonical no-disease / perpetual-climate / from-here-to-heaven property; the
> canonical akkhaṇa list (AN 8.29 / DN 33) read directly, does not name Uttarakuru. **No coding flipped**; the
> canonical frame (A1, A2, A6) gained witnesses. Voice split 14/20/110 → **18/23/120** of 161.

## Deliverables (the record)
- `research/uttarakuru/RESEARCH-DESIGN.md` — frozen pre-registration (hypotheses, codebook, scope, stopping rule).
- `research/uttarakuru/EVIDENCE.md` — consolidated verbatim evidence dossier, feature by feature (coder material).
- `research/uttarakuru/build_dataset.py` — the reproducible dataset builder (counts data-bound; consistency check gates the build).
- `public/research/uttarakuru.json` — the auditable dataset (meta, disambiguation, reliability, saturation, context, 16 features, 144-row census, aggregates).
- `src/ResearchView.jsx` — `UttarakuruStudy` renderer + `RESEARCH_ENTRIES` registration + dispatch line.

## Data lane
Direct SQL against `dhamma-pg` via the running proxy: `flyctl proxy 15432:5432 --app dhamma-pg`, then
`PYTHONIOENCODING=utf-8 DATABASE_URL="postgres://dhamma:<PASSWORD>@localhost:15432/dhamma" python research/naga/sql.py "<SQL>"`.
The password is the `dhamma` role's; retrieved live, never committed. `PYTHONIOENCODING=utf-8` is mandatory
(Windows cp1252 console crashes on ṭ/ā otherwise). The live API was used only for `/api/dbcheck` and a search
smoke test; all counts and load-bearing negatives are SQL, not the search lane.

## Query log (term · scope · layer · result)
- `uttarakur` STEM (the honest superset), by work_role: **mula 26, attha 69, tika 51, anya 15 = 161.** (The short-u substring `%uttarakuru%` gave 144 and missed the long-ū forms; see the v1.2 correction.)
- `uttarakuru` exact-FTS (`/api/search?mode=exact`): **15.** So three search depths: exact 15, short-u substring 144, stem 161 — a recorded methodological finding.
- bare `kuru` NOT `uttarakuru`, by layer: mula 125, attha 449, tika 283, anya 120 = **977** (the Kuru janapada; excluded, reported).
- `kurudhamma`/`kuruvatta`: attha 19, tika 5, anya 1, mula 1 = **26** (excluded).
- four-continent frame (`aparagoyāna`/`pubbavideha` present, bare term absent): ~**29** (triaged; DN 17/26 folded selectively).
- cakkavatti `cāturanta` epithet (no uttarakuru): 125 (excluded as epithet).
- The 20 mula rows split by VOICE: 14 canon (Kathāvatthu, AN 9.21, DN 32, Apadāna, KN/Bv, Vinaya, with CST+SC dup ids) + 2 Vism + 4 Milinda (para-canon). The corpus carries both a CST and an SC id for many canonical passages; the census keeps the unique passage once, preferring the English-bearing id.

## Adversarial SQL log (load-bearing negatives reconfirmed; this is where coding errors hid)
- **kapparukkha + uttarakuru in true-canon (mula, ¬Vism, ¬Milinda):** 1 row = the Apadāna, terms ~21k chars apart in different verses → spurious. A4 commentarial. (And DN 27 Aggañña has no wish-tree.)
- **1,000-yr (vassasahassa) + uttarakuru in true-canon:** 1 row = the Apadāna; the vassasahassa is the Āsāvatī-creeper's millennial fruiting, unrelated → A6 figure commentarial.
- **akkhaṇa + uttarakuru in mula:** 6 rows, gaps 930–126,000 chars. Direct read of the canonical 8-akkhaṇa list (AN 8.29) and DN 33: **Uttarakuru is not in the list** (hell/animal/ghost/long-lived-deva/border-region/wrong-view/dullness/no-Buddha). The Uttarakuru-as-akkhaṇa identification is commentarial. (This was the peer reviewers' potentially-fatal objection; the direct read settled it for the thesis.)
- **acchandika + uttarakuru in mula:** 2 rows, both the Kathāvatthu; the acchandika/abhabba list is ~7,200 chars from the uttarakuru passage and is applied (in a reductio) to "all the gods", not the Uttarakurukas → B3 = canonical category, commentarial identification (coded "split").
- **heaven-destiny (sagga/devaloka) + uttarakuru in true-canon:** 5 rows, smallest gap 4,302 chars → B5 commentarial.
- **DN 27 Aggañña:** the self-ripening rice formula (akaṭṭhapāko sāli akaṇo athuso suddho sugandho) IS canonical (golden-age), no wish-tree, no uttarakuru → strengthens "canon supplies the frame"; A2 even more canonical.

## Reliability (IAA)
3 independent blind coders classified each of 16 features (warrant: canonical id or null; H0/H1 class).
**Fleiss κ = 0.941** (P̄ = 0.958, P_e = 0.293), unanimous on **15/16** features and **16/16** on the warrant.
The one split: A10 (the wheel-turner's conquest / jewel-woman origin), 2 "commentarial-detail" vs 1 "split";
adjudicated to the majority (the four-continent conquest frame is canonical DN 17/26, the Uttarakuru naming a
detail within it). Codes are frozen in `build_dataset.py:CODES`.

## Consensus result
- warrant present (canonical) **11/16**; warrant null **5/16**.
- classes: canonical-seed 6 (A1,A2,A3,A9,B1,B2), commentarial-detail 2 (A6,A10), split 3 (A7,B3,B4), no-canonical-warrant 5 (A4,A5,A8,B5,C1).
- census voice: canonical 14 / para-canon 20 (Vism 2, Milinda 4, extra-canonical 14) / commentary 110, of 144.

## Peer review (3 adversarial personas) — memos and responses
- **Pāli philologist (verdict: minor revision).** (1) AN 9.21 "three grounds but four nouns" → fixed: the three ṭhāna are amama/apariggaha/niyatāyuka, visesaguṇā (var. visesabhuno) marked as the closing descriptor, not a fourth ground. (2) amama="without mine-making" is the analyst's morphological gloss, not the commentary's → fixed: noted Mp-a glosses amama as nittaṇha (var. niddukkha); kept "without mine-making" (superior to Sujato's "selfless"). (3) Abh-pṭ §73.3 "gods can attain, Uttarakuru cannot" over-read from the truncated quote → fixed: included the fuller line "devesu maggapaṭilābhāya atthitā… uttarakurukānaṃ pana visesānadhigamabhāvo", which does support it. (4) ASCII verbatim below the floor → fixed: all verbatim now full IAST/diacritics, matching the cited rows.
- **Buddhist-studies / cosmology scholar (verdict: major revision).** (A) the akkhaṇa disqualification may be canonical → checked: AN 8.29/DN 33 do not name Uttarakuru (added as a displayed control); "most consequential" downgraded to "decisive, a claim about location not importance". (B) Collins missing → added (Nirvana and Other Buddhist Felicities) and deployed in the discussion. (C) La Vallée Poussin + name the akkhaṇa / no-Buddha-outside-Jambudīpa topos → added. (D) Aggañña DN 27 parallel → added as a canonical control + woven into A2.
- **Methodological skeptic (verdict: major revision).** (M1) "commentarial construction" over-reaches → reframed to "small canonical frame carrying a large commentarial superstructure"; text-mass vs concept-origin separated in meta.framing_note + the count section. (M2) 8,000-yojana provenance → stated as para-canonical (Vism), not canonical. (M3) 977-exclusion bias → breakdown reported (125/449/283/120); different referent, no bias. (M4) "invention" is an argument from silence → relabelled "no canonical warrant", recall-bounded caveat added (substring is blind to epithet/periphrasis). (M5) saturation asserted → marginal-yield note added (feature-term passes added 0 features). (S1) raw agreement only → Fleiss κ=0.94 reported. (S4) para-canon lumping → 3-way sub-split reported (Vism/Milinda/extra-canonical), Milinda's Burmese-canon status noted.

## Editorial passes
- De-AI copy edit (separate pass): clean; one "not as X but as Y" scaffolding removed. Zero em-dashes, zero process leaks (grep `agent|workflow|box|prompt|LLM`).
- Process-leak scrub: the paper names the method (corpus, query log, codebook, IAA) but not the orchestration; "coders" is methods, not a leak.
- Coherence pass (whole-document + deterministic `uttarakuru-consistency` in build_dataset.py): consistency PASS; abstract updated to roadmap the new akkhaṇa control + lead with the reframed thesis; the felicity/paradox split kept (DN 32 frame-bearing, AN 9.21 paradox-bearing); the recall caveat and the author's-gloss note de-duplicated to one home each.

## Tool friction (the dual-track evaluation)
- **Pāli declension lengthens the final vowel, and a naive substring misses it.** `uttarakuru` → genitive/
  locative plural `uttarakurūnaṃ` / `uttarakurūsu` (long ū). `ILIKE '%uttarakuru%'` silently drops these,
  and they are exactly where the canonical four-continent cosmology lives. Use the stem `%uttarakur%`. This
  was the v1.2 root fix; the same trap caught `amama` → `amamā` earlier (use `%amam%`). For any low-frequency
  Pāli proper name, search the stem, then triage, and run concept searches independent of the name before
  asserting a canonical absence.
- Windows cp1252 console: every Python touching Pāli needs `PYTHONIOENCODING=utf-8` or it dies on ṭ (ṭ).
- Exact-FTS undercounts inflected Pāli badly (15 vs 144); substring ILIKE is the honest superset. The site's "exact" mode is a precision tool, not a recall tool, for a low-frequency term.
- `work_role=mula` is a STRUCTURAL role, not "canonical": pli-vism (Visuddhimagga) and pli-mil (Milindapañha) are work_role=mula but post-canonical in voice. layer≠voice; the study tracks both.
- The corpus carries CST + SC ids for many canonical passages (DN 32 = `cst-s0103m.mul-dn3_9` and `dn32`); dedupe at the concept level, prefer the English-bearing id.
- Citation→id is not always guessable by pattern: 5 pattern-derived commentary ids failed to resolve and had to be looked up from the census (e.g. KN-a §305.18 = `cst-s0510a.att-305_p018`, not `cst-s0514a…`). Every cited id (149) was validated against the DB before shipping.

## Reproduce
1. `flyctl proxy 15432:5432 --app dhamma-pg`
2. regenerate the census inputs (committed for convenience):
   - `_census_windows.json`: `SELECT id, work_slug, work_role AS layer, citation, title, length(original) olen, (translation IS NOT NULL AND translation<>'') has_tr, substring(original, greatest(1, strpos(lower(original),'uttarakuru')-70), 230) window FROM passages WHERE original ILIKE '%uttarakuru%' ORDER BY work_role, work_slug, id;`
   - `_census_coded.json`: rule-code voice (deterministic from work_slug) + motif (window keywords) over the above.
3. `PYTHONIOENCODING=utf-8 python research/uttarakuru/build_dataset.py` → writes `public/research/uttarakuru.json`, prints the consistency check (must PASS).
4. validate every cited id resolves: see the `psycopg2 … id = ANY(%s)` check in the session log (149/149).
