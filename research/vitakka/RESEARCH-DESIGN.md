# Pre-registration — The apparatus of absorption: is the jhāna meditation-manual vocabulary canonical or commentarial?

*Frozen 2026-06-25, BEFORE the full sense-audited enumeration. dhamma-research method. DISCLOSED SEED: the
deep-research report DR-1 (project memory `jhana-vitakka-deep-research.md`) and the local exploration
(`_explore.py` / `_explore2.py`, the only data seen before this freeze). Per Hard rule 1, the value of this
prereg is the frozen decision rule + falsifiable predictions + audit protocol, not data-blindness. Corpus
snapshot 194,710 passages (2026-06-25). Internal doc; em-dashes allowed here, NOT in the deliverable prose.*

## The question

The commentaries organise jhāna with a technical apparatus the meditation manuals (above all the
Visuddhimagga) treat as standard: a graded scale of concentration with **access concentration**
(*upacāra-samādhi*) below full **absorption** (*appanā-samādhi*), and a technical re-gloss of the first
jhāna factor *vitakka* not as "thinking" but as *abhiniropana*, "the placing / application of the mind on
its object" (the gloss string *takko vitakko saṅkappo appanā byappanā cetaso abhiniropanā vacīsaṅkhāro*).
Is this apparatus a canonical vocabulary the commentary inherited, or a later construction it built on the
early discourses? This is a question about the **provenance of the apparatus terms**, by chronological
stratum, on the granularity-robust per-character measure.

Sub-questions, on distinct axes:
1. **Provenance by stratum.** Where, by chronological stratum (early-canonical / late-canonical /
   Abhidhamma / para-canonical / commentary / sub-commentary), does each apparatus term sit, per million
   characters?
2. **Sense (mandatory audit).** Of the few early-canonical hits, how many carry the *technical* sense
   (access/absorption concentration; the vitakka re-gloss) versus a homograph (*upacāra* = vicinity/boundary;
   substrings *saṅk-appanā* / *vik-appanā* / *appa-nigghosa*)? A raw substring count is not a count until
   its sense is read.
3. **Phenomenon versus term (the control).** Does the early canon describe the *underlying state* the
   apparatus organises (a hindrance-free, pliant, ready mind) in its own non-technical vocabulary, even
   where the technical label is absent?

## Hypotheses (H0 pre-committed, reported if it wins)

- **H1 (the apparatus is a late overlay):** the access/absorption tiering (*upacāra-samādhi*,
  *appanā-samādhi*) and the *abhiniropana* re-gloss of *vitakka* are near-absent from the early canon and
  saturate the Abhidhamma + para-canon + commentary. Per character they run several times denser in the
  commentary than in the early canon; the access-concentration sense of *upacāra* is essentially 0 in the
  early canon (the early hits are the Vinaya "vicinity/boundary" sense); the single early-canonical anchor
  for the technical gloss is the *Mahācattārīsaka* (MN 117) definition string. The DPD dates the technical
  sense to the Paṭisambhidāmagga (a late/para stratum).
- **H0 (the apparatus is canonical):** the apparatus terms in their technical sense are present in the early
  Nikāyas per character at a density comparable to the commentary, so the access/absorption scheme and the
  vitakka re-gloss are an early-canonical distinction the commentary merely inherits and repeats.

## Falsifiable predictions (scored verbatim afterward; pre-committed disconfirming counts)

- **P1 (upacāra access-sense is not early).** After sense-audit, the number of early-canonical (`1early`)
  *upacāra* rows in the **access-concentration** sense is 0. **Disconfirming leg:** if ≥1 early-canonical
  *upacāra* row carries the samādhi sense (not the Vinaya vicinity/boundary sense), P1 fails.
- **P2 (appanā absorption is not early).** After sense-audit with the tightened word-boundary pattern, the
  early-canonical *appanā* (absorption / gloss) rows number ≤ 2. **Disconfirming leg:** ≥3 real
  early-canonical *appanā*-in-the-absorption-sense rows (beyond MN 117) fails P2. (The naive substring count
  of 9 is predicted to collapse on audit to the MN 117 gloss alone, the rest being *saṅkappanā* /
  *vikappanā* / *appanigghosa*.)
- **P3 (abhiniropana gloss has one early anchor).** The early-canonical occurrences of *abhiniropana* (the
  vitakka re-gloss) number exactly 1, the MN 117 definition string; the term is then established in the
  late/para stratum (Paṭisambhidāmagga, Niddesa) and the Abhidhamma before saturating the commentary.
  **Disconfirming leg:** ≥2 distinct early-canonical suttas carrying the *abhiniropana* gloss fails P3.
- **P4 (the phenomenon is canonical; only the label is late).** The non-technical vocabulary for the
  hindrance-free pliant mind (*vinīvaraṇa(citta)*, *kallacitta*) is **canon-denser** than the commentary per
  character (ratio early-canon : commentary > 1). **Disconfirming leg:** if those phenomenon terms are
  commentary-denser per character, P4 fails and the "phenomenon is early, label is late" reading is dropped.
- **P5 (apparatus density is markedly commentarial).** Each apparatus term (*upacāra*, *appanā*,
  *abhiniropana*, *parikamma*, *khaṇika*) runs several times denser per character in the commentary
  (`5comm`+`6tika`) than in the early canon (`1early`). Reported as a per-character density contrast by
  stratum, NOT as a formal monotonic-gradient trend test (the co-occurrence-ratio gradient method is
  withdrawn program-wide; only gross per-character density is used).

## What would falsify the thesis / force H0

- A sense-audited early-canonical samādhi-sense *upacāra* or a cluster of real early *appanā*-absorption
  rows (P1/P2 disconfirming legs).
- The *abhiniropana* gloss in two or more independent early suttas (P3), making MN 117 not a singleton.
- The phenomenon terms turning out commentary-denser (P4), which would undercut the phenomenon-versus-term
  reading.
- The apparatus terms being early-canon-dense per character (P5), i.e. H0.

## Method (frozen)

1. **Stratum, not layer.** The unit is the chronological `stratum(work_slug)` (1early / 2late / 3abh /
   4para / 5comm / 6tika / 7other), NOT `work_role` (which lumps the Visuddhimagga, the Vinaya, the late
   Khuddaka, and the Abhidhamma into "mula"). Per-character density uses the deduped (`is_primary`) char-mass
   per stratum as the denominator (1early 13.10, 2late 3.85, 3abh 7.58, 4para 1.21, 5comm 30.69, 6tika 28.36
   Mchar; re-derived in `_enumerate.py`).
2. **Tightened patterns + mandatory sense-audit.** *appanā* uses a word-boundary pattern (`\mappanā` /
   `\mappaṇā`) to exclude *saṅkappanā* / *vikappanā*; every early-canonical hit of every apparatus term is
   read and coded for sense (technical-samādhi / gloss / homograph). The commentary magnitudes are reported
   with the contamination caveat; the load of the audit is on the small early-canonical cells.
3. **Per-claim-granularity gate.** Each early hit's sense is read from the row's own text, not assigned by
   work. A blind second/third coder re-codes the early apparatus hits for κ.
4. **Phenomenon-versus-term pass.** Enumerate *vinīvaraṇa(citta)*, *kallacitta*, *mudu-/kammañña* per
   stratum as the control: the canon's own vocabulary for the hindrance-free pliant mind.
5. **Density rule (SKILL rule 8).** Every magnitude claim is per million characters, deduped, never raw
   rows. No row-ratio headline.
6. **Auditability.** Every cited row resolves to a real corpus id in the reader; counts re-derive from
   `_enumerate.py` (committed query->result).

## Scope limits (stated up front, per DR-1 deliverable e)

- **This settles the provenance of the APPARATUS, not the MEANING of vitakka in the suttas.** It does NOT
  adjudicate the Sujato-versus-Thanissaro / Bucknell debate over whether *vitakka* in the jhāna formula is
  discursive thinking or a technical "application of mind"; density cannot settle intra-sutta meaning.
- **Genre confound, stated.** The Abhidhamma is an enumerative matrix, so *vitakka* as a listed factor is
  mechanically dense there; a high Abhidhamma *vitakka* count is a genre artifact, not evidence about
  meaning. FTS does not stem Pāli, so counts are measured floors.
- **Phenomenon, not absence.** The finding is "the technical labels and the tiered scheme are late", NOT
  "the canon had no notion of a pre-absorption pliant mind". The phenomenon control (P4) is what keeps the
  claim narrow.
- **No within-canon date precision.** MN 117 (*Mahācattārīsaka*) is itself argued to be a late sutta; the
  stratum is the frozen work->stratum value, a bucketing aid, and any "MN 117 is late" remark is hedged.

## Dataset schema (frozen)

`public/research/vitakka.json`: the per-stratum density table for each apparatus + baseline + phenomenon
term; the sense-audited early-canonical hit list (each row id, citation, sense code, coder agreement,
evidence snippet); the MN 117 anchor record; the verbatim P1-P5 scoring; the IAA block (κ scoped). Versioned
`vitakka-census vX.Y`, corpus snapshot pinned, codebook + query log committed beside it.

## Stopping rule

Saturated when (a) every apparatus + phenomenon term has per-stratum counts and per-character densities,
(b) every early-canonical apparatus hit is sense-audited and the load-bearing ones blind-coded for κ,
(c) the MN 117 anchor is confirmed by hand, and (d) a second pass adds no new early-canonical hits.
