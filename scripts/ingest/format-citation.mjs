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
//   pli-tv-{bu,bi}-vb-{rule}<num>   → "Bu/Bi {Rule} <num>"
//   pli-tv-{bu,bi}-pm               → "Bu/Bi Pātimokkha"
//   pli-tv-kd<num>                  → "Vin Kd <num>"   (Khandhaka)
//   pli-tv-pvr-*                    → "Vin Pvr"        (Parivāra)
//
// Rule abbreviations used by SuttaCentral CST:
//   pj=Pārājika, pc=Pācittiya, np=Nissaggiya Pācittiya,
//   sa/sd=Saṅghādisesa, ay=Aniyata, sr=Sekhiya,
//   as=Adhikaraṇasamatha, nd=Nidāna
export function formatCitation(id) {
  if (!id) return '';
  // Vinaya: pli-tv-{role}-vb-{rule}{num}
  const m = id.match(/^pli-tv-(bu|bi)-vb-([a-z]+?)(\d.*)$/);
  if (m) {
    const role = m[1] === 'bu' ? 'Bu' : 'Bi';
    const rule = ({
      pj: 'Pj',  pc: 'Pc',  np: 'NP',  sa: 'Sg',  sd: 'Sg',
      ay: 'Ay',  sr: 'Sk',  as: 'As',  nd: 'Nd',
    })[m[2]] || m[2].toUpperCase();
    return `${role} ${rule} ${m[3]}`;
  }
  // Vinaya: pli-tv-{role}-pm (Pātimokkha)
  const pm = id.match(/^pli-tv-(bu|bi)-pm/);
  if (pm) return `${pm[1] === 'bu' ? 'Bu' : 'Bi'} Pm`;
  // Vinaya: pli-tv-kd{num} (Khandhaka)
  const kd = id.match(/^pli-tv-kd(\d.*)$/);
  if (kd) return `Vin Kd ${kd[1]}`;
  // Vinaya: pli-tv-pvr*
  if (id.startsWith('pli-tv-pvr')) return id.toUpperCase().replace(/^PLI-TV-PVR-?/, 'Vin Pvr ');
  // Default: split first letter run from first digit run.
  return id.toUpperCase().replace(/^([A-Z]+)(\d)/, '$1 $2');
}
