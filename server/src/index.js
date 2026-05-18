// Dhamma server — Phase 1 stub.
//
// Today: serves the built SPA at / and provides /api/healthz.
// Phase 2 adds /api/search, /api/passage/:id, /api/corpus, and /api/compare
// backed by a sibling Postgres + pgvector Fly app (dhamma-pg.flycast).
// The frontend already uses /api/ paths via Vite proxy in dev, so when those
// endpoints land here the UI swaps from in-memory mock data to real backend
// without UI code changes.

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const STATIC_DIR = path.resolve(ROOT, 'dist');

const app = new Hono();

app.get('/api/healthz', (c) => c.json({ ok: true, ts: Date.now() }));

// Static SPA. Only mount if dist exists (skipped in pure-server dev).
if (fs.existsSync(STATIC_DIR)) {
  app.use('/*', serveStatic({ root: path.relative(process.cwd(), STATIC_DIR) || '.' }));
  app.notFound((c) => {
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return c.html(fs.readFileSync(indexPath, 'utf8'));
    return c.text('Not found', 404);
  });
}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`dhamma server listening on :${info.port}`);
});
