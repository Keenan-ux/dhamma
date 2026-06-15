// Resolve the three partial cells in the heart-base study (§10 limits) with
// per-row verbatim grounding, and bump to v1.1.
import { readFileSync, writeFileSync } from 'node:fs'
const P = 'C:/Dev/Dhamma/public/research/heart-base-and-insight.json'
const d = JSON.parse(readFileSync(P, 'utf8'))
const row = (s) => d.rows.find(r => r.structure.startsWith(s))
const addCite = (cell, id, label) => { if (!cell.cites.some(c => c.id === id)) cell.cites.push({ id, label }) }

// 1. Bhavaṅga × commentary — the citta-vīthi is built in the Aṭṭhakathā (Atthasālinī),
//    verbatim: bhavaṅge āvaṭṭite vīthicittāni uppajjanti.
{
  const c = row('Bhavaṅga').cells.commentary
  c.text = 'Builds the full cognitive series (citta-vīthi) on the heart: when the life-continuum is turned, the cognitive-process cittas arise (bhavaṅge āvaṭṭite vīthicittāni uppajjanti).'
  addCite(c, 'cst-abh01a.att-79_p015', 'As §79')
}
// 2. Analytical categories × abhidhamma — add the missing Dhātuvibhaṅga (dhātu);
//    now the full khandha/āyatana/dhātu/paṭiccasamuppāda set.
{
  const c = row('Analytical categories').cells.abhidhamma
  c.text = "Canonical source: the Vibhaṅga's analytical chapters, one per category (khandha, āyatana, dhātu, paṭiccasamuppāda)."
  // keep order khandha(vb1) āyatana(vb2) dhātu(vb3) paṭiccasamuppāda(vb6)
  c.cites = [{ id: 'vb1', label: 'Vibh 1' }, { id: 'vb2', label: 'Vibh 2' }, { id: 'vb3', label: 'Vibh 3' }, { id: 'vb6', label: 'Vibh 6' }]
}
// 3. Named insight-ñāṇas × para-canon — the Paṭis Ñāṇakathā names them (udayabbaya, bhaṅga …).
{
  const c = row('Named insight-ñāṇas').cells['para-canon']
  c.text = 'First defined, by name, with their own niddesa sections (udayabbayānupassanā- and bhaṅgānupassanā-ñāṇa appear in the Ñāṇakathā).'
}

d.meta.version = '1.1'
d.meta.version_note = 'v1.1 (2026-06-15): resolved the three §10 partial cells with per-row verbatim grounding — the citta-vīthi via the Atthasālinī (As §79, "bhavaṅge āvaṭṭite vīthicittāni uppajjanti"); the Vibhaṅga analytical set completed with the Dhātuvibhaṅga (vb3); the Paṭis Ñāṇakathā confirmed to name the udayabbaya/bhaṅga ñāṇas.' + (d.meta.version_note ? ' | ' + d.meta.version_note : '')
writeFileSync(P, JSON.stringify(d, null, 1))
console.log('heart-base -> v' + d.meta.version + '; cites now:',
  JSON.stringify({
    bhavanga_comm: row('Bhavaṅga').cells.commentary.cites.map(c => c.id),
    analytical_abhi: row('Analytical categories').cells.abhidhamma.cites.map(c => c.id),
    nana_para: row('Named insight-ñāṇas').cells['para-canon'].cites.map(c => c.id),
  }, null, 1))
