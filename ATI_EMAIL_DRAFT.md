# Draft email to Access to Insight / Barre Center for Buddhist Studies

Send once the Library is polished — particularly the curated indexes
(passage-tags) and Library Meaning-mode search.

---

**To:** info@bcbs.org (Barre Center for Buddhist Studies — current ATI maintainers)
**Cc:** John Bullitt, if locatable (original ATI editor)
**Subject:** A respectful mirror of Access to Insight at dhamma.fly.dev

Dear BCBS,

I'm writing as a long-time reader of Access to Insight, and as someone
who's been quietly distressed by the project's slowing maintenance and
the prospect that decades of careful scholarly work might thin out
over time.

I've built a small open-source scholarly tool — **Dhamma Data** — at
<https://dhamma.fly.dev/>. It started as a hybrid FTS + vector search
across the Pali canon (SuttaCentral Tipiṭaka, VRI / CST commentary +
sub-commentary, three Pali dictionaries). Over the past few months it
has grown into something I hope you'll find sympathetic:

- Multi-translator coverage for every passage that has one. Sujato
  (SuttaCentral) is paired with **1,139 translations from ATI's
  offline edition**: Thanissaro, Walshe, Ireland, Olendzki, Nyanaponika,
  Bodhi, Piyadassi, Ñāṇamoli, Soma, Buddharakkhita, Sister Uppalavaṇṇā,
  Harvey, and others. Each rendering is shown with its copyright
  notice, license restatement (CC BY-NC 4.0), and a link back to the
  original page on accesstoinsight.org.

- A **Library** tab dedicated to ATI's secondary content — the 17 study
  guides (Wings to Awakening, Mind Like Fire Unbound, the Four Noble
  Truths, etc.), 277 author essays (across ~80 authors), the 73-essay
  Thai forest tradition collection, the Path to Freedom study program,
  the supplementary glossary, and the curated indexes. **386 articles
  in total.** Each carries ATI's required attribution.

- SuttaCentral's parallels.json ingested, so each passage's reader
  view shows direct parallels, mentions, and retells — including the
  Sanskrit/Chinese/Gāndhārī cross-tradition links.

- A scholarly UI: typeset frontmatter, no marketing copy, no
  AI-generated summaries, no analytics or telemetry. Selection-popover
  dictionary lookup against DPD (88K headwords + 727K inflections),
  DPPN proper names, and the PTS PED. Per-passage bookmarks (local
  only). Citation export. In-passage find.

I am explicitly committed to honoring the CC BY-NC 4.0 terms — the
tool will never carry ads, paywalls, or commercial features. If ATI's
license terms ever need clarification, or if you'd like attribution
to read differently, please let me know and I'll adjust.

I am also explicitly committed to giving credit where credit is due.
ATI made a generation of Pali scholarship freely accessible online when
no one else was doing it, and that work deserves to be preserved and
made discoverable to the next generation of practitioners and scholars.

A few things I'd love your input on, if you have the bandwidth:

1. **Anything you'd like me to handle differently** in attribution or
   presentation. The current footer on each ATI-sourced page reads
   `© {year} {author} · CC BY-NC 4.0 · accesstoinsight.org` with a
   link back to the source page. Happy to revise.

2. **The translator slugs.** I expanded ATI's 4-letter slugs (`than`,
   `nypo`) to readable full names (`thanissaro`, `nyanaponika`). If
   there's a translator I've miscategorized or misnamed, that's an
   easy fix.

3. **Possible coordination.** If BCBS would like the dhamma.fly.dev
   mirror to be referenced from accesstoinsight.org (or vice versa),
   I'm open to that — both technically and editorially. Conversely
   if you'd rather it stay independent, that's also fine.

4. **Sustainability.** ATI's README notes ATI is winding down due to
   traditional-hosting cost and maintainer attrition. dhamma.fly.dev
   runs on Fly.io's $5/month tier and is git-versioned; if ever there's
   a need to hand off operational responsibility, the code is open and
   the data is just an SQL dump.

With deep respect for the work ATI has done, and gratitude for the
license that made re-presentation possible.

— [Your name]

---

## Pre-send checklist

- [ ] Library Meaning-mode embeddings populated (so search across
      Library articles works semantically, not just by token)
- [ ] Curated indexes (similes / names / subjects / titles) ingested
      as `passage_tags` with a tag-filter UI in Browse — currently
      only the index essays themselves are in the Library; the
      structured tag-passage mapping is the high-value piece
- [ ] All 7 index files ingest successfully (only 1 of 7 made it
      through the current ingest's body-length filter)
- [ ] Spot-check a few translator attributions against the original
      ATI pages — copyright year, name spelling, license
- [ ] Hard-refresh on a fresh device to confirm CC BY-NC 4.0 footer
      renders on every ATI passage and every Library article
