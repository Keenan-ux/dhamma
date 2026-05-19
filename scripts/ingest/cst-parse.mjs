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
// Walks <body> for <div> children. Each interior <div> becomes a passage
// if it has direct <head> + <p> children. Wrapper divs (which only
// contain other divs) are unwrapped — their <head> is propagated as
// section context to descendants.

function passagesFromDivs(body) {
  const out = [];
  function walk(div, breadcrumb) {
    const head = elemChildren(div, 'head')[0];
    const headText = head ? normalize(extractInlineText(head)) : null;
    const childDivs = elemChildren(div, 'div');
    const childPs   = elemChildren(div, 'p');

    const nextCrumb = headText ? [...breadcrumb, headText] : breadcrumb;

    if (childPs.length > 0) {
      // Leaf-ish div: produce a passage from its direct <p> children
      // (and any <p> from non-div descendants — usually there are none).
      const bodyText = childPs.map((p) => normalize(extractInlineText(p))).filter(Boolean).join(' ');
      if (bodyText) {
        out.push({
          section_id: div.attribs?.id || null,
          xml_div_id: div.attribs?.id || null,
          title:      headText || nextCrumb.slice(-1)[0] || null,
          breadcrumb: nextCrumb.slice(),
          original:   bodyText,
        });
      }
    }
    // Recurse into child divs (a div can have both <p>s of its own and
    // sub-<div>s — both cases produce passages).
    for (const c of childDivs) walk(c, nextCrumb);
  }
  for (const topDiv of elemChildren(body, 'div')) walk(topDiv, []);
  return out;
}

// ─────────────────── Flat mode (no <div>) ───────────────────
//
// Iterate direct <p> children of <body>. Section-starting rends
// (subhead|subsubhead|chapter|title|book) open a new passage and become
// its title. Body-text rends append to the currently open passage.

// 'title' is context-sensitive: in the preamble (before any content) it's
// the scholarly short name of the work (e.g., "Aṭṭhasālinī nāma" at the
// head of abh01a.att.xml). After content has started, it's a section
// heading like any other. The loop handles this with a preamble guard.
const SECTION_START_RENDS = new Set(['chapter', 'subhead', 'subsubhead', 'title']);
const WORK_HEADER_RENDS   = new Set(['centre', 'nikaya', 'book']);

function passagesFromFlat(body) {
  const out = [];
  let work_name = null;
  let current = null;       // accumulating passage
  let sectionCounter = 0;
  let breadcrumb = [];      // [book?, chapter?, subhead?]

  function pushCurrent() {
    if (current && current.original) {
      out.push(current);
    }
    current = null;
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
    // opens (sectionCounter > 0) or any body content arrives (current set).
    if (rend === 'title' && !current && sectionCounter === 0) {
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
      // New section boundary. Close previous, open a new one with this
      // text as the title.
      pushCurrent();
      sectionCounter++;
      // Track breadcrumb depth by rend granularity (chapter > subhead > subsubhead).
      // Simple model: replace the tail of breadcrumb at this level.
      const level = rend === 'chapter' ? 1 : rend === 'subhead' ? 2 : 3;  // title shares 1
      breadcrumb = breadcrumb.slice(0, level).concat([text]);
      current = {
        section_id: `${sectionCounter}`,
        xml_div_id: null,
        title:      text,
        breadcrumb: breadcrumb.slice(),
        original:   '',
      };
      continue;
    }

    // bodytext, gatha1/2/last, indent, etc. — append to current passage.
    if (!current) {
      // No section opened yet but we have body text. Open an implicit
      // "intro" passage so we don't drop content.
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
  pushCurrent();
  return { passages: out, work_name };
}

// ─────────────────── Entry point ───────────────────
//
// Returns {work_name, passages: [...]}. work_name is the CST-given
// <p rend="book"> when present (often more verbose than the scholarly
// short name — caller may prefer the work-map citation_prefix).

export async function parseCstFile(filePath) {
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
    const passages = passagesFromDivs(body);
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
    const { passages, work_name: flatName } = passagesFromFlat(body);
    return { work_name: flatName || work_name, passages };
  }
}
