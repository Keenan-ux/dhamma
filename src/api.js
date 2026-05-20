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

export function compareApi(ids, opts) {
  return get(`/api/compare?ids=${ids.map(encodeURIComponent).join(',')}`, opts);
}

export function searchApi({ q, mode, field, limit, signal }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (mode) params.set('mode', mode);
  if (field) params.set('field', field);
  if (limit != null) params.set('limit', String(limit));
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
