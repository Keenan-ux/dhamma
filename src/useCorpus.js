// Fetch /api/corpus once for the lifetime of the SPA. The tree is
// transformed into the legacy shape (id/children/passageId/stub) that
// BrowseView and corpus.js helpers expect, so the view code didn't have
// to change shape just because the data source did.
//
// Also exposes:
//   - traditions: list of tradition name strings (for sidebar filter)
//   - traditionByWorkSlug: Map for deriving a passage's tradition from its work

import { useEffect, useState, useCallback } from 'react';
import { corpusApi } from './api.js';

let _cachedShape = null;
let _pending = null;

function transformWork(w) {
  const node = {
    id: w.slug,
    name: w.name,
    subtitle: w.subtitle || undefined,
    stub: !!w.is_stub,
    total: Number(w.total_passage_count) || 0,
    translated: Number(w.total_translated_count) || 0,
  };
  if (w.children && w.children.length > 0) {
    node.children = w.children.map(transformWork);
  } else if (w.passages && w.passages.length > 0) {
    // Leaf work — its passages become tree leaves.
    node.children = w.passages.map((p) => ({
      id: p.id,
      name: p.citation || p.id,
      subtitle: p.title || undefined,
      passageId: p.id,
    }));
  }
  return node;
}

function transformCorpus(server) {
  const tree = (server.traditions || []).map((t) => ({
    id: t.slug,
    name: t.name,
    subtitle: t.subtitle || undefined,
    children: (t.works || []).map(transformWork),
  }));

  // work_slug → { slug, name, tradition, ... }. Lets the frontend resolve
  // a passage's work label and tradition without an extra server JOIN.
  const workBySlug = new Map();
  for (const t of server.traditions || []) {
    function walk(w) {
      workBySlug.set(w.slug, {
        slug: w.slug,
        name: w.name,
        subtitle: w.subtitle || null,
        tradition: t.name,
        is_stub: !!w.is_stub,
      });
      if (w.children) for (const c of w.children) walk(c);
    }
    for (const w of (t.works || [])) walk(w);
  }

  const traditions = (server.traditions || []).map((t) => t.name);

  // tradition name → total passage count (sum of top-level works' rollups)
  const passageCountByTradition = new Map();
  for (const t of server.traditions || []) {
    let n = 0;
    for (const w of (t.works || [])) n += Number(w.total_passage_count) || 0;
    passageCountByTradition.set(t.name, n);
  }

  return { tree, traditions, workBySlug, passageCountByTradition };
}

export default function useCorpus() {
  const [shape, setShape] = useState(_cachedShape);
  const [loading, setLoading] = useState(!_cachedShape);
  const [error, setError] = useState(null);
  // Bumped by retry() to re-run the fetch after a transient failure, so a
  // timed-out /api/corpus (cold start, network blip) can recover without a
  // full page reload.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (_cachedShape) { setShape(_cachedShape); setLoading(false); setError(null); return; }
    let alive = true;
    setLoading(true);
    setError(null);
    // One in-flight request shared across all hook instances. A failed
    // request clears _pending (in the catch) so a later mount or retry()
    // re-fetches instead of replaying the cached rejection forever — the
    // bug where a single corpus-load timeout left the whole SPA stuck on
    // "Loading…" until a hard reload.
    if (!_pending) {
      _pending = corpusApi()
        .then((server) => {
          _cachedShape = transformCorpus(server);
          return _cachedShape;
        });
    }
    _pending
      .then((r) => { if (alive) { setShape(r); setLoading(false); } })
      .catch((err) => {
        _pending = null;
        if (alive) { setError(err); setLoading(false); }
      });
    return () => { alive = false; };
  }, [attempt]);

  const retry = useCallback(() => {
    if (!_cachedShape) setAttempt((n) => n + 1);
  }, []);

  return { shape, loading, error, retry };
}
