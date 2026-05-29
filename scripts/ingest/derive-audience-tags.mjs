// Derive an `audience` facet into passage_tags — who a canonical text is
// addressed to (monks / nuns / laypeople / kings / brahmins / devas).
//
// This is the "Audience facet" backlog item. Audience is NOT in the ATI
// indexes, so it lives under source='derived' (the ATI ingest re-runs with
// DELETE WHERE source='ati', which must never touch these rows). Re-running
// this script is idempotent: it deletes only source='derived' audience rows
// first, then re-inserts.
//
// Usage (with flyctl proxy 15432 → dhamma-pg):
//   cd scripts/ingest
//   DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
//     node derive-audience-tags.mjs
//
// ── Derivation policy: determinable signals only; log the gap, never guess ──
//
// Two kinds of evidence are used, both of which the canonical source states
// directly rather than inferring:
//
//  1. Vocative of address in the Pāli (the text literally says who it speaks
//     to). Restricted to canonical mūla (work_role='mula', excluding pli-vism)
//     so commentary glossing a word as a lemma is not mistaken for address.
//       • monks      — `bhikkhave` / `bhikkhavo`. The vocative plural; it can
//                      only be the Buddha (or an elder) addressing the monks.
//                      It has no nominative/narrative reading, so precision is
//                      effectively total.
//       • laypeople  — `gahapati` / `gahapatayo` / `gahapatāni` (householder).
//                      Slightly lower precision: gahapati's nominative and
//                      vocative singular are homographs, so a narrative "the
//                      householder said" can match. Kept because the word is
//                      not silent in the source and the facet is a discovery
//                      aid, not a citation; the imprecision is noted here.
//
//  2. Canonical structural classification (the collection is *defined* by its
//     interlocutor class). Restricted to mūla.
//       • nuns       — Bhikkhunī-vibhaṅga (id `pli-tv-bi-%`) ∪ SN 5
//                      Bhikkhunīsaṃyutta.
//       • kings      — SN 3 Kosalasaṃyutta (King Pasenadi).
//       • brahmins   — SN 7 Brāhmaṇasaṃyutta.
//       • devas      — SN 1 Devatāsaṃyutta ∪ SN 2 Devaputtasaṃyutta.
//
// Signals deliberately REJECTED to avoid fabrication (logged, not used):
//   • the bare `mahārāja` / `brāhmaṇa` lexical scans — both appear constantly
//     as narrative ("the great king Pasenadi…") or topic ("who is a true
//     brāhmaṇa"), not as address; tagging on them would invent audience where
//     the text only mentions a class. Structural SN 3 / SN 7 used instead.
//   • the `bhikkhuniyo` scan — it occurs inside the *monks'* rules ("a monk
//     who … with nuns …"), so it is not an address-to-nuns signal. Structural
//     Bhikkhunī sources used instead.
//   • Therīgāthā — verses *spoken by* elder nuns; speaker ≠ audience.
//
// DPPN was considered as a source (it classifies persons as king / brahmin /
// deva) but rejected: it would require a sutta→addressee mapping we do not
// have. ATI's name index records names *mentioned*, not *addressed*, so
// joining through it would tag audience where the source is silent.

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: false });

// Each category is one INSERT…SELECT. The `where` is a composed sql fragment;
// patterns carry Pāli diacritics and are sent as bound parameters (the
// postgres client is UTF-8 safe, unlike psql.exe argv on Windows).
const CATEGORIES = [
  {
    value: 'monks',
    where: sql`work_role = 'mula' AND work_slug <> 'pli-vism' AND original ~* ${'\\m(bhikkhave|bhikkhavo)\\M'}`,
  },
  {
    value: 'laypeople',
    where: sql`work_role = 'mula' AND work_slug <> 'pli-vism' AND original ~* ${'\\m(gahapati|gahapatayo|gahapatāni)\\M'}`,
  },
  {
    value: 'nuns',
    where: sql`id LIKE 'pli-tv-bi-%' OR (work_role = 'mula' AND citation ~ ${'^SN 5\\.'})`,
  },
  {
    value: 'kings',
    where: sql`work_role = 'mula' AND citation ~ ${'^SN 3\\.'}`,
  },
  {
    value: 'brahmins',
    where: sql`work_role = 'mula' AND citation ~ ${'^SN 7\\.'}`,
  },
  {
    value: 'devas',
    where: sql`work_role = 'mula' AND citation ~ ${'^SN [12]\\.'}`,
  },
];

async function main() {
  await sql`DELETE FROM passage_tags WHERE source = 'derived' AND tag_type = 'audience'`;
  console.log("Cleared existing source='derived' audience tags\n");

  let total = 0;
  for (const c of CATEGORIES) {
    const res = await sql`
      INSERT INTO passage_tags (passage_id, tag_type, tag_value, source)
      SELECT id, 'audience', ${c.value}, 'derived'
      FROM passages
      WHERE ${c.where}
      ON CONFLICT (passage_id, tag_type, tag_value, source) DO NOTHING
    `;
    console.log(`  audience=${c.value.padEnd(10)} ${res.count} passages`);
    total += res.count;
  }
  console.log(`\nInserted ${total} audience tag rows`);

  // ── Coverage log ── how much of the canonical sutta corpus did we reach,
  // and how much is the honest gap. Do not present the gap as covered.
  const [{ tagged }] = await sql`
    SELECT COUNT(DISTINCT passage_id)::int AS tagged
    FROM passage_tags WHERE tag_type = 'audience' AND source = 'derived'
  `;
  const [{ pool }] = await sql`
    SELECT COUNT(*)::int AS pool FROM passages
    WHERE work_role = 'mula' AND work_slug <> 'pli-vism'
  `;
  console.log(`\nCoverage: ${tagged} distinct passages carry an audience tag.`);
  console.log(`Canonical mūla (non-Vism) pool: ${pool} passages.`);
  console.log(`Uncovered (audience not determinable from the above signals): ` +
              `${pool - tagged} passages — left untagged by design, not guessed.`);

  // Verify the stopping-criterion shape: every required value present + the
  // per-value breakdown the Browse chip row will display.
  const breakdown = await sql`
    SELECT tag_value, COUNT(*)::int AS n
    FROM passage_tags WHERE tag_type = 'audience' AND source = 'derived'
    GROUP BY tag_value ORDER BY n DESC
  `;
  console.log('\nBy audience value:');
  for (const r of breakdown) console.log(`  ${r.tag_value.padEnd(10)} ${r.n}`);

  await sql.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
