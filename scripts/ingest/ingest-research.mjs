// Ingest compiled research markdown docs as admin-gated `articles`
// (category='research', source='research'). They render in the Research tab
// via /api/research (requireAdmin) and never appear in the public Library
// (which filters source='ati'). Idempotent: upserts on slug.
//
// Run locally against dhamma-pg through the proxy:
//   flyctl proxy 15432:5432 --app dhamma-pg   # in another shell
//   DATABASE_URL=postgres://postgres:<pw>@127.0.0.1:15432/dhamma \
//     node scripts/ingest/ingest-research.mjs
//
// Add new studies by appending to DOCS below.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const DOCS = [
  { slug: 'intoxicants-findings', file: 'research/intoxicants/FINDINGS.md',
    title: 'The Buddha on Drugs and Alcohol — Findings',
    summary: 'Verified study of every canonical reference to intoxicants: the fifth precept, the Vinaya rule, medicinal alcohol, psychedelics, Soma, and ego-death vs anattā.' },
  { slug: 'intoxicants-handoff', file: 'research/intoxicants/HANDOFF.md',
    title: 'Intoxicants Study — Coordinator Handoff',
    summary: 'The tool-evaluation track: pain points, prioritized feature backlog, and the verification ledger from the intoxicants study.' },
  { slug: 'tooling-and-process', file: 'research/TOOLING-AND-PROCESS.md',
    title: 'Improving Dhamma as a Research Instrument',
    summary: 'Targeted and generalized, measurable improvements to the corpus tool and the research process, with an evaluation-harness proposal.' },
  // Meditation-objects study lands here once its findings doc is written:
  // { slug: 'meditation-objects-findings', file: 'research/meditation-objects/FINDINGS.md', title: '…', summary: '…' },
];

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Inline markdown → HTML, on already-escaped text. Order matters: code spans
// first (so their contents aren't re-formatted), then links, bold, italic.
function inline(s) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, (_, b) => `<strong>${b}</strong>`);
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, (_, pre, i) => `${pre}<em>${i}</em>`);
  return out;
}

// Block-level markdown → HTML. Handles headings, hr, fenced code, blockquotes,
// pipe tables, ordered/unordered lists, and paragraphs. Tuned for the project's
// own docs (we control the input), not a general-purpose parser.
function md2html(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;
  const isTableSep = (l) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes('-');
  while (i < lines.length) {
    let line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(esc(lines[i])); i++; }
      i++; // closing fence
      html.push(`<pre><code>${buf.join('\n')}</code></pre>`);
      continue;
    }
    // Horizontal rule
    if (/^\s*(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) { html.push('<hr />'); i++; continue; }
    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const n = h[1].length; html.push(`<h${n}>${inline(h[2].trim())}</h${n}>`); i++; continue; }
    // Blockquote (one or more consecutive > lines)
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(inline(lines[i].replace(/^\s*>\s?/, ''))); i++; }
      html.push(`<blockquote>${buf.join('<br />')}</blockquote>`);
      continue;
    }
    // Pipe table: a header row followed by a separator row.
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const splitRow = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') { rows.push(splitRow(lines[i])); i++; }
      const thead = '<tr>' + header.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr>';
      const tbody = rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('');
      html.push(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);
      continue;
    }
    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { buf.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`); i++; }
      html.push(`<ul>${buf.join('')}</ul>`);
      continue;
    }
    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`); i++; }
      html.push(`<ol>${buf.join('')}</ol>`);
      continue;
    }
    // Blank line
    if (line.trim() === '') { i++; continue; }
    // Paragraph: gather until blank or a block-starter.
    const buf = [];
    while (i < lines.length && lines[i].trim() !== ''
           && !/^(#{1,6}\s|```|\s*>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])
           && !/^\s*(-{3,}|_{3,}|\*{3,})\s*$/.test(lines[i])) {
      buf.push(inline(lines[i])); i++;
    }
    if (buf.length) html.push(`<p>${buf.join(' ')}</p>`);
  }
  return html.join('\n');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. Start the dhamma-pg proxy and export it.');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 2 });
  let n = 0;
  try {
    for (const doc of DOCS) {
      const abs = path.join(ROOT, doc.file);
      if (!fs.existsSync(abs)) { console.warn(`skip (missing): ${doc.file}`); continue; }
      const md = fs.readFileSync(abs, 'utf8');
      const body = md2html(md);
      await sql`
        INSERT INTO articles (slug, title, author, category, source, body, summary, year)
        VALUES (${doc.slug}, ${doc.title}, ${'Dhamma research'}, ${'research'}, ${'research'},
                ${body}, ${doc.summary || null}, ${2026})
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title, author = EXCLUDED.author, category = EXCLUDED.category,
          source = EXCLUDED.source, body = EXCLUDED.body, summary = EXCLUDED.summary, year = EXCLUDED.year`;
      console.log(`upserted research/${doc.slug} (${body.length} chars html)`);
      n++;
    }
    console.log(`done — ${n} research articles upserted.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
