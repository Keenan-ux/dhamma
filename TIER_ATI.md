# Tier ATI — Access to Insight ingest + English translation corpus

Access to Insight is winding down due to maintainer attrition + traditional-hosting costs.
They've published the entire site as a downloadable offline edition (CC BY-NC 4.0).
This doc plans the ingest of that corpus into Dhamma, focused on the two
biggest wins:

1. **Alternative English translations.** Multiple translator renderings of
   the same canonical suttas — Thanissaro, Nyanaponika, Walshe, Bhikkhu Bodhi,
   Ireland, Olendzki, Soma, etc. SuttaCentral gives us Sujato; ATI fills in
   the historical/scholarly translators a serious comparative reader wants.
2. **A dedicated English-translation search corpus.** Most users search for
   English meaning ("the chief disciple", "impermanence", "right speech") —
   not Pali. Today FTS hits a single `translation` column with one Sujato
   rendering. Adding multi-translator coverage + a translation-only search
   mode is what most users actually want.

The articles, study guides, and indexes from ATI are a separate (smaller-value)
opportunity covered in §7 — defer until §3 and §4 ship.

---

## ⚡ State as of this handoff — READ THIS FIRST

The dump is at `C:\Users\isaac\OneDrive\Desktop\pokemon\accesstoinsight\ati\`
(153 MB, 1,273 sutta translation HTML files + articles + indexes).
Nothing ingested yet. The data model decisions in §3-4 are the gate before
any ingest code gets written.

Open questions surfaced in §8 — answer these first.

---

## 1. What we have

```
C:\Users\isaac\OneDrive\Desktop\pokemon\accesstoinsight\ati\
├── tipitaka/                — sutta translations, nested by canon
│   ├── dn/{dn01..dn34}.{translator}.html      ~17 files
│   ├── mn/{mn.001..mn.152}{,x}.{translator}.html  ~102 files
│   ├── sn/sn{01..56}/{sutta}.{translator}.html    ~600 files
│   ├── an/an{01..11}/{sutta}.{translator}.html    ~400 files
│   ├── kn/{dhp,iti,khp,miln,snp,thag,thig,ud,...}/...
│   ├── abhi/                — abhidhamma extracts
│   └── sutta.html           — index page
├── lib/
│   ├── authors/{82 authors}/   — author pages, bios, full translations
│   ├── study/                  — study guides + dharma-talk transcripts
│   ├── thai/                   — Thai forest tradition texts (English)
│   └── bps/, diacritics/       — supporting material
├── ptf/                     — "Path to Freedom" study program
├── noncanon/                — Visuddhimagga, Vinaya Pitaka excerpts
├── glossary.html            — Pali-English term glossary
├── index-{sutta,author,subject,title,similes,names,number}.html
└── news/, faq.html, etc.    — site metadata, can skip
```

**Translator distribution** (filename `.{slug}.html`):

| Slug | Translator | File count |
|---|---|---|
| `than` | Thanissaro Bhikkhu | 889 |
| `wlsh` | Maurice Walshe | 68 |
| `irel` | John D. Ireland | 47 |
| `olen` | Andrew Olendzki | 41 |
| `budd` | Buddharakkhita | 32 |
| `nypo` | Nyanaponika Thera | 31 |
| `piya` | Piyadassi Thera | 24 |
| `nymo` | Ñāṇamoli Thera | 15 |
| `bodh` | Bhikkhu Bodhi (extracts) | 13 |
| `niza` | Nizamis | 12 |
| `hekh` | Hecker | 12 |
| `nara` | Nārada Thera | 5 |
| `soma` | Soma Thera | 3 |
| ... | other minor translators | ≤5 each |

Thanissaro is ~70% of coverage. Combined with our existing Sujato corpus
(SuttaCentral bilara-data, ~5,764 sutta passages), the comparative
coverage looks roughly like:

| Sutta | Sujato (SC) | Thanissaro (ATI) | Other (ATI) |
|---|---|---|---|
| DN 22 (Satipaṭṭhāna) | ✓ | ✓ | Nyanaponika, Soma |
| MN 10 (Satipaṭṭhāna) | ✓ | ✓ | Nyanaponika, Soma |
| MN 118 (Ānāpānasati) | ✓ | ✓ | — |
| SN 56.11 (Dhammacakka) | ✓ | ✓ | Piyadassi, Bodhi |
| Long tail (most suttas) | ✓ | ✓ or — | — |

Net: ATI doubles or triples the translator coverage where we have suttas.

### Source format

Each sutta HTML file wraps the translation in a license-protected div:

```html
<div id='COPYRIGHTED_TEXT_CHUNK'><!-- BEGIN COPYRIGHTED TEXT CHUNK -->
<div class="chapter">
<p>I have heard that on one occasion the Blessed One was staying in the
<a id="kuru">Kuru</a> country...</p>
...
</div>
</div> <!-- #COPYRIGHTED_TEXT_CHUNK (END OF COPYRIGHTED TEXT CHUNK) -->
```

ATI's README is explicit: re-use is allowed within CC BY-NC 4.0 if we (a)
preserve copyright notice, (b) restate license, (c) attribute back to ATI.
We are non-commercial, so this fits.

The HTML inside the chunk is well-formed semantic markup (`<p>`, `<i>`,
`<b>`, `<a>` for anchor refs, occasional `<h4>`). Easy to clean.

---

## 2. ID mapping — ATI → SuttaCentral

ATI's IDs are file-based:
- `mn.010.than.html`     → MN 10, Thanissaro translation
- `sn01.001.wlsh.html`   → SN 1.1, Walshe translation
- `an03.065.than.html`   → AN 3.65, Thanissaro
- `dn.16.0.than.html`    → DN 16, Thanissaro (segmented)
- `kn/dhp/dhp.20.than.html` → Dhammapada chapter 20, Thanissaro

SuttaCentral / our `passages.id` convention:
- `pli-mn10`, `pli-sn1.1`, `pli-an3.65`, `pli-dn16`, `pli-dhp1` etc.

Mapping is mostly mechanical. Edge cases:
- ATI has "`x`" suffix for excerpts (`mn.021x.than.html` = excerpt of MN 21).
  Map to the parent passage with a flag `is_excerpt = true`.
- ATI sometimes segments large suttas into multiple files (`dn.16.{0..6}`).
  SuttaCentral has DN 16 as one passage. Two options: (a) concatenate
  ATI segments into one translation tied to `pli-dn16`, or (b) preserve
  ATI's segmentation as separate `dn16.0`, `dn16.1`... — but our existing
  passages table is keyed on the SC ID and doesn't have ATI's segmentation.
  **Recommend (a)** — preserve SC's coarser passage boundary, paste ATI
  segments together with the chapter breaks intact in the text.
- KN sub-collections (`khp`, `iti`, `snp`, etc.) — check SC's id format
  per sub-collection; the prefix changes (`pli-tv-snp1.1`, `pli-iti1`, etc.).

Build a `scripts/ingest/ati-id-map.mjs` that normalizes ATI's filename →
our passage id. Maintain a `unmapped.log` for suttas where the mapping
fails so they can be reviewed.

---

## 3. Data model — the `translations` table

The current `passages` table has `translation TEXT` (single Sujato
rendering). That schema won't carry alt translators. We need:

```sql
CREATE TABLE translations (
  id          BIGSERIAL PRIMARY KEY,
  passage_id  TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  language    TEXT NOT NULL DEFAULT 'en',
  translator  TEXT NOT NULL,         -- 'thanissaro', 'sujato', 'nyanaponika', ...
  source      TEXT NOT NULL,         -- 'ati' | 'sc' | 'bps' | ...
  text        TEXT NOT NULL,
  notes       TEXT,                  -- translator's footnotes (HTML or markdown)
  copyright   TEXT,                  -- '© 1995 Thanissaro Bhikkhu'
  license     TEXT,                  -- 'cc-by-nc-4.0', 'cc-by-4.0', 'public-domain', ...
  source_url  TEXT,                  -- canonical URL back to source site
  fts_doc     tsvector GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED,
  embedding   vector(1024),
  position    INT,                   -- display order when multiple translations exist
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (passage_id, translator, source)
);

CREATE INDEX idx_translations_passage    ON translations(passage_id);
CREATE INDEX idx_translations_translator ON translations(translator);
CREATE INDEX idx_translations_source     ON translations(source);
CREATE INDEX idx_translations_fts        ON translations USING GIN(fts_doc);
-- HNSW on embedding only after embed pass (see §6).
```

The existing `passages.translation` column stays as a denormalized "primary
display" copy of Sujato's translation so the passage view doesn't need a
JOIN for the common case. New translations live in the new table.

**Migration:**
- Backfill: for each existing `passages` row where `translation IS NOT NULL`,
  insert a row in `translations` with `translator='sujato'`, `source='sc'`,
  `text=passages.translation`, license/attribution from SuttaCentral's
  bilara metadata.
- Going forward: ingest scripts (ATI ingest, future others) write to
  `translations` only. The `passages.translation` is updated by a trigger
  or in the ingest script when a new "primary" translation arrives.

---

## 4. Search architecture — the English-translation search mode

Right now SearchView has Exact / Stem / Meaning over the unified
`passages.fts_doc` (citation + title + original + translation). That's
fine for "find me passages where X appears anywhere". It's *not* what a
reader who wants "I want to read English suttas about X" needs — they
get Pali-only matches drowning the result list, and they only get
Sujato's rendering even when Thanissaro's word choice is closer to
their query.

**New search scope: "English translations only"**

Add a `scope` option to the existing Search UI:

| Scope | Searches |
|---|---|
| All (current default) | `passages.fts_doc` (everything mixed) |
| Original | Pali only — `to_tsvector(passages.original)` |
| Translation | English only — `translations.fts_doc` (across translators) |
| Citation | sutta IDs and titles only |

When scope=`translation`:
- FTS query: `translations.fts_doc @@ tsquery`
- Returns translation rows; group by `passage_id` and show one card per passage
  with a "Translations matching: Sujato, Thanissaro, Nyanaponika" header
- A passage might appear once with 3 highlighted matches, each from a
  different translator — let the user click to expand individual translations

When scope=`translation` AND mode=`meaning`:
- Embed query, vector-ANN over `translations.embedding`
- One row per (passage, translator) but group results by passage in the UI

Existing `passages.embedding` already covers the Sujato translation; the
new `translations.embedding` per row gives the full multi-translator search.

**For Meaning search across translations:**

We need to embed all translation rows. Same BGE-M3 pipeline as the
dictionary ingest (`embed_dict.py`), input is `${citation}: ${text}`
truncated to ~2000 chars. With ~5,764 SC passages + ATI's ~1,273 = ~7,000
translation rows total → ~5-10 min on the GPU.

If we keep multiple translations per passage, the embedding count grows
to maybe 15-20K total rows (more if KN is included). Still well within
embed-pass capacity.

---

## 5. UI changes

### Passage view (reading)

Today: Pali on the left, single English translation on the right.

With multi-translator data:
- Translation column gets a translator switcher (chips or dropdown)
  along the top: `Sujato (SuttaCentral)` `Thanissaro (ATI)` `Nyanaponika (ATI)`
- Each option shows its license / attribution inline in a thin footer
  ("Translated by Thanissaro Bhikkhu, © 1995, CC BY-NC 4.0, [link to ATI](https://accesstoinsight.org/...)")
- Optionally: a "side-by-side comparison" view that columns two translators
  next to each other — high-value for scholarly comparative work, but
  needs UI care; defer until the basics are in.

### Search view

- Add a "Search in" filter row with the new scope options (model in §4).
- When scope=`translation`, results show which translator matched.
- A small chip under each search result: `Sujato +2` meaning "this passage
  matches Sujato + 2 other translators". Click to expand a per-translator
  breakdown.

### Browse view

- Add a translator chip row in the passage card — small badges showing
  which translators are available for this passage. Click any chip to jump
  the right pane to that translator.

### Attribution footer

Required by CC BY-NC 4.0:
- Translator's name
- License (CC BY-NC 4.0 etc.)
- Link back to source

Put this in a `<footer style={attribFooter}>` under each translation. Make
it readable (this matters scholarly) but not loud (it's per-passage).

---

## 6. Implementation plan — phased

### Phase 1: data model migration (no user-facing change)
1. Apply `translations` table schema (via proxy, not boot path — see how
   `headword_folded` was added).
2. Backfill: for each passage with non-null `translation`, INSERT into
   `translations` with translator='sujato', source='sc'. Get SC's license
   metadata from their bilara repo metadata if available.
3. Verify: `SELECT COUNT(*) FROM translations` matches the Sujato-coverage
   passage count.

### Phase 2: ATI ingest
1. Write `scripts/ingest/ingest-ati.mjs`:
   - Walk `tipitaka/` recursively, parse each `.html`.
   - Extract `<div id='COPYRIGHTED_TEXT_CHUNK'>...</div>`.
   - Parse out copyright notice, license, ATI source URL (in the
     trailing license block of each file).
   - Map filename → passage id via `ati-id-map.mjs`.
   - Sanitize the HTML to plain text or to our allowlist (b, i, em, etc.).
   - INSERT into `translations`. ON CONFLICT update.
2. Smoke check: distinct translator count, passage coverage, a few
   spot-checks of known suttas.

### Phase 3: server search update
1. Update `runSearch` in `server/src/search.js` to accept
   `scope='translation'` and JOIN against `translations` table.
2. Group results by `passage_id` in the response (server returns
   passage + list of matching translators).
3. New `/api/passage/:id/translations` endpoint returning all
   translations for a passage (for the reading-view switcher).

### Phase 4: UI
1. SearchView: add scope option, render translator-matched results.
2. PassageCard / ReadingPanel: translator switcher chip row, attribution
   footer.
3. BrowseView: small "available translations" badges.

### Phase 5: embeddings for Meaning mode
1. Extend `scripts/ingest/embed_dict.py` (or new `embed_translations.py`)
   to embed `translations.text` with the same BGE-M3 pipeline.
2. Build per-translator HNSW partial indexes if the workload calls for it
   (probably not needed for ~15K rows — global HNSW should work fine
   at this size).
3. Wire Meaning mode + scope='translation' to use these vectors.

### Phase 6 (later): articles, study guides, indexes
1. Decide whether these become a new content type ("Library") or get
   slotted into existing structures.
2. Most cleanly: new `articles` table separate from `passages`. Different
   shape (no canonical citation, just title + author + text).
3. The curated indexes (similes, names, subjects, titles) are valuable
   navigational aids — slot them under Browse if a clean tree fits.

---

## 7. Articles / study guides / indexes (deferred)

After the alt-translations land, return here. The non-sutta content in
ATI's dump has high editorial value:

- **`lib/study/`** — themed study guides (Wings to Awakening, etc.) by
  Thanissaro. Hundreds of pages of secondary literature.
- **`lib/authors/`** — author pages with bio, full talks/essays.
- **`noncanon/`** — Visuddhimagga and related extra-canonical material.
- **`ptf/`** — Path to Freedom (modern study program).
- **`index-*.html`** — curated indexes: similes, proper names, subjects, etc.
- **`glossary.html`** — supplementary Pali-English glossary.

These are a different content type from sutta passages and probably want
their own table (`articles` or `library_entries`). Defer until the Tier C
commentaries and PED-quality dictionary expansions are in place — the
core canonical material should be solid first.

---

## 8. Open decisions (answer before §3 implementation)

1. **`passages.translation` deprecation strategy.** Keep it as the
   denormalized "default translation"? Or drop it entirely and have the
   passage view always JOIN `translations`?
   - Keep: simpler reads, marginally more storage, has-to-stay-in-sync
   - Drop: cleaner data model, all reads JOIN
   - Recommend **keep** initially, revisit after Phase 2 lands. Easier to
     drop later than to add back.
2. **Default translator per passage.** When a passage has 3 translators,
   which renders by default in Browse? Options:
   - Sujato (current "primary" Sujato translation)
   - User-selectable preference in settings
   - Per-passage scholarly choice (some suttas Thanissaro is the canonical;
     others Bodhi)
   - Recommend Sujato default + per-user preference toggle in settings.
3. **Translator slug naming.** ATI uses 4-letter slugs (`than`, `nypo`).
   Keep the same? Or expand to readable (`thanissaro`, `nyanaponika`)?
   - Recommend full readable slugs in our DB. ATI's 4-letter slugs are an
     accident of their file-naming, not a meaningful convention.
4. **Position/ordering**. When multiple translations exist, which is shown
   first? Sujato-then-Thanissaro? Alphabetical? Per-source priority?
   - Recommend: by `translations.position` column, defaulting to (sujato=0,
     thanissaro=10, nyanaponika=20, others=100). Lets us curate without
     UI complexity.
5. **HTML or plain text in translations.text?** ATI's HTML has paragraph
   structure (`<p>`), some inline `<i>`/`<b>`, footnote anchor `<a id>` refs.
   - Storing as plain text is simpler; loses some structural fidelity.
   - Storing as sanitized HTML (allowlist `p`, `b`, `i`, `em`) preserves
     paragraph breaks and emphasis. Renders cleanly via the
     existing `sanitizeDictHtml` pattern.
   - Recommend **sanitized HTML** — paragraphs matter for reading flow.
6. **English translation search default scope.** When the user opens
   SearchView with no scope chosen, search `translations` or `passages`?
   - If `translations`, Pali-only searches return nothing. Surprising.
   - If `passages`, current behavior continues.
   - Recommend: keep the current default (search `passages` mixed), make
     scope=`translation` an explicit toggle. Once UX is stable, consider
     making scope=`translation` the default for new users.

---

## 9. Smoke checks (after Phase 2)

```bash
# DB
PYTHONIOENCODING=utf-8 DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
  /c/Dev/Dhamma/scripts/ingest/.venv/Scripts/python.exe -c "
  import os, psycopg2
  conn = psycopg2.connect(os.environ['DATABASE_URL'])
  cur = conn.cursor()
  cur.execute(\"SELECT translator, source, count(*) FROM translations GROUP BY translator, source ORDER BY count(*) DESC\")
  for r in cur.fetchall(): print(r)
  "
# Expect: sujato/sc ~5764, thanissaro/ati ~889, walshe/ati ~68, ...

# Prod
curl -s "https://dhamma.fly.dev/api/passage/pli-mn10/translations" | jq '.translations | map({translator, source, len: (.text | length)})'
# Expect: at least sujato + thanissaro entries
```

---

## 10. License / attribution

ATI uses **CC BY-NC 4.0** for most translator content. Some pages have
custom restrictions (a few PDFs are publisher-locked — those we don't
re-host anyway since we only ingest HTML).

Required in our UI:
- Copyright notice (e.g., "© 1995 Thanissaro Bhikkhu")
- License restatement ("Licensed under CC BY-NC 4.0")
- Source attribution ("From Access to Insight (Offline Edition 2013.12.01.01),
  [link]")

Three lines on the attribution footer of every translation card. Acceptable.

Non-commercial = compatible. If we ever pivot to commercial offering (paid
features, ads), the ATI texts have to come out. Document this constraint
clearly in any future commercial pitch.

---

## 11. Standing project rules (don't violate)

- **No Tailwind.** Inline styles with `var(--bc-*)` tokens only.
- **No LLM at runtime by default.** ATI is static text ingest, fine.
- **Pin model & DB versions.** Same BGE-M3 model as corpus/dict.
- **Quiet, scholarly tone.** Attribution belongs on the page but
  understated. No "Sponsored by" loudness.
- **Bias toward forward motion.** After Phase 2, deploy and tee up the
  English-corpus search mode (Phase 3) in this doc.
