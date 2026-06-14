# Seed prompt — Complete the Individual-Guidance study (Phase 4b–d), ship it

> Paste everything below the line into a fresh chat (cwd `C:\Dev\Dhamma`). It is self-contained;
> the READ-FIRST list points to the files that carry the detail, so the new context stays lean.

---

You are continuing a Dhamma-corpus research build in `C:\Dev\Dhamma` (deployed at
https://dhamma.fly.dev). A multi-phase plan was approved and **Phases 1–4a are done and committed**
(branch `master`, latest relevant commit `d22f9e0`). Your job is **Phases 4b → 4d, to completion**:
build the study's renderer, write its paper to the `/dhamma-research` standard, and ship it admin-gated.

**The study — "How an individual is guided":** how the Pāli tradition guides a person toward awakening
(modes: a bare statement / an elaborated teaching / step-by-step leading / an assigned meditation object;
the criterion of assignment; samatha vs vipassanā; **canon vs commentary** throughout). It is a
standalone, admin-gated Research topic held to the awakening-census quality bar.

### READ FIRST (in order)
1. `~/.claude/plans/clever-bubbling-wozniak.md` — the approved plan (groups A–F, deliverables, verification).
2. `research/individual-guidance/RESEARCH-DESIGN.md` — the frozen pre-registration (master Q, H0/H1,
   codebook, methodology; §7 has the `kammaṭṭhāna` reconfirm).
3. `public/research/individual-guidance.json` — **the audited dataset v1.0 you render.** `meta` carries
   the H0/H1 (8/7) + D0 verdict + residual gaps; `aggregates` has the cross-tabs; `instances[]` are each
   grounded to a real passage id with evidence + a `verification` status.
4. `research/individual-guidance/census-digest.txt` — full evidence: every instance's verbatim Pāli
   quote, recipient, warrant, and the synthesis (the H0/H1 reasoning, the D0 evidence, the labelling
   notes). `census-instances-raw.json` is the raw record.
5. `.claude/skills/dhamma-research/SKILL.md` + `EDITOR-CHECKLIST.md` — **the standard you write to**
   (paper format; the SEPARATE de-AI editor pass; adversarial peer review; "keep methods, never leak
   process"). You may invoke it as `/dhamma-research`.
6. `src/ResearchView.jsx` — read `AwakeningStudy` (the pattern to mirror) + the `ENTRIES` array (the
   static-JSON study model).
7. Tool playbook: `research/intoxicants/HANDOFF.md` + memory notes `dhamma-research-standard`,
   `dhamma-auth-research-tab`, `dhamma-concurrency-wedge`.

### Phase 4b — Renderer
In `src/ResearchView.jsx`, add a second static study by mirroring `AwakeningStudy`:
- an `ENTRIES` entry `{ slug:'individual-guidance', title:'How an Individual Is Guided', subtitle:'…',
  data:'/research/individual-guidance.json' }`;
- an `IndividualGuidanceStudy` component that loads the JSON and renders, in the academic table style:
  - the prose paper (from Phase 4c);
  - **hyperlinked tables with clickable citations (`#/read/<id>`)**: object × layer (the canon/commentary
    table), mode × layer, criterion × layer, the expandable per-instance evidence, and the **H0/H1 delta
    table** (which assignment cells are warranted vs innovations, with the warrant tier);
  - the reader **DECISION-AID** panel: the canonical defilement→antidote map as self-applicable `[canon]`
    (lust→foulness, ill-will→love, scattered thought→breath, conceit→impermanence); the *carita* matrix
    shown descriptively `[comm]` with its teacher-assigned caveat (and the heart-blood-colour diagnostic
    as the emblem of its un-canonical character). **Never a single "your object is X" verdict.**
The Research tab is already admin-gated (`Dhamma.jsx` gates `tab==='research'` on `isAdmin`), so this
study is automatically admin-only and split from intoxicants. **No Tailwind**; inline styles with
`var(--bc-*)` tokens; serif/academic — match `AwakeningStudy` exactly. The renderer only READS the static
JSON (no live API needed to render).

### Phase 4c — The paper (to the `/dhamma-research` standard)
Write the prose: abstract · question + H0/H1 · **literature review** (engage, confirm/quantify — don't
rediscover: Cousins/Bronkhorst/Gethin/Anālayo on samatha–vipassanā; Bapat 1937 + Crosby/Skilton/Kyaw
2019 + Ñāṇamoli on the 40/Vimuttimagga; Puggalapaññatti/Law on the typologies) · **methodology** (CST/VRI
edition, the query log, the codebook, the saturation rule + honest recall limit, translation provenance =
commentary/Abhidhamma are the author's gloss) · one section per group **A–F** using the verified
citations from the dataset · discussion · **limitations** (the residual gaps) · contribution (the
auditable canon-vs-commentary census + the quantified H0/H1 + the D0 result) · references · **appendix =
the dataset + data-availability statement**. Then run, in order:
1. the **SEPARATE de-AI copy-edit** (`EDITOR-CHECKLIST.md`) — gate: **zero em-dashes**, AI tells removed;
2. **adversarial peer review** by 3 personas (Pāli philologist; meditation-studies scholar; methodological
   skeptic) → a review memo → revise;
3. the **process-leak scrub** — the paper must NOT contain `agent / workflow / box / prompt / LLM /
   N-agent pass` (grep it) and MUST keep a real Methods section. Put the orchestration + tool-friction in
   a separate `research/individual-guidance/HANDOFF.md` (internal), never in the paper.
The paper prose lives in the `IndividualGuidanceStudy` component (like `AwakeningStudy` carries its prose).

### Phase 4d — Ship
Verify the render locally (vite preview; the `/api` proxy points to prod, and the study renders from the
static JSON so it shows without sign-in). Then `npm run build`, then `flyctl deploy -a dhamma`. Verify:
admin sign-in (magic link to `isaac11cyr@gmail.com` or `keenan@boothcheck.com`) → **Research** tab → the
Individual-Guidance study renders; spot-check 3 citations open the right passages. Commit each phase.

### Key facts to carry (don't re-derive)
- **H0/H1 = 8/7** over the 15 decidable assignment cells: "faithful in principle, innovative in
  apparatus." The H1 innovations: the *carita*-as-temperament matrix, the heart-blood-**colour**
  diagnostic, the teacher-diagnosis-then-misassignment machinery (the Suvaṇṇakāra case), and the
  saddhā→six-recollections match. **4 of 8 H0 cells rest on the para-canonical Niddesa / Abhidhamma**,
  not the four Nikāyas — report the warrant **tier** per cell, don't collapse to "the canon says so."
- **D0:** the canon yokes samatha + vipassanā (AN 4.170 *Yuganaddha*; SN 43.2; AN 4.92–94/10.54 type
  people only to tell them to restore the missing member; it never assigns vipassanā alone to a named
  person). The *samatha-yānika / vipassanā-yānika* ("dry-insight") two-vehicle split is **commentarial**.
  This confirms Cousins; say so.
- **`kammaṭṭhāna`** is canonical only in the ordinary "occupation/work" sense; the meditation-subject
  sense is commentarial (this corrects the prior study; matches Crosby/Skilton/Kyaw).
- Warrant column is already normalized: `warrant='self'` for canonical instances, `null` only for true
  H1. Don't re-inflate the H0/H1 count with canonical rows.

### Gotchas
- Drive the live API **serially**; `/api/passage/:id` is reliable, `/api/search` is flaky. The box
  self-heals on boot (F5) but has **no concurrency guard (F6 not deployed)** — don't fan out heavy queries.
- Optional enrichment (residual gaps, NOT blockers): pull the verbatim Vism III 40-object rows (via the
  `flyctl proxy 15432:5432 --app dhamma-pg` + SQL, since the search `work=` filter is unhonored); confirm
  maraṇassati→named-person, MN 119 kāyagatāsati-as-directed, and the Mettasutta tree-deva nidāna. If you
  add any, ground + verify them and append to the dataset (bump to v1.1).

### Stopping criterion
Done when the Individual-Guidance study is **live** at https://dhamma.fly.dev (admin-gated Research tab),
renders the prose paper + hyperlinked canon/commentary + cross-tab tables + the decision-aid, every
citation opens its passage, and the paper has **zero em-dashes + no process-leak + a Methods section +
peer-review addressed** — committed and deployed.
