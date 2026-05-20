# Contributing to Dhamma Data

Thanks for taking a look. This document is short — there's not much
to learn before you can be useful, and most of what isn't here lives
in `HACKING.md`.

## What's welcome

- **Corrections.** Typos in translations, misattributed translators,
  broken citation links, wrong Pali diacritics, mis-tagged passages.
  These are easy to merge and immediately useful.
- **Ingest contributions** for sources we don't yet cover. The
  current pattern lives in `scripts/ingest/`; the existing scripts
  (`ingest.mjs` for SuttaCentral, `ingest-cst.mjs` for VRI/CST,
  `ingest-ati-*.mjs` for ATI) are the templates. If you have a
  digitised text under a compatible licence, open an issue first to
  agree on schema mapping.
- **New dictionaries.** `DICTIONARIES.md` lists the roadmap (CPD,
  Buddhadatta) and the pattern that DPPN/PED/MW/BHS already follow.
- **Bug reports** with steps to reproduce against
  [dhamma.fly.dev](https://dhamma.fly.dev/) or a local checkout.
- **Scholarly feedback** — if you notice a translator's name
  spelled wrong, an attribution missing the year, a piṭaka
  misclassified, a parallel that should be linked but isn't, please
  say so. Issues are fine; PRs are better.

## What's out of scope

- **Analytics, telemetry, geolocation, advertising.** None of these
  belong in the tool, and PRs that add them won't merge.
- **AI summary as a default.** A future opt-in "Synthesize" button
  over curated passages is fine if it's clearly labelled
  AI-generated and off by default. AI-generated translations,
  AI-rewritten passages, or AI commentary in the reading flow are
  not.
- **Commercial features.** The corpus mixes sources under CC BY-NC
  3.0, CC BY-NC 4.0, and CC BY-NC-SA 4.0. Non-commercial is a
  binding constraint.
- **Marketing copy** anywhere in the UI. The register is academic —
  see `CLAUDE.md`.

## Dev setup

You'll need Node 20+ and a Postgres 16 + pgvector instance. The
README has the short version of `npm install && npm run dev`.
`HACKING.md` covers the endpoint surface and the ingest pipeline.

The corpus isn't in the repo. To work against real data, either
point your local server at the production Fly Postgres via the
proxy (read-only is safest — `flyctl proxy 15432 --app dhamma-pg`)
or run a local Postgres and walk through the ingest scripts in
order: SuttaCentral first, then DPD, then the various commentaries.
Expect that to take an afternoon.

## House style

- **No Tailwind.** Inline styles using `var(--bc-*)` theme tokens.
- **Don't hardcode hex colours.** All colour comes from `theme.css`.
- **Serif (Noto Serif) for body text. Outfit for chrome.** Small
  caps for section labels.
- **Pin embedding model + DB versions.** BGE-M3 vectors only work
  against BGE-M3 vectors; switching models means re-embedding the
  whole corpus.
- **Attribute every translation.** Translator name, copyright year,
  licence, source URL. Footer-rendered on every reading view.

## Licensing

Code in this repository is MIT-licensed. By submitting a PR you
agree to release your contribution under the same licence.

Corpus data carries the licence of its original source; if your
contribution adds a new corpus, please include the attribution
metadata (translator, year, licence, source URL) at the column
level in the ingest, not at the page level. The README has the
list of current sources.

## Communication

Open an issue first for anything larger than a small fix. The
maintainers (`@Keenan-ux`) read GitHub. If you're a maintainer of
one of the upstream projects (SuttaCentral, ATI/BCBS, VRI, the
Cologne lexica) and you'd like attribution displayed differently
or content removed, please contact us and it'll be done.
