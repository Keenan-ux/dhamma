// Link CST mūla passages to their SC twin's English translation.
//
// CST mūla and SC mūla cover the same canonical Pali (Burmese 6th Council
// vs Mahāsaṅgīti edition — 99% identical), but only SC ships with
// translations (Sujato, Brahmali). For each CST mūla passage, derive
// the corresponding SC id from xml_div_id and copy the translation.
//
// xml_div_id conventions (CST → SC):
//   pli-dn:  dn<vol>_<sutta>      → dn<sutta>            (dn1_5 → dn5)
//   pli-mn:  mn<vol>_<sutta>      → mn<sutta>            (mn2_60 → mn60)
//   pli-sn:  sn<sam>_<sutta>      → sn<sam>.<sutta>      (sn1_10 → sn1.10)
//                                    or sn<sam>.<vagga>.<sutta>
//   pli-an:  an<nipata>_<v>_<s>   → an<nipata>.<v>.<s>   (an6_2_4 → an6.2.4)
//
// Volume-wrapper passages (xml_div_id like `dn1`, `sn5`) have no SC
// equivalent — those are colophons/uddānas, skipped.
//
// Use:
//   node link-cst-translations.mjs            # dry run, shows coverage
//   node link-cst-translations.mjs --apply    # commit the UPDATEs

import postgres from 'postgres';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

// Returns array of candidate SC ids (most-likely first) for a CST mūla
// passage given its xml_div_id and work_slug. Empty array if no clean
// derivation.
function deriveScCandidates(workSlug, xmlDivId) {
  if (!xmlDivId) return [];

  // DN/MN: <canon><vol>_<sutta>  →  <canon><sutta>
  let m = xmlDivId.match(/^(dn|mn)\d+_(\d+)$/);
  if (m && (workSlug === 'pli-dn' || workSlug === 'pli-mn')) {
    return [m[1] + m[2]];
  }

  // SN: sn<sam>_<sutta>            →  sn<sam>.<sutta>
  //     sn<sam>_<sutta>_<x>        →  sn<sam>.<sutta>.<x>
  if (workSlug === 'pli-sn') {
    m = xmlDivId.match(/^sn(\d+(?:_\d+)+)$/);
    if (m) return ['sn' + m[1].replace(/_/g, '.')];
  }

  // AN: an<nipata>_<vagga>_<sutta> →  an<nipata>.<vagga>.<sutta>
  //     SC sometimes groups (an1.1-10) — caller falls back to citation
  //     match for those after this exact lookup misses.
  if (workSlug === 'pli-an') {
    m = xmlDivId.match(/^an(\d+(?:_\d+)+)$/);
    if (m) return ['an' + m[1].replace(/_/g, '.')];
  }

  // KN families: CST xml_div_id is kn<vol>_<n>. SC routes by sub-work
  // slug (pli-dhp, pli-snp, etc.) not pli-kn, so a direct id lookup
  // generally won't find anything — leave it to manual mapping.

  return [];
}

const cstRows = await sql`
  SELECT id, work_slug, xml_div_id, citation, length(coalesce(translation, '')) AS t_len
  FROM passages
  WHERE source_edition = 'cst' AND work_role = 'mula'
    AND xml_div_id IS NOT NULL
    AND work_slug IN ('pli-dn', 'pli-mn', 'pli-sn', 'pli-an')
`;
console.log(`[link] inspecting ${cstRows.length} CST sutta mūla passages`);

let derived = 0, found = 0, updated = 0, alreadySet = 0, noDerivation = 0, scMissing = 0;
const sample = [];

for (const cst of cstRows) {
  const candidates = deriveScCandidates(cst.work_slug, cst.xml_div_id);
  if (candidates.length === 0) {
    noDerivation++;
    continue;
  }
  derived++;
  let matched = null;
  for (const candId of candidates) {
    const [hit] = await sql`
      SELECT id, translation
      FROM passages
      WHERE id = ${candId} AND source_edition = 'sc' AND translation IS NOT NULL
      LIMIT 1
    `;
    if (hit) { matched = hit; break; }
  }
  if (!matched) { scMissing++; continue; }
  found++;
  if (cst.t_len > 0) { alreadySet++; continue; }
  if (sample.length < 8) {
    sample.push({ cst: cst.id, citation: cst.citation, sc: matched.id, len: matched.translation.length });
  }
  if (args.apply) {
    await sql`
      UPDATE passages
      SET translation = ${matched.translation},
          notes = ${`translation linked from ${matched.id} (same canonical text, different edition)`}
      WHERE id = ${cst.id}
    `;
  }
  updated++;
}

console.log(`[link] derived: ${derived}, sc-found: ${found}, no-derivation: ${noDerivation}, sc-missing: ${scMissing}`);
console.log(`[link] ${args.apply ? 'updated' : 'would update'}: ${updated} (${alreadySet} already had a translation)`);
if (sample.length > 0) {
  console.log(`\n[sample]`);
  for (const s of sample) {
    console.log(`  ${s.cst} (${s.citation}) ← ${s.sc} (${s.len} chars)`);
  }
}
if (!args.apply && updated > 0) {
  console.log(`\n[dry-run] re-run with --apply to commit`);
}
await sql.end();
