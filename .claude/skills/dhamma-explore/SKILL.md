---
name: dhamma-explore
description: Build a public-facing "Exploration" for the Dhamma tool (dhamma.fly.dev) — a worked example that teaches how to research a theme across the Pāli canon and commentaries with the site, and doubles as a real survey of that theme (a corpus-wide vocabulary count, a canon-vs-commentary split, and thematic strands, with every citation resolving to a real corpus row). Invoke for "/dhamma-explore <topic>", "make an exploration on X", "explore X for the public", or when the operator wants a public, instructional worked example rather than a gated rigorous study. Distinct from dhamma-research: lighter (no pre-registration, no inter-annotator agreement, no adversarial peer review), public, and explicitly framed as "a worked example, not a full study." The output is a single JSON file in public/explorations/ plus one registration line; this skill never writes React.
---

# dhamma-explore

Produce one **Exploration**: the product the operator approved with the wheel-turning-monarch
page. An Exploration is a **public worked example** that (a) teaches a reader how to research a
theme with this tool, and (b) delivers a real, lightly-explained survey of that theme across the
canon and its commentaries. It lives in the **Explorations** sidebar tab (open to all), beside the
gated **Research** studies.

The reference implementation is `public/explorations/wheel-turning-monarch.json`. **Read it first.**
Your output must match its depth, structure, and voice. The renderer is
`ExplorationStudy` in `src/ResearchView.jsx` — it is fully data-driven, so you only ever produce a
JSON file and one registration line. **Do not edit the renderer.** If you find yourself wanting to,
the schema is wrong, not the code.

## What this is NOT (boundary vs dhamma-research)

| | dhamma-explore (this) | dhamma-research |
|---|---|---|
| Output | Public worked example | Gated rigorous study |
| Home | Explorations tab · `public/explorations/` | Research tab · `public/research/` |
| Rigor | Real counts, verified citations, honest limits | Pre-registration, blind coding, IAA, adversarial peer review |
| Claim | "A worked example, not a full study" | A publishable study |
| Doubles as | A how-to-use-the-tool tutorial | — |

Never claim completeness or rigor an Exploration does not have. The honesty *is* the quality bar.

## The output contract

1. `public/explorations/<slug>.json` — the whole page, conforming to the schema below.
2. One entry appended to `EXPLORATION_ENTRIES` in `src/ResearchView.jsx`:
   `{ slug: '<slug>', title: '<Title>', subtitle: '<one line>', data: '/explorations/<slug>.json' }`.

That is all. No component, no server change. `/explorations/*.json` is served publicly by
`serveStatic` (the `/research/*.json` admin gate does not match it — leave that gate alone).

## The corpus tooling (use the live API at https://dhamma.fly.dev)

All counts and every citation come from the live tool. Never estimate a number or invent an id.

- **Counts (the headline table):** `GET /api/compare-stats?q=<URL-ENCODED-TERM>` returns
  `{ totalOccurrences, matchingPassageCount, frequencyByPitaka: [{ slug, count }] }`. The endpoint
  folds NFC + niggahīta and prefix-stems, so one query catches inflections. **You MUST URL-encode
  Pāli diacritics or the query is silently mangled** (the server echoes a stripped `query` — check
  it). Encodings: ā `%C4%81` · ī `%C4%AB` · ū `%C5%AB` · ṃ `%E1%B9%83` · ṁ `%E1%B9%81` · ṇ
  `%E1%B9%87` · ḍ `%E1%B8%8D` · ñ `%C3%B1` · ṅ `%E1%B9%85` · ṭ `%E1%B9%AD` · ḷ `%E1%B8%B7`.
  `frequencyByPitaka` slugs: `pli-sutta`, `pli-abhidhamma`, `pli-vinaya`, `pli-commentary`,
  `pli-subcommentary`, `pli-anya`. The per-piṭaka counts are occurrences and **sum to
  totalOccurrences** — reconcile every row.
- **Enumerate passages:** `GET /api/search?q=<enc>&mode=<exact|stem|meaning>&scope=<all|title|original|translation|citation>&limit=N`
  returns `{ results: [{ id, citation, title, snippet }] }`. Use `mode=stem&scope=title` to find
  named suttas; `mode=exact&scope=original` for a fixed Pāli formula; `mode=stem&scope=all` to sweep.
  The `pitaka=` parameter does NOT filter — ignore it.
- **Verify an id (mandatory for every citation):** `GET /api/passage/<id>` returns
  `{ citation, title, title_en, original, translation }` or `{ error: 'not_found' }`. Every instance
  id must return non-error, AND the passage's `original`/`translation` must actually contain the term
  or be genuinely on-topic (guard against homonyms and false-positives — see Gates).
- **Meaning-mode test:** `GET /api/search?q=<english phrase>&mode=meaning&scope=all&limit=6`. Run
  your candidate English queries live and keep only the ones whose top results are genuinely relevant.

## The JSON schema

Copy the shape of `wheel-turning-monarch.json` exactly. Fields:

```jsonc
{
  "meta": { "version": "v1.0", "generated": "YYYY-MM-DD", "corpus_snapshot": "194,710 passages",
            "note": "Counts reproducible from the live database via the Concordance view; every citation opens in the reader; renderings follow the corpus edition." },
  "overview":   "The 'Overview.' lead paragraph. State what the theme is, that this is a worked example, the corpus size, the headline count of the core term, the substantive count (if ids repeat across strands, state it as 'N instances across M passages'), the number of strands, and the one structural finding (usually: canon states it tersely, commentary draws the picture). Numbers baked in. design.md voice.",
  "methodNote": "Honest recall-bound: counts reproducible; the enumeration is bounded by the vocabulary in the how-to (a passage without those words can be missed); 'This is a worked example rather than a full study'; canon-vs-commentary is a textual-layer split, not a dating.",
  "howto": {
    "intro": "One paragraph: the page is a worked example; the recipe is find the vocabulary, count it, read and split the substantive passages; each box below is a real query you can paste in.",
    "recipes": [ { "query": "<pali term>", "mode": "Stem|Exact", "scope": "Original|Title|All", "occ": 0, "pass": 0, "note": "what this term narrows to and why this mode/scope" } ],
    "tips": [ { "label": "Concordance", "note": "...", "path": "/concordance/<core-term>" },
              { "label": "Search by title", "note": "..." },
              { "label": "Dictionaries", "note": "..." },
              { "label": "Commentary jump", "note": "..." } ],
    "meaning": { "intro": "Meaning mode is the way in when you don't know the Pāli; it ranks by sense over Pāli + translations; it is a way in, not a complete index.",
                 "examples": [ { "query": "<plain english>", "mode": "Meaning", "scope": "All", "surfaces": [ { "id": "<id>", "citation": "<DN 17>" } ], "note": "what it catches" } ],
                 "limit": "Honest limits: it misses the untranslated commentary; number-heavy phrases pull in unrelated lists; for completeness and the commentarial detail, the term-searches and Concordance are the reliable path." }
  },
  "termCounts": {
    "note": "The vocabulary, counted corpus-wide. Total occurrences; the passage count is distinct rows. Counts-for-all: most mentions are brief; the strands keep the substantive passages.",
    "columns": ["sutta", "abhidhamma", "vinaya", "commentary", "subcommentary", "anya"],
    "rows": [ { "term": "<pali>", "gloss": "<english gloss>", "occ": 0, "pass": 0,
                "byPitaka": { "sutta": 0, "abhidhamma": 0, "vinaya": 0, "commentary": 0, "subcommentary": 0, "anya": 0 } } ]
  },
  "themes": [ { "key": "kebab-slug", "label": "<Title Case strand>", "blurb": "2-3 sentences on what this strand is and how canon vs commentary divide on it.",
                "instances": [ { "id": "<corpus id>", "citation": "<DN 26>", "layer": "mula|attha|tika|anya", "note": "one line on what this passage contributes" } ] } ]
}
```

**Layer tagging** (the canon/commentary split, per instance): `mula` = Tipiṭaka — sutta ids
(`dn` `mn` `sn` `an` `snp` `ud` `iti` `dhp` `thag` `thig` `kp` `ja` `cp` …), Abhidhamma (`kv`,
`cst-abh…m.mul-…`), Vinaya, and `cst-…m.mul-…` mūla rows. `attha` = commentary, `cst-…a.att-…`.
`tika` = sub-commentary, `cst-…t.tik-…`. `anya` = extra-canonical, `cst-e…n.nrf-…`, Milinda (`mil…`).

## The method (run in order)

1. **Frame.** Write the master question ("where does X come from; how much is canon vs commentary").
   Confirm the theme is *bounded* (a figure, a rule, a practice — not a whole vague doctrine). Pick a
   kebab `slug` and a quiet, descriptive title.
2. **Build the vocabulary.** From canonical knowledge AND corpus probing, assemble the Pāli terms
   that *name* the phenomenon. Probe candidates with `/api/compare-stats` and `/api/search`; keep the
   terms with a real footprint and drop the ones that don't earn a row. This term set is the spine of
   both the how-to recipes and the headline table.
3. **Count.** Run `/api/compare-stats` (URL-encoded) for each kept term. Build `termCounts.rows`
   (occ, pass, byPitaka). **Reconcile every row** (byPitaka sums to occ).
4. **Enumerate + verify the substantive passages.** For each thematic strand, find the substantive
   canon AND commentary loci with `/api/search` (title, stem, exact). For EVERY candidate id, call
   `/api/passage/<id>`: confirm it resolves and is genuinely on-topic. Tag the layer. Write a
   one-line note on what it contributes. This is "counts-for-all in the table, expand-substantive in
   the strands": you are not listing every match (that is mostly noise), you are curating the
   passages that carry the theme. Aim for roughly 40-80 instances for a broad theme, but a genuinely
   narrow theme may legitimately have fewer (the vegetarianism reference has 32 instances across 26
   passages in 8 strands). Never pad to reach a number: the curate-don't-list-noise gate always wins.
   Count instances, and where the same id sits in more than one strand, report the distinct-passage
   count too.
5. **Sub-categorize into strands.** Group the verified instances into thematic strands that together
   cover the facets of the theme. Each strand gets a `blurb`. A passage central to two strands may
   appear in both with different notes.
6. **Test Meaning mode.** Draft plain-English queries a non-specialist would type. Run each live
   (`mode=meaning`). Keep 2-4 that genuinely surface relevant passages; record their real top
   results in `surfaces`. State the honest limits you observe (it usually misses the untranslated
   commentary; number-heavy phrasings pull in noise). Never fabricate a result.
7. **Author the prose.** Write `overview`, `methodNote`, the how-to `intro`, recipe notes, tips,
   meaning notes, and strand blurbs in the design.md voice (see Voice). Bake real numbers into the
   overview.
8. **Assemble + self-validate.** Emit the JSON. Run the validation script below; fix anything it
   flags before going further.
9. **Register.** Append the `EXPLORATION_ENTRIES` line; save the JSON to `public/explorations/`.
10. **Verify locally.** `npm run build` (must be clean). Then load `#/explorations/<slug>` in the
    preview (public — no admin gate needed) and confirm it renders with zero console errors, both
    tables populate, the strands expand, and the citation + concordance links are well-formed.
11. **Stop for operator review. Do NOT deploy.** Explorations are public; the operator reviews
    locally first. Only on their approval: `flyctl deploy -a dhamma`, then prod-verify (anon
    `/explorations/<slug>.json` = 200, gated `/research/*.json` still 401, bundle ships the new title).

## Hard quality gates (these are what make it correct on the first try)

- **No invented numbers.** Every `occ`/`pass`/`byPitaka`/recipe count comes from `/api/compare-stats`,
  and every `byPitaka` reconciles to `occ`.
- **No invented citations.** Every `instances[].id` resolves via `/api/passage/<id>`.
- **On-topic, not homonym, not false-positive.** Confirm the cited passage actually carries the term
  or theme. (Real traps seen: AN 3.2 "Lakkhaṇa" = fool-vs-wise, NOT the DN 30 thirty-two-marks
  "Lakkhaṇa"; a passage that turned out not to contain the term at all was dropped.) When unsure,
  read the passage text.
- **Meaning examples are live-tested**, `surfaces` are the real top results, and `limit` is honest.
- **Voice + framing** pass design.md and say plainly that this is a worked example, not a full study.
- **Renderer untouched**; output is JSON + one registration line.

### Validation script (run before declaring done)

```python
import json, urllib.request
slug = "<slug>"
d = json.load(open(f"public/explorations/{slug}.json", encoding="utf-8"))
# 1. counts reconcile
for r in d["termCounts"]["rows"]:
    assert sum(r["byPitaka"].values()) == r["occ"], ("byPitaka != occ", r["term"])
# 2. every cited id resolves
ids = {i["id"] for t in d["themes"] for i in t["instances"]}
ids |= {s["id"] for e in d["howto"]["meaning"]["examples"] for s in e["surfaces"]}
bad = []
for cid in sorted(ids):
    try:
        j = json.load(urllib.request.urlopen(f"https://dhamma.fly.dev/api/passage/{cid}", timeout=30))
        if j.get("error"): bad.append(cid)
    except Exception: bad.append(cid)
assert not bad, ("unresolved ids", bad)
# 3. layers valid
assert all(i["layer"] in {"mula","attha","tika","anya"} for t in d["themes"] for i in t["instances"])
print("OK", len(ids), "ids resolve;", len(d["themes"]), "strands;", sum(len(t["instances"]) for t in d["themes"]), "instances")
```

## Voice (design.md — this is public/published text)

No em dashes. Plain short words, varied sentence rhythm, no hype, no clichés. Be honest about limits.
Quiet academic tone for an audience of comparative-Buddhist-studies researchers and serious students.
Use commas, periods, parentheses, semicolons instead of em dashes. Match the register of
`wheel-turning-monarch.json` exactly.
