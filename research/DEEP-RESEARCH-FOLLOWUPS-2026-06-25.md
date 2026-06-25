# Deep-research follow-ups — 2026-06-25

*Captured from the 5 parallel `/deep-research` chats run during the expansion campaign. Each report is a
literature map + (for vitakka, saṅkhāra) a live dhamma-pg corpus probe. DR-2 (sati) and DR-3 (anattā) had
not reported as of capture; anattā likely still running (empty `sn2259.json` placeholder in the tree).
Internal doc.*

## Status of the 5 chats
- **DR-1 jhāna / vitakka-vicāra** — DONE. Memory `jhana-vitakka-deep-research.md`.
- **DR-4 saṅkhāra** — DONE (pasted). Probe scripts `research/sankhara/probe.py`+`probe2.py` were accidentally
  removed by a `git clean`; results preserved in the report; regenerable.
- **DR-5 suttas→Abhidhamma** — DONE (pasted). No memory written.
- **DR-3 anattā** — likely IN PROGRESS (empty `sn2259.json` = SN 22.59 Anattalakkhaṇa).
- **DR-2 sati** — no trace; check that chat directly.

## DR-1 jhāna / vitakka — key result + follow-ups
KEY REFRAME: the *senses* axis (sealed vs sense-aware) and the *lexical* axis (vitakka = discursive thinking
vs technical "application of mind") CROSS-CUT. Sujato is an absorptionist but sides with Buddhaghosa/Bodhi/
Anālayo on vitakka=non-discursive, AGAINST Thanissaro/Bucknell/Polak. Live measurement: the
absorption/access apparatus is measurably commentarial (upacāra 13 sutta hits vs 2,246 comm; appanā 75%
comm; abhiniropana the technical gloss = 206 vs vitakka 20,060; DPD dates the technical sense to the
Paṭisambhidāmagga). No prior computational study exists; DPD inflections now unblock it.
FOLLOW-UPS:
- [BUILD] a dhamma-explore/dhamma-research provenance study: the apparatus-is-commentarial measurement is
  clean and never done. Scope already fixed by deliverable (e): density CAN settle apparatus provenance +
  collocation-shift; CANNOT settle intra-Sutta meaning (genre confound: Abhidhamma is an enumerative matrix
  so vitakka-as-factor is mechanically dense there; FTS does not stem Pāli).
- Direct-page-check the Bucknell (1993) + Shankman (2008) verbatim quotes (image-only scans).

## DR-4 saṅkhāra — key result + follow-ups
KEY RESULT (novel, measured): on identical canonical text the two highest-coverage modern translators sit at
opposite poles — **Sujato lexicalises the active/passive split** ("choices" for DO/khandha, "conditions" for
the *sabbe saṅkhārā* maxim) while **Thanissaro collapses it** ("fabrications" everywhere incl. the maxim).
This is exactly the "translators import the wrong sense" thesis, which is UNSTATED + UNTESTED in the
literature. No computational study of saṅkhāra exists. cetanā is the shared core of the two psychological
senses (Bodhi: khandha has "wider compass"); Hamilton locates unity in the constructing *function*; Bucknell
declines the semantic question (structural thesis only). NOTE this CONTRADICTS our campaign's
"sankhara NOT ESTABLISHED" verdict — the deep-research corpus probe computed the translator×field matrix our
one-shot SQL did not; the study IS viable with a sharp finding.
FOLLOW-UPS:
- [BUILD] a dhamma-research study: per-translator consistency + disambiguation profile (Sujato-splits /
  Thanissaro-collapses), anchored by named exemplars on the maxim + DO loci. Clean null, enumerable.
- [DATA] ingest Bodhi's + Horner's full SN/MN so the confusion matrix includes Horner (the deliberate
  context-splitter, currently n=2) + Bodhi (fixed-word advocate, n=12). Coverage is the binding constraint:
  only 178 own-text saṅkhāra passages have >=2 translators; maxim cell n=5, pure khandha cell n=2.
- [VERIFY] Brahmāli's own voice on cetanā (his Dependent Origination series / Authenticity of the EBT) —
  the "choices=kamma" equation is Sujato's, not provably Brahmāli's.
- [VERIFY] Hamilton "most important/difficult khandha" superlative (clean Identity and Experience pp.66-81).
- [REGEN] research/sankhara/probe.py + probe2.py (deleted; regenerate from the report's method).

## DR-5 suttas→Abhidhamma — key result + follow-ups
KEY RESULT: systematization (canon→Abhidhamma→commentary formalizes open sutta material) is consensus;
"hardening into metaphysics" is genuinely contested (Heim/Ram-Prasad vs Ronkin, live). Momentariness
(khaṇavāda) is post-canonical (von Rospatt). Two-truths is an Abhidhamma innovation but "two ways of
presenting what is true", NOT graded (Karunadasa) — cuts against the hardening reading.
**TENSION DIRECTLY RELEVANT TO US:** the brief/our sabhava prereg framed Ronkin as localizing the realist
crystallization in the **aṭṭhakathā**; the deep-research finds Ronkin's ACTUAL position is the later **ṭīkā**
(Wikipedia citing EBM p.112; SEP) — aṭṭhakathā still "pragmatic". **Our own corpus agrees with the ṭīkā:**
sabhava peaks at ṭīkā (3981) > aṭṭha (1632); the realist tetrad is 0 in canon, appears only 5comm→6tīkā and
peaks at ṭīkā. So our flagship "intensifies into the ṭīkā" is VINDICATED and the sabhava prereg's
aṭṭhakathā framing should be corrected to ṭīkā before re-citing Ronkin.
FOLLOW-UPS:
- [VERIFY/CORRECT] pull Ronkin's 2005 *Early Buddhist Metaphysics* p.112 primary wording (aṭṭhakathā vs
  ṭīkā) and fix the sabhava-realist-drift-seam prereg + our flagship's Ronkin attribution.
- [CORPUS-DOABLE NOW] the PED "abhiññā narrowed to the fixed six nine-times-in-ten in commentary" claim — a
  per-stratum chaḷabhiññā/abhiññā token census tests it directly on dhamma-pg (the wording itself is
  unverified; the narrowing is real per EIR).
- [CORPUS-DOABLE NOW] Hamilton's "khandha×āyatana×dhātu cross-classification + rūpakkhandha-classification of
  the sense faculties only in the Abhidhamma" — a per-stratum census tests it; Hamilton's own text (Identity
  and Experience) was not crackable, so verify her exact loci.
- [METHOD] a defensible "hardening" quantitative result needs: blind sense-audit completed + an explicit
  similarity/continuity test (not just difference) + a formal trend test (Hilpert-Gries), else "hardening"
  is answerable only by close reading. (Matches our meta-finding: gross density CAN show register
  provenance; CANNOT show metaphysical hardening or term-specific drift.)

## Cross-campaign synthesis
- TWO of the deep-research topics (vitakka provenance, saṅkhāra translator-divergence) are now PROVEN-viable
  dhamma-research studies with clean nulls and sharp findings, BETTER than our fast-pipeline verdicts,
  because the chats did careful per-topic corpus probes. saṅkhāra in particular flips our "not established".
- DR-5 independently CORROBORATES our sabhava finding (ṭīkā-peaking realist register) and our meta-finding
  (density shows provenance, not hardening), and supplies the Ronkin correction.
- The denominator dedup correction (our SKILL rule 8 fix) applies to any density number these chats cite too.
