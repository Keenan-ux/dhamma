// Dhamma server.
//
// Phase 1 (v2-pre): serves the SPA + /api/healthz.
// Phase 2 (now landing): connects to Postgres+pgvector at dhamma-pg.flycast,
// runs schema migrations on boot, exposes /api/dbcheck for connectivity test.
// Real /api/search, /api/passage/:id, /api/corpus arrive once ingest writes
// rows to the passages table.

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applySchema, health as dbHealth } from './db.js';
import { embedReady } from './embed.js';
import { aliasesReady } from './aliases.js';
import { runSearch } from './search.js';
import { runCorpus, getPassage, getPassages } from './corpus.js';
import { runCompareStats } from './compareStats.js';
import { runLookup } from './dictionary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
// In production the Dockerfile copies the SPA build into /app/dist next to
// the server. For local dev (running from C:/Dev/Dhamma/server/src) point
// STATIC_DIR at the repo-root dist/ produced by `npm run build`.
const STATIC_DIR = process.env.STATIC_DIR || path.resolve(ROOT, 'dist');

const app = new Hono();

app.get('/api/healthz', (c) => c.json({ ok: true, ts: Date.now() }));

app.get('/api/dbcheck', async (c) => {
  const h = await dbHealth();
  return c.json(h, h.connected ? 200 : 503);
});

app.get('/api/corpus', async (c) => {
  try {
    return c.json(await runCorpus());
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/passage/:id', async (c) => {
  try {
    const row = await getPassage(c.req.param('id'));
    if (!row) return c.json({ error: 'not_found' }, 404);
    return c.json(row);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/compare', async (c) => {
  try {
    const idsParam = c.req.query('ids') || '';
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return c.json({ error: 'missing ids' }, 400);
    if (ids.length > 20) return c.json({ error: 'too many ids (max 20)' }, 400);
    return c.json({ passages: await getPassages(ids) });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/search', async (c) => {
  try {
    const out = await runSearch({
      q: c.req.query('q'),
      mode: c.req.query('mode'),
      field: c.req.query('field'),
      limit: c.req.query('limit'),
    });
    return c.json(out);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/compare-stats', async (c) => {
  try {
    const out = await runCompareStats({
      q: c.req.query('q'),
      limit: c.req.query('limit'),
    });
    return c.json(out);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/lookup', async (c) => {
  try {
    const out = await runLookup({
      term:     c.req.query('term'),
      source:   c.req.query('source') || undefined,
      language: c.req.query('language') || 'pli',
      mode:     c.req.query('mode')     || undefined,
    });
    return c.json(out);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Static SPA
if (fs.existsSync(STATIC_DIR)) {
  app.use('/*', serveStatic({ root: path.relative(process.cwd(), STATIC_DIR) || '.' }));
  app.notFound((c) => {
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return c.html(fs.readFileSync(indexPath, 'utf8'));
    return c.text('Not found', 404);
  });
}

async function start() {
  try {
    await applySchema();
  } catch (err) {
    console.error('[boot] schema apply failed:', err.message);
  }
  // Aliases must be loaded before /api/search can expand terms. Cheap (~15
  // rows); await it so the first search doesn't race the cache fill.
  try {
    await aliasesReady();
  } catch (err) {
    console.error('[boot] aliases load failed:', err.message);
  }
  // Model load is heavier (~3-5s). Kick off in background; first /api/search
  // in Meaning mode awaits the same ready promise.
  embedReady().catch((err) => console.error('[boot] embed init failed:', err.message));
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`dhamma server listening on :${info.port}`);
  });
}

start();
