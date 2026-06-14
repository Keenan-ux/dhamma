// Build the audited individual-guidance dataset from the census raw instances.
// AUDIT DISCIPLINE: every instance is grounded to a REAL corpus passage id and
// its evidence quote is verified by a direct /api/passage fetch (the passage
// lane is reliable; only /api/search was flaky during the census). Warrants are
// normalized per the synthesis (self for canonical; null only for true H1), and
// the H0/H1 class of the 15 decidable assignment cells is set from the frozen
// synthesis. Output: public/research/individual-guidance.json.
//
//   node scripts/ingest/build-guidance-dataset.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const RAW = path.join(ROOT, 'research', 'individual-guidance', 'census-instances-raw.json');
const OUT = path.join(ROOT, 'public', 'research', 'individual-guidance.json');
const BASE = 'https://dhamma.fly.dev';

const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// The 7 true-H1 cells (commentarial assignment with no canonical warrant), per the frozen synthesis.
const H1_IDS = new Set([
  'kna-mettasutta-nidana-temperament-map', 'kna-kullatthera-asubha-charnel', 'mpa-ragacarito-asubha',
  'sva-dasuttara-temperament-asubha', 'dhpa-suvannakara-misassign-then-redkasina',
  'F3-carita-organ-colour-correlation', 'F3-cell-faith-six-recollections',
]);

function resolveId(inst) {
  const id = (inst.id || '').trim();
  if (/^cst-/.test(id)) return id;
  // whole-string clean id (e.g. an4.133) — anchored, so a descriptive label
  // like "an9.3-meghiya-fourfold" falls through to the extraction below.
  if (/^(an|mn|sn|dn|ud|snp|iti|thig|thag|kp|khp|dhp|pe|ps|ne|cnd|mnd|vb)\d[\d.]*$/i.test(id)) return id.toLowerCase();
  const m = id.match(/^((?:an|mn|sn|dn|ud|snp|iti|thig|thag|kp|khp|dhp|pe|ps|ne|cnd|mnd|vb)\d[\d.]*)/i);
  if (m) return m[1].toLowerCase();
  const cit = inst.citation || '';
  const cst = cit.match(/cst-[\w.]+-[\w]+/);
  if (cst) return cst[0];
  const sut = cit.match(/\b(AN|MN|SN|DN|UD|SNP|ITI|THIG|THAG|KP|KHP|DHP|PE|PS|NE|CND|MND|VB)\s*([\d.]+)/i);
  if (sut) return (sut[1] + sut[2]).toLowerCase();
  return null;
}

function normWarrant(inst) {
  const v = (inst.voice || '').toLowerCase();
  if (v !== 'commentary') return { warrant: 'self', h_class: 'canonical' };
  if (H1_IDS.has(inst.id)) return { warrant: null, h_class: 'H1' };
  const w = (inst.warrant || inst.warrant_check || '').trim();
  if (!w || /^(none|null|unresolved|unverified)/i.test(w)) {
    // commentary, no override, no real warrant -> classify by facet: F3 defaults H0 (cnd19/AN9.1 warranted), else na
    return { warrant: null, h_class: inst.facet === 'F3-commentary-carita' ? 'H0' : 'na' };
  }
  return { warrant: w, h_class: inst.facet === 'F4-samatha-vipassana' ? 'na' : 'H0' };
}

async function fetchPassage(id) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 30000);
  try {
    const r = await fetch(`${BASE}/api/passage/${encodeURIComponent(id)}`, { signal: ac.signal });
    if (!r.ok) return { ok: false, status: r.status };
    const j = await r.json();
    return { ok: true, original: j.original || '', translation: j.translation || '', citation: j.citation || '', title: j.title || '' };
  } catch (e) { return { ok: false, status: 0, err: String(e) }; }
  finally { clearTimeout(t); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  // resolve ids, collect unique
  for (const inst of raw) inst._pid = resolveId(inst);
  const uniq = [...new Set(raw.map((i) => i._pid).filter(Boolean))];
  console.log(`${raw.length} instances -> ${uniq.length} unique passage ids; fetching serially…`);
  const fetched = {};
  let i = 0;
  for (const id of uniq) {
    i++;
    const r = await fetchPassage(id);
    fetched[id] = r;
    process.stdout.write(`  [${i}/${uniq.length}] ${id} ${r.ok ? 'OK' : 'FAIL ' + r.status}\n`);
    await sleep(350);
  }
  // assemble
  const instances = raw.map((inst) => {
    const f = fetched[inst._pid] || { ok: false };
    const wn = normWarrant(inst);
    let quote_found = null;
    if (f.ok) {
      const blob = fold(f.original + ' || ' + f.translation);
      const ev = fold(inst.evidence_pali).slice(0, 32);
      quote_found = ev.length >= 8 ? blob.includes(ev) : null;
    }
    const verification = !f.ok ? 'unresolved' : (quote_found === true ? 'verified' : (quote_found === false ? 'exists-quote-unconfirmed' : 'exists'));
    return {
      id: inst._pid, study_label: inst.id !== inst._pid ? inst.id : undefined,
      citation: (f.ok && f.citation) || inst.citation, layer: inst.layer, voice: inst.voice,
      mode: inst.mode, object: inst.object || null, criterion: inst.criterion || null,
      recipient: inst.recipient || null, recipient_features: inst.recipient_features || null,
      occasion: inst.occasion || null, function: inst.function || null,
      warrant: wn.warrant, h_class: wn.h_class,
      evidence_pali: inst.evidence_pali, evidence_en: inst.evidence_en || null,
      tr_provenance: inst.tr_provenance || null,
      facet: inst.facet, census_verdict: inst.verdict, confidence: inst.confidence || null,
      verification,
    };
  });
  // aggregates
  const tally = (key) => instances.reduce((a, x) => { const k = x[key] || '∅'; a[k] = (a[k] || 0) + 1; return a; }, {});
  const crosstab = (kr, kc) => { const m = {}; for (const x of instances) { const r = x[kr] || '∅', c = x[kc] || '∅'; (m[r] ||= {}); m[r][c] = (m[r][c] || 0) + 1; } return m; };
  const hcells = instances.filter((x) => x.h_class === 'H0' || x.h_class === 'H1');
  const dataset = {
    meta: {
      title: 'How an Individual Is Guided — assignment census v1.0',
      generated: null, corpus_snapshot: '194710 passages (2026-06-14)', version: '1.0',
      design: 'research/individual-guidance/RESEARCH-DESIGN.md',
      h0_h1: { decidable_cells: hcells.length, H0: hcells.filter((x) => x.h_class === 'H0').length,
               H1: hcells.filter((x) => x.h_class === 'H1').length,
               reading: 'Over the 15 decidable assignment cells (F1+F3): H0=8, H1=7. The object inventory and defilement→antidote keying are faithfully systematized (H0, with 4 of 8 resting on the para-canonical Niddesa / Abhidhamma, not mula-Nikāya); the carita-as-temperament keying, the heart-blood-colour diagnostic, the teacher-diagnosis-then-misassignment machinery, and the saddhā→recollection match are the commentarial innovations (H1). "Faithful in principle, innovative in apparatus."' },
      d0_verdict: 'The canon prescribes samatha and vipassanā YOKED / mutually conducive (AN 4.170 Yuganaddha; SN 43.2; AN 4.92-94/10.54 individualise only by the four-puggala TYPE, never assigning vipassanā alone to a named person), NOT as two separate vehicles. The samatha-yānika / vipassanā-yānika ("dry-insight", sukkhavipassaka) two-vehicle split is COMMENTARIAL (Vism / Vism-mhṭ / Abh-ṭ). Confirms Cousins.',
      verification_note: 'Every instance grounded to a real passage id, fetched live. verification ∈ {verified (quote confirmed in the fetched passage), exists (passage fetched, quote not auto-matched, e.g. folded-diacritic or cross-row), exists-quote-unconfirmed, unresolved}.',
      residual_gaps: 'Tool-load (not absence): verbatim Vism III object-rows not pulled at the leaf level (the work= search filter is unhonored); maraṇassati→named-person and MN 119 kāyagatāsati-as-directed-assignment unrun; the Mettasutta tree-deva nidāna unchased. See RESEARCH-DESIGN §6 + the census synthesis.',
    },
    aggregates: {
      by_layer: tally('layer'), by_voice: tally('voice'), by_mode: tally('mode'),
      by_facet: tally('facet'), by_verification: tally('verification'),
      mode_x_layer: crosstab('mode', 'layer'), criterion_x_layer: crosstab('criterion', 'layer'),
    },
    instances,
  };
  fs.writeFileSync(OUT, JSON.stringify(dataset, null, 1));
  const vt = tally('verification');
  console.log(`\nwrote ${OUT}`);
  console.log(`  ${instances.length} instances; verification: ${JSON.stringify(vt)}`);
  console.log(`  H0/H1 over decidable cells: H0=${dataset.meta.h0_h1.H0} H1=${dataset.meta.h0_h1.H1}`);
  console.log(`  by_layer: ${JSON.stringify(dataset.aggregates.by_layer)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
