# Deferred items handoff

Five workstreams I'm setting aside so I can focus on other things.
Each is briefed in enough detail that a fresh chat can pick it up
cold. Read this **after** CLAUDE.md and HANDOFF.md for the project
context, then act on whichever item I queue up next.

Live at https://dhamma.fly.dev. Verify with
`curl -s https://dhamma.fly.dev/api/dbcheck`.

---

## Quick state recap (as of this handoff)

- All 25,986 passages re-embedded with DPD English-gloss appendix
  injected. HNSW rebuilt. Search quality lifts confirmed by spot-checks
  (SN 54 for "mindfulness of breathing", Vism + canonical mula
  surfacing on "metta", SN 12.60 on "dependent origination").
- 25% canonicality boost in the 3-way RRF for `work_role='mula'`
  passages. Note: Visuddhimagga is classified as `mula` in our data
  model so it still ranks high on its own terminology. To distinguish
  canonical-Tipiṭaka from extra-canonical mula, look at
  `source_edition='sc'` or a curated `passage_priority` table.
- Layout pass on Tipiṭaka / Commentaries / Extra-canonical: every
  block has `margin: ... auto ...` inside a pageColumn wrapper, so
  all elements share one centerline. Sidebar slimmed to 145px (total
  ~190 rendered) so its right edge sits just past the "Dhamma data"
  wordmark.
- Search defaults to Meaning on first visit; persists last choice in
  localStorage at `dhamma:searchMode`.
- Library re-click in the sidebar returns to the splash via a
  hashchange listener and a Sidebar handler that pushes the base hash
  on re-click.
- Right-click / Cmd-click / middle-click → "Open in New Tab" works
  on: sidebar tabs, passage cards in Search/Concordance, Library
  article cards, Library translator chips, frontmatter drill targets
  on Tipiṭaka / Commentaries / Extra-canonical, Browse tree leaves,
  reader prev/next, SuttaCentral parallel links.
- Path-form deep-link redirects: `/library/X`, `/read/X`, `/search/X`,
  `/dict/X`, `/concordance/X`, `/compare/X` all 302-redirect to the
  `#/` form. Direct URLs from email or chat work without the hash.
- Dictionary "Define" action on highlighted text is now available
  inside the Dictionary page itself, which makes the "circular
  definition" case (e.g. `sampajānāpetuṃ` → "inf of sampajānāpeti")
  actionable: scholars can click through to the referenced base
  verb's full entry.

The repo also has a stale `HANDOFF.md` and various smaller markdown
files from older sessions. CLAUDE.md is the canonical voice doc.

---

## 1. AI-assisted draft translations pilot

**Status:** designed in `TRANSLATIONS-AI.md`, not implemented.

**Goal:** generate one machine-drafted English reading aid for a
specific commentary passage, present it alongside Bhikkhu Bodhi's
human translation of the same passage as a quality benchmark, then
iterate the prompt before scaling.

**Concrete first step:** pick a single passage from the
Sumaṅgalavilāsinī (DN-A) where Bodhi has a published rendering in
*The All-Embracing Net of Views* (BP209S). The DN 1 commentary on
the opening Brahmajāla section is the obvious candidate. Generate
one draft with Claude using the v1 prompt sketched in
`TRANSLATIONS-AI.md`, output JSON with `translation`, `notes`,
`confidence`, `glossary`.

**Required before generation:**
- Lock the model version (pin a specific Claude model so re-runs are
  reproducible)
- Lock the prompt version as `v1` in `scripts/ingest/ai-translate.prompt.md`
- Decide whether the model sees surrounding passages as context
  (cost is not a constraint here, so probably yes)
- Decide whether to substitute human-translated quoted canonical
  text inline rather than re-translating

**Storage:** new table `ai_translations` defined in
`TRANSLATIONS-AI.md` §Storage. Apply that DDL before generation so
the draft has somewhere to land.

**Hand the output to:** one or two scholars who actually read Pāli,
in writing, with three specific questions per `TRANSLATIONS-AI.md`
§2.

**Hard rules:**
- Off by default in the reader (settings toggle, not automatic)
- Visually distinct on the page (hatched border, italic, footer
  reads "machine-drafted")
- Never appears in citation export
- Never feeds back into the FTS / Meaning indexes

This is a high-care workstream. The labelling discipline is the
only thing standing between it being a research aid and being
epistemically harmful. Do not skip steps to move faster.

---

## 2. Site-wide review of the word "Buddhist"

**Status:** in-flight rethink, single occurrence touched (README).

**Why:** I'm rethinking how the term lands on the audience. Scholars
of comparative Pāli studies aren't all writing from inside a
"Buddhist" identity, and the word does work that doesn't necessarily
need doing on a tool that is, at root, a scholarly index of canonical
texts.

**Scope of the pass:**
- `index.html` meta description
- `manifest.webmanifest` description
- `package.json` description
- `src/AboutView.jsx` body copy
- Any UI prose that uses the word (search the codebase, treat each
  occurrence as a separate editorial decision, don't blanket-rename)
- README.md and CONTRIBUTING.md
- The handful of internal markdown files (CLAUDE.md, HANDOFF.md,
  TRANSLATIONS-AI.md, this file, the EMAIL_DRAFT files) are NOT in
  scope for this pass; they're internal voice docs.

**Constraint:** do not blanket-replace. Each occurrence is its own
editorial call. Some uses ("Pāli is a canonical Buddhist language")
are factually right and stay. Some ("for Buddhist scholars") narrow
the audience unnecessarily and should be rephrased. Bring the diff
back for review before deploying.

**Bring me each proposed change in a list** before applying. Don't
do a wholesale find-replace.

---

## 3. Drop the `xenova-v2-pinned` memory note

**Status:** bookkeeping. The note was a pin warning against
@xenova/transformers v2 because v3 had ORT load issues on my Win11
dev box. The v3 migration has since shipped, so the note is stale.

**Action:** delete
`C:\Users\isaac\.claude\projects\C--Dev-Dhamma\memory\xenova-v2-pinned.md`
and remove its reference from
`C:\Users\isaac\.claude\projects\C--Dev-Dhamma\memory\MEMORY.md`.

That's the whole task.

---

## 4. Email queue

Four outreach drafts in the repo. Three are ready to send when I
say so; one needs revision.

### Ready to send (after I confirm)

**ATI_EMAIL_DRAFT.md** → `contact@buddhistinquiry.org`. Finalized in
the prior session and tweaked once this session (the offer-paragraph
reworded from "I'd be glad to discuss hosting a stable mirror" to
"What's at dhamma.fly.dev already functions as a durable mirror" so
it doesn't read as if the mirror is hypothetical when 100% of their
content is already hosted). Demonstration links verified working
on prod (`#/read/snp1.8`, `#/library`).

### Need revision before sending

**SUTTACENTRAL_EMAIL_DRAFT.md** → contact form / appropriate SC
address. Section-by-section pass needed, same shape as the ATI
revision: strip em-dashes, tighten tone, drop "Buddhist" per the
in-flight term review, swap any stale facts.

**BPS_EMAIL_DRAFT.md** → `info@bps.lk` + `cnt@bps.lk`. Permission
request for Bhikkhu Bodhi's four commentary translation books. Same
revision pass. If they reply yes, see HANDOFF.md task #9 for the
follow-on ingest work.

**CPD_EMAIL_DRAFT.md** → `cpd-contact@uni-koeln.de`, cc
`info@palitextsociety.org`. Permission request for the Critical
Pāli Dictionary. Same revision pass. If yes, ingest pattern matches
`scripts/ingest/ingest-cped.mjs`.

### Sending discipline

- One email at a time, not a batch send. I read each one before
  send.
- Scholarly register throughout. No marketing copy, no stat-bragging,
  no em-dashes. CLAUDE.md memory note on `feedback-tone-no-marketing`
  is the canonical voice.
- First-person singular (Isaac Keenan Cyr / Keenan).
- Sign-off email is `keenan@boothcheck.com`.
- Don't volunteer the fact that the site is brand-new or that I'm
  the sole maintainer. The signature already conveys "small,
  independent." Volunteering it shifts the register toward
  apology / humble-brag.

### After replies land

- Yes from BPS → ingest Bodhi's four commentary translations from
  bps.lk PDFs into the `translations` table, attribution pattern
  same as ATI rows.
- Yes from Cologne/PTS → ingest CPD from DPD's `other-dictionaries`
  archive.
- Any reply that isn't a clean yes → bring it to me before
  responding.

---

## How to start the next chat

Paste this into the new chat verbatim:

```
Read C:\Dev\Dhamma\CLAUDE.md, C:\Dev\Dhamma\HANDOFF.md, and
C:\Dev\Dhamma\HANDOFF-DEFERRED.md. Working tree should be clean
(unless I've started something since). Deploy state is good, verify
with `curl -s https://dhamma.fly.dev/api/dbcheck`.

I want to work on [PICK ONE: AI translation pilot / "Buddhist" term
review / a specific email from the queue / the xenova memory note].

Notes for working with me:
- Flat-rate Anthropic plan, per-token cost not a constraint
- No em-dashes, use commas / periods
- Don't use "Buddhist" in user-facing copy without asking
- I'm one person (Isaac Keenan Cyr, go by Keenan)
- Scholarly register, not marketing
- Wait for direction before starting anything substantive
```
