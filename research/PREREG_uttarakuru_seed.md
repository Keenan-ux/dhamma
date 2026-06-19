# Pre-registration seed — The Uttarakuruka as a class of being in the Pāli tradition

> Status: **SEED** (operator-supplied question for `/dhamma-research`). Not yet a
> frozen pre-registration. Hand this file to a fresh chat, invoke the
> `dhamma-research` skill, and point it here; the skill produces the frozen
> prereg, the auditable dataset, and the paper.
>
> Scope decided interactively 2026-06-19, mirroring the nāga study
> ([PREREG_naga_seed.md](PREREG_naga_seed.md)): referent = **the people/continent
> of Uttarakuru**; rigor = **rigorous gated study** (Research tab, admin-private);
> breadth = **full picture** — all three analytical segments kept distinct,
> enumeration boundary fully inclusive.
>
> **Sibling framing.** Uttarakuru is the *inverted mirror* of the nāga. The nāga
> is blessed-but-barred **from below** (an animal nearly a deva, shut out of the
> path). The Uttarakuruka is blessed-but-barred **from above** (a human so
> effortlessly virtuous and long-lived he is nearly a deva — and that comfort is
> itself the bar). Same soteriological paradox, opposite pole. The two studies
> are designed to sharpen each other.

---

## Central question

What does the Pāli tradition hold the people of **Uttarakuru** *to be* — and why
are these the most materially and morally fortunate humans in the cosmos yet, by
the canon's own reckoning, *worse placed for awakening* than we are?

## Three analytical segments (kept distinct in the dataset, not blended)

- **§A — Granular ethnography (the spine).** What an Uttarakuruka *is*: the
  northern *mahādīpa* within the four-continent schema (Jambudīpa / Aparagoyāna /
  Pubbavideha / Uttarakuru); the **fixed 1,000-year lifespan**; spontaneous
  unploughed rice (*akaṭṭhapāka-sāli*); the wish-/cloth-tree (*kapparukkha*); the
  absence of ownership and possessiveness (*amama*, no *pariggaha*); the absence
  of fixed marriage / guarded women; the fixed post-mortem destiny (heaven-bound,
  *sugati-niyata*). The "just what are they" layer, at the finest granularity the
  corpus supports.
- **§B — The soteriological paradox.** The hinge is **AN 9.21**: humans of
  Jambudīpa surpass *both* Uttarakurukas *and* the Tāvatiṃsa devas in three
  things — courage (*sūra*), mindfulness (*sati*), and *that the holy life is
  lived here* (*idha brahmacariyavāso*). Uttarakuru has the fruits without the
  path: virtue that is karmically automatic, not won; no Buddhas arise there;
  comfort as anti-renunciation. Tie to the *aṭṭhakkhaṇā* (the inopportune births
  where the holy life cannot be lived).
- **§C — Canon → commentary divergence (the DOMINANT segment here).** Because the
  suttas barely sketch Uttarakuru, this segment carries the weight rather than
  serving as a check: show the Aṭṭhakathā / Ṭīkā / Visuddhimagga *building* the
  ethnography — lifespan, the rice, the *amama* customs, the climate — onto a
  thin canonical frame. (Contrast the nāga study, where SN 29 gives a canonical
  spine. Here the commentary IS the subject.)

## Enumeration boundary — inclusive (all confirmed in scoping)

- DN 32 (Āṭānāṭiya) — the northern quarter under Kuvera / Vessavaṇa
- AN 9.21 — the three-superiorities hinge (Jambudīpa > Uttarakuru + Tāvatiṃsa)
- The four-*mahādīpa* cosmological passages (the continent schema itself)
- The cakkavatti's conquest of the four continents (DN 17 / DN 26)
- Visuddhimagga cosmology (pli-vism + pli-vism-tika)
- Commentarial ethnographies — *akaṭṭhapāka*, *kapparukkha*, *amama* customs
  (pli-kn-attha, pli-dn-tika, pli-mn-tika, pli-vin-attha/tika)

## Critical method — sense disambiguation up front (MUST be in the frozen prereg)

A bare `uttarakuru` exact search returns only **15 rows**, and the concept also
hides under variants and the four-continent frame. Two gates:

1. **Separate three referents the term blurs:**
   - **Uttarakuru** — the northern *continent* (the study's target),
   - **Kuru** — the *janapada* in Jambudīpa (Kammāsadhamma; "Kurūsu viharati" —
     where Satipaṭṭhāna / MN 10 / DN 22 / MN 75 are taught),
   - ***kuru-vatta / kuru-dhamma*** — the moral observance of the Kurudhamma
     Jātaka.
   Report the exclusion counts. The first scoping hit (Ps-pṭ §928) already shows
   the commentary using "like Uttarakuru" as a *simile* for the Kuru country —
   exactly the slippage to control for.
2. **Search the four-continent frame** (*cattāro mahādīpā*, *catudīpa*,
   *cattāro dīpā*, the cakkavatti dominion) to catch concept-hits the bare term
   misses.

## Enumeration unit

Passage-row (mūla + per-paragraph commentary). Every citation must resolve to a
live corpus row. Canon-vs-commentary split tracked per row — and given the
corpus shape, the split is itself a headline finding (Uttarakuru is a
commentarial construction).

## Anchor texts surfaced during scoping (seed list, not exhaustive)

- `cst-s0201t.tik-mn1_1_p928` — "Uddesavārakathāvaṇṇanā" (Ps-pṭ 1 §928), the
  "like Uttarakuru" climate simile tying the continent to the Kuru country
- pli-dn (1 mūla hit) — the lone canonical solid-spelling occurrence
- Heavy commentary presence: pli-kn-attha, pli-dn-tika, pli-vism / pli-vism-tika,
  pli-an-tika, pli-vin-attha / pli-vin-tika, pli-mn-tika

## Corpus health at scoping time

`/api/dbcheck` → connected, postgres 16.14, pgvector true, passages 194,710.
Bare-term volume: 15 rows (vs nāga's 200+ capped) — thinner, commentary-dominated.
