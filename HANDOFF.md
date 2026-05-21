# Dhamma data — handoff to next session

This document captures the state at the end of the previous chat
so the next chat can pick up without re-reading the full
conversation. Read **this**, then **CLAUDE.md** for project
context, then **TRANSLATIONS-AI.md** if the AI-draft work is the
next priority.

Live at **https://dhamma.fly.dev/** · GitHub: `Keenan-ux/dhamma` (still private)
Last verified: `dbcheck → passages: 25,986, tables: 11, pgvector: true`

---

## What's live

The reader app is feature-complete for the original "single
person scholarly tool" scope. What ships today:

**Corpus**
- Pali Tipiṭaka (14,377 passages) + Commentaries (3,470) +
  Sub-commentaries (5,109) + Extra-canonical (3,030) via
  SuttaCentral + VRI/CST.
- Library: 386 ATI articles with BGE-M3 embeddings + meaning
  search.
- 30,741 SuttaCentral parallels (in-corpus targets clickable;
  Sanskrit / Chinese / Gāndhārī rendered as plain text).
- 3,547 ATI-indexed tags across simile / name / subject /
  number, with `/tags/<type>/<value>` drill-down.

**Multi-translator coverage**
- 5,113 Sujato (CC0) + 1,139 ATI translators across ~15
  translators (Ṭhānissaro, Walshe, Bodhi extracts, Ireland,
  Olendzki, Piyadassi, Ñāṇamoli, Soma, Buddharakkhita,
  Uppalavaṇṇā, et al.; CC BY-NC 4.0).
- Reader carries translator chip switcher + per-row
  attribution footer.

**Dictionaries** — six sources cascading on every `/api/lookup`:
DPD, DPPN, PED, CPED (Pāli) · MW, BHS (Sanskrit, gated under
`?language=san`).

**Search**
- Exact / Stem / Meaning modes
- Scopes: All / Title / Original / Translation / Citation /
  Library
- `?pitaka=sutta|vinaya|abhidhamma` filter for canon-scoped
  queries
- Sentence-aware FTS snippets (`refineSnippet`)

**Reader chrome (this session's main work)**
- TopNav: `position: fixed`, backdrop-blur, fades up on
  scroll-down + slides back on scroll-up. Same hide-on-scroll
  pattern as the boothcheck top nav.
- Sticky reader header: back (or "Exit reading mode") + prev /
  next nav + citation + action icons + find-in-passage row, all
  wrapped in a single sticky chrome that collapses smoothly with
  scroll progress. Adapts collapse range to short passages so it
  never gets stranded.
- Both fades use `data-scroll-root` selector + MutationObserver
  re-attach on route change. Scroll handler is `useEffect` with
  rAF throttle writing directly to a DOM ref (no React re-renders
  during scroll — that was the cause of the mobile stutter).

**Other reader features**
- Split-pane parallel view (pin a passage + open another at
  ≥ 880 px → two full-chrome columns with swap / unpin)
- Reading-mode (focus) variant with the same sticky chrome
- Bookmarks (localStorage)
- Citation copy
- Share button (Web Share API on mobile, clipboard URL on desktop)
- Interlinear DPD glosses on hover
- Mobile overflow menu for low-priority actions; Share +
  Bookmark stay inline

**Pages**
- Tipiṭaka / Commentaries / Extra-canonical: typeset frontmatter
  + leaf-drill via Browse
- Library: 386 ATI articles, browse by category + reader at
  `/library/:slug`
- Tags: drill type → value → passage list
- Search: Exact / Stem / Meaning + scopes
- Concordance: per-piṭaka frequency + KWIC + companion words
- Dictionary: standalone lookup at `/dict/<term>` + selection-
  popover inside every reader
- Bookmarks: localStorage list
- **About**: dedicated `/about` page with the corpus + dictionary
  inventory + Contact section
- **Contact form**: server-side `POST /api/contact` → stores in
  Postgres + emails the maintainer via Resend
  (`notifications@boothcheck.com` → `Keenan@boothcheck.com`)
- Random sutta: server picks a passage with English + opens
  reader

**Brand**
- Custom bodhi-leaf SVG (heart-cordate base + long acuminate
  drip tip + pinnate venation), translucent membrane at 35 %
  fill, crisp outline + veins
- "Dhamma data" wordmark — "Dhamma" in Noto Serif, "data" in
  Montserrat tertiary
- Clickable logo → home (Tipiṭaka)
- Working back button via `popstate` listener + meaningful
  `pushState` heuristic

**Infrastructure**
- `@xenova/transformers` v2 → `@huggingface/transformers` v3
  migration shipped (vector equivalence proved at min cosine
  0.999999 across 50 queries; no corpus re-embed needed)
- Server dep tree: 119 → 31 packages, 4 vulnerabilities → 0
- Service worker stripped to no-op (was intercepting navigations
  and causing stalled refreshes)

---

## To-do — work through top to bottom

Linear list. Items 1–6 need user actions or sign-off. Items 7–10
are dev work, ready to start.

**User actions / sign-off:**

1. **Review `README.md` + `CONTRIBUTING.md`** — committed, but
   maintainer hasn't read them. Get sign-off on tone before any
   public-flip.
2. **Flip GitHub repo public**: `gh repo edit Keenan-ux/dhamma --visibility public`.
   Maintainer must authorise — destructive to do without explicit
   green light.
3. **Send `ATI_EMAIL_DRAFT.md`** (info@bcbs.org)
4. **Send `SUTTACENTRAL_EMAIL_DRAFT.md`**
5. **Send `BPS_EMAIL_DRAFT.md`** (info@bps.lk + cnt@bps.lk) —
   asks BPS to extend ATI's CC BY-NC 4.0 precedent to Bodhi's four
   commentary translation books (BP209S Brahmajāla, BP210S Mūla-
   pariyāya, BP211S Sāmaññaphala, BP212S Mahānidāna).
6. **Send `CPD_EMAIL_DRAFT.md`** (cpd-contact@uni-koeln.de,
   info@palitextsociety.org cc) — asks Cologne + PTS for
   permission to mirror the Critical Pāli Dictionary.

**Conditional ingests (start when replies land):**

7. **If BPS replies yes** → ingest Bodhi's four commentary
   translation books from bps.lk PDFs into `translations` +
   `passages` tables. Same attribution pattern as ATI rows
   (translator + year + licence + source URL in the footer).
   Lifts commentary translation coverage from ~2.3 % to a
   meaningful percent of canonical sutta material.
8. **If Cologne / PTS replies yes** → ingest CPD from DPD's
   scraped SQLite (`digitalpalidictionary/other-dictionaries`,
   `dictionaries/cpd/cpd.tar.zst`, 29,734 entries). Pattern
   identical to `ingest-cped.mjs`; new source value `'cpd'`,
   `language='pli'`. While the letter is open also ask about
   Cone's *Dictionary of Pāli*.

**Other dev work, no blockers:**

9. **AI-assisted draft translations** — see `TRANSLATIONS-AI.md`
   for the full process plan. Goal is to fill the ~67 % of CST
   commentarial / sub-commentarial passages that have no English
   at all, as visibly-labelled machine drafts (not translations).
   The model is Claude via the maintainer's flat-rate Anthropic
   plan — per-token cost is not a constraint, so we can afford
   generous context (DPD anchors, adjacent passages) and a high-
   quality variant. **First step**: run a one-shot generation on
   the DN 1 Aṭṭhakathā passage that Bodhi covered in BP209S so
   we have a human gold standard to compare against. Iterate
   from there.

10. **Smaller follow-ups** — clean-up rather than new features:
    - Vinaya citation formatting (`PLI-TV-BI-VB-PJ1-4` →
      `Bhi. Pj. 1-4`)
    - Maybe a `simplify`-pass on `BrowseView.jsx` (~1800 lines now)
    - Audit / remove `useHeaderProgress.js` — was extracted as a
      shared hook then inlined into ReadingPanel for ref-based DOM
      writes; the file is now unused. Either delete or re-use.
    - Drop the `xenova-v2-pinned` memory note now that v3 is
      shipped and the override is gone.

---

## Architecture quick-reference

### Frontend
```
src/
  Dhamma.jsx              — top-level hash router; handleRandomSutta,
                            handleBack via popstate listener
  TopNav.jsx              — fixed-position, scroll-hides via
                            useScrollHide; backdrop-blur; clickable
                            "Dhamma data" wordmark = home
  Sidebar.jsx             — desktop sidebar (Corpus + Tools + About);
                            top padding clears the fixed TopNav
  CanonMapView.jsx        — Tipiṭaka frontmatter
  CommentaryView.jsx      — Aṭṭhakathā + Ṭīkā frontmatter
  ExtraCanonicalView.jsx  — Anya frontmatter
  LibraryView.jsx         — ATI library
  TagsView.jsx            — curated tag drill
  BookmarksView.jsx       — local-only bookmarks
  SearchView.jsx          — Exact / Stem / Meaning + scopes
  CompareView.jsx         — Concordance (KWIC + companion words)
  DictionaryView.jsx      — selection-popover host + standalone
  AboutView.jsx           — typeset About page + Contact form
                            (POST /api/contact → Resend)
  BrowseView.jsx          — column drill + ReadingPanel + sticky
                            collapsing chrome (back/prev-next/citation/
                            find wrapped in single sticky <div>,
                            opacity-driven by direct DOM writes in
                            useEffect — no React re-renders during scroll)
  PassageCard.jsx         — search/concordance result tile
  SelectionActions.jsx    — selection popover
  Leaf.jsx                — bodhi-leaf SVG (translucent at 35 %,
                            crisp outline + veins)
  api.js                  — fetch helpers (incl. randomPassageApi,
                            contactApi)
  useCorpus.js, usePassage.js, useSearch.js, useCompareStats.js
  useBookmarks.js, useIsNarrow.js
  useScrollHide.js        — generic hide-on-scroll-down chrome
  useHeaderProgress.js    — extracted scroll-progress hook
                            (currently unused; ReadingPanel inlined
                            the equivalent for ref-based DOM writes)
  ScrollPage.jsx          — shared scroll-root wrapper helper
                            (currently unused; views still set the
                            attribute inline)
  paliStem.js, parseQuery.js, searchHistory.js
  citationFormat.js, dictHtml.js, theme.css
```

### Server
```
server/src/
  index.js     — Hono routes incl. /api/contact, /api/random-passage
  db.js        — postgres connection + applySchema on boot
  corpus.js    — /api/corpus (hides uddāna mūla rows)
  search.js    — /api/search (FTS + vector + RRF; pitaka filter)
  compareStats.js
  dictionary.js — six-source cascade
  aliases.js
  embed.js     — BGE-M3 ONNX via @huggingface/transformers v3
  paliStem.js
server/sql/schema.sql — incl. contact_messages, articles, parallels,
                       passage_tags
```

### Data tables (11)
- traditions, works (display_order normalised), passages
- dictionary_entries + dictionary_inflections (six sources)
- translations (Sujato + ATI multi-translator)
- articles (ATI Library + embedding)
- passage_parallels (30,741)
- passage_tags (3,547)
- aliases
- contact_messages (form inbox)

### Endpoints
- `/api/corpus`, `/api/passage/:id`, `/api/passages?ids=`
- `/api/random-passage?scope=sutta|all`
- `/api/search?q=&mode=&field=&limit=&pitaka=`
- `/api/compare-stats?q=`
- `/api/lookup?term=&source=&language=&mode=`
- `/api/library`, `/api/library/:slug`
- `/api/passage/:id/translations`
- `/api/passage/:id/parallels`
- `/api/passage/:id/tags`, `/api/tags?type=&value=`
- `POST /api/contact` (rate-limited, Resend-relayed)
- `POST /api/gloss`
- `/api/healthz`, `/api/dbcheck`

### Deploy / data ops
- **Deploy**: `flyctl deploy --app dhamma` (5–8 min, schema
  auto-applies on boot)
- **Local DB access**: `flyctl proxy 15432 --app dhamma-pg`
  running in background (often left running)
- **DB password fetch**:
  `flyctl ssh console --app dhamma -C "printenv DATABASE_URL"`
- **Resend API key**: stored as Fly secret `RESEND_API_KEY`;
  domain `boothcheck.com` is verified on Resend so
  `notifications@boothcheck.com` is the validated FROM
- **Ingest scripts** run from `scripts/ingest/`, using
  `DATABASE_URL` pointing at the local proxy (`ssl: false` —
  flyctl loopback)

---

## Project rules (don't violate)

- **No Tailwind.** Inline styles using `var(--bc-*)` tokens only.
- **No analytics, telemetry, geolocation.**
- **No LLM at runtime by default.** AI translation drafts (per
  `TRANSLATIONS-AI.md`) are generated **offline**, stored as
  static DB rows, off by default behind a user toggle, and
  visually distinct from human translations.
- **Academic typesetting** — Noto Serif body, small-caps section
  labels, thin gold rules.
- **CC BY-NC 4.0 honoured** — every ATI-sourced rendering shows
  copyright + licence + source link.
- **Pin model & DB versions** — BGE-M3 only works against
  BGE-M3 vectors.
- **Scholarly register in outreach + UI prose.** See
  `feedback-tone-no-marketing` memory note.
- **One person, not an organisation.** First-person framing in
  user-facing copy. Maintainer is Keenan; replies come from him.

---

## Memory notes worth re-reading

Located at `~/.claude/projects/C--Dev-Dhamma/memory/`:

- `fly-memory-requirement.md` — 4 GB or BGE-M3 OOMs
- `xenova-v2-pinned.md` — **superseded by the v3 migration**;
  remove next time you touch memory
- `snippet-sentence-upgrade.md` — FTS-side shipped; vector-only
  sentence embeddings still deferred
- `cst-tipitaka-source.md` — VRI CST XML peculiarities
- `never-suggest-stopping.md` — bias toward forward motion
- `feedback-tone-no-marketing.md` — scholarly voice in outreach +
  docs

---

## How to start the next chat

Paste this into the new chat verbatim:

```
Read C:\Dev\Dhamma\HANDOFF.md and C:\Dev\Dhamma\CLAUDE.md.
Previous chat is at context limit. Deployed state is good —
verify with `curl -s https://dhamma.fly.dev/api/dbcheck`. The
working tree should be clean.

The reader app is feature-complete; remaining work is mostly
outreach (items 1–6 in HANDOFF.md, all needing my sign-off
or my hand to send) plus AI-draft translations (item 9, the
substantive next dev item — see TRANSLATIONS-AI.md for the
full process plan).

Notes for working with me:
- I have flat-rate Anthropic plans. Per-token cost is not a
  constraint. Don't penny-pinch model variant or context.
- Both `C:\Dev\Dhamma` and `C:\Dev\boothcheck` are my own
  private projects. When I ask to port a pattern between them
  it's just refactoring across my own codebases — not an
  external IP question.
- I'm one person (Keenan), not a team. First-person framing in
  any user-facing copy.

Wait for direction before starting anything from the to-do list —
ask which item I want to work on. Don't assume.
```
