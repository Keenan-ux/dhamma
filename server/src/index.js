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
import { embedReady, embedQuery } from './embed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const STATIC_DIR = path.resolve(ROOT, 'dist');

const app = new Hono();

app.get('/api/healthz', (c) => c.json({ ok: true, ts: Date.now() }));

app.get('/api/dbcheck', async (c) => {
  const h = await dbHealth();
  return c.json(h, h.connected ? 200 : 503);
});

// Temporary smoke endpoint — verifies the embedding pipeline end-to-end.
// Remove once /api/search lands and uses embedQuery() for real.
app.get('/api/embed-test', async (c) => {
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'missing q' }, 400);
  const t0 = Date.now();
  try {
    const vec = await embedQuery(q);
    return c.json({
      query: q,
      dim: vec.length,
      sample: vec.slice(0, 5),
      ms: Date.now() - t0,
    });
  } catch (err) {
    return c.json({ error: err.message }, 503);
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
  // Kick off model load in the background. The server starts listening
  // immediately; the first /api/embed-test (or future /api/search) call
  // awaits the same ready promise.
  embedReady().catch((err) => console.error('[boot] embed init failed:', err.message));
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`dhamma server listening on :${info.port}`);
  });
}

start();
