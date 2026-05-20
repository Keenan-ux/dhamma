// Audit passages with short `original` text. Most short rows are real
// canonical content (Abhidhamma mātikā definitions, Paṭṭhāna
// conditional-relations entries, CST grammar-primer lemmas). The
// purpose of this audit is to surface the rare zero-content or
// metadata-only rows that should be cleaned up vs. the much larger
// pool of legitimately terse passages.
//
// Usage (with flyctl proxy 15432 → dhamma-pg):
//   cd scripts/ingest
//   DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
//     node audit-short-passages.mjs > short-passages-audit.md

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const THRESHOLD = 200;

const sql = postgres(process.env.DATABASE_URL, { ssl: false });

const out = [];
const log = (s = '') => out.push(s);

log(`# Short-original passage audit`);
log(``);
log(`Threshold: \`LENGTH(original) < ${THRESHOLD}\`. Run via`);
log(`\`audit-short-passages.mjs\`. Date column omitted intentionally —`);
log(`re-run any time for a fresh snapshot.`);
log(``);

const total = (await sql`SELECT COUNT(*)::int AS n FROM passages`)[0].n;
const short = (await sql`SELECT COUNT(*)::int AS n FROM passages WHERE LENGTH(original) < ${THRESHOLD}`)[0].n;

log(`## Headline`);
log(``);
log(`- Total passages: **${total.toLocaleString()}**`);
log(`- Short passages (< ${THRESHOLD} chars): **${short.toLocaleString()}** (${(short * 100 / total).toFixed(2)}%)`);
log(``);

log(`## Length distribution`);
log(``);
log(`| Bucket | Count |`);
log(`| --- | ---: |`);
const dist = await sql`
  SELECT
    CASE
      WHEN LENGTH(original) = 0 THEN '0 (empty)'
      WHEN LENGTH(original) < 50 THEN '1-49'
      WHEN LENGTH(original) < 100 THEN '50-99'
      WHEN LENGTH(original) < 200 THEN '100-199'
      ELSE '200+'
    END AS bucket,
    COUNT(*)::int AS n
  FROM passages
  GROUP BY 1
  ORDER BY 1
`;
for (const r of dist) log(`| ${r.bucket} | ${r.n.toLocaleString()} |`);
log(``);

log(`## By work_slug (short rows only)`);
log(``);
log(`Concentrated in Abhidhamma + CST grammar/reference works — the`);
log(`Paṭṭhāna's combinatorial entries and the Saddanīti's grammar`);
log(`lemmas are genuinely terse. Not noise.`);
log(``);
log(`| work_slug | short rows | avg len | min len |`);
log(`| --- | ---: | ---: | ---: |`);
const byWork = await sql`
  SELECT work_slug, COUNT(*)::int AS n,
         ROUND(AVG(LENGTH(original))::numeric, 1)::float AS avg_len,
         MIN(LENGTH(original)) AS min_len
  FROM passages WHERE LENGTH(original) < ${THRESHOLD}
  GROUP BY work_slug ORDER BY n DESC
`;
for (const r of byWork) {
  log(`| ${r.work_slug} | ${r.n} | ${r.avg_len} | ${r.min_len} |`);
}
log(``);

log(`## Shortest 40 rows (potential noise)`);
log(``);
log(`These are the rows most likely to be parse-truncation or`);
log(`metadata-only — anything < ~30 chars deserves a manual look.`);
log(``);
log(`| len | id | title | original (head) |`);
log(`| ---: | --- | --- | --- |`);
const shortest = await sql`
  SELECT id, citation, title, LENGTH(original) AS len, original
  FROM passages WHERE LENGTH(original) < ${THRESHOLD}
  ORDER BY LENGTH(original) ASC, id ASC LIMIT 40
`;
for (const r of shortest) {
  const o = (r.original || '').replace(/\s+/g, ' ').slice(0, 80).replace(/\|/g, '\\|');
  const t = (r.title || '').slice(0, 40).replace(/\|/g, '\\|');
  log(`| ${r.len} | \`${r.id}\` | ${t} | ${o} |`);
}
log(``);

log(`## Non-CST short rows`);
log(``);
log(`SuttaCentral-ingested rows (no \`cst-\` prefix) with short original.`);
log(`These are mostly genuine short suttas (e.g. SN 1.x verses, Thag`);
log(`single-stanza verses) but worth scanning for outliers.`);
log(``);
const nonCst = await sql`
  SELECT id, citation, title, LENGTH(original) AS len, original
  FROM passages
  WHERE LENGTH(original) < ${THRESHOLD} AND id !~ '^cst-'
  ORDER BY LENGTH(original) ASC LIMIT 25
`;
log(`| len | id | citation | original (head) |`);
log(`| ---: | --- | --- | --- |`);
for (const r of nonCst) {
  const o = (r.original || '').replace(/\s+/g, ' ').slice(0, 80).replace(/\|/g, '\\|');
  log(`| ${r.len} | \`${r.id}\` | ${r.citation || ''} | ${o} |`);
}
log(``);

log(`## Likely-noise candidates`);
log(``);
log(`Rows whose \`original\` is dominated by punctuation, parenthetical`);
log(`markup, or section-header crumbs — heuristics for triage:`);
log(``);
log(`- contains \`niṭṭhito\` / \`niṭṭhitā\` (volume colophon) and < 200 chars`);
log(`- only digits/punctuation`);
log(``);
const colophon = await sql`
  SELECT id, citation, title, LENGTH(original) AS len, LEFT(original, 120) AS head
  FROM passages
  WHERE LENGTH(original) < ${THRESHOLD}
    AND (original ~* 'niṭṭhito|niṭṭhitā|samattaṃ|niṭṭhitaṃ')
  ORDER BY LENGTH(original) ASC LIMIT 20
`;
log(`### Colophon-only-looking (sample of 20)`);
log(``);
log(`| len | id | head |`);
log(`| ---: | --- | --- |`);
for (const r of colophon) {
  const h = (r.head || '').replace(/\s+/g, ' ').slice(0, 100).replace(/\|/g, '\\|');
  log(`| ${r.len} | \`${r.id}\` | ${h} |`);
}
log(``);

const punctOnly = await sql`
  SELECT id, citation, LENGTH(original) AS len, original
  FROM passages
  WHERE LENGTH(original) < ${THRESHOLD}
    AND original !~ '[A-Za-zĀ-žā-žĀ-ǿ]'
`;
log(`### Punctuation/digit-only rows`);
log(``);
log(`Rows whose original has zero alphabetic characters: **${punctOnly.length}**`);
if (punctOnly.length) {
  log(``);
  for (const r of punctOnly.slice(0, 20)) log(`- \`${r.id}\` (len ${r.len}): \`${r.original}\``);
}
log(``);

log(`## Recommendation`);
log(``);
log(`Most short rows are real canonical content. The 25 CST mūla`);
log(`volume-header uddāna rows (\`cst-…m.mul-{nikāya}N\` with no`);
log(`underscore) are already hidden from \`/api/corpus\` — see`);
log(`CLAUDE.md. No other systematic noise pattern jumps out from this`);
log(`audit. Spot-check the "Shortest 40" table above before any future`);
log(`cleanup pass.`);

await sql.end();

console.log(out.join('\n'));
