// Parse ATI's index-*.html files into passage_tags rows.
//
// Each ATI index is a long <dt>/<dd> definition list:
//   <dt>Ant-hill:</dt>
//   <dd>... <a href="tipitaka/mn/mn.023.than.html">MN 23</a> ...</dd>
//
// The <dt> text is the tag value (the simile / name / subject); each
// <a href="tipitaka/..."> in the <dd> is a passage reference. We
// extract sutta IDs from ATI's file path convention and map to our
// canonical passage IDs (mn23, dn22, sn47.19, dhp21, …). Anything we
// can't resolve gets logged and skipped — better to have fewer
// confident tags than wrong ones.
//
// Usage (with flyctl proxy 15432 → dhamma-pg):
//   cd scripts/ingest
//   DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
//     node ingest-ati-indexes.mjs

import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

const ATI_ROOT = 'C:/Users/isaac/OneDrive/Desktop/pokemon/accesstoinsight/ati';

const INDEXES = [
  { file: 'index-similes.html', tag_type: 'simile' },
  { file: 'index-names.html',   tag_type: 'name' },
  { file: 'index-subject.html', tag_type: 'subject' },
  { file: 'index-title.html',   tag_type: 'title' },
  { file: 'index-number.html',  tag_type: 'number' },
];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Strip HTML and entities from a <dt> label.
function cleanLabel(html) {
  let s = html;
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&[a-z]+;/gi, '');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[.:]+$/, '');
  return s;
}

// ATI href → our passage id. Returns null if we can't resolve.
// Examples that should map:
//   tipitaka/mn/mn.023.than.html      → mn23
//   tipitaka/dn/dn.02.0.than.html     → dn2
//   tipitaka/sn/sn47/sn47.019.than.html → sn47.19
//   tipitaka/kn/dhp/dhp.21.than.html  → dhp.21 (Dhammapada *chapter*,
//                                       which we don't carry as a
//                                       single passage — gets skipped
//                                       when no match exists)
//   tipitaka/kn/snp/snp.3.08.than.html → snp3.8
//   tipitaka/an/an05/an05.028.than.html → an5.28
function atiHrefToId(href) {
  if (!href) return null;
  href = href.split('#')[0];
  const filename = href.split('/').pop();
  // Match: stem (alpha + digits with possible dots) before .{translator}.html
  // Translators include than, wlsh, irel, olen, budd, nypo, piya, nymo,
  // bodh, niza, hekh, nara, soma, kandy, kelly, harvey, sonadhammo,
  // nizamis, narada, amaravati-sangha, nanamoli-bodhi, vajira,
  // sister-uppalavanna, hecker, nyanasatta, horner, hare, ...
  const m = filename.match(/^([a-z]+\d?[a-z]*[\d.-]+?)\.[a-z-]+\.html$/i);
  if (!m) return null;
  let stem = m[1];
  // Normalize numeric components: drop leading zeros.
  stem = stem.replace(/(\.|^|[a-z])0+(\d)/gi, '$1$2');
  // Drop trailing ".0" — dn.02.0 → dn2.0 → dn2
  stem = stem.replace(/\.0$/, '');
  // Collapse the first "letter+dot+digit" into "letter+digit" for the
  // canonical SC form: "mn.63" → "mn63", "dn.2" → "dn2", but leave
  // multi-part IDs alone: "sn47.19" → "sn47.19".
  stem = stem.replace(/^([a-z]+)\.(\d+)/i, '$1$2');
  return stem.toLowerCase();
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: false });

  // Pre-load known passage IDs so we can filter on the fly. ~26K rows
  // currently — cheap to hold in memory.
  const ourIds = new Set();
  const rows = await sql`SELECT id FROM passages`;
  for (const r of rows) ourIds.add(r.id);
  console.log(`Known passages: ${ourIds.size}`);

  await sql`DELETE FROM passage_tags WHERE source = 'ati'`;
  console.log('Cleared existing ATI tags');

  const allTags = [];
  let totalLinks = 0;
  let resolved = 0;

  for (const { file, tag_type } of INDEXES) {
    const full = path.join(ATI_ROOT, file);
    if (!fs.existsSync(full)) {
      console.warn(`Skip ${file} (missing)`);
      continue;
    }
    const html = fs.readFileSync(full, 'utf8');
    // Match every <dt>…</dt> immediately followed (whitespace allowed)
    // by one or more <dd>…</dd> blocks. We collect the links from the
    // whole sequence of dd's between this dt and the next.
    const re = /<dt>([\s\S]*?)<\/dt>([\s\S]*?)(?=<dt>|<\/dl>)/gi;
    let perFile = 0;
    let m;
    while ((m = re.exec(html)) !== null) {
      const label = cleanLabel(m[1]);
      if (!label) continue;
      // Find all <a href="tipitaka/..."> in the dd block
      const linkRe = /<a\s+[^>]*href=["']([^"']+)["']/gi;
      let lm;
      while ((lm = linkRe.exec(m[2])) !== null) {
        const href = lm[1];
        if (!/^tipitaka\//.test(href) && !/\/tipitaka\//.test(href)) continue;
        totalLinks++;
        const pid = atiHrefToId(href);
        if (pid && ourIds.has(pid)) {
          resolved++;
          allTags.push({
            passage_id: pid,
            tag_type,
            tag_value: label.slice(0, 200), // cap pathological labels
            source: 'ati',
          });
        }
      }
      perFile++;
    }
    console.log(`  ${file}: ${perFile} entries processed`);
  }

  console.log(`Total links: ${totalLinks} · resolved to passages: ${resolved}`);

  // Dedupe by composite key
  const dedup = new Map();
  for (const t of allTags) {
    const k = `${t.passage_id}|${t.tag_type}|${t.tag_value}`;
    if (!dedup.has(k)) dedup.set(k, t);
  }
  const list = Array.from(dedup.values());
  console.log(`Deduped to ${list.length} unique tags`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH);
    await sql`
      INSERT INTO passage_tags ${sql(batch, 'passage_id', 'tag_type', 'tag_value', 'source')}
      ON CONFLICT (passage_id, tag_type, tag_value, source) DO NOTHING
    `;
    inserted += batch.length;
  }
  console.log(`Inserted ${inserted} rows`);

  // Smoke checks
  const byType = await sql`
    SELECT tag_type, COUNT(*)::int AS n
    FROM passage_tags WHERE source = 'ati'
    GROUP BY tag_type ORDER BY n DESC
  `;
  console.log('\nBy type:');
  for (const r of byType) console.log(`  ${r.tag_type.padEnd(10)} ${r.n}`);

  const sampleMN10 = await sql`
    SELECT tag_type, tag_value FROM passage_tags
    WHERE passage_id = 'mn10' AND source = 'ati'
    ORDER BY tag_type, tag_value LIMIT 10
  `;
  console.log('\nmn10 tags:');
  for (const r of sampleMN10) console.log(`  ${r.tag_type}: ${r.tag_value}`);

  await sql.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
