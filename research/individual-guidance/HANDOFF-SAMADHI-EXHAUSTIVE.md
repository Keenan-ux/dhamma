# Handoff — finish the exhaustive "limited samādhi" search

> **STATUS: COMPLETE (2026-06-21).** All 3,045 enumerated stems were run serially across the four
> strata (driver `run_samadhi.py`, single connection + temp-table + trigram index; full matrix in
> `SAMADHI-COUNTS.json`, 51 batches, exit 0). Decisive long-tail confirmations folded into the live
> paper and its readable mirror, built green, deployed (`flyctl deploy -a dhamma`), smoke green
> (dbcheck 194710, /api/research 401, SPA 200, new loci mn117/an7.45/sn48.10/dn5/dn14 all 200).
> **What landed in the subsection "How much concentration the lower path requires":**
> (1) the maximalist anchor is qualified — right concentration has two non-jhānic canonical definitions
> (MN 117 / AN 7.45 seven-supports one-pointedness; SN 48.10 release-as-object faculty);
> (2) the 0-canon commentarial-fill list extended (appanā-samādhi 0c added to upacāra/khaṇika; verified
> floors: upacāra-samādhi 0c/135cm, appanā-samādhi 0c/116, khaṇika-samādhi 0c/24, pādaka-jjhāna 0c/265,
> lokuttara-jhāna 0c/16, ekābhisamaya 0c/34, samatha-/vipassanā-yānika 0c, sukkhavipassaka 0c/120);
> (3) a synthesis paragraph: the canon DOES supply the floor as a *state* not a tier — the on-the-spot
> Dhamma-eye narratives name a hindrance-free pliant mind (kallacitta/muducitta/vinīvaraṇacitta 25c;
> dhammacakkhu 61c; DN 5, DN 14, Yasa) that the commentary later relabels "access concentration," and
> jhāna where framed directly is most often a pleasant abiding (diṭṭhadhammasukhavihāra 114c). Nothing
> overturned; every fold sharpened, not bloated. Method caveat recorded: the matrix uses exact
> all_terms stems, so inflection-final stems (e.g. `samadhisamvattanika`) UNDERCOUNT — positive numbers
> were re-verified with truncated stems. A 0 is robust only on the correctly-truncated invariant root (a
> truncated root is a substring superset, so truncating can only raise a count); a 0 on an inflection-FINAL
> key is NOT safe (siblings can hide below it) — re-truncate before trusting a zero too. Deploy is working-tree (not
> committed), matching the IG study's standing pattern.

**For a new chat. Operator: isaac11cyr@gmail.com. Project: C:\Dev\Dhamma (live at https://dhamma.fly.dev).**

## Do this, in order
1. **Respond to the operator in-line first** (conversationally, in the quiet academic register — no marketing, no AI-summary unless asked). They may open with questions or notes; answer those before doing anything else.
2. **Then finish the exhaustive execution** of the limited-samādhi research: run **every** one of the 317 avenues / 3,045 enumerated search terms, not a decisive subset. The operator was explicit: "I want every single one taken advantage of, not partial."

## The question
How much concentration do the lower fruits (stream-entry, once-return) actually require? The canon states a **gradient** (`samādhismiṃ mattaso kārī`, AN 3.86/3.87, AN 9.12) but **never a floor**. This is treated as one of the most pressing live questions in modern practice-scholarship; do it to the awakening-census quality bar.

## The enumeration is DONE — use it, do not re-run it
`research/individual-guidance/SAMADHI-ENUMERATION.json` (≈1 MB) holds **3,045 unique Pāli search stems, 317 avenues (each with an `inference_path`), 353 key loci, and the inference subjects**, produced by an 18-lens reasoning fleet. Read its `avenues` array for the full map with the reasoning behind each search.

## The METHOD (the operator's mandated pattern — now also encoded in the skill, `@PROVENANCE-SIGNATURE.md` §3.6)
- **Reason/execute split (hard rule):** the fleet agents reason about *what* to search and never query. **You, the orchestrator, execute** the term list **serially** against `dhamma-pg` via the **proxy**, NOT the live `/api/*` (it cold-starts ~38 s/call and has no concurrency guard — a planner agent that hit it this session stalled out).
- **Sense-audit every count** (a high count of an abstract term is a doctrinal-list / homograph / co-occurrence artifact until you read sampled rows — e.g. `sotapattiyanga AND jhana` co-occurs only in list-suttas, not coupling; `pannavimutta` person-type is ~28–37 canon, not the 257 the broad arahant-formula returns).
- **Read the priority loci in full** before trusting a reading.

### Corpus access recipe (run in Git Bash)
```bash
cd /c/Dev/Dhamma
export PYTHONIOENCODING=utf-8
curl -s --max-time 90 https://dhamma.fly.dev/api/dbcheck >/dev/null   # wake the app (auto-stops); the secret pull needs it awake
RAW="$(flyctl ssh console -a dhamma -C 'printenv DATABASE_URL' 2>/dev/null | tr -d '\r' | grep -o 'postgres[^[:space:]]*' | head -1)"
LOCAL="$(printf '%s' "$RAW" | sed -E 's#@[^/]+/#@localhost:15432/#')"
export DATABASE_URL="$LOCAL"      # NEVER echo this; it carries the DB password
python research/naga/sql.py "<SQL>"   # proxy must be up: flyctl proxy 15432:5432 --app dhamma-pg
```
Layer CASE (diacritic-robust via `unaccent(original)`):
```
CASE WHEN work_slug IN ('pli-an','pli-sn','pli-mn','pli-dn','pli-vinaya','pli-abhidhamma') THEN '1canon'
     WHEN work_slug LIKE '%-attha' OR work_slug LIKE 'pli-vism%' THEN '3comm'
     WHEN work_slug LIKE '%-tika' THEN '4tika' ELSE '2para' END
```
Batch many terms per query: `count(*) FILTER (WHERE o ILIKE '%stem%') AS name, ...` over `WITH lay AS (SELECT <CASE> AS layer, unaccent(original) AS o FROM passages) ... GROUP BY layer`.

## What is ALREADY executed + deployed (do not redo; build on it)
The **decisive clusters** are run and written into the live paper, in the `<h3>` subsection **"How much concentration the lower path requires"** (`src/ResearchView.jsx` `IndividualGuidanceStudy`, the calm-insight area) and mirrored in `research/individual-guidance/FINDINGS-readable.md`:
- **Pro-jhāna anchor:** `sammāsamādhi` defined as the four jhānas (`ayaṃ vuccati sammāsamādhi` + tetrad, 28 canon).
- **Negative space:** the stream-entry requirement lists (4 sotāpattiyaṅga, the 3 fetters) never include jhāna; the noble sīla is `samādhisaṃvattanika` "conducive to concentration" (92 canon); jhāna co-occurs only in list-suttas (DN 33 Saṅgīti).
- **Concentration as caused fruit:** `sukhino cittaṃ samādhiyati` (46; passive `samādhiyati` 63), in AN 6.10 to the **lay** Mahānāma; insight's proximate condition is bare `samāhite citte yathābhūtaṃ pajānāti` (58), depth-neutral.
- **A-fortiori (bounded):** `paññāvimutta` arahants reach the ceiling without the formless/eight-liberations (Susīma SN 12.70, `"No hetaṃ, āvuso"`); MN 70 with/without split. NOTE the deployed text now states this precisely as **beyond the four jhānas** (the formless); "without even the four jhānas" is flagged as the contested dry-insight extension, weight carried by the gradient + negative-space + caused-fruit, not the a-fortiori.
- **Commentary fills the gap:** `upacāra-`/`khaṇika-samādhi` 0 canon; `cittekaggatā` 64 canon → ~191 commentary.

## What is LEFT — the long tail (execute ALL; group by avenue from the JSON)
Not-yet-run clusters (cross-reference the 317 avenues in `SAMADHI-ENUMERATION.json` for the exact stems + inference paths per lens):
- **Per-scholar loci (Lens 11):** the suttas Cousins / Gombrich / Brahmali-Sujato / Polak / Arbel / Shankman / Gunaratana / Bodhi / Anālayo / Wynne lean on — run them as targets.
- **Cross-recensional (Lens 9):** the Susīma SĀ parallel's jhāna-denial asymmetry; Āgama parallels to AN 3.86 / AN 9.12 (use the `parallels` table by SuttaCentral id, then WebFetch SuttaCentral for feature-level confirmation); the Kathāvatthu controversies (`anupubbābhisamaya`, momentary concentration, arahant-without-jhāna).
- **Object-defined samādhis (Lens 6):** `animitta` / `appaṇihita` / `suññata` cetosamādhi — concentration defined by its object, not its depth.
- **Right-concentration definitions (Lens 7):** MN 117 `ariyo sammāsamādhi sa-upaniso sa-parikkhāro`; the bare `cittekaggatā` / `cittassa ekaggatā` definitions; `sammā` vs `micchā` / `lokiya` vs `lokuttara` samādhi.
- **Faculty-grading ladder (Lens 13):** SN 48.24 and neighbours — the five faculties graded by degree → the ladder of noble persons (`ekabījī`, `kolaṅkola`, `sattakkhattuparama`, then the followers); whether `samādhindriya` "fulfilled" = jhāna.
- **Calm/insight order (Lens 14):** AN 4.170 four ways in detail (`samathapubbaṅgama` / `vipassanāpubbaṅgama` / `yuganaddha` / `dhammuddhacca`); AN 4.94 the four persons by which quality they have/lack.
- **The breakthrough moment (Lens 12):** `dhammacakkhu udapadi` distribution and whether it is "seated, listening, in that very seat"; `abhisamaya`; `gotrabhū` (canonical footprint?).
- **Orthogonal inference (Lens 18):** count the **lay stream-enterers** who plainly lack jhāna training (Anāthapiṇḍika, Mahānāma, Dīghāvu, the upāsaka/upāsikā lists); deathbed and sudden awakenings (Bāhiya); "in the time it takes to snap the fingers."
- **jhāna as pleasant-abiding (Lens 16):** `diṭṭhadhammasukhavihāra`, jhāna as the arahant's dwelling vs the cause of taint-destruction.
- **Degree/partiality vocab (Lens 8):** `padesa` / `paritta` vs `appamāṇa` / `mahaggata`; the comparative morphology on samādhi vs on sīla/paññā.
- **Commentary glosses (Lens 10):** how the aṭṭhakathā/ṭīkā gloss `mattaso kārī`, and the `vipassanā-` / `magga-` / `phala-samādhi` categories.

Run these in batched serial queries, sense-audit, read the priority loci, then **fold the confirmed findings into the existing subsection** — sharpen or add a sentence/footnote each; do not bloat or duplicate. Edit the live page (`ResearchView.jsx`) directly; it is canonical, and `FINDINGS-readable.md` is a secondary/stale draft no longer kept in sync.

## Standing constraints
No first person (`I`/`we`/`our`); banned words `load-bearing`, `cross-cutting`; show curated Pāli (italic + gloss) for key/recurring/no-1:1 terms; academic tone; every citation resolves to a real row. Editorial rules: `@.claude/skills/dhamma-research/EDITOR-CHECKLIST.md` + `WRITING-STANDARD-READABILITY.md`.

## Deploy + smoke
`npm run build` (must be green) → `flyctl deploy -a dhamma` → smoke: `dbcheck` passages 194710, `/api/research` 401, SPA 200, study JSON 401 (gated, expected). The study is the admin-gated Research tab (cannot be browser-verified headlessly; build + cite-resolution + smoke is the verification pattern).

## Two operator questions answered this session (for context; new chat need not redo)
- **Perception-totality vs the nimitta technique:** in the canon the kasiṇa is a *perception* (`saññā`) of one quality (earth, light, …) extended as a boundless totality — `uddhaṃ adho tiriyaṃ advayaṃ appamāṇaṃ`, "above, below, across, undivided, measureless" (MN 77, AN 10.25-26). There is no nimitta-mechanics there: the object is the limitless perception itself. The `parikamma → uggaha → paṭibhāga` counterpart-sign progression is the Visuddhimagga's *technique* for reaching it (0 canon, ~190 commentary). The operator (like most readers) knew the kasiṇa only through the commentarial nimitta lens; that framing has become the default.
- **Arahantship "beyond four":** correct — the secure canonical point is arahantship without the **formless attainments / eight liberations** (beyond the four jhānas), per Susīma. Whether it needs even the four rūpa jhānas is the contested fully-dry-insight claim the commentary's `sukkhavipassaka` fills.

## Memory pointers
`[[discovery-sweep-and-ig-overhaul]]` (the full study state + findings), `[[writing-rules-from-ig-notes]]`, `[[dhamma-concurrency-wedge]]` (why serial-only), `[[research-notes-feature]]` (how to read the operator's inline notes from the DB).
