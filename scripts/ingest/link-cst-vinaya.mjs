// CST → SC translation linking for the Vinaya Piṭaka.
//
// Both editions live under work_slug = pli-vinaya. CST passages have
// xml_div_ids like vin1_1 (Verañjakaṇḍa), vin1_2 (Pārājikakaṇḍa), etc.
// SC has individual rule-level passages with bilara prefixes like
// "Theravāda Vinaya Mahāvibhaṅga Nissaggiyakaṇḍa Cīvaravagga 10.
// Rājasikkhāpada …". The kaṇḍa / vagga name appears in the head.
//
// Strategy: match CST title (the kaṇḍa name) against SC heads — same
// vagga-name approach used for the sutta-nikāya linker.
//
// Use:
//   node link-cst-vinaya.mjs            # dry-run
//   node link-cst-vinaya.mjs --apply

import postgres from 'postgres';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

function normName(s) {
  if (!s) return '';
  let x = String(s).toLowerCase();
  x = x.replace(/^\d+\.\s*/, '');
  x = x.replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ū/g, 'u');
  x = x.replace(/[ṃṁ]/g, 'm').replace(/ṅ/g, 'n').replace(/ṇ/g, 'n');
  x = x.replace(/ṭ/g, 't').replace(/ḍ/g, 'd').replace(/ḷ/g, 'l').replace(/ñ/g, 'n');
  x = x.replace(/[ṃ]$/, '').replace(/o$/, 'a').replace(/ā$/, 'a');
  return x.replace(/\s+/g, '').trim();
}

const cstRows = await sql`
  SELECT id, title, xml_div_id
  FROM passages
  WHERE source_edition='cst' AND work_role='mula' AND work_slug='pli-vinaya'
    AND (translation IS NULL OR length(trim(translation)) = 0)
`;
const scRows = await sql`
  SELECT id, substring(original, 1, 300) AS head, translation
  FROM passages
  WHERE source_edition='sc' AND work_slug='pli-vinaya' AND translation IS NOT NULL
`;
console.log(`[link-vin] ${cstRows.length} unlinked CST vinaya · ${scRows.length} SC vinaya translations`);

// Pre-normalize SC heads once.
const scIndexed = scRows.map((r) => ({ ...r, headN: normName(r.head) }));

let linked = 0, missed = 0;
const sample = [];

for (const cst of cstRows) {
  if (!cst.title) { missed++; continue; }
  const needle = normName(cst.title);
  if (needle.length < 4) { missed++; continue; }
  const hits = scIndexed.filter((sc) => sc.headN.includes(needle));
  if (hits.length === 0) { missed++; continue; }
  hits.sort((a, b) => a.id.localeCompare(b.id));
  const joined = hits.map((h) => h.translation).join('\n\n');
  const note = `translation linked from SC pli-vinaya kaṇḍa "${cst.title}" (${hits.length} rules, Brahmali tr.)`;
  if (sample.length < 6) sample.push({ cst: cst.id, title: cst.title, n: hits.length });
  if (args.apply) {
    await sql`UPDATE passages SET translation = ${joined}, notes = ${note} WHERE id = ${cst.id}`;
  }
  linked++;
}

console.log(`\n[link-vin] ${args.apply ? 'linked' : 'would link'}: ${linked}, missed: ${missed}`);
if (sample.length > 0) {
  console.log('sample:');
  for (const s of sample) console.log(`  ${s.cst.padEnd(28)} (${s.title}) ← ${s.n} SC rules`);
}
if (!args.apply && linked > 0) console.log('\n[dry-run] re-run with --apply');
await sql.end();
