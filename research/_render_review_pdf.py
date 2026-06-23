#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Render the 2026-06-23 adversarial review to a styled, readable HTML (-> PDF via headless Edge).
Organized BY STUDY, findings ranked critical->major->minor, with coordinator DB-verification badges.
Pulls the full structured findings from the workflow output so nothing is dropped."""
import json, io, sys, html, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

OUT = sys.argv[1] if len(sys.argv) > 1 else 'research/ADVERSARIAL-REVIEW-2026-06-23.html'
WF = r"C:\Users\isaac\AppData\Local\Temp\claude\C--Dev-Dhamma\3141d7b1-4c41-4003-ab83-6d04e06bf102\tasks\wt8q737hx.output"
R = json.loads(open(WF, encoding='utf-8').read())['result']

def esc(s): return html.escape(str(s or ''))

# ---- study display meta ----
TITLES = {
 'awakening': 'Every Instance of Awakening in the Pāli Canon and Commentary',
 'individual-guidance': 'From Function to Essence (Individual Guidance)',
 'heart-base': 'The Heart-Base, Bhavaṅga, and the Stages of Insight',
 'uttarakuru': 'The People of Uttarakuru',
 'naga': 'The Nāga as a Class of Being in the Pāli Canon',
}

# ---- coordinator DB / local verification badges, keyed by (study, keyword-in-title) ----
# kind: ok = confirmed real, reframe = refined/partly overturned, partial = mixed
VERIF = {
 'awakening': [
   ('buddha-vacana', 'ok', 'DB-CONFIRMED: sn4_1 / vin3_1 are 311,658 / 243,393-char monolithic rows holding the Buddha’s self-claim AND a third party’s awakening (Rāhula, Yasa). 17/9 → 15/7 is warranted.'),
 ],
 'individual-guidance': [
   ('h0=8', 'ok', 'CONFIRMED (logic): 0 identity violations across the 15 cells; build_dataset.py:452 hard-pins 8/7. It is a coding restatement, not a test.'),
   ('sabh', 'ok', 'DB-CONFIRMED: independent count vism=84 (RECONCILIATION ≈ 98), attha 1,548, tika 3,981. The page’s vism 553 is a ~5–6× overcount. Peak-in-ṭīkā holds.'),
   ('paṭisambh', 'ok', 'DB-CONFIRMED: 0 in the Paṭisambhidāmagga — the page (“carries none”) is right; the JSON RUNG3 pli-ps:1 is the stray error.'),
   ('carita', 'ok', 'DB-CONFIRMED: carita = 0 (diacritic-correct) in all four Nikāyas, the Abhidhamma, and the Paṭisambhidāmagga. The load-bearing negative holds.'),
 ],
 'heart-base': [
   ('hardcoded literal', 'ok', 'DB re-derived the keystone independently: hadayavatthu total 272, 0 in four Nikāyas, 0 in seven Abhidhamma books. Counts are correct — but only because I re-ran them; the repo cannot.'),
   ('never verified', 'ok', 'DB-CONFIRMED critique: negative control → cakkhuvatthu (a matched material support) is ALSO never verified (0 co-occurrences); bhavaṅga = 8. So “never verified” is partly a category property. Soften it.'),
 ],
 'uttarakuru': [
   ('6 of 26', 'ok', 'CONFIRMED (local): the 6 early mula rows are 3 AN suttas, each once under an SC id and once under a CST sibling. After dedup: 3/17 ≈ 18% early.'),
   ('divine-eye', 'ok', 'DB-CONFIRMED: exactly 5 mula rows co-occur with uttarakur (page’s “five” is exact); pericope attested 176× (page says ~124, conservative). Cite the corpus count.'),
   ('flowering creeper', 'partial', 'DB: such canonical rows DO exist (kn10_1, kn18_2) but are absent from the served data; “the one canonical row” may be a couple. Surface the datum.'),
 ],
 'naga': [
   ('lopsided', 'reframe', 'REFRAMED: per-ROW the picture is mixed (canon denser on several facets), but that normalizer is itself confounded. Per-CHARACTER the commentary is 5.5× denser overall — report per-character; the qualitative direction holds, the raw magnitude does not. See T2.'),
   ('32%', 'ok', 'CONFIRMED: 1267/3270 = 39%; the 3,910 denominator wrongly folds in 640 no-morpheme nonlexical rows.'),
   ('nāgadīpa', 'partial', 'DB: mixed — e0703n is the genuine Mahodara/Cūľodara nāga-king episode (correctly serpent); e1001n reads as a calendar/chronicle toponym. Smaller false-positive rate than feared.'),
   ('nāgadīp', 'partial', 'DB: mixed — e0703n is a genuine nāga-king episode; e1001n reads as a toponym.'),
 ],
}

def verif_for(study, title):
    t = title.lower()
    for key, kind, text in VERIF.get(study, []):
        if key.lower() in t:
            return kind, text
    return None

SEV_ORDER = {'critical': 0, 'major': 1, 'minor': 2}

# order studies by importance: critical count desc, then major count desc
def study_weight(x):
    vf = x['verified'].get('verified_findings', [])
    crit = sum(1 for f in vf if f.get('final_severity') == 'critical')
    maj = sum(1 for f in vf if f.get('final_severity') == 'major')
    return (-crit, -maj)
studies = sorted(R['perStudy'], key=study_weight)

# ---- cross-cutting (T1/T2 + secondary) synthesized cards ----
SYSTEMIC = [
 ('critical', 'T1 — The “chronological stratum” axis is a work_slug lookup, not an independent coding',
  'awakening, individual-guidance, heart-base, uttarakuru, naga',
  'PROVENANCE-SIGNATURE.md promises stratum “coded independently of structural layer,” then operationalizes it as a work→stratum lookup. So every early-vs-late gradient and every “N layer/stratum disagreements” integer is circular with the corpus’s own shelving; the per-row “disagree” flag fires iff stratum ≠ early-canonical, so it is the same partition counted twice.',
  'COORDINATOR-VERIFIED (local): stratum is a pure function of work in naga (0/24 works multi-valued) and awakening (0/10), near-pure in uttarakuru (1/35 = the KN catch-all). “disagree” == “not-early” for 299/299 awakening mula rows and 26/26 uttarakuru mula rows.',
  'Relabel the axis as a frozen work→stratum REFERENCE TABLE (a recall aid, not a per-row coding); drop “three readers coded each row’s stratum independently”; footnote that “disagree” == “not-early” by construction. For any load-bearing within-canon chronology claim, code the contested rows from per-row philology and report a real κ.'),
 ('critical', 'T2 — The “commentary dominates” magnitude is a corpus-granularity artifact',
  'awakening, naga, individual-guidance, heart-base, uttarakuru',
  'Every study reports the commentary doing the heavy lifting (“85% commentarial,” “most lopsided,” “rises with lateness”). But the commentary was subdivided into ~330-char paragraph rows while the canon stayed at ~2,975-char whole-sutta rows, so raw counts inflate the commentary by construction.',
  'COORDINATOR-VERIFIED + REFRAMED (DB): canon is 9% of ROWS but 44% of the corpus by CHARACTER. The cross-study agent’s “it reverses, the canon is denser” is a per-ROW artifact and does NOT survive per-character normalization. Per CHARACTER the commentary is genuinely 3.5–5.5× denser (awakening 5.1×, naga 5.5×, IG 3.5×). The truth is between the studies and the adversary.',
  'Add a per-layer denominator to every census; report topic density per MILLION CHARACTERS next to every raw canon-vs-commentary count. This single change corrects the inflated magnitude AND vindicates the qualitative direction the studies argue.'),
 ('major', 'S3 — “Never verified” epistemic legs run without a negative control',
  'heart-base, uttarakuru',
  'Both argue absence-of-verification from non-co-occurrence with the canon’s knowing-formulae, without showing the formulae EVER take a comparable material support or place as object — so the “downgrade” may just be a grammatical-category fact. Heart-base even prints “0 in-window” next to a recorded 70-char co-occurrence.',
  'COORDINATOR-VERIFIED (DB): cakkhuvatthu (a matched material support) is also never verified (0). So the heart-base’s silence is at least partly a category property, not a doctrine-specific downgrade.',
  'Run the matched control before either leg is leaned on; soften to “shares the non-verified grammar of supports/places generally”; foreground the heart-base’s in-corpus harmonization witness (Pāľiyaṃ anāgata).'),
 ('major', 'S4 — Auditability is uneven; load-bearing counts are not re-derivable from the repo',
  'heart-base, individual-guidance, naga',
  '0 of 5 build_dataset.py scripts run a live query. Heart-base hardcodes every count as a literal behind a self-check that asserts the literals equal themselves; IG’s fine_full.json and naga’s canon_serpent_candidates.json are git-ignored — so the artifacts behind two load-bearing claims are not in the repo.',
  'NOTED: this review’s research/_adv_db_check.py is a first query→result snapshot; the keystone zeros re-derive correctly.',
  'Commit per-study SQL + a counts snapshot and have build_dataset.py read it; un-ignore the two artifacts; add a per-study data-availability line.'),
 ('major', 'S5 — IAA κ is reported on the easy/feature calls, not the per-row judgements the headlines turn on',
  'uttarakuru, naga, individual-guidance, awakening',
  'Published κ sits next to a headline it does not cover: uttarakuru 14/16 over 16 FEATURES (cited for the 26-ROW split); naga 0.853 over 124 ambiguous rows (41% of serpent rows are unchecked auto-codes; 87% commentary single-coded); IG promises per-field IAA but reports no numeric κ for the 8/7 warrant calls; awakening κ=1.0 covers the 17 attribution rows, not the 9-bucket taxonomy driving the lead finding.',
  '',
  'Scope every κ to its unit in the sentence that prints it; state where no per-row κ exists; compute a real per-row κ for any headline that turns on a per-row split.'),
 ('major', 'S6 — House-thesis confirmation risk: one template confirmed five times',
  'awakening, individual-guidance, heart-base, uttarakuru, naga',
  'All five reach “canon supple/silent/functional; commentary systematizes/hardens/names.” “faithful... innovative in the apparatus” appears verbatim in IG and naga; two prereg seeds (naga, uttarakuru) bake the direction into the question. The result is also the field’s standing consensus (Cousins, Crosby), so the contribution is quantification, not discovery.',
  '',
  'Restate the naga/uttarakuru questions as hypotheses with explicit nulls; run at least one study on a topic where the prior points the OTHER way, and publish it whatever it shows; engage the secondary literature the result already belongs to.'),
]

# ---- correction queue ----
QUEUE = {
 'P0 — fix the framing a referee could sink in one line': [
  'Add a per-million-character density column to every census; rewrite all “85% commentarial / most lopsided” sentences to normalized rates. (T2 — protects four of five headlines.)',
  'Relabel the stratum axis as a work→stratum reference table; footnote “disagree == not-early”; drop “three readers coded each row’s stratum independently.” (T1 — all five.)',
  'Uttarakuru: dedup SC/CST recension siblings before computing 6/26 (→ 3/17); fix the IAA-unit sentence; fix the subtitle.',
 ],
 'P1 — correct published integers / over-sold apparatus': [
  'Awakening 17/9 → 15/7 (and fix the IAA harness to excerpt the catalogued span, not the whole book).',
  'IG: replace vism 553 with ≈ 84–98; reframe H0=8/H1=7 as a descriptive coding output; fix the RUNG3 pli-ps stray and the 53/43 double-count.',
  'Naga: 32% → 39% (relabel the denominator); rewrite the lopsidedness sentences to normalized rates; restrict to the genuinely attha-denser facets.',
  'Heart-base: run the matched negative control and soften “never verified”; foreground the Pāľiyaṃ anāgata witness.',
 ],
 'P2 — method hardening (so the next study inherits the fixes)': [
  'Patch PROVENANCE-SIGNATURE.md I.1 and add the stratum axis to the per-claim-granularity gate it was wrongly exempted from.',
  'Extend the per-claim gate to audit the SPAN on monolithic/work-level rows; route hand-injected and prefix-rule rows through the blind gate.',
  'Commit per-study SQL + query→result snapshots (heart-base first); un-ignore the two load-bearing artifacts; add a per-study data-availability line.',
  'Scope every published κ to its unit; require a per-row κ for any headline that turns on a per-row split.',
  'Restate the naga/uttarakuru prereg questions as hypotheses with explicit nulls; run one study where the prior points against the house thesis.',
 ],
}

# ===================== HTML =====================
CSS = r"""
@page { size: A4; margin: 1.6cm 1.7cm; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
* { box-sizing: border-box; }
body { font: 10.3pt/1.5 "Segoe UI", "Helvetica Neue", Arial, sans-serif; color:#1d1d1f; margin:0; }
.serif { font-family: Georgia, Cambria, serif; }
h1.doctitle { font-size: 21pt; line-height:1.2; margin:0 0 .15em; font-weight:800; letter-spacing:-.2px; }
.sub { color:#555; font-size:10.5pt; margin:0 0 1em; }
h2.sec { font-size:15pt; font-weight:800; margin:1.9em 0 .5em; padding-bottom:.18em; border-bottom:2px solid #c8a84b; }
h3.studyhead { font-size:13pt; font-weight:800; margin:.2em 0 .1em; }
.meta-row { font-size:9pt; color:#666; margin:.1em 0 1.2em; }
.lead { font-size:10.6pt; }
.callout { border:1px solid #e3ddc9; border-left:5px solid #c8a84b; background:#fcfaf3; border-radius:5px; padding:.7em .9em; margin:.7em 0; page-break-inside:avoid; }
.callout.crit { border-left-color:#b3261e; background:#fdf3f2; }
.callout.warn { border-left-color:#b9770e; background:#fdf8ef; }
.badge { display:inline-block; font-size:7.6pt; font-weight:800; letter-spacing:.4px; padding:.12em .5em; border-radius:3px; color:#fff; vertical-align:middle; text-transform:uppercase; }
.b-crit{background:#b3261e;} .b-major{background:#b9770e;} .b-minor{background:#6b7075;} .b-grade{background:#1d1d1f;} .b-ok{background:#1a7f37;} .b-reframe{background:#7a3da8;} .b-partial{background:#0b6b9c;}
.gradeline { margin:.2em 0 .6em; font-size:9.4pt; color:#444; }
.gradeline .g { font-size:11pt; font-weight:800; }
.finding { border:1px solid #e6e6e6; border-radius:6px; padding:.55em .75em; margin:.55em 0; page-break-inside:avoid; }
.finding.critical { border-left:5px solid #b3261e; }
.finding.major { border-left:5px solid #b9770e; }
.finding.minor { border-left:5px solid #b9bcc0; }
.ftitle { font-weight:700; font-size:10.4pt; }
.fmeta { font-size:8.2pt; color:#777; margin:.15em 0 .35em; text-transform:uppercase; letter-spacing:.3px; }
.flabel { font-weight:700; color:#444; font-size:8.6pt; letter-spacing:.3px; }
.fbody { font-size:9.5pt; margin:.12em 0 .35em; }
.verif { font-size:9pt; border-radius:4px; padding:.4em .6em; margin:.3em 0 .1em; }
.verif.ok{background:#eaf6ec; border:1px solid #bfe3c6;} .verif.reframe{background:#f3ecfa; border:1px solid #ddc9f0;} .verif.partial{background:#e8f3fa; border:1px solid #c2dff0;}
.fp { font-size:9pt; color:#555; margin:.25em 0; padding-left:.7em; border-left:2px solid #ddd; }
table { border-collapse:collapse; width:100%; margin:.5em 0 1em; font-size:9.3pt; }
th,td { border-bottom:.5px solid #ccc; padding:.32em .5em; text-align:left; vertical-align:top; }
thead th { border-top:1px solid #444; border-bottom:1px solid #444; font-weight:800; background:#f4f1e8; }
ol.q li, ul li { margin:.2em 0; }
.small { font-size:8.8pt; color:#666; }
.toc { font-size:9.6pt; columns:2; column-gap:2em; }
.toc a { color:#1d1d1f; text-decoration:none; }
h2.sec, h3.studyhead { page-break-after:avoid; }
.studyblock { page-break-before:always; }
.kbd { font-family:Consolas,monospace; font-size:8.8pt; background:#f3f1ea; padding:.05em .3em; border-radius:3px; }
"""

P = []
def w(s): P.append(s)

w(f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Adversarial review</title><style>{CSS}</style></head><body>')

# ---- header ----
w('<h1 class="doctitle">Adversarial Peer Review</h1>')
w('<p class="sub">The five live Dhamma research studies &middot; no-holds-barred audit of every claim, the data, and every inference</p>')
w('<p class="meta-row">2026-06-23 &middot; 22 agents (5 studies &times; 3 hostile lenses &rarr; per-study verifier &rarr; 2 meta passes) + a coordinator DB-verification layer &middot; corpus snapshot 194,710 passages &middot; workflow <span class="kbd">wf_fd14f07b-e12</span> &middot; nothing deployed or edited on the live pages</p>')

# ---- bottom line ----
w('<h2 class="sec" id="bottom">Bottom line</h2>')
w('<p class="lead"><b>Every central thesis survives.</b> All five rest on present/absent <b>0-canon negatives</b> and hand-verified close readings, which I independently re-confirmed against the live corpus (carita = 0 in the four Nikāyas + Abhidhamma + Paṭisambhidāmagga; hadayavatthu = 272 total, 0 in canon, 0 in the seven Abhidhamma books). The qualitative direction — canon sparer/functional, commentary systematizing — also matches the field’s standing consensus.</p>')
w('<p class="lead"><b>What does not survive is the quantitative apparatus.</b> Two systemic defects (found independently by both meta passes, then verified by me) run through the whole program: the chronological-stratum axis is circular with the corpus’s shelving (T1), and the “85% commentarial” magnitude is a row-granularity artifact (T2). Details in <i>Cross-cutting findings</i> below.</p>')

# grades table
w('<table><thead><tr><th>Study</th><th>Grade</th><th>Thesis verdict</th><th>Biggest single defect</th></tr></thead><tbody>')
GRADE_DEFECT = {
 'uttarakuru': '<b>CRITICAL:</b> “6 of 26 mula rows early” double-counts 3 suttas as 6 SC/CST recension siblings',
 'individual-guidance': 'headline <b>H0=8/H1=7 is a definitional tautology</b>, not a test it could fail; page vism sābhava 553 → ~84–98',
 'awakening': 'buddha-vacana <b>17/9 → 15/7</b> (2 rows are book-sized monoliths cataloguing third parties)',
 'heart-base': '“posited, <b>never verified</b>” has no negative control (and the control partly defeats it)',
 'naga': 'flagship “commentary most lopsided on power/habitat” <b>reverses</b> under per-row normalization',
}
for x in studies:
    s = x['study']; v = x['verified']
    w(f'<tr><td><b>{esc(TITLES.get(s,s))}</b></td><td><span class="badge b-grade">{esc(v.get("reliability_grade"))}</span></td><td>{esc(v.get("central_thesis_verdict"))}</td><td>{GRADE_DEFECT.get(s,"")}</td></tr>')
w('</tbody></table>')

# TOC
w('<h2 class="sec">Contents</h2><div class="toc">')
w('<div><a href="#bottom">Bottom line</a></div>')
w('<div><a href="#verif">Independent verification (the credibility layer)</a></div>')
w('<div><a href="#systemic">Cross-cutting findings (T1, T2, S3–S6)</a></div>')
for i,x in enumerate(studies,1):
    w(f'<div><a href="#st{i}">{i}. {esc(TITLES.get(x["study"],x["study"]))}</a></div>')
w('<div><a href="#queue">Prioritized correction queue (P0/P1/P2)</a></div>')
w('</div>')

# ---- independent verification ----
w('<h2 class="sec" id="verif">Independent verification (the credibility layer)</h2>')
w('<p class="lead">I re-checked the corpus-dependent findings myself, serially against the live DB (<span class="kbd">research/_adv_db_check.py</span>) rather than taking the agents’ word. These are the decisive numbers.</p>')
w('<p><b>Base-rate denominators</b> (authoritative, from the corpus):</p>')
w('<table><thead><tr><th>Layer</th><th>Rows</th><th>Characters</th><th>Avg chars/row</th></tr></thead><tbody>'
  '<tr><td>mula (canon)</td><td>17,996</td><td>53.5M</td><td><b>2,975</b></td></tr>'
  '<tr><td>attha</td><td>91,843</td><td>29.5M</td><td>321</td></tr>'
  '<tr><td>tika</td><td>81,841</td><td>28.4M</td><td>346</td></tr>'
  '<tr><td>anya</td><td>3,030</td><td>9.9M</td><td>3,261</td></tr></tbody></table>')
w('<p class="small">Canon = 9% of <i>rows</i> but <b>44% of the corpus by character</b> (commentary subdivided to paragraph rows; canon left at whole-sutta rows, 9&times; larger).</p>')
w('<p><b>Granularity-robust density</b> (topic per million characters), commentary &divide; canon:</p>')
w('<table><thead><tr><th>Study</th><th>Raw split (canon/comm)</th><th>Per row</th><th>Per character (the right unit)</th></tr></thead><tbody>'
  '<tr><td>Awakening events</td><td>14% / 86%</td><td>~1.2&times;</td><td><b>commentary 5.1&times;</b> (attha alone 10.7&times;)</td></tr>'
  '<tr><td>Naga serpent rows</td><td>13% / 87%</td><td>~1.0&times;</td><td><b>commentary 5.5&times;</b></td></tr>'
  '<tr><td>Naga claim-bearing</td><td>16% / 84%</td><td>&mdash;</td><td><b>commentary 4.1&times;</b></td></tr>'
  '<tr><td>IG instances</td><td>18% / 82%</td><td>&mdash;</td><td><b>commentary 3.5&times;</b></td></tr></tbody></table>')
w('<p class="small">The raw 85/14 overstates (rides the 9&times; subdivision); the per-row “reversal” understates (mula rows are 9&times; bigger); per-character — the right unit — says the commentary is ~3.5–5.5&times; denser. Honest claim: “the commentary dwells on this several times more densely than the canon,” not “85% of instances are commentarial” and not “the canon is actually denser.”</p>')
w('<div class="callout"><b>Number-changing checks (DB):</b><ul>'
  '<li><b>Awakening</b> sn4_1 / vin3_1 confirmed as 311,658 / 243,393-char monoliths holding the Buddha’s self-claim AND a third party’s awakening (Rāhula, Yasa) &rarr; <b>17/9 &rarr; 15/7</b>.</li>'
  '<li><b>IG sābhava</b>: independent count vism <b>84</b>, attha 1,548, tika 3,981, mula 65 &rarr; the page’s vism <b>553 is a ~5–6&times; overcount</b>.</li>'
  '<li><b>IG carita = 0</b> confirmed in all four Nikāyas, Abhidhamma, and Paṭisambhidāmagga (the program’s strongest negative).</li>'
  '<li><b>Heart-base</b>: hadayavatthu total 272; <b>0 in canon, 0 in Abhidhamma</b> (silence tier holds). Negative control → cakkhuvatthu also never verified (0).</li>'
  '<li><b>Uttarakuru</b>: exactly <b>5</b> mula rows co-occur with uttarakur (page’s “five” is exact); pericope attested <b>176&times;</b> (page says ~124).</li>'
  '<li><b>Naga</b>: 32% &rarr; <b>39%</b> (bad denominator); nāgadīpa rows are mixed (one genuine nāga-king story, one toponym).</li>'
  '</ul></div>')

# ---- systemic ----
w('<h2 class="sec" id="systemic">Cross-cutting findings (affect several studies at once)</h2>')
w('<p class="small">Both meta passes converged on these. Ranked by importance.</p>')
SEVB = {'critical':'b-crit','major':'b-major','minor':'b-minor'}
for sev, title, affects, pattern, verif, action in SYSTEMIC:
    cls = 'crit' if sev=='critical' else ('warn' if sev=='major' else '')
    w(f'<div class="callout {cls}"><div><span class="badge {SEVB[sev]}">{sev}</span> <b>{esc(title)}</b></div>')
    w(f'<div class="small" style="margin:.2em 0 .4em">Affects: {esc(affects)}</div>')
    w(f'<div class="fbody"><span class="flabel">PATTERN.</span> {esc(pattern)}</div>')
    if verif:
        w(f'<div class="fbody" style="color:#1a5c2a"><span class="flabel" style="color:#1a5c2a">VERIFIED.</span> {esc(verif)}</div>')
    w(f'<div class="fbody"><span class="flabel">FIX.</span> {esc(action)}</div></div>')

# ---- per-study ----
for i, x in enumerate(studies, 1):
    s = x['study']; v = x['verified']
    vf = sorted(v.get('verified_findings', []), key=lambda f: SEV_ORDER.get(f.get('final_severity'), 9))
    fps = v.get('false_positives', [])
    ncrit = sum(1 for f in vf if f.get('final_severity')=='critical')
    nmaj = sum(1 for f in vf if f.get('final_severity')=='major')
    nmin = sum(1 for f in vf if f.get('final_severity')=='minor')
    w(f'<div class="studyblock"><h2 class="sec" id="st{i}">{i}. {esc(TITLES.get(s,s))}</h2>')
    w(f'<div class="gradeline">Reliability grade <span class="g">{esc(v.get("reliability_grade"))}</span> &middot; thesis <b>{esc(v.get("central_thesis_verdict"))}</b> &middot; {ncrit} critical, {nmaj} major, {nmin} minor &middot; {len(fps)} critiques rejected on review</div>')
    if v.get('headline'):
        w(f'<div class="callout"><span class="flabel">HEADLINE.</span> {esc(v.get("headline"))}</div>')
    for f in vf:
        sev = f.get('final_severity','minor')
        w(f'<div class="finding {sev}">')
        vf_ann = verif_for(s, f.get('title',''))
        badges = f'<span class="badge {SEVB.get(sev,"b-minor")}">{sev}</span>'
        if vf_ann:
            k = {'ok':'b-ok','reframe':'b-reframe','partial':'b-partial'}[vf_ann[0]]
            lbl = {'ok':'verified','reframe':'reframed','partial':'partial'}[vf_ann[0]]
            badges += f' <span class="badge {k}">{lbl}</span>'
        w(f'<div class="ftitle">{badges} &nbsp;{esc(f.get("title"))}</div>')
        w(f'<div class="fmeta">{esc(f.get("issue_type",""))} &middot; verdict: {esc(f.get("verdict",""))}{" &middot; needs DB check" if f.get("needs_db_check") else ""}</div>')
        w(f'<div class="fbody"><span class="flabel">ISSUE.</span> {esc(f.get("the_issue"))}</div>')
        if f.get('why_it_holds'):
            w(f'<div class="fbody"><span class="flabel">WHY IT HOLDS.</span> {esc(f.get("why_it_holds"))}</div>')
        w(f'<div class="fbody"><span class="flabel">ACTION.</span> {esc(f.get("recommended_action"))}</div>')
        if vf_ann:
            w(f'<div class="verif {vf_ann[0]}"><b>Coordinator check:</b> {esc(vf_ann[1])}</div>')
        elif f.get('needs_db_check') and f.get('db_check_spec'):
            w(f'<div class="fbody small"><span class="flabel">DB SPEC.</span> {esc(f.get("db_check_spec"))}</div>')
        w('</div>')
    if fps:
        w('<div style="margin-top:.6em"><span class="flabel">Considered and rejected (stress-tested, did not hold):</span>')
        for fp in fps:
            w(f'<div class="fp"><b>{esc(fp.get("title"))}</b> &mdash; {esc(fp.get("why_rejected"))}</div>')
        w('</div>')
    w('</div>')

# ---- queue ----
w('<h2 class="sec studyblock" id="queue">Prioritized correction queue</h2>')
w('<p class="small">Nothing below is applied yet — these are scholarly calls pending your decisions.</p>')
for head, items in QUEUE.items():
    w(f'<h3 class="studyhead">{esc(head)}</h3><ol class="q">')
    for it in items: w(f'<li>{esc(it)}</li>')
    w('</ol>')
w('<p class="small" style="margin-top:1.4em">Verification trail: <span class="kbd">research/_adv_db_check.py</span> (serial DB harness) + the workflow output (full per-study lens + verifier JSON). Local stratum-circularity proof and per-character densities reproduce from <span class="kbd">public/research/*.json</span> + the per-layer totals above. Full prose report: <span class="kbd">research/ADVERSARIAL-REVIEW-2026-06-23.md</span>.</p>')

w('</body></html>')
open(OUT, 'w', encoding='utf-8').write('\n'.join(P))
print('wrote', OUT, sum(len(p) for p in P), 'chars;',
      len(studies), 'studies,',
      sum(len(x['verified'].get('verified_findings',[])) for x in studies), 'verified findings,',
      sum(len(x['verified'].get('false_positives',[])) for x in studies), 'rejected')
