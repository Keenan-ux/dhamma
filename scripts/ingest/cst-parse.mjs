// CST/VRI TEI XML parser. Reads romn/ files and emits passages.
//
// Two structural modes observed across the 217 romn/ files:
//
//   Div-nested  — Sutta nikāya files (s####a/m/t.xml) use proper
//                 <div type="book"|"sutta"|"chapter"> nesting with
//                 <head> per div. Each <div type="sutta"|"chapter">
//                 becomes one passage.
//
//   Flat        — Vinaya (vin*), Abhidhamma (abh*), and Khuddaka
//                 extra-canonical (e*) files have zero <div> elements.
//                 Sequence of <p rend="..."> only. We chunk by
//                 <p rend="chapter|subhead|subsubhead"> boundaries.
//
// Both modes produce {section_id, title, original, xml_div_id?, work_name?}.
//
// Text extraction conventions:
//   - <pb ed="..."/>                   stripped (no text content)
//   - <hi rend="bold|italic|...">x</hi> kept inline as plain text
//   - <note>variant</note>             rewritten as " (variant)" inline
//   - Whitespace collapsed; NFC normalized
//   - First <p rend="centre"> salutation skipped (always Namo tassa…)
//   - <p rend="nikaya"> and <p rend="book"> tracked as work metadata,
//     not included in passage body

import fs from 'node:fs/promises';
import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';

// Read a CST UTF-16 LE file and return a decoded UTF-8 string with BOM stripped.
export async function readCstFile(filePath) {
  const buf = await fs.readFile(filePath);
  // UTF-16 LE BOM is FF FE. Node's TextDecoder handles 'utf-16le' but won't
  // strip the BOM byte for us, so do that manually.
  const hasBom = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe;
  const data = hasBom ? buf.subarray(2) : buf;
  return new TextDecoder('utf-16le').decode(data);
}

// Parse XML string → DOM tree. Returns top-level nodes (will include
// processing instructions, the <TEI.2> root, etc.).
function parseTeiDom(xml) {
  return new Promise((resolve, reject) => {
    const handler = new DomHandler((err, dom) => {
      if (err) reject(err); else resolve(dom);
    });
    // xmlMode: parses as XML (case-sensitive tag names, recognizes
    // self-closing tags). recognizeSelfClosing handles <pb ... />.
    const parser = new Parser(handler, {
      xmlMode: true,
      recognizeSelfClosing: true,
      decodeEntities: true,
    });
    parser.write(xml);
    parser.end();
  });
}

// Find first element by name (recursive DFS).
function findFirst(nodes, name) {
  for (const n of nodes) {
    if (n.type === 'tag' && n.name === name) return n;
    if (n.children) {
      const found = findFirst(n.children, name);
      if (found) return found;
    }
  }
  return null;
}

// Direct element children matching name(s). Single-name or array.
function elemChildren(node, names) {
  const wanted = Array.isArray(names) ? new Set(names) : new Set([names]);
  return (node.children || []).filter((c) => c.type === 'tag' && wanted.has(c.name));
}

// Inline text extraction with our text-cleanup conventions:
//   - <pb>      drop entirely
//   - <hi>      keep inner text only
//   - <note>    wrap in parentheses
//   - <head>    keep inner text (caller usually extracts <head> separately)
//   - other     recurse into children
//   - text node verbatim
function extractInlineText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.data;
  if (node.type !== 'tag') return '';

  if (node.name === 'pb') return '';
  if (node.name === 'note') {
    const inner = (node.children || []).map(extractInlineText).join('').trim();
    return inner ? ` (${inner})` : '';
  }
  if (node.name === 'hi' || node.name === 'head' || node.name === 'p') {
    return (node.children || []).map(extractInlineText).join('');
  }
  // Default: recurse into anything else (foreign, etc.)
  return (node.children || []).map(extractInlineText).join('');
}

// Collapse whitespace, NFC normalize.
function normalize(s) {
  return s.replace(/\s+/g, ' ').trim().normalize('NFC');
}

// Get rend attribute (lowercased) or empty string.
function rendOf(p) {
  return (p.attribs?.rend || '').toLowerCase();
}

// ─────────────────── Div-nested mode ───────────────────
//
// Walks <body> for <div> children. Each interior <div> contributes
// passages from its direct <p> children. Wrapper divs (which only
// contain other divs) are unwrapped — their <head> is propagated as
// section context to descendants.
//
// Two output modes:
//
//   'coarse' (default) — one passage per leaf <div>, joining all its
//                        <p> children into one bodyText. This is the
//                        historical chunking; matches what the CST
//                        ingest produced before the 2026-05 subdivision.
//
//   'fine'             — one passage per <p>, with consecutive gatha
//                        lines (gatha1/2/3/last) grouped as a single
//                        verse row to keep couplets intact. Subhead <p>
//                        elements update a "current subhead" context
//                        that becomes the title of following body rows.
//                        The leaf div's own <head> still anchors the
//                        breadcrumb. Used for Aṭṭhakathā + Ṭīkā where
//                        the original author's paragraph granularity
//                        is the right unit for search precision,
//                        translation alignment, and vector embedding.
//
// In 'fine' mode each emitted row carries:
//   section_id   — `${divId}_p${NNN}` (3-digit zero-padded ordinal)
//   xml_div_id   — leaf div id (parent grouping handle for the reader)
//   paragraph_index — 1-based ordinal within the leaf div
//   rend         — first paragraph's rend (or 'gatha' for a verse group)
//   title        — current subhead text, or leaf div's <head>, or null
//   breadcrumb   — outer-div headings, like coarse mode

const GATHA_RENDS = new Set(['gatha1', 'gatha2', 'gatha3', 'gathalast']);

function passagesFromDivs(body, mode = 'coarse') {
  const out = [];

  function emitCoarse(div, headText, nextCrumb) {
    const childPs = elemChildren(div, 'p');
    if (!childPs.length) return;
    const bodyText = childPs.map((p) => normalize(extractInlineText(p))).filter(Boolean).join(' ');
    if (!bodyText) return;
    out.push({
      section_id: div.attribs?.id || null,
      xml_div_id: div.attribs?.id || null,
      title:      headText || nextCrumb.slice(-1)[0] || null,
      breadcrumb: nextCrumb.slice(),
      original:   bodyText,
    });
  }

  function emitFine(div, headText, nextCrumb) {
    const divId = div.attribs?.id || null;
    const childPs = elemChildren(div, 'p');
    if (!childPs.length) return;

    // Walk paragraphs in source order, grouping consecutive gathas
    // and tracking the current subhead context for row titles.
    let paraIdx = 0;
    let currentSubhead = null;     // most recent <p rend="subhead"> text
    let gathaBuffer = [];           // accumulating gatha lines
    let gathaStartIdx = null;       // ordinal of the first gatha line in buffer
    const fallbackTitle = headText || nextCrumb.slice(-1)[0] || null;

    function flushGatha() {
      if (!gathaBuffer.length) return;
      const original = gathaBuffer.join(' ');
      const idx = ++paraIdx;
      out.push({
        section_id: divId ? `${divId}_p${String(idx).padStart(3, '0')}` : null,
        xml_div_id: divId,
        paragraph_index: idx,
        rend:       'gatha',
        title:      currentSubhead || fallbackTitle,
        breadcrumb: nextCrumb.slice(),
        original,
      });
      gathaBuffer = [];
      gathaStartIdx = null;
    }

    for (const p of childPs) {
      const rend = rendOf(p);
      const text = normalize(extractInlineText(p));
      if (!text) continue;

      // Subhead paragraphs are section headings inside the leaf div
      // (Buddhaghosa's own section labels). They become the title of
      // following body rows AND are emitted as their own row so the
      // heading shows up in the corpus.
      if (rend === 'subhead' || rend === 'subsubhead') {
        flushGatha();
        currentSubhead = text;
        const idx = ++paraIdx;
        out.push({
          section_id: divId ? `${divId}_p${String(idx).padStart(3, '0')}` : null,
          xml_div_id: divId,
          paragraph_index: idx,
          rend,
          title:      text,                                // heading IS its own title
          breadcrumb: nextCrumb.slice(),
          original:   text,
        });
        continue;
      }

      // Gatha grouping: consecutive gathaN lines collect into one row.
      // The "last" suffix is a strong group terminator but we also flush
      // on any non-gatha rend change.
      if (GATHA_RENDS.has(rend)) {
        if (!gathaBuffer.length) gathaStartIdx = paraIdx + 1;
        gathaBuffer.push(text);
        if (rend === 'gathalast') flushGatha();
        continue;
      }
      // Non-gatha paragraph: flush any pending gatha, then emit this <p>
      // as its own row.
      flushGatha();
      const idx = ++paraIdx;
      out.push({
        section_id: divId ? `${divId}_p${String(idx).padStart(3, '0')}` : null,
        xml_div_id: divId,
        paragraph_index: idx,
        rend:       rend || 'bodytext',
        title:      currentSubhead || fallbackTitle,
        breadcrumb: nextCrumb.slice(),
        original:   text,
      });
    }
    flushGatha();
  }

  function walk(div, breadcrumb) {
    const head = elemChildren(div, 'head')[0];
    const headText = head ? normalize(extractInlineText(head)) : null;
    const childDivs = elemChildren(div, 'div');
    const childPs   = elemChildren(div, 'p');
    const nextCrumb = headText ? [...breadcrumb, headText] : breadcrumb;

    if (childPs.length > 0) {
      if (mode === 'fine') emitFine(div, headText, nextCrumb);
      else                 emitCoarse(div, headText, nextCrumb);
    }
    for (const c of childDivs) walk(c, nextCrumb);
  }
  for (const topDiv of elemChildren(body, 'div')) walk(topDiv, []);
  return out;
}

// ─────────────────── Flat mode (no <div>) ───────────────────
//
// Iterate direct <p> children of <body>. Section-starting rends
// (subhead|subsubhead|chapter|title|book) open a new section and become
// its title.
//
// Two output modes (same shape as passagesFromDivs):
//
//   'coarse' (default) — one passage per section. All body <p>s within
//                        a section concatenate into a single original
//                        string. section_id is a 1-based section counter.
//                        Matches historical CST ingest behaviour.
//
//   'fine'             — one passage per <p>, with consecutive gatha
//                        lines (gatha1/2/3/last) grouped as a single
//                        verse row. Section heading paragraphs emit
//                        their own heading-row AND set the title
//                        context for following body rows. section_id
//                        is `${sectionCounter}_p${paraNNN}`.
//                        Used for Abhidhamma, Vinaya, Khuddaka, and
//                        Vism commentaries (the att+tik flat files)
//                        per the 2026-05 per-paragraph subdivision
//                        decision in HANDOFF.

// 'title' is context-sensitive: in the preamble (before any content) it's
// the scholarly short name of the work (e.g., "Aṭṭhasālinī nāma" at the
// head of abh01a.att.xml). After content has started, it's a section
// heading like any other. The loop handles this with a preamble guard.
const SECTION_START_RENDS = new Set(['chapter', 'subhead', 'subsubhead', 'title']);
const WORK_HEADER_RENDS   = new Set(['centre', 'nikaya', 'book']);

function passagesFromFlat(body, mode = 'coarse') {
  const out = [];
  let work_name = null;
  let sectionCounter = 0;
  let breadcrumb = [];      // [book?, chapter?, subhead?]

  // Coarse-mode accumulator: the in-flight section's joined original.
  let current = null;

  // Fine-mode state: current section context + paragraph counter inside it.
  let fineSection = null;     // { id: '1', title: '...', breadcrumb: [...] }
  let paraIdxInSection = 0;
  let gathaBuffer = [];

  function pushCurrentCoarse() {
    if (current && current.original) out.push(current);
    current = null;
  }

  function ensureFineSection() {
    // If a body paragraph arrives with no section opened, synthesize
    // an "intro" section so we don't drop content. Matches the
    // coarse-mode fallback.
    if (fineSection) return;
    sectionCounter++;
    fineSection = {
      id:         String(sectionCounter),
      title:      work_name || null,
      breadcrumb: breadcrumb.slice(),
    };
    paraIdxInSection = 0;
  }

  function flushGathaFine() {
    if (!gathaBuffer.length) return;
    ensureFineSection();
    paraIdxInSection++;
    const sectionId = `${fineSection.id}_p${String(paraIdxInSection).padStart(3, '0')}`;
    out.push({
      section_id: sectionId,
      xml_div_id: fineSection.id,
      paragraph_index: paraIdxInSection,
      rend:       'gatha',
      title:      fineSection.title,
      breadcrumb: fineSection.breadcrumb.slice(),
      original:   gathaBuffer.join(' '),
    });
    gathaBuffer = [];
  }

  function emitFineBody(rend, text) {
    ensureFineSection();
    paraIdxInSection++;
    const sectionId = `${fineSection.id}_p${String(paraIdxInSection).padStart(3, '0')}`;
    out.push({
      section_id: sectionId,
      xml_div_id: fineSection.id,
      paragraph_index: paraIdxInSection,
      rend:       rend || 'bodytext',
      title:      fineSection.title,
      breadcrumb: fineSection.breadcrumb.slice(),
      original:   text,
    });
  }

  for (const child of body.children || []) {
    if (child.type !== 'tag' || child.name !== 'p') continue;
    const rend = rendOf(child);
    const text = normalize(extractInlineText(child));
    if (!text) continue;

    if (rend === 'centre') {
      // Almost always the Namo-tassa salutation; skip.
      continue;
    }
    if (rend === 'nikaya') {
      // Work-level context like "Vinayapiṭake". Don't open a passage.
      continue;
    }
    if (rend === 'book') {
      // Descriptive long form. Only adopt if no scholarly title set.
      if (!work_name) {
        work_name = text;
        breadcrumb = [text];
      }
      continue;
    }
    // Preamble 'title' is the scholarly work name; later 'title' is a
    // section heading. The preamble window ends when the first section
    // opens (sectionCounter > 0) or any body content arrives.
    const inPreamble = mode === 'fine' ? !fineSection : !current;
    if (rend === 'title' && inPreamble && sectionCounter === 0) {
      work_name = text;       // first preamble title wins
      breadcrumb = [text];
      continue;
    }

    if (SECTION_START_RENDS.has(rend)) {
      // First chapter/subhead with no prior <p rend="book"|"title">
      // doubles as the work title — happens in a handful of files
      // (e.g., e0601n.nrf opens straight with <p rend="chapter">
      // Namakkārapāḷi). Capture it before treating it as a section.
      if (!work_name && rend === 'chapter') {
        work_name = text;
      }
      // New section boundary. Track breadcrumb depth by rend
      // granularity (chapter > subhead > subsubhead).
      const level = rend === 'chapter' ? 1 : rend === 'subhead' ? 2 : 3;  // title shares 1
      breadcrumb = breadcrumb.slice(0, level).concat([text]);

      if (mode === 'fine') {
        // Flush any pending gatha into the OLD section, then open a
        // new fineSection AND emit the heading text as its own row.
        flushGathaFine();
        sectionCounter++;
        fineSection = {
          id:         String(sectionCounter),
          title:      text,
          breadcrumb: breadcrumb.slice(),
        };
        paraIdxInSection = 0;
        emitFineBody(rend, text);   // heading is its own paragraph row
      } else {
        // Coarse: close previous, open a new accumulating passage.
        pushCurrentCoarse();
        sectionCounter++;
        current = {
          section_id: `${sectionCounter}`,
          xml_div_id: null,
          title:      text,
          breadcrumb: breadcrumb.slice(),
          original:   '',
        };
      }
      continue;
    }

    // Body content: bodytext, gathaN, indent, unindented, etc.
    if (mode === 'fine') {
      if (GATHA_RENDS.has(rend)) {
        gathaBuffer.push(text);
        if (rend === 'gathalast') flushGathaFine();
        continue;
      }
      // Non-gatha body paragraph: flush pending gatha, emit this one.
      flushGathaFine();
      emitFineBody(rend, text);
      continue;
    }

    // Coarse mode: append to current section's accumulating body.
    if (!current) {
      sectionCounter++;
      current = {
        section_id: `${sectionCounter}`,
        xml_div_id: null,
        title:      work_name || null,
        breadcrumb: breadcrumb.slice(),
        original:   '',
      };
    }
    current.original = current.original ? `${current.original} ${text}` : text;
  }
  // Flush any tail content.
  if (mode === 'fine') flushGathaFine();
  else                 pushCurrentCoarse();
  return { passages: out, work_name };
}

// ─────────────────── Entry point ───────────────────
//
// Returns {work_name, passages: [...]}. work_name is the CST-given
// <p rend="book"> when present (often more verbose than the scholarly
// short name — caller may prefer the work-map citation_prefix).
//
// Options:
//   mode: 'coarse' | 'fine'
//     'coarse' (default) — historical chunking, one passage per leaf
//                          <div>. Flat-mode files always use coarse;
//                          the flag affects div-nested mode only.
//     'fine'             — div-nested files emit one passage per <p>,
//                          gathas grouped, subheads tracked as titles.
//                          Used for att + tik ingest where the original
//                          author's paragraph granularity is the right
//                          unit. Flat mode is unaffected (vinaya,
//                          abhidhamma, Vism etc. keep their existing
//                          section chunking until a separate decision).

export async function parseCstFile(filePath, { mode = 'coarse' } = {}) {
  const xml = await readCstFile(filePath);
  const dom = await parseTeiDom(xml);
  const body = findFirst(dom, 'body');
  if (!body) {
    return { work_name: null, passages: [] };
  }

  // Try to surface <p rend="book"> as work_name regardless of mode.
  let work_name = null;
  for (const child of body.children || []) {
    if (child.type === 'tag' && child.name === 'p' && rendOf(child) === 'book') {
      work_name = normalize(extractInlineText(child));
      break;
    }
  }

  const hasDivs = elemChildren(body, 'div').length > 0;
  if (hasDivs) {
    const passages = passagesFromDivs(body, mode);
    // Sutta nikāya div files don't have <p rend="book"> at body level —
    // it lives inside the first <div type="book"><head>. Grab that as
    // a work_name if we missed it.
    if (!work_name) {
      const topDiv = elemChildren(body, 'div')[0];
      const topHead = topDiv ? elemChildren(topDiv, 'head')[0] : null;
      if (topHead) work_name = normalize(extractInlineText(topHead));
    }
    return { work_name, passages };
  } else {
    const { passages, work_name: flatName } = passagesFromFlat(body, mode);
    return { work_name: flatName || work_name, passages };
  }
}
