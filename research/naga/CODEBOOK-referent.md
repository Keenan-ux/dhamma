# Codebook — the nāga referent gate (canon / mula coding)

You are a blind coder on a Pāli-corpus study. Each input record is one canonical (mula) passage row
containing a `nāg`-family token, with a context `window` (verbatim Pāli) and the `tokens` found. Decide
what the `nāga` token **refers to** in that passage, by the sense of the word IN CONTEXT — not by the
word alone. Code from the window; do not guess beyond it.

## Field 1 — `referent` (required, exactly one)

- `serpent` — the **serpent-being / nāga as a class of being**: nāga-kings (nāgarāja), nāga-maidens
  (nāgakaññā), the nāga realm/world (nāgabhavana, nāgaloka), the four nāgayoni, a nāga in water / with a
  hood (phaṇa) / coils (bhoga) / shedding skin, a nāga that takes human form, Mucalinda, Bhūridatta /
  Campeyya / Saṅkhapāla as nāga, a nāga in a list of beings (devas, yakkhas, gandhabbas, **nāgas**,
  supaṇṇas). THIS is the study target.
- `elephant` — *nāga* = the noble **bull-elephant**: `rañño nāgo` (the royal elephant), elephant similes
  for a great monk (AN 4.114 Nāgasutta, the tusker with four/eight qualities), `hatthināga`,
  `nāganāsūru` ("elephant-trunk thighs"), an elephant in a battle/forest scene, `nāgavanika`
  (elephant-hunter). Cue words nearby: hatthi, kuñjara, mātaṅga, gaja, danta (tusk), soṇḍā (trunk).
- `epithet` — *nāga* as an **honorific of a person** (the Buddha / an arahant / a great sage): the folk
  etymology *na + āgu* "one who does no wrong"; often `mahānāga`, or "the nāga" said of a human teacher,
  or in praise verses. If the passage *puns* on serpent/elephant/sinless-one applied to a human, code
  `epithet` and set `polysemy=true`.
- `tree` — *nāga* = the **ironwood tree** (Mesua ferrea) or betel (`nāgalatā`), or `punnāga`
  (Calophyllum), in a list of flowers/trees/scents.
- `person` — a **human proper name** built on nāga-: Nāgasena (the Milinda monk), Nāgita, Nāgasamāla,
  Nāgadatta, an elder named Nāga, etc.
- `citizen` — *nāgara / nāgarika* = "of the city, urban, citizen"; the place/clan name Aṭṭhaka-nāgara
  (the householder Dasama of Aṭṭhakanagara), or a town name containing the string (e.g. Venāgapura).
- `nonlexical` — the string is **not the nāga morpheme at all**: a morphological false friend that
  slipped the filter — *anāghāta* (non-anger), *anāgantā* (not-coming), *samannāgata*, *anāgāmī*
  (non-returner), or any case where `nāg` is an artefact of sandhi/prefix, not the word "nāga".
- `ambiguous` — a genuine nāga token but the window truly cannot fix serpent vs elephant vs epithet.
  Use sparingly; prefer a decision.

## Field 2 — `claim_bearing` (only if `referent=serpent`; else `false`)

`true` if the passage **says something about what a nāga IS or its religious/soteriological status** —
its birth, realm, lifespan, powers, the karma that makes one, its keeping of uposatha, its hearing
Dhamma, its taking human form, its (in)capacity for the path, its being barred from ordination, the
bodhisatta being born as one. `false` if the nāga is a **passing mention** (a name in a list, a simile
vehicle, scenery) that asserts no ontological/soteriological proposition.

## Field 3 — `facet` (only if `claim_bearing=true`; else null)

One of: `birth_mode` · `classification` (animal/plane status) · `realm_habitat` · `lifespan` · `power`
(shapeshift / weather / venom / iddhi) · `karma_cause` · `diet_predation` · `uposatha` · `hears_dhamma`
· `takes_human_form` · `magga_phala_ceiling` · `ordination_bar` · `bodhisatta_as_naga`.

## Field 4 — `claim` (only if claim_bearing) — one short English line of what it asserts. Field 5 — `note` (optional, any flag, e.g. polysemy, uncertainty, a cross-reference).

## Output

Write a JSON array to the output path you are given. One object per input row, same order:
`{"id":..., "referent":..., "claim_bearing":bool, "facet":null|"...", "claim":null|"...", "note":""}`.
Code every row. Return only a one-line summary (counts per referent) as your final message.
