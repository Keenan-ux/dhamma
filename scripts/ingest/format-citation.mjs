// Citation formatter for passage IDs. Lives in its own module so the
// migration script (and anything else that wants this function) can
// import it without dragging in ingest.mjs's top-level main() — which
// auto-runs an ingest on import. That side effect cost us a runaway
// re-embed of the full corpus before this got extracted.
//
// See the in-tree migrate-citations.mjs for the consumer. The ingest
// pipeline (ingest.mjs) imports from this module too.

// Scholarly short citation for a given sutta/work id. Default: split
// first letter run from first digit run (mn10 → "MN 10"). Vinaya IDs
// get a readable form because raw `pli-tv-bi-vb-pj1-4` is unreadable.
//
// Vinaya patterns (Theravāda):
//   pli-tv-{bu,bi}-vb-{rule}<num>   → "Bhu./Bhi. {Rule}. <num>"
//   pli-tv-{bu,bi}-pm               → "Bhu./Bhi. Pm."   (Pātimokkha)
//   pli-tv-kd<num>                  → "Vin. Kd. <num>"  (Khandhaka)
//   pli-tv-pvr-*                    → "Vin. Pvr. ..."   (Parivāra)
//
// Rule abbreviations used by SuttaCentral CST:
//   pj=Pārājika, sg/sa/sd=Saṅghādisesa, ay=Aniyata,
//   np=Nissaggiya Pācittiya, pc=Pācittiya, pd=Pāṭidesanīya,
//   sk=Sekhiya, as=Adhikaraṇasamatha, nd=Nidāna
const VINAYA_RULE = {
  pj: 'Pj.', sg: 'Sg.', sa: 'Sg.', sd: 'Sg.',
  ay: 'Ay.', np: 'Np.', pc: 'Pc.', pd: 'Pd.',
  sk: 'Sk.', as: 'As.', nd: 'Nd.',
};

export function formatCitation(id) {
  if (!id) return '';
  // Vinaya: pli-tv-{role}-vb-{rule}{num}
  const m = id.match(/^pli-tv-(bu|bi)-vb-([a-z]+?)(\d.*)$/);
  if (m) {
    const role = m[1] === 'bu' ? 'Bhu.' : 'Bhi.';
    const rule = VINAYA_RULE[m[2]] || `${m[2][0].toUpperCase()}${m[2].slice(1)}.`;
    return `${role} ${rule} ${m[3]}`;
  }
  // Vinaya: pli-tv-{role}-pm (Pātimokkha)
  const pm = id.match(/^pli-tv-(bu|bi)-pm/);
  if (pm) return `${pm[1] === 'bu' ? 'Bhu.' : 'Bhi.'} Pm.`;
  // Vinaya: pli-tv-kd{num} (Khandhaka)
  const kd = id.match(/^pli-tv-kd(\d.*)$/);
  if (kd) return `Vin. Kd. ${kd[1]}`;
  // Vinaya: pli-tv-pvr{num} or pli-tv-pvr-*
  const pvr = id.match(/^pli-tv-pvr-?(.*)$/);
  if (pvr) return pvr[1] ? `Vin. Pvr. ${pvr[1]}` : 'Vin. Pvr.';
  // Default: split first letter run from first digit run.
  return id.toUpperCase().replace(/^([A-Z]+)(\d)/, '$1 $2');
}
