// Minimal fetch wrapper for the dhamma server's /api endpoints.
// Same-origin in production (server hosts SPA + API together). In dev,
// Vite's proxy routes /api → the local Hono server.

async function get(path, { signal } = {}) {
  const res = await fetch(path, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error || ''; } catch { /* */ }
    const err = new Error(detail || `${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function corpusApi(opts) {
  return get('/api/corpus', opts);
}

export function passageApi(id, opts) {
  return get(`/api/passage/${encodeURIComponent(id)}`, opts);
}

// Fetches a window of the passage's sibling paragraph rows. For fine
// CST rows (id ends in `_pNNN`), the response is a slice of the
// paragraphs under the same parent div plus { total, offset, window,
// anchorIndex, sections } so the reader can page through and jump to
// sections without loading the whole division. `window` is a page size
// or 'all'; `cursor` is the 0-based start row. Singleton groups
// (canonical mula, library articles, Vism coarse) return just the
// anchor row with the navigator fields zeroed.
export function passageGroupApi(id, { window, cursor, signal } = {}) {
  const qs = new URLSearchParams();
  if (window != null) qs.set('window', String(window));
  if (cursor != null) qs.set('cursor', String(cursor));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get(`/api/passage/${encodeURIComponent(id)}/group${suffix}`, { signal });
}

// Bulk translations across the paragraph group. Used by the reader's
// multi-translator dropdown so it surfaces every translator present
// on ANY group row, not just the anchor row's.
export function passageGroupTranslationsApi(id, opts) {
  return get(`/api/passage/${encodeURIComponent(id)}/group-translations`, opts);
}

export function randomPassageApi({ scope, signal } = {}) {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  return get(`/api/random-passage${qs}`, { signal });
}

// POST a message from the About-page contact form. The server stores
// it in contact_messages; the maintainer reads via the DB proxy.
// `from_email` is optional (some users won't include one). `website`
// is the honeypot — should always be empty for real submissions.
export async function contactApi({ from_email, subject, body, website, signal } = {}) {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ from_email, subject, body, website }),
    signal,
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error || ''; } catch { /* */ }
    const err = new Error(detail || `${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function passageTranslationsApi(id, opts) {
  return get(`/api/passage/${encodeURIComponent(id)}/translations`, opts);
}

export function passageParallelsApi(id, opts) {
  return get(`/api/passage/${encodeURIComponent(id)}/parallels`, opts);
}

// Sutta → commentary jump. For a canonical mūla sutta, returns its CST
// Aṭṭhakathā (attha) + Ṭīkā (tika) sections grouped by layer, each
// { id, citation, title, work_slug, layer, snippet }. Empty arrays
// when there's no commentary or the passage is itself commentary.
export function passageCommentaryApi(id, opts) {
  return get(`/api/passage/${encodeURIComponent(id)}/commentary`, opts);
}

export function passageTagsApi(id, opts) {
  return get(`/api/passage/${encodeURIComponent(id)}/tags`, opts);
}

export async function glossApi(words, { signal } = {}) {
  const res = await fetch('/api/gloss', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ words }),
    signal,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function tagsApi({ type, value, signal } = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (value) params.set('value', value);
  const qs = params.toString();
  return get(`/api/tags${qs ? '?' + qs : ''}`, { signal });
}

export function libraryListApi({ category, author, limit, signal } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (author) params.set('author', author);
  if (limit != null) params.set('limit', String(limit));
  const qs = params.toString();
  return get(`/api/library${qs ? '?' + qs : ''}`, { signal });
}

export function libraryArticleApi(slug, opts) {
  return get(`/api/library/${encodeURIComponent(slug)}`, opts);
}

export function compareApi(ids, opts) {
  return get(`/api/compare?ids=${ids.map(encodeURIComponent).join(',')}`, opts);
}

export function searchApi({ q, mode, field, limit, offset, nosnippet, pitaka, layer, translator, tag, signal }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (mode) params.set('mode', mode);
  if (field) params.set('field', field);
  if (limit != null) params.set('limit', String(limit));
  if (offset != null && offset > 0) params.set('offset', String(offset));
  if (nosnippet) params.set('nosnippet', 'true');
  if (pitaka) params.set('pitaka', pitaka);
  if (layer) params.set('layer', layer);
  if (translator) params.set('translator', translator);
  if (tag) params.set('tag', tag);
  return get(`/api/search?${params.toString()}`, { signal });
}

// /api/translators — list every distinct translator with passage counts,
// powering the Library "Translators" view. Cached at the call site since
// the list changes only on ingest.
export function translatorsApi(opts) {
  return get('/api/translators', opts);
}

export function compareStatsApi({ q, limit, signal }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (limit != null) params.set('limit', String(limit));
  return get(`/api/compare-stats?${params.toString()}`, { signal });
}

export function lookupApi({ term, source, language, mode, signal }) {
  const params = new URLSearchParams();
  if (term) params.set('term', term);
  if (source) params.set('source', source);
  if (language) params.set('language', language);
  if (mode) params.set('mode', mode);
  return get(`/api/lookup?${params.toString()}`, { signal });
}
