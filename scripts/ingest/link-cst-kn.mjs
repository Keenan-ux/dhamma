// CST → SC translation linking for Khuddaka Nikāya.
//
// CST lumps everything Khuddaka under pli-kn while SC routes each
// sub-work to its own slug (pli-dhp, pli-snp, pli-ud, etc.). The
// existing same-slug linker can't see across this boundary; this
// script knows the file → sub-work mapping and bridges it.
//
// Only the sub-works that *have* SC translations are considered. The
// other Khuddaka sub-works (Apadāna, Buddhavaṃsa, Vimāna/Petavatthu,
// Niddesa, Paṭisambhidāmagga, Nettippakaraṇa, Peṭakopadesa,
// Milindapañha) have no public English in SC bilara-data and will
// stay untranslated until the AI-translation feature lands.
//
// Use:
//   node link-cst-kn.mjs            # dry-run
//   node link-cst-kn.mjs --apply

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

// CST file prefix → SC sub-work slug. Each CST passage's id encodes
// its source file as the first segment after "cst-" (e.g.,
// "cst-s0502m.mul-…" → s0502 → pli-dhp = Dhammapada).
const KN_FILE_TO_SUBSLUG = {
  s0501: 'pli-kp',    // Khuddakapāṭha
  s0502: 'pli-dhp',   // Dhammapada
  s0503: 'pli-ud',    // Udāna
  s0504: 'pli-iti',   // Itivuttaka
  s0505: 'pli-snp',   // Sutta Nipāta
  s0508: 'pli-thag',  // Theragāthā
  s0509: 'pli-thig',  // Therīgāthā
  s0512: 'pli-cp',    // Cariyāpiṭaka
  s0513: 'pli-ja',    // Jātaka (partial coverage in SC)
  s0518: 'pli-mil',   // Milindapañha (Kelly translation backfilled)
};

function normName(s) {
  if (!s) return '';
  let x = String(s).toLowerCase();
  x = x.replace(/^\(\d+\)\s*/, '').replace(/^\d+\.\s*/, '');
  x = x.replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ū/g, 'u');
  x = x.replace(/[ṃṁ]/g, 'm').replace(/ṅ/g, 'n').replace(/ṇ/g, 'n');
  x = x.replace(/ṭ/g, 't').replace(/ḍ/g, 'd').replace(/ḷ/g, 'l').replace(/ñ/g, 'n');
  x = x.replace(/o$/, 'a');
  return x.replace(/\s+/g, '').trim();
}

function cstFilePrefix(id) {
  const m = id.match(/^cst-(s\d+)/);
  return m ? m[1] : null;
}

const cstRows = await sql`
  SELECT id, title, xml_div_id
  FROM passages
  WHERE source_edition='cst' AND work_role='mula' AND work_slug='pli-kn'
    AND (translation IS NULL OR length(trim(translation))=0)
`;
console.log(`[link-kn] ${cstRows.length} unlinked CST KN passages`);

// Group CST passages by file prefix → target slug.
const bySlug = new Map();
for (const r of cstRows) {
  const file = cstFilePrefix(r.id);
  const slug = KN_FILE_TO_SUBSLUG[file];
  if (!slug) continue;  // file maps to an un-translated sub-work
  if (!bySlug.has(slug)) bySlug.set(slug, []);
  bySlug.get(slug).push(r);
}

let linked = 0, missed = 0;
const sample = [];

for (const [targetSlug, cstList] of bySlug.entries()) {
  const scRows = await sql`
    SELECT id, substring(original, 1, 300) AS head, translation
    FROM passages
    WHERE source_edition='sc' AND work_slug=${targetSlug}
      AND translation IS NOT NULL
  `;
  // slugBase = "kp", "dhp", "ud", "iti", "snp", "thag", "thig", "cp", "ja"
  const slugBase = targetSlug.replace(/^pli-/, '');

  function tryLink(cst) {
    // (1) Vagga / nipāta name match — the normalized CST title appears
    //     somewhere in the SC head. Works for sub-works whose bilara
    //     prefix actually carries the vagga name (dhp, iti, cp, thag,
    //     thig).
    const vagga = normName(cst.title);
    if (vagga.length >= 4) {
      const hits = scRows.filter((sc) => normName(sc.head).includes(vagga));
      if (hits.length > 0) return { hits, strategy: 'name' };
    }
    // (2) Leading number in CST title → SC ids matching <slugBase><N>.*.
    //     Works where SC encodes the vagga/nipāta number in the id
    //     itself (snp, ud, thag, thig, ja).
    const numMatch = cst.title?.match(/^(\d+)\./);
    if (numMatch) {
      const prefix = `${slugBase}${numMatch[1]}.`;
      const hits = scRows.filter((sc) => sc.id.startsWith(prefix));
      if (hits.length > 0) return { hits, strategy: 'number' };
    }
    // (3) Small sub-work fallback (≤ 10 SC suttas): glue the whole
    //     sub-work's translations together. Imperfect alignment but
    //     gives something to read.
    if (scRows.length <= 10) {
      return { hits: scRows, strategy: 'small-fallback' };
    }
    return null;
  }

  for (const cst of cstList) {
    const result = tryLink(cst);
    if (!result) { missed++; continue; }
    result.hits.sort((a, b) => a.id.localeCompare(b.id));
    const joined = result.hits.map((h) => h.translation).join('\n\n');
    const note = `translation linked from SC ${targetSlug} via ${result.strategy} match on "${cst.title}" (${result.hits.length} suttas)`;
    if (sample.length < 8) {
      sample.push({ cst: cst.id, title: cst.title, slug: targetSlug, n: result.hits.length, via: result.strategy });
    }
    if (args.apply) {
      await sql`UPDATE passages SET translation = ${joined}, notes = ${note} WHERE id = ${cst.id}`;
    }
    linked++;
  }
}

console.log(`\n[link-kn] ${args.apply ? 'linked' : 'would link'}: ${linked}, missed: ${missed}`);
if (sample.length > 0) {
  console.log('sample:');
  for (const s of sample) console.log(`  ${s.cst} (${s.title}) → ${s.slug}`);
}
if (!args.apply && linked > 0) console.log('\n[dry-run] re-run with --apply');
await sql.end();
