// Phase 2 of CST → SC translation linking. Handles CST mūla passages
// whose xml_div_id didn't deterministically derive to an SC id — mostly
// AN/SN where CST groups by vagga (an1_5) while SC groups by sutta
// range (an1.41-50) or flat sutta numbering.
//
// Strategy: SC's bilara-data formatting embeds the vagga name in the
// passage's `original` text as a prefix — e.g., "Aṅguttara Nikāya 1
// 5. Paṇihitaacchavagga 41 …". The CST passage's `title` field is the
// same vagga name ("5. Paṇihitaacchavaggo", with the -o nominative
// ending). Normalize both and match.
//
// Run after link-cst-translations.mjs has done the easy direct-id cases.
//
// Use:
//   node link-cst-vagga.mjs           # dry-run
//   node link-cst-vagga.mjs --apply

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

// Normalize a vagga name for fuzzy matching across editions:
//   "5. Paṇihitaacchavaggo"  →  "panihitaacchavagga"
//   "Paṇihitaacchavagga"     →  "panihitaacchavagga"
// Strips number prefix, lowercases, removes diacritics, normalizes
// nominative -o → stem -a so CST "vaggo" and SC "vagga" both → "vagga".
function normVagga(s) {
  if (!s) return '';
  let x = String(s).toLowerCase();
  x = x.replace(/^\(\d+\)\s*/, '');     // strip "(6) " parenthesized part marker
  x = x.replace(/^\d+\.\s*/, '');       // strip "1. "
  // Diacritics → bare letters
  x = x.replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ū/g, 'u');
  x = x.replace(/[ṃṁ]/g, 'm').replace(/ṅ/g, 'n').replace(/ṇ/g, 'n');
  x = x.replace(/ṭ/g, 't').replace(/ḍ/g, 'd').replace(/ḷ/g, 'l').replace(/ñ/g, 'n');
  // CST -o (nominative) vs SC -a (stem) ending — unify
  x = x.replace(/o$/, 'a');
  return x.replace(/\s+/g, '').trim();
}

// Pull all unlinked CST sutta mūla passages.
const cstRows = await sql`
  SELECT id, work_slug, xml_div_id, citation, title
  FROM passages
  WHERE source_edition='cst' AND work_role='mula'
    AND work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an')
    AND (translation IS NULL OR length(trim(translation)) = 0)
`;
console.log(`[link-vagga] ${cstRows.length} unlinked CST sutta mūla passages`);

// Pull all SC pli-{dn,mn,sn,an} passages with translations. Index by
// work_slug + nipāta + vagga-name so collisions across nipātas (like
// "Mahāvagga" appearing in AN 3, 5, 6, …) don't cause wrong matches.
const scRows = await sql`
  SELECT id, work_slug, substring(original, 1, 200) AS head, translation
  FROM passages
  WHERE source_edition='sc'
    AND work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an')
    AND translation IS NOT NULL
`;
console.log(`[link-vagga] ${scRows.length} SC sutta translations to match against`);

// Extract (nipāta, vaggaName) from an SC head string. bilara prefixes
// take two shapes:
//   "Aṅguttara Nikāya 1 1. Rūpādivagga 1 Evaṁ me sutaṁ—"   ← range
//   "Aṅguttara Nikāya 5.60 6. Nīvaraṇavagga Dutiyavuḍḍha"  ← single sutta
//   "Sa(ṁ|ṃ)yutta Nikāya 1.24 3. Sattivagga Manonivāraṇa"  ← SN
// In all of them the first number is the nipāta/saṃyutta, then a vagga
// ordinal+name (always ending in "vagga"). Returns null if not parseable.
function scKey(workSlug, head) {
  const m = head.match(/Nik[āa]ya\s+(\d+)(?:\.\d+)?\s+\d+\.\s+(\S+vagga\S*)/i);
  if (m) return { nipata: m[1], vagga: m[2] };
  return null;
}

const vaggaIndex = new Map();   // key = `${work_slug}::${nipata}::${normVagga}` → list of SC rows
for (const sc of scRows) {
  const k = scKey(sc.work_slug, sc.head);
  if (!k) continue;
  const key = `${sc.work_slug}::${k.nipata}::${normVagga(k.vagga)}`;
  if (!vaggaIndex.has(key)) vaggaIndex.set(key, []);
  vaggaIndex.get(key).push(sc);
}
console.log(`[link-vagga] indexed ${vaggaIndex.size} distinct (work, nipāta, vagga) keys`);

// Extract nipāta number from a CST xml_div_id like an5_3_3 → "5".
function cstNipata(xmlDivId) {
  const m = xmlDivId?.match(/^[a-z]+(\d+)/);
  return m ? m[1] : null;
}

// Match each CST passage against the index.
let linked = 0, missed = 0;
const sample = [];
for (const cst of cstRows) {
  if (!cst.title) { missed++; continue; }
  const nipata = cstNipata(cst.xml_div_id);
  if (!nipata) { missed++; continue; }
  const key = `${cst.work_slug}::${nipata}::${normVagga(cst.title)}`;
  const hits = vaggaIndex.get(key);
  if (!hits || hits.length === 0) { missed++; continue; }
  // Concatenate all SC translations in this vagga in their natural
  // order (sorted by sutta number embedded in id).
  hits.sort((a, b) => {
    const na = parseInt((a.id.match(/\.(\d+)/) || [])[1] || '0', 10);
    const nb = parseInt((b.id.match(/\.(\d+)/) || [])[1] || '0', 10);
    return na - nb;
  });
  const joined = hits.map((h) => h.translation).join('\n\n');
  const note = `translation linked from SC vagga ${cst.work_slug} nipāta ${nipata} "${cst.title}" (${hits.length} sutta${hits.length === 1 ? '' : 's'})`;
  if (sample.length < 6) {
    sample.push({ cst: cst.id, title: cst.title, scCount: hits.length, firstSc: hits[0].id });
  }
  if (args.apply) {
    await sql`UPDATE passages SET translation = ${joined}, notes = ${note} WHERE id = ${cst.id}`;
  }
  linked++;
}

console.log(`\n[link-vagga] ${args.apply ? 'linked' : 'would link'}: ${linked}, missed: ${missed}`);
if (sample.length > 0) {
  console.log('sample:');
  for (const s of sample) {
    console.log(`  ${s.cst} (${s.title}) → ${s.scCount} SC suttas starting with ${s.firstSc}`);
  }
}
if (!args.apply && linked > 0) console.log('\n[dry-run] re-run with --apply');
await sql.end();
