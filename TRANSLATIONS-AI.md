# Auditable Translation — Design

*Supersedes the former `TRANSLATIONS-AI.md` placeholder (the "opt-in
✨ Synthesize button" / "machine-drafted reading aid" sketch). That
framing is obsolete. This is the core of where the translation work is
actually going.*

Status: design / pre-prototype. Last worked: 2026-06-06.

---

## The thesis

A translation is not a *claim* ("this is what the text says"). It is a
*proof* ("here is each decision, and here is the evidence under it").
The product is a translation that is **auditable down to the token** —
every rendering traces to a primary source, and every place where the
source underdetermines the target is **exposed, not silently resolved**.

We are not trying to recover "the meaning." Meaning in the strong sense
— precisely what the author said *and meant* — is unrecoverable, and the
canon says so about itself (*neyyattha* vs *nītattha*; the Buddha's
refusal to fix one liturgical language, *sakāya niruttiyā buddhavacanaṃ
pariyāpuṇituṃ*, Vin Cūḷavagga). What is recoverable, and what we build,
is the **decision surface**: the choice-points, the live options at each,
the evidence beneath each, and which option was committed, by whom, and
why.

The irreducible work of translation is judgment, not lookup. The lexical
layer is automatable; the judgment layer is where a translation is
actually made. So the system's job is not to *make* the judgments but to
**stage** them — surface them, arm them with evidence, and record the
human commitment.

## The product decision: primary-evidence translation, translation-blind

The deliverable is a **self-standing auditable translation grounded only
in primary evidence** (dictionaries, commentary, parallels, grammar). It
does not cite, depend on, or defer to any existing human translation.

The governing rule:

> **Human translations may be a *detector*, never a *warrant*.**

- A **warrant** is what *licenses* a rendering — what makes "longhouse"
  defensible. Warrants must be **primary**: a DPD sense, a commentary
  gloss, a parallel, a grammatical fact. The moment "Sujato also said
  this" functions as a warrant, the audit breaks — an un-audited
  judgment has entered as if it were evidence. The chain must bottom out
  in primary data, not in another translator's opinion.
- A **detector** is what *flags where a decision exists* — it points, it
  does not justify. Translator divergence is an excellent detector and
  **disposable scaffolding**: used to improve recall, quarantined from
  the warrant layer, logged as `flagged_by`, never `warranted_by`.

A second, *separable* artifact falls out for free: a **disagreement
atlas** mapping where existing translators split and on what kind of
choice. For comparative-Buddhist-studies researchers that is publishable
scholarship on its own — but it only ever *describes* human disagreement;
the translation never *consumes* it. The firewall keeps the two distinct.

## The unit: the decision, made first-class

Most translation tools store sentences. Here the first-class object is
the **choice-point** — a span where defensible renderings diverge in
*commitment*, not in style.

```
choice_point   { id, segment_id, span, lemma, type, status }
option         { id, choice_point_id, rendering, commitment_type,
                 evidence_refs[], rationale, generated_by }
commitment     { choice_point_id, chosen_option, committed_by,
                 rationale, ts, supersedes }
```

- `type` — lexical-sense / register / domestication-vs-foreignization /
  syntactic / text-critical-variant / doctrinal.
- `evidence_refs` — point at real rows: DPD senses, a commentary
  passage, a parallel id, a concordance query. This is the apparatus,
  but live and queryable rather than frozen in a footnote.

---

## The pipeline, in layers

The split maps onto the "finance lesson": pin and verify the layer that
*can* be pinned; expose (never auto-resolve) the layer that can't. The
ratio is inverted vs. financial prose — there the verified atoms
dominate and the prose is subordinate; in scripture the words are the
easy part and the *meaning* is the whole game — so near-determinism is
reachable for the scaffold and structurally impossible for the product.
That is by design, not a defect.

### 1. Pinnable layer — automate fully, lock it (the "verified numbers")

Segment-align (we have `segments` / `passage_sentences`), then gloss
every token to DPD with inflection resolution and a morph parse
(lemma, case, number, root). Checkable and near-deterministic. This is
literally the backlog's "interlinear gloss." It is **not the product**
— it is the scaffold the product hangs on.

### 2. Detection — find the choice-points without hand-marking 190k passages

The scale unlock. Every input already exists in the corpus:

- **Translator divergence (primary detector, disposable).** Sujato +
  ~15 ATI translators, alignable. Where aligned translations disagree,
  that disagreement *is* an empirically-surfaced choice-point. Don't
  theorize where the decisions are — mine them from where humans already
  split. One join away. (Detector only — never a warrant; see firewall.)
- **DPD multi-sense.** Tokens where the dictionary lists genuinely
  distinct senses.
- **Commentary presence.** Where the aṭṭhakathā/ṭīkā *glosses* a term,
  the tradition is telling you "this needed deciding" (the
  commentary-jump already finds it — *vedehiputta* is the canonical
  example: Buddhaghosa reads *vedehī* as *paṇḍitā*, "wise woman," not
  "the Videha lady").
- **Parallel/recension variance.** The 30,741 parallels are the
  text-critical detector — the "said" margin.

The primary-evidence detectors (DPD, commentary, parallels) find
choice-points with **zero reference to any human translation**. The
whole system can be built translation-blind; divergence-mining is an
optional recall booster on top.

### 3. LLM role — stage the judgment, never close it

The model does **not** emit the final translation. It:

- **(a)** drafts each option's rationale *from the linked evidence*
  under verified-extraction discipline — every gloss must resolve to a
  real row, no un-sourced sense admitted (exactly the finance protocol);
- **(b)** generates the case for each option **separately and
  adversarially** — the brief *for* "palace" and the brief *for*
  "longhouse" as opposing arguments — so the system exposes the tension
  instead of picking.

Here the model's non-determinism flips from bug to instrument: sample it
N times and the variance map *is* a heat-map of the soft choice-points.

### 4. Commitment — where accountability lives

A human commits each choice; the record carries who / when / why +
evidence links + a stable id. Then the consistency win humans cannot
achieve: propagate a committed lemma-level choice as the **default**
across all 190k passages — but **flagged and revisable, never silently
baked**. That is the difference between a monoculture and an owned
default: the choice is *visible and revisable*, not invisible orthodoxy.

### 5. Reader surface — the workbench

Default view reads as clean prose (commitments applied). Every
choice-point is a quiet affordance; open it and you get the
alternatives, the evidence, the adversarial briefs, the committer. The
margin, rendered in the margin.

---

## The honest hard parts

- **Granularity is the real enemy.** Everything is a choice at *some*
  altitude; surface them all and it's unreadable noise. You need a
  threshold that fires only when the commitment-type actually differs,
  not on stylistic micro-variation. This is the tuning problem the whole
  thing lives or dies on.
- **Divergence-mining has a blind spot.** When all translators copy each
  other, or are wrong the same way, they won't diverge and the detector
  stays silent on a real choice-point. You need a "no one split here, but
  the DPD/commentary says they should have" critic pass to catch herd
  consensus.
- **The "said" and "meant" margins want different UI.** Text-critical
  variants (said) can be largely auto-resolved with an apparatus;
  hermeneutic choices (meant) must **never** auto-resolve. Don't let one
  mechanism handle both.

---

## What already exists (the inputs are shipped)

| Need | Already in the corpus |
|---|---|
| Alignment substrate | `segments`, `passage_sentences` (507,777 mula sentences) |
| Lexical warrants | DPD 88,933 headwords + 727,678 inflections; PED; CPED; DPPN; MW + BHS |
| Divergence detector | Sujato (5,113) + ~15 ATI translators (1,139) |
| Doctrinal detector | sutta→commentary jump (`/api/passage/:id/commentary`) |
| Text-critical detector | 30,741 SuttaCentral parallels |
| Usage evidence | concordance / KWIC (`/concordance/<term>`) |
| Curated equivalence | `aliases` table (scholar-asserted overlay) |

The missing piece is the one layer that treats the *decision* as the
object and mines the above to populate it. The palace/longhouse and
sabbath/uposatha analyses (2026-06-06 session) were a manual run of that
layer on a handful of tokens.

---

## Worked examples (hand-labeled gold set, DN 2 opening)

Surfaced by hand in the 2026-06-06 session; these serve as the eval
target — an automated detector should rediscover them.

- **pāsāda** → "palace" (DPD: mansion / palace / pillared building) vs
  Sujato's "longhouse" (register / material-vs-rank; *not* in any
  dictionary — an interpretive bet). Type: register / domestication.
- **uposatha** → "sabbath" (domestication, imports the weekly
  Judeo-Christian frame) vs "uposatha day" / "observance day"
  (foreignizing, keeps the lunar technical term). Type: domestication.
- **payirupāsati** → "wait upon / attend" (DPD: sits at the feet of,
  attends closely) vs "pay homage" (overstates; homage is the territory
  of *vandati / namassati / pūjeti*). Type: lexical-sense.
- **gaṇa** in *saṅghī … gaṇī* → "company / following" vs "community"
  (contrast-preservation against *saṅgha* = "order"). Type: lexical-sense.
- **vedehiputta** → "son of the Videhan lady" vs Buddhaghosa's "son of
  the wise woman" (*vedehī = paṇḍitā*). Type: doctrinal / commentarial.

---

## Prototype plan

Validate the **riskiest assumption first**: that choice-points can be
detected automatically at the *right granularity*. If detection fails,
nothing downstream matters — so build the detector before the commitment
DB or the reader UI. We have a free gold set (the worked examples above)
to measure against.

A single vertical slice, one passage (DN 2 opening, ~10 segments):

1. **Detection PoC.** Align the existing translations we hold for that
   passage at segment level and diff them → choice-points from
   divergence. On the *same* spans, run the primary-evidence detectors
   (DPD multi-sense, commentary presence, parallel variance). Compare:
   do they agree? complement?
2. **Eval against the gold set.** Did the detectors rediscover
   pāsāda / uposatha / payirupāsati / gaṇa / vedehiputta — and at the
   right granularity (no flood of stylistic noise)? Precision/recall vs.
   the hand-labels is the go/no-go signal.
3. **Staging PoC.** For 2–3 surfaced choice-points, have the LLM draft
   the adversarial briefs *from linked primary evidence only*, under
   verified-extraction discipline (every gloss resolves to a real row).
   Check the "no un-sourced sense" constraint holds.
4. **Persist.** Write `choice_point` / `option` / `commitment` for the
   one passage (JSON or a tiny table). Confirm the schema is expressive
   enough.
5. **Reader-surface sketch.** Minimal render — prose with committed
   choices, each choice-point a hover/click revealing options + evidence.
   Throwaway, just to test the workbench UX.

Build order is steps 1–2 first, alone. Detection at the right
granularity is the whole bet; prove it before building anything else.
