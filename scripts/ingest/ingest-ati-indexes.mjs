// Parse ATI's index-*.html files into passage_tags rows.
//
// Most ATI indexes are a long <dt>/<dd> definition list:
//   <dt>Ant-hill:</dt>
//   <dd>... <a href="tipitaka/mn/mn.023.than.html">MN 23</a> ...</dd>
//
// The <dt> text is the tag value (the simile / name / subject); each
// <a href="tipitaka/..."> in the <dd> is a passage reference.
//
// index-title.html uses a different layout: <ul class='index'>/<li>,
// where the anchor TEXT (not a sibling <dt>) is the title, and every
// <a href> inside the li is a possible passage reference. In practice
// most title-index entries link to nikāya index pages or articles, not
// individual suttas, so the resolved-tag count is small — that's
// expected, we still parse the file for completeness.
//
// We extract sutta IDs from ATI's file path convention and map to our
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

// `layout: 'dl'` — <dt>label</dt><dd>...links...</dd>
// `layout: 'ul'` — <ul class='index'><li><a href>label</a> ... </li>
//   (only index-title.html uses this)
const INDEXES = [
  { file: 'index-similes.html', tag_type: 'simile',  layout: 'dl' },
  { file: 'index-names.html',   tag_type: 'name',    layout: 'dl' },
  { file: 'index-subject.html', tag_type: 'subject', layout: 'dl' },
  { file: 'index-title.html',   tag_type: 'title',   layout: 'ul' },
  { file: 'index-number.html',  tag_type: 'number',  layout: 'dl' },
];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// A handful of named entities show up in ATI labels — decode rather
// than drop, so titles keep their diacritics (Ñāṇamoli, Pāṭimokkha).
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', Ntilde: 'Ñ', ntilde: 'ñ',
};

// Strip HTML and decode entities from an index label.
function cleanLabel(html) {
  let s = html;
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  s = s.replace(/&([a-z]+);/gi, (m, name) =>
    Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : ''
  );
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

  // Emit a {label, href} for every link in the file along with its
  // governing label (the <dt> for dl indexes, the anchor text for the
  // first tipitaka-style <a> of a <li> in ul indexes).
  function* entriesFromHtml(html, layout) {
    if (layout === 'dl') {
      const re = /<dt>([\s\S]*?)<\/dt>([\s\S]*?)(?=<dt>|<\/dl>)/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        const label = cleanLabel(m[1]);
        if (!label) continue;
        const linkRe = /<a\s+[^>]*href=["']([^"']+)["']/gi;
        let lm;
        while ((lm = linkRe.exec(m[2])) !== null) {
          yield { label, href: lm[1] };
        }
      }
      return;
    }
    // ul layout: each <li> inside <ul class='index'> ... </ul>.
    // The label is the text of the first <a> in the li (typically the
    // title link); every <a href='tipitaka/…'> in the li produces a
    // (label, href) pair against that title. Entries with no anchor
    // (rare: quoted-text-only suttas like '"Anatta According to …"')
    // are skipped — they wouldn't have a tipitaka link anyway.
    const ulRe = /<ul\s+class=['"]index['"]\s*>([\s\S]*?)<\/ul>/gi;
    let ulm;
    while ((ulm = ulRe.exec(html)) !== null) {
      const ulBody = ulm[1];
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let lim;
      while ((lim = liRe.exec(ulBody)) !== null) {
        const liBody = lim[1];
        // Title = text of first <a> with non-empty visible content.
        let label = '';
        const titleRe = /<a\b[^>]*>([\s\S]*?)<\/a>/i;
        const titleMatch = titleRe.exec(liBody);
        if (titleMatch) label = cleanLabel(titleMatch[1]);
        if (!label) continue;
        const linkRe = /<a\s+[^>]*href=["']([^"']+)["']/gi;
        let lm;
        while ((lm = linkRe.exec(liBody)) !== null) {
          yield { label, href: lm[1] };
        }
      }
    }
  }

  for (const { file, tag_type, layout } of INDEXES) {
    const full = path.join(ATI_ROOT, file);
    if (!fs.existsSync(full)) {
      console.warn(`Skip ${file} (missing)`);
      continue;
    }
    const html = fs.readFileSync(full, 'utf8');
    let perFile = 0;
    let perFileResolved = 0;
    for (const { label, href } of entriesFromHtml(html, layout)) {
      if (!/^tipitaka\//.test(href) && !/\/tipitaka\//.test(href)) continue;
      totalLinks++;
      perFile++;
      const pid = atiHrefToId(href);
      if (pid && ourIds.has(pid)) {
        resolved++;
        perFileResolved++;
        allTags.push({
          passage_id: pid,
          tag_type,
          tag_value: label.slice(0, 200),
          source: 'ati',
        });
      }
    }
    console.log(`  ${file} (${layout}): ${perFile} tipitaka links · ${perFileResolved} resolved`);
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
