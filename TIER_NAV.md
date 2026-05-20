# Tier NAV — visual canon navigation + translation-aware browsing

This is a **sketch**, not a finished plan. The point is to leave enough
shape for a future session to pick up and experiment, not to lock in
decisions. Keep room to throw things out and try again.

---

## Seed prompt for next chat

> Read TIER_NAV.md at the repo root, then the "What we have today"
> section in CLAUDE.md. The goal of this session is to prototype a
> vertical top-down canonical-tree navigation that visually echoes
> Ven. Pannyavaro's classic Tipiṭaka diagram (reference image saved
> separately). It should be the *primary* corpus navigation, replacing
> the current flat "Theravāda 25,986" sidebar entry. Treat this as an
> experiment — ship small, iterate fast. The user wants to see something
> on screen and react to it before we lock in the structure. Also wire a
> "Translated only" filter that hides passages with no row in
> `translations`, since the multi-translator ingest already populated
> that table. Phase 6 of TIER_ATI.md (Library tab) is the layer above
> this one; that's the next thing after nav lands.

---

## What we're trying to do

Three intertwined goals from the live session:

1. **Visual canon navigation** that echoes Pannyavaro's diagram (the
   top-down branching Tipiṭaka tree, with Sutta-piṭaka splitting into
   five nikāyas, Khuddaka splitting into fifteen books, Vinaya into
   its sub-books, Abhidhamma into seven). Vertically oriented, not
   indented-list style. The diagram is the *experience* we want, not
   just a reference.
2. **Translation-aware browsing.** A toggle that filters the browseable
   tree to passages where we have at least one English translation.
   Future-proof: AI-generated translations (source='ai') should slot
   into the same `translations` table and be filterable separately.
3. **Tab-based top-level corpus split.** Top of the nav lets the user
   pick which corpus they're browsing — Tipiṭaka / Commentaries /
   Library (the ATI articles + study guides + curated indexes from
   TIER_ATI §7, when that ships).

The "visual nav" is the experiment. The translation filter and the tab
split are mechanically straightforward once the nav shape is decided.

---

## Reference

Pannyavaro's 2000 Tipiṭaka diagram, top-down:

```
                          TIPIṬAKA
                  ─────────┬─────────
        ┌─────────────────┴─────────────────┐
   Vinaya-piṭaka       Sutta-piṭaka       Abhidhamma-piṭaka
   (5 books)           (5 collections)    (7 books)
   ┌────┴────┐         ┌────┴───┬───┬───┬───┐
  Sutta-   Khan-       Dīgha  Majjh.  Saṃy.  Aṅgut.  Khuddaka (15)
  vibhanga dhaka                                  │
   ┌──┴──┐  ┌──┴──┐                              ┌─15 children─┐
  Mahā  Bhi.  Mahā  Cullavagga                  Khp Dhp Ud ...
  -vibh -vibh -vagga
```

Two-row layout: piṭaka level at the top, then collections/books, then
the leaves of each branch (with Khuddaka requiring a third row for
its 15 sub-books).

Pannyavaro draws it left-to-right because it's printed. We're on
screen; the user's preference is **vertical top-down**, which is also
the more natural layout for a column-shaped viewport (sidebar or
left-rail panel) and scales gracefully down to narrow screens by
letting branches stack.

---

## Where to put it

Two real options to think through, no decision yet:

**Option A — replace the sidebar's "Corpus" section.**
The diagram lives in the left rail. Becomes the primary corpus
navigation. Loses the indented-tree-in-main-panel pattern that Browse
view currently uses (the multi-column drill-down). Pro: one nav
metaphor across the app. Con: the diagram has to fit in 260 px wide
or the layout gets weird; Khuddaka's 15 leaves are hard to render
vertically in a narrow column.

**Option B — primary nav stays as is; new dedicated "Canon Map"
view.**
A full-page top-level page (new tab next to Browse / Search / Compare
/ Dictionary) that renders the diagram large, click-to-drill. The
sidebar gets a much smaller hierarchical tree for daily nav (the
indented version I described before).
Pro: diagram has room to breathe; sidebar stays predictable.
Con: two nav surfaces; user has to remember where things are.

**Option C — hybrid.**
Diagram lives in the sidebar in a compact form (clusters collapse so
only the active branch expands). Has its own internal scroll for the
Khuddaka case. May feel cramped.

Don't pre-commit. Build whichever feels right after a quick spike on
the diagram itself, then decide where it belongs.

---

## Technical sketch — render approaches

Rough mental ladder from cheapest to most polished. Don't aim for the
top initially; pick the lowest tier that produces a working diagram,
ship, see if it's enough.

1. **CSS Grid with explicit connector pseudo-elements.** Each node is
   a `<button>` in a grid cell; horizontal connectors are
   `::before` lines, vertical drops are flex children of intermediate
   container divs. Responsive. No SVG. Limits: precise diagonal lines
   are awkward, but the canon tree is purely orthogonal so this is fine.
2. **Inline SVG, hand-positioned.** Each node is a `<rect>` or `<g>`
   at fixed coordinates; lines are `<line>` elements. Pixel-precise
   match to Pannyavaro's diagram if that matters. Doesn't scale to
   different screen widths automatically — needs `viewBox` + media
   queries. Best for the "Canon Map" dedicated-view scenario, weaker
   for sidebar.
3. **Hybrid: CSS layout, SVG decorations.** Grid does the positioning;
   SVG overlays draw the connecting lines. Most flexible, most code.

Recommend starting at tier 1, only escalate if it looks bad.

---

## Data we already have

```sql
-- Hierarchy already in works
SELECT slug, parent_slug, name, subtitle, display_order
FROM works
ORDER BY display_order, slug;

-- Passage counts at each leaf
SELECT work_slug, COUNT(*) FROM passages GROUP BY work_slug;

-- Translation presence — what the filter needs
SELECT DISTINCT passage_id FROM translations;
```

`useCorpus()` already calls `/api/corpus` which returns the full
hierarchy. The tree component should consume that as-is, no new
endpoint needed.

For the translation filter, the cleanest path is a derived `Set` of
passage_ids on the client, built from a small `/api/corpus/coverage`
endpoint that returns `{ work_slug: { total, with_translation } }` —
then each tree node knows its coverage at render time and can dim or
hide leaves with zero translations.

---

## What "experimental" actually means here

The user is explicit: ship small, react, iterate. So:

- Don't write the diagram component in isolation — get it in the page
  first with placeholder nodes, see how it sits next to the existing
  UI, then fill in real data.
- Don't theme it perfectly before showing — match `var(--bc-*)`
  tokens but skip animations / micro-interactions in v1.
- Skip mobile/narrow-screen optimization in v1. Note the breakpoints
  where it falls over and we'll come back.
- The "Translated only" toggle is *small* — it's a `Set` lookup. Ship
  it as soon as the tree component can take filter props.
- Phase 6 (Library tab) of TIER_ATI lives above this work. Adding a
  third top-level tab once Library content lands is mechanical;
  designing for "three tabs" now doesn't help, design for "tabs
  pluralized" instead.

---

## Open questions for the experiment

Answer these by trying, not by debating:

1. **Does the diagram work in 260px?** If yes, sidebar wins. If no,
   it goes to a dedicated view.
2. **Should each leaf show a count, a coverage bar, or nothing?**
   Test all three in a sketch and pick.
3. **Does collapsing inactive branches help or hurt?** Pannyavaro
   shows everything; that's static print. We're interactive; maybe
   show the path the user's drilling into and stub the rest.
4. **Color/weight to convey state?** Active branch dimmed siblings?
   Or just dim everything and brighten on hover? Try both.
5. **Where does the "Translated only" toggle go?** Above the diagram?
   In a corner of each node? In a separate filter row? Try once,
   move it if it doesn't feel right.

---

## Don't do (anti-scope)

- A full pan/zoom canvas. Overkill for a tree this size.
- Animated tree transitions. Cool for a demo, distracting in use.
- Drag-to-rearrange nodes. Pannyavaro's structure is canonical.
- Search inside the tree. The existing top-level Search view is for
  search; this is for navigation.

---

## Standing project rules (don't violate)

- Inline styles only, `var(--bc-*)` tokens. No Tailwind.
- Academic typesetting. Serif body, small-caps section labels, thin
  gold rules. The diagram should fit that aesthetic.
- No analytics / telemetry.
- Quiet, scholarly tone. Pannyavaro's diagram has gravitas; preserve it.
