# Ronkin on sabhāva: aṭṭhakathā vs ṭīkā — primary-text verification (2026-06-25)

*Closes the open question DR-5 (`abhidhamma.md`) flagged: "Does Ronkin's 2005 primary text actually say
aṭṭhakathā or ṭīkā?" Resolved against the primary text. Internal doc.*

## Question
The sabhāva prereg (`research/sabhava-realist-drift-seam/_protocol.json`) and the shipped Commentarial
Register study inherited a framing that attributed to Noa Ronkin the claim that the realist "own-nature"
reading of *sabhāva* crystallizes at the **aṭṭhakathā** (commentary) boundary. DR-5 flagged (2 of 3
verifiers, medium confidence) that Ronkin's actual position is the **ṭīkā** (sub-commentary). This note
adjudicates against the primary text.

## Method
Six-agent adversarial verification (4 parallel source-gather Explore agents → 2 Opus adversarial verifiers,
no DB). Both verifiers reached the primary text itself (Early Buddhist Metaphysics, ch. 3 PDF; one used
pdftotext with printed page headers intact), plus Ronkin's own SEP "Abhidharma" article, her OCBS
Paṭisambhidāmagga article, and Wikipedia/secondary cross-checks.

## Verdict: ṭīkā-localization CONFIRMED, with a gradient nuance
Ronkin localizes the explicit **ontological** investment of *sabhāva* at the **ṭīkā**, not the aṭṭhakathā.
The decisive sentence is **Early Buddhist Metaphysics, ch. 3 (§3.2.2 "The concept of sabhāva in the
Aṭṭhakathā"), p. 118**:

> "While Buddhaghosa equates dhamma with sabhāva in its sense of 'own-nature', which does not necessarily
> have an ontological significance, the Mahāṭīkā invests this equation with ontology. Sabhāva is now not
> only an epistemological determinant of a dhamma's distinct nature, but also attests to the dhamma's real
> existence; it is an ontological determinant and may accordingly be rendered as individual essence at the
> level of ontology."

So: Buddhaghosa's **aṭṭhakathā** uses *sabhāva* as own-nature *without necessary ontological force*
(individuating, epistemological); the **ṭīkā / Mahāṭīkā** invests it with ontology (the term comes to attest
a dhamma's real existence).

**Nuance (a staged gradient, not a clean binary).** Ronkin treats the hardening as having "several distinct
stages." One incipient ontological reading sits already in a **sixth-century aṭṭhakathā** — Mahānāma's
*Saddhammappakāsinī* (the Paṭisambhidāmagga commentary), who divides *sabhāva* into *sat+bhāva* "real
essence" with "ontological repercussions" — but she marks Mahānāma an outlier (his own preferred gloss is
the non-ontological one) and reserves the systematic "invests this equation with ontology" verb for the
sub-commentary. So the aṭṭhakathā is not portrayed as wholly innocent of reification, only as not yet
ontologically committal about *sabhāva*; the full substantialist investiture is a ṭīkā-stage development.

## Page-number corrections (the handoff/secondary sources were off)
- The often-quoted thesis sentence "sabhāva is predominantly used for the sake of determining the dhammas'
  individuality, not their existential status" is on **p. 111** (Wikipedia's "p. 112" is one page off;
  MDPI's "p. 58" is wrong).
- The decisive Buddhaghosa-vs-Mahāṭīkā contrast is **p. 118**. Cite **p. 118** for the localization claim.

## Why this matters for our corpus result (it flips the read)
Our own data peaks the realist package at **6tīkā**, not 5comm/aṭṭhakathā (sabhāva raw deduped: mūla 45,
aṭṭhakathā 1632, ṭīkā 3981; realist co-occurrence peaks at 6tīkā 2.363/Mchar). Under the *mistaken*
aṭṭhakathā-boundary attribution that ṭīkā peak read as a **null** against H1. Under the *corrected*
attribution it reads as **confirmation** of Ronkin's actual localization: the study's PRIMARY 4para→5comm
step was testing a boundary Ronkin does not assert, and the SECONDARY 5comm→6tīkā intensification leg is the
one that tracks her. Distributional only; the corpus co-locates with where Ronkin places the ontological
investment and does not adjudicate the metaphysical question.

## Where the correction landed (queue item 3, commit 2900899, deployed)
- `public/research/commentarial-register.json` v1.1 — Ronkin-attributed paragraph in the sabhāva headline
  section (the live deliverable).
- `research/sabhava-realist-drift-seam/_protocol.json` — `correction_2026-06-25` (frozen h1 left as the
  pre-registered record).
- `research/sabhava-realist-drift-seam/FINDINGS.md` — dated correction callout.

## Live confirmation that DISPUTES Ronkin's periodization (kept for completeness)
Y. Karunadasa holds the realist reading goes back to the earliest discourses, against Ronkin's later-stage
localization. The Heim & Ram-Prasad reading (PEW 2018) holds the Theravāda Abhidhamma is method-giving and
phenomenological, not a Sarvāstivāda-style ontology, and that Ronkin's realist case rests on question-begging
translations (Amod Lele argues the opposite). The corpus result is silent on this doctrinal dispute by design.
