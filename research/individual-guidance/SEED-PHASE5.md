# Seed prompt — Phase 5: three-tier upgrade + heart-base addendum, applied to the LIVE study

> Paste below the line into a fresh chat (cwd `C:\Dev\Dhamma`). Self-contained; READ-FIRST points to the
> detail so the new context stays lean.

---

You are continuing a Dhamma-corpus research build in `C:\Dev\Dhamma` (deployed at https://dhamma.fly.dev).
The **individual-guidance study is already LIVE** (renderer + peer-reviewed paper + dataset v1.1, deployed;
commits `3db9b1f` + `cf22af6`). A follow-up conversation then produced two amendments it now needs. Your
job is **Phase 5: apply them to the live study and ship**.

**The two amendments:**
1. **Three-tier axis.** The study currently contrasts **canon vs commentary** (two tiers). That is wrong:
   the **Abhidhamma is canon** (the third basket), and most "commentarial" structures are the commentary
   *systematizing the Abhidhamma*. Upgrade the axis to **Sutta / Abhidhamma / Commentary** (+ a
   para-canonical bridge: Paṭisambhidāmagga, Nettippakaraṇa, Peṭakopadesa). This is verbatim-grounded.
2. **Heart-base addendum.** A finished, verbatim-grounded addendum
   (`research/individual-guidance/HADAYA-INSIGHT-STAGES.md`) on the heart-base (hadaya-vatthu), bhavaṅga,
   and the insight-stages needs to be **rendered into the admin-gated Research tab** (currently it's only a
   markdown file). It carries the three-tier verdict, the experiential-vs-map clarification, and the Goenka
   long-course correction.

### READ FIRST (in order)
1. `research/individual-guidance/HADAYA-INSIGHT-STAGES.md` — the addendum to render + the **§9 amendment
   list** (the authoritative spec for the three-tier changes).
2. `research/individual-guidance/abhidhamma-digest.txt` — the verbatim Abhidhamma evidence + passage ids
   (the killer quotes + the three-tier table source data).
3. `public/research/individual-guidance.json` — the live dataset v1.1 you will revise to v1.2.
4. `src/ResearchView.jsx` — the live `IndividualGuidanceStudy` component (static-JSON study via `ENTRIES`)
   you will amend; `AwakeningStudy` is the table/style pattern.
5. `research/individual-guidance/RESEARCH-DESIGN.md` (frozen prereg) + `HANDOFF.md` (internal methods log).
6. `.claude/skills/dhamma-research/SKILL.md` + `EDITOR-CHECKLIST.md` — the standard for any new prose
   (separate de-AI em-dash pass; 3-persona peer review; "keep methods, never leak process").
7. Memory notes `dhamma-research-standard`, `dhamma-concurrency-wedge`, `dhamma-auth-research-tab`.

### Task

**5a — Three-tier the dataset → v1.2.** Add a `tier` field to each instance + each warrant, derived from
`work_slug` / layer:
- `sutta` = pli-dn / pli-mn / pli-sn / pli-an + prose Khuddaka (dhp/ud/snp/iti/khp);
- `abhidhamma` = pli-abhidhamma (the seven books — Dhammasaṅgaṇī, Vibhaṅga, Dhātukathā, **Puggalapaññatti**,
  Kathāvatthu, Yamaka, Paṭṭhāna). *Note: the four understanding-types (`cst-abh03m2.mul-014`) are
  Puggalapaññatti = **abhidhamma**, not sutta — they're currently filed under "mula".*
- `para-canon` = pli-ps (Paṭisambhidāmagga) / pli-ne (Netti) / pli-pe (Peṭaka) / Niddesa;
- `commentary` = attha / tika / Visuddhimagga (pli-vism).
Recompute the warrant-tier breakdown (the live ledger says "4 mūla / 4 para-canonical / 7 innovation" —
re-split the 4 "mūla" into sutta vs abhidhamma). The **H0/H1 count is unchanged (8/7)**; only the tier
labels sharpen. Bump `meta.version` to `1.2`, keep the snapshot pin.

**5b — Three-tier the renderer + paper.** In `IndividualGuidanceStudy`:
- the criterion×layer / canon-vs-commentary tables **split "canon" into Sutta and Abhidhamma** columns;
- the H0/H1 warrant ledger shows the four-tier warrant (sutta / abhidhamma / para-canon / none=innovation);
- the **carita finding sharpens** in the paper prose: *roots Abhidhamma (the three akusalamūla) · 3-fold
  remedy-carita para-canon (Netti/Peṭaka) · 6-fold temperament-typing commentary* — and note the
  Abhidhamma's own word `carita` means **kamma** (Vibhaṅga §817 `Puññābhisaṅkhāro…`), so "temperament" is a
  commentarial re-coinage;
- add a short **methods note**: the axis is three-tier; the Abhidhamma is *canonical but second* (its
  Buddhavacana claim rests on a commentarial origin-account, the Aṭṭhasālinī's Tāvatiṃsa narrative).

**5c — Render the heart-base addendum into the Research tab.** Add `HADAYA-INSIGHT-STAGES.md` as a
**rendered, admin-gated study** — either a new section of `IndividualGuidanceStudy` or a sibling `ENTRIES`
study (recommended: sibling entry `heart-base-and-insight`, since it has its own three-tier table). Render:
the three-tier table (§2) with **hyperlinked citations** (`#/read/<id>`); the heart-base chain (§3) with the
self-aware naming quote `Ettha ca rūpanti hadayavatthumattameva adhippetaṃ` + the `paṭṭhā.1.1.8` warrant;
bhavaṅga (§4); the insight-stages + the **experiential-vs-map** clarification (§5); the carita sharpening
(§6); the **modern-practice layer with the Goenka long-course correction** (§7, attributed practitioner
testimony, flagged not-publicly-verifiable); the "heart is integral, to which tier" close (§8). Match
`AwakeningStudy` style (no Tailwind, `var(--bc-*)`, serif). It's admin-gated automatically via `Dhamma.jsx`.

**5d — Residual gaps → optional v1.2 enrichment (ground + verify each before adding; not blockers):**
verbatim Vism III 40-object rows (via `flyctl proxy 15432:5432 --app dhamma-pg` + SQL, since the search
`work=` filter is unhonored); maraṇassati→named-person and MN 119 kāyagatāsati-as-directed; the Mettasutta
tree-deva nidāna; per-row verbatim for the `partial`-verdict Abhidhamma rows (see the addendum §10 limits).

**5e — Ship.** Any new prose runs the three editorial passes (de-AI copy-edit → 0 em-dashes; 3-persona
peer review; process-leak scrub — grep `agent|workflow|box|prompt|LLM`). Render-verify in vite preview
(static JSON shows without sign-in). `npm run build` → `flyctl deploy -a dhamma`. Verify admin sign-in
(magic link to `isaac11cyr@gmail.com` / `keenan@boothcheck.com`) → Research → both studies render, the
canon column shows Sutta + Abhidhamma, citations open the right passages. Commit each step; update
`research/individual-guidance/HANDOFF.md`.

### Key facts to carry (don't re-derive)
- **Three-tier verbatim verdict** (all in the addendum + abhidhamma-digest, with ids): mind-base = sutta
  silent → Abhidhamma anonymous `yaṁ rūpaṁ` (Paṭṭhāna) → commentary names it the heart (and cites
  `paṭṭhā.1.1.8`, flags `dha.sa.584`); bhavaṅga = bare Paṭṭhāna term → commentary builds the citta-vīthi;
  named insight-ñāṇas = **0 in the 7 Abhidhamma books**, first defined in the Paṭisambhidāmagga (`ps1.1`),
  systematized by Vism; seven purifications = **sutta** (MN 24, `mn24`); analytical categories
  (khandha/āyatana/dhātu/PS) = **Abhidhamma** (Vibhaṅga vb1/vb2/vb3/vb6).
- **carita:** roots Abhidhamma; 3-fold remedy para-canon; 6-fold typing commentary; `carita`=kamma in the
  Abhidhamma. H0/H1 still 8/7 — only the warrant *tier* sharpens.
- **Experiential framing:** the canon is a path to *walk* (ehipassiko, paccattaṃ veditabbo, anupassanā,
  bhāvanā); the named ñāṇa-ladder is the commentary's *map* of that walking. Don't call the canonical
  practice "contemplation"/"pondering".
- **Goenka correction:** the heart-base/bhavaṅga apparatus IS taught in Goenka's confidential long courses
  (per a practitioner), not only Pa-Auk; record as attributed testimony, not a verified citation.

### Gotchas
- Drive the live API **serially**; `/api/passage/:id` reliable, `/api/search` flaky; box self-heals on
  boot (F5) but has **no concurrency guard (F6)** — don't fan out heavy queries. The renderer only READS
  static JSON. Every citation must resolve to a real corpus row.

### Stopping criterion
Done when: the live study's canon column is split **Sutta / Abhidhamma**; the warrant ledger shows the
four tiers; the carita finding + the three-tier methods note are in the paper; the **heart-base addendum is
rendered** in the admin-gated Research tab with working hyperlinks, the experiential-vs-map clarification,
and the Goenka long-course correction; dataset → v1.2; any new prose has 0 em-dashes + no process-leak +
a Methods section; committed and **deployed + prod-verified**.
