// Frontend helpers for rendering dictionary entries from multiple sources.
//
// DPD entries store `definition` as plain text and render with React's
// default text escaping. DPPN entries store `definition` as HTML
// (the source paragraph from Malalasekera with <b>, <i>, <abbr title=>
// markup preserved) — those go through `sanitizeDictHtml` first.

const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'abbr', 'p', 'br', 'hr', 'span', 'sup', 'sub']);

// Strip everything except a small set of inline-typography tags. For
// <abbr> keep the `title` attribute (DPPN uses it for citation tooltips
// like "Added or Corrected"). Drop every other attribute and tag.
// Walks the parsed DOM rather than regex-matching so unknown nesting
// can't bypass the filter.
export function sanitizeDictHtml(html) {
  if (typeof DOMParser === 'undefined') return String(html ?? '');
  const doc = new DOMParser().parseFromString(`<div>${String(html ?? '')}</div>`, 'text/html');
  const root = doc.body.firstChild;
  if (!root) return '';
  walk(root);
  return root.innerHTML;
}

function walk(node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== 1) continue; // 1 = element
    const tag = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      while (child.firstChild) node.insertBefore(child.firstChild, child);
      node.removeChild(child);
      continue;
    }
    for (const attr of Array.from(child.attributes)) {
      if (tag === 'abbr' && attr.name === 'title') continue;
      child.removeAttribute(attr.name);
    }
    walk(child);
  }
}

// Group a flat entries array by source, preserving the order each
// source first appears in. Returns [{ source, entries }, ...].
export function groupEntriesBySource(entries) {
  const groups = new Map();
  for (const e of entries) {
    const key = e.source || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.entries()].map(([source, list]) => ({ source, entries: list }));
}

// DPPN entries store `definition` as `name + entry` concatenated — the
// full source paragraph including the bold heading. The heading text
// is already shown as the entry title (source_id), so strip it from
// the body before sanitizing to avoid the visible duplication.
export function prepareDppnHtml(html) {
  if (!html) return '';
  const withoutHead = String(html).replace(/^<p>\s*<span class="Head">[\s\S]*?<\/span>\s*/i, '<p>');
  return sanitizeDictHtml(withoutHead);
}

// PED entries are HTML from the Buddhadust digitization — uses <b> for
// the lemma + sense superscripts, <i> for foreign words and emphasis,
// <sup> for sense numbers, <hr> between major sections in long entries.
// The lemma appears bolded at the start of the body; we don't strip it
// because PED definitions read naturally beginning with the bold word.
export function preparePedHtml(html) {
  return sanitizeDictHtml(html);
}

// Pretty section labels for UI headers.
export const SOURCE_LABEL = {
  dpd:  { name: 'Digital Pali Dictionary',     short: 'DPD',  attribution: 'Bodhirasa · CC-BY-NC-SA' },
  dppn: { name: 'Proper Names · Malalasekera', short: 'DPPN', attribution: 'rev. Ānandajoti 2025' },
  ped:  { name: 'Pali-English Dictionary',     short: 'PED',  attribution: 'Rhys Davids & Stede · 1921-25 · CC BY-NC 3.0' },
  mw:   { name: 'Sanskrit-English · Monier-Williams', short: 'MW', attribution: 'Monier-Williams · 1899 · Cologne digitization' },
};
