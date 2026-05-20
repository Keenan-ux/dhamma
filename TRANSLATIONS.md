# Translations roadmap and licensing audit

Companion to [DICTIONARIES.md](DICTIONARIES.md). Tracks the
multi-translator translation layer (`translations` table — Sujato +
ATI + future sources) and the licensing situation for translators
we'd like to add but can't yet.

---

## Currently live in prod

| Source | Translator | Rows | Licence |
|---|---|---|---|
| SuttaCentral | Bhikkhu Sujato | 5,113 | CC0 |
| ATI offline edition | Thanissaro Bhikkhu | ~600 | CC BY-NC 4.0 |
| ATI offline edition | Maurice Walshe | ~50 | CC BY-NC 4.0 |
| ATI offline edition | Bhikkhu Bodhi (extracts) | 13 | CC BY-NC 4.0 |
| ATI offline edition | Nāṇamoli + Bodhi (MN extracts) | 3 | CC BY-NC 4.0 |
| ATI offline edition | Nyanaponika, Ireland, Olendzki, Piyadassi, Ñāṇamoli, Soma, Buddharakkhita, Uppalavaṇṇā, Harvey, et al. | ~470 (combined) | CC BY-NC 4.0 |

Plus 56 articles by Bhikkhu Bodhi in the Library (`articles` table,
also CC BY-NC 4.0 via ATI) — these are essays, not sutta translations.

Verify counts with:

```bash
DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
  psql -c "SELECT translator, source, license, COUNT(*) AS n FROM translations GROUP BY 1,2,3 ORDER BY n DESC"
```

---

## Bhikkhu Bodhi commentary translations — blocked

(Item 11 in the HANDOFF backlog as of this session.)

Bodhi has translated substantial portions of the Pāli Aṭṭhakathā,
mostly published by BPS or Wisdom Publications. Lifting our 2.3 %
commentary translation coverage with his work would be valuable.
Here's what's actually licensable.

### What we already have

Bodhi's 13 sutta translations + 3 Ñāṇamoli-Bodhi MN extracts came
to us via ATI's offline edition, all CC BY-NC 4.0. The 56 Bodhi
essays in the Library came the same way — most of the BPS Essays
series, several Wheel and Bodhi Leaves publications.

### What's on bps.lk but **not redistributable in structured form**

Most of Bodhi's commentary translation books are free PDFs on
bps.lk's online library:

- *The All-Embracing Net of Views* (Brahmajāla Sutta + commentaries) — BP209S
- *The Discourse on the Root of Existence* (Mūlapariyāya Sutta + cy.) — BP210S
- *The Discourse on the Fruits of Recluseship* (Sāmaññaphala Sutta + cy.) — BP211S
- *The Great Discourse on Causation* (Mahānidāna Sutta + cy.) — BP212S
- *Transcendental Dependent Arising* (Upanisā Sutta + cy.) — Wheel 277
  *(already in our Library as an article)*
- *Nourishing the Roots* — Wheel 259 *(already in our Library)*

BPS's published terms on these (per public statements and the
notice in BPS PDFs) read in substance: "the work may be freely
copied and redistributed electronically, provided that the file
contents (including this Agreement) are not altered in any way and
that it is distributed at no cost to the recipient."

The "not altered in any way" clause means we **can't extract
commentary passages out of the PDF and store them as structured
rows in `translations` or `passages`**, even with full attribution
and the link back to bps.lk. The licence is for whole-file
redistribution only.

### What's on Wisdom Publications — **commercially copyrighted**

- *In the Buddha's Words* (2005) — anthology with translator notes
- *The Long Discourses of the Buddha* (Walshe; not Bodhi)
- *The Middle Length Discourses of the Buddha* (Ñāṇamoli/Bodhi 1995)
- *The Connected Discourses of the Buddha* (Bodhi 2000)
- *The Numerical Discourses of the Buddha* (Bodhi 2012)

These are for-sale Wisdom products. No path without a licensing
arrangement Wisdom is unlikely to offer for free.

### Path forward

Reach out to **BPS directly** (`cnt@bps.lk`) and ask for explicit
CC BY-NC permission on the specific commentary-translation books
listed above, for dhamma.fly.dev's scholarly non-commercial mirror.
Lead with the fact that ATI's offline edition already gave us 56
of Bodhi's BPS-published essays under CC BY-NC 4.0 — the precedent
exists at BPS for that licence on Bodhi's work. Frame it as
extending that licence to the commentary translations.

Don't ingest from bps.lk in the meantime. The "no alteration"
terms genuinely don't admit structured extraction.

A draft letter would look much like `ATI_EMAIL_DRAFT.md` — short,
personal, one ask, no enumerated consult list. See the
`feedback-tone-no-marketing` memory note.

---

## Other translator gaps worth tracking

- **Bhikkhu Anālayo** — substantial comparative-translation work
  (especially on Madhyama-Āgama parallels); some open under CC BY-NC
  via Hamburg Numata Center, some not. Worth a separate audit when
  Chinese parallels land in the corpus.
- **Andrew Olendzki, Gil Fronsdal** — Dhammapada translations
  partially free. Olendzki's are already in ATI; Fronsdal's are
  Shambhala-published.
- **Patrick Kearney, Leigh Brasington** — modern teacher translations
  of selected suttas, usually personal-licence but sometimes CC.
  Long-tail; pursue if and when a translator-curated set is
  prioritised.
