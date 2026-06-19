# Uttarakuru v2 — Stage-A evidence dossier (input for the Stage-B sweep)

**Task.** Re-do the Uttarakuru study under the provenance-signature framework: code every load-bearing
claim with its full signature, fold in the Stage-A findings + the cosmology discussion below, and produce a
**more organized, more segmented** study (per-claim signature, a stratigraphy table organized by ascending
stratum, an epistemic-status column, an absence table, a cross-recension flag, a cosmology section). The
single canon-vs-commentary axis becomes one row of the signature, not the headline.

## Artifacts on disk (read these; do NOT query the database — the box is serial-only)
- `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md` — the framework (11 axes, triage, tiering, paper
  segmentation §6, the worked example §7). THIS is the method you apply.
- `public/research/uttarakuru.json` — the v1 dataset: 16 features (A1–C1) with verbatim Pāli + glosses +
  per-layer cells + h0h1, the 161-row census, the disambiguation, the context (Aggañña/akkhaṇa controls).
- `research/uttarakuru/EVIDENCE.md` — the verbatim evidence dossier, feature by feature.
- `research/uttarakuru/_census_v2.json` — the 161-row census with **I.1 chronological stratum** coded.
- `research/uttarakuru/RESEARCH-DESIGN.md` — the frozen prereg.

## The Stage-A findings (NEW since v1 — fold these in)

**Recall is complete.** The stem `%uttarakur%` catches all 47 distinct surface forms (incl. ṁ/ṃ variants,
long-ū `uttarakurūnaṁ/-su`, the `sineru…uttarakuru…himavanta` compound). No continent material hides under
periphrasis or "the northern dīpa". The 161-row census (mula 26 / attha 69 / tika 51 / anya 15) is
recall-certified. Search-depth ladder: exact-FTS 15 → short-u substring 144 → stem 161.

**I.1 Chronological stratum (the load-bearing re-split).** Coding stratum INDEPENDENTLY of structural layer:
of the **26 structurally-"canon" (mūla) rows, only 6 are genuinely early-canonical** — and those 6 are
exactly the bare-name-in-a-list uses (AN 9.21 comparison, AN 3.80 / AN 10.29 thousandfold-cosmology lists).
The other **20 disagree** (mūla layer, late stratum): DN 32 Āṭānāṭiya (late paritta), the Apadāna verse,
the Vinaya frame-narratives, Milinda (paracanon), Visuddhimagga (commentary-era). The literal-place reading
**deepens monotonically with lateness inside the canon**: bare name (early) → described place (DN 32,
late paritta) → visited place (Apadāna, Vinaya nidāna; the Buddha flies there for alms — late) → measured
place (commentary). The v1 headline ("commentary supplies the verdict") credited to "the commentary" a
materialization that **begins inside the late canon**. Re-split: **6 early-canonical (bare name) → 20
late/para/Abhidhamma/commentary-era (described+visited) → 124 commentary (measured)**.

**III.10 Structured absence (total, not partial).** Uttarakuru is absent from **every** rebirth-destiny /
opportunity frame in the canon, not just the divine eye: the 8-`akkhaṇa` list (AN 8.29 / DN 33) does not
name it; the gati scheme — 0; the Suddhāvāsa realms — 0; the "rare human birth" frame — 0; the divine-eye
formula (`dibbena cakkhunā … satte passāmi … sugate duggate`, 124 canonical attestations) verifies
rebirth-destiny and **never** the continents (the 5–8 co-occurrences are distance artifacts, 4,900–227,000
chars). The four-continent geography is a **separate** cosmology from the vertical rebirth-and-kamma
apparatus, and only the latter carries the verification + opportunity machinery. This is the strongest form
of the epistemic finding: the texts never present the continental geography as directly-verified knowledge,
and the whole rebirth apparatus structurally excludes it.

**I.4 Cross-recension (link-level, available now; feature-level pending Āgama ingest).** From the corpus's
`passage_parallels` table (4,420 Chinese `lzh` + 773 Sanskrit `san` + 148 Prakrit `pra` parallels):
- DN 27 (Aggañña, the golden-age rice the Uttarakuru ethnography recapitulates): parallels in the
  **Mahāvastu** (`san-lo-mvu32`), the **Mūlasarvāstivāda Vinaya** (`san-mu-kd17`), **Chinese** (`t10`),
  Sanskrit fragment (`sf277`) → the ethnographic template is **pre-sectarian bedrock**.
- DN 32 (Āṭānāṭiya, the descriptive paritta): **Chinese parallel** (`t1245`) → multi-recensional.
- AN 9.21 (Tiṭhānasutta, the three-superiorities soteriological hinge): **no non-Pāli parallel** (only a
  Pāli "mentions") → the load-bearing soteriological claim looks **Pāli-local**. HONESTY GUARD: "no linked
  parallel" ≠ "Theravāda-invented" (could be lost/unlinked); code `cross-recensional-status: unconfirmed /
  pali-local-pending-verification`, not `original`.
- So the split is clean: the ethnographic **template** is pan-Buddhist; the specific soteriological
  **verdict** is (so far) Pāli-only.

## The cosmology / plane material (from the operator discussion — fold into a cosmology section)
- The four mahādīpa (Jambudīpa S, Pubbavideha E, Aparagoyāna W, **Uttarakuru N**) sit in the great ocean
  around Mt Sineru = **one world-system (cakkavāḷa / lokadhātu)**. Uttarakuru is the **same human plane**
  (manussa-loka) as us — its people are `manussā` (AN 9.21) — a different **continent**, not a different
  realm. Horizontal (continent), not vertical (plane).
- It is **ocean-separated and reached only by iddhi**: the Buddha/Moggallāna fly there (Vinaya), Milinda
  asks "with this very body?" (yes, by psychic mastery), the cakkavatti's wheel-treasure "plunges into the
  ocean and emerges" (DN 17). Not ordinarily walkable.
- The `samudda` between continents is **salt water** (the one-taste-of-salt simile, Vin Kd 19; `ogāhati` =
  plunge into; etymology saṃ+udaka = gathered waters). NOT "ocean of space." The tradition's actual
  empty-dark-space concept is the **`lokantarikā aghā`** — the unenclosed dark voids **between
  world-systems** where sun and moon do not reach (DN 14, MN 3, SN, AN 4.127, the birth-marvels), a
  DIFFERENT word for a DIFFERENT gap.
- The cosmology has a **nested macro-structure** (AN 3.80 Cūḷanikā): the base unit = one sun-and-moon's
  reach (a cakkavāḷa); a thousand = `sahassī cūḷanikā lokadhātu` (Sujato renders "galaxy"); a thousand of
  those = millionfold; then billionfold — worlds nested by thousands, separated by dark voids. This
  macro-structure (plurality of worlds in dark space) is the part that anticipates modern cosmology; the
  LOCAL structure (Meru + flat shaped continents + one circling disc-sun + saltwater ocean) is the
  pre-scientific mythic-geographic core that does NOT map to a solar system.
- Scholarly frame (reception/I.6): the cosmology is inherited pan-Indian furniture (Mahābhārata/Vedic
  Uttarakuru; the Hyperborean parallel), functioning soteriologically (Gethin: a map of states; Collins:
  Pāli utopias as soteriological dead-ends), and the canon itself never stakes its truth-claim on
  cosmography (the avyākata deflections; the poison-arrow simile; "I teach only suffering and its
  cessation"). The literal travel is real in the texts (bodily, brings back rice) but late-canonical,
  redactor-framed, and never epistemically-verified.

## v2 deliverable
A segmented study + updated dataset: per-claim provenance signatures; the stratigraphy table (ascending
stratum); the epistemic-status column; the absence table; the cross-recension flag; the cosmology section;
the corrected headline (a tiny early-canonical seed → a late-canonical materialization → a commentarial
measurement, never presented as verified knowledge, the ethnographic template pan-Buddhist but the
soteriological verdict Pāli-local). Process-free paper, the four editorial passes, every citation resolving.
