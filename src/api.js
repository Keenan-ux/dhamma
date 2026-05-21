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

export function searchApi({ q, mode, field, limit, offset, nosnippet, pitaka, signal }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (mode) params.set('mode', mode);
  if (field) params.set('field', field);
  if (limit != null) params.set('limit', String(limit));
  if (offset != null && offset > 0) params.set('offset', String(offset));
  if (nosnippet) params.set('nosnippet', 'true');
  if (pitaka) params.set('pitaka', pitaka);
  return get(`/api/search?${params.toString()}`, { signal });
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
