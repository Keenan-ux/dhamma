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

import { applySchema, health as dbHealth, sql } from './db.js';
import { embedReady, embedWarmState } from './embed.js';
import { aliasesReady } from './aliases.js';
import { runSearch } from './search.js';
import { runCorpus, getPassage, getPassages, getPassageGroup, getPassageGroupTranslations, getCommentaryFor } from './corpus.js';
import { runCompareStats } from './compareStats.js';
import { runLookup, glossWords } from './dictionary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
// In production the Dockerfile copies the SPA build into /app/dist next to
// the server. For local dev (running from C:/Dev/Dhamma/server/src) point
// STATIC_DIR at the repo-root dist/ produced by `npm run build`.
const STATIC_DIR = process.env.STATIC_DIR || path.resolve(ROOT, 'dist');

const app = new Hono();

app.get('/api/healthz', (c) => c.json({ ok: true, ts: Date.now() }));

// Warm the BGE-M3 embedding model. The first Meaning query after a machine
// wake loads the ONNX model (tens of seconds to ~100s on shared CPU). The
// SPA pings this when the Search view mounts so the load overlaps the
// user's typing instead of stalling their first query; the request also
// wakes an auto-stopped machine. Kicks off the load if not started and
// returns the current state immediately (does NOT block on the full load).
app.get('/api/warm', (c) => {
  if (!embedWarmState().warm) embedReady().catch(() => { /* best-effort */ });
  return c.json(embedWarmState());
});

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

// Sibling-paragraph fetch, windowed. For a fine CST row like
// `cst-s0101a.att-dn1_1_p047`, returns a window of the `_p%` rows under
// the same `cst-s0101a.att-dn1_1` parent — a slice of the logical "page"
// plus the total/offset/sections the reader needs to navigate the rest,
// so a jump onto a 2,799-row division doesn't render it all at once.
// `?window=N` sets the page size (or `all`); `?cursor=N` the start row.
// Singleton groups (mula / anya / library / Vism mula coarse) return
// the anchor row only, with the navigator fields zeroed.
app.get('/api/passage/:id/group', async (c) => {
  try {
    const out = await getPassageGroup(c.req.param('id'), {
      window: c.req.query('window'),
      cursor: c.req.query('cursor'),
    });
    if (!out) return c.json({ error: 'not_found' }, 404);
    return c.json(out);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Bulk translations across a paragraph group. Returns every row's
// translations for the same group /api/passage/:id/group covers, so
// the reader's translator dropdown can show translators present on
// ANY group row (Tier 2 Bodhi cy commentary, for example, anchors
// to specific paragraphs across the group; without this endpoint the
// dropdown would only see translators on the user's exact landing
// row).
app.get('/api/passage/:id/group-translations', async (c) => {
  try {
    const out = await getPassageGroupTranslations(c.req.param('id'));
    if (!out) return c.json({ error: 'not_found' }, 404);
    return c.json(out);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Random sutta: returns one passage id, biased to readable ones —
// must be in the sutta piṭaka (or its commentary/sub-commentary), must
// have an English translation, and must not be a CST volume-header
// uddāna row. The descendant-slug list is small and rarely changes;
// computing it inline is cheap enough not to need caching here.
app.get('/api/random-passage', async (c) => {
  try {
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ error: 'no_db' }, 500);
    const scope = c.req.query('scope') || 'sutta';
    const root = scope === 'all' ? null : 'pli-sutta';
    const rows = await sql`
      WITH RECURSIVE sutta_works(slug) AS (
        SELECT slug FROM works WHERE slug = ${root}
        UNION ALL
        SELECT w.slug FROM works w JOIN sutta_works s ON w.parent_slug = s.slug
      )
      SELECT p.id
      FROM passages p
      WHERE (${root}::text IS NULL OR p.work_slug IN (SELECT slug FROM sutta_works))
        AND p.translation IS NOT NULL AND length(p.translation) > 40
        AND p.id !~ '^cst-[a-z0-9]+m\\.mul-(dn|mn|sn|an|kn)[0-9]+$'
      ORDER BY random()
      LIMIT 1
    `;
    if (!rows.length) return c.json({ error: 'no_passage' }, 404);
    return c.json({ id: rows[0].id });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/library', async (c) => {
  try {
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ articles: [], byCategory: {} });
    const category = c.req.query('category') || null;
    const author   = c.req.query('author')   || null;
    const limit    = Math.max(1, Math.min(500, Number(c.req.query('limit')) || 200));

    // List endpoint returns the metadata, not the body — keeps the
    // payload small enough for a sidebar/grid render.
    const rows = category || author
      ? await sql`
          SELECT slug, title, author, category, year, source_url,
                 LENGTH(body) AS body_len
          FROM articles
          -- No source filter when a category/author is given: this branch
          -- serves both the ATI Library (its categories are all source='ati')
          -- and DocsView (category='docs', source='dhamma'). Categories do
          -- not collide across sources, so category alone is unambiguous.
          -- The default (no-category) list and byCategory below stay
          -- source='ati' so the Library tab's own list/nav is unaffected.
          WHERE (${category}::TEXT IS NULL OR category = ${category})
            AND (${author}::TEXT   IS NULL OR author   = ${author})
          ORDER BY category, author NULLS LAST, title
          LIMIT ${limit}
        `
      : await sql`
          SELECT slug, title, author, category, year, source_url,
                 LENGTH(body) AS body_len
          FROM articles
          WHERE source = 'ati'
          ORDER BY category, author NULLS LAST, title
          LIMIT ${limit}
        `;

    // Always include category counts so the LibraryView can render
    // its category nav without a second request.
    const counts = await sql`
      SELECT category, COUNT(*)::int AS n
      FROM articles WHERE source = 'ati'
      GROUP BY category ORDER BY n DESC
    `;
    const byCategory = Object.fromEntries(counts.map((r) => [r.category, r.n]));
    return c.json({ articles: rows, byCategory });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/library/:slug', async (c) => {
  try {
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ error: 'no_db' }, 503);
    const slug = c.req.param('slug');
    const [row] = await sql`
      SELECT slug, title, author, category, year, source, source_url,
             body, summary, tags, copyright, license
      FROM articles
      WHERE slug = ${slug}
      LIMIT 1
    `;
    if (!row) return c.json({ error: 'not_found' }, 404);
    return c.json(row);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Notify the maintainer of a contact-form submission via Resend's
// transactional email API. Reads RESEND_API_KEY from env; when the
// key isn't set this is a no-op (the message still gets stored in
// contact_messages, so nothing is lost — the user can wire up Resend
// later and start receiving notifications without code changes).
//
// CONTACT_FROM_EMAIL defaults to onboarding@resend.dev (works
// immediately without DNS setup). After verifying boothcheck.com
// on Resend, swap to notifications@boothcheck.com via the Fly
// secret — no code change needed.
async function sendContactEmail({ from_email, subject, body }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'no_api_key' };
  const fromAddr = process.env.CONTACT_FROM_EMAIL || 'Dhamma data <onboarding@resend.dev>';
  const toAddr   = process.env.CONTACT_TO_EMAIL   || 'Keenan@boothcheck.com';

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px;">
      <p style="margin: 0 0 6px; color: #888; font-size: 12px;">New message from the dhamma.fly.dev contact form</p>
      <h2 style="margin: 8px 0 16px;">${esc(subject)}</h2>
      <p style="margin: 0 0 4px; color: #444;">
        <strong>From:</strong> ${from_email ? esc(from_email) : '<em>(no email provided)</em>'}
      </p>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 16px 0;">
      <pre style="white-space: pre-wrap; font-family: Georgia, serif; font-size: 14px; line-height: 1.5; margin: 0;">${esc(body)}</pre>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to: toAddr,
        reply_to: from_email || undefined,
        subject: `[dhamma.fly.dev] ${subject}`,
        html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { sent: false, reason: `resend_${res.status}: ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

// POST /api/contact — store a message from the About-page form,
// then notify the maintainer via Resend (if configured). The DB
// row is the source of truth — every submission is persisted even
// if the email delivery fails or no API key is configured.
app.post('/api/contact', async (c) => {
  try {
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ error: 'no_db' }, 500);
    const body = await c.req.json().catch(() => ({}));
    const subject = String(body.subject || '').trim().slice(0, 200);
    const message = String(body.body || '').trim().slice(0, 10000);
    const fromEmailRaw = body.from_email ? String(body.from_email).trim().slice(0, 200) : null;
    if (!subject) return c.json({ error: 'subject_required' }, 400);
    if (!message) return c.json({ error: 'message_required' }, 400);
    // Loose email shape check — we don't want false rejections on
    // valid-but-unusual addresses, just basic sanity.
    if (fromEmailRaw && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmailRaw)) {
      return c.json({ error: 'invalid_email' }, 400);
    }
    // Honeypot — the form's hidden "website" field should always be
    // empty for a real human. Bots that auto-fill every input set it.
    if (body.website && String(body.website).trim().length > 0) {
      // Pretend success to avoid signalling the trap is detected.
      return c.json({ ok: true });
    }

    // Rate limit: SHA-256(ip) so we can throttle without storing PII.
    // Fly puts the client IP in the Fly-Client-IP header.
    const crypto = await import('node:crypto');
    const ip = c.req.header('fly-client-ip')
            || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
            || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    const recent = await sql`
      SELECT COUNT(*)::int AS n FROM contact_messages
      WHERE ip_hash = ${ipHash} AND created_at > NOW() - INTERVAL '1 minute'
    `;
    if (recent[0]?.n >= 5) {
      return c.json({ error: 'rate_limited', retry_after_s: 60 }, 429);
    }
    const userAgent = c.req.header('user-agent') || null;
    await sql`
      INSERT INTO contact_messages (from_email, subject, body, user_agent, ip_hash)
      VALUES (${fromEmailRaw}, ${subject}, ${message}, ${userAgent}, ${ipHash})
    `;
    // Fire-and-don't-block email notification. The DB row is the
    // source of truth; if Resend isn't configured or the API call
    // fails, we still return success to the user — their message is
    // saved either way.
    sendContactEmail({ from_email: fromEmailRaw, subject, body: message })
      .then((result) => {
        if (!result.sent) console.warn(`[contact] email not sent: ${result.reason}`);
      });
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/gloss', async (c) => {
  // Batch word-gloss lookup for interlinear / hover glosses. Body:
  // { words: ["sampajāno", "bhikkhave", ...] } — or { text: "..." } to
  // let the server tokenise (lowercase, keep Pāli/Latin letter runs).
  // Returns: { glosses: { word: { headword, def, source } } } — only
  // entries for words we resolved a lemma for; unmatched words are
  // absent so the caller renders the bare Pāli. Resolution + def
  // trimming live in dictionary.js#glossWords (shared with any future
  // interlinear pre-render pass).
  try {
    if (!sql) return c.json({ glosses: {} });
    const body = await c.req.json().catch(() => ({}));
    let words;
    if (Array.isArray(body.words)) {
      words = body.words;
    } else if (typeof body.text === 'string') {
      // Server-side tokenisation for the { text } form: any Unicode
      // letter run (covers Pāli diacritics), lowercased + de-duped.
      words = body.text.toLowerCase().match(/\p{L}+/gu) || [];
    } else {
      words = [];
    }
    const glosses = await glossWords(words);
    return c.json({ glosses });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/passage/:id/tags', async (c) => {
  try {
    const id = c.req.param('id');
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ tags: [] });
    const rows = await sql`
      SELECT tag_type, tag_value, source
      FROM passage_tags
      WHERE passage_id = ${id}
      ORDER BY tag_type, tag_value
    `;
    return c.json({ passage_id: id, tags: rows });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/tags', async (c) => {
  // List of tags + the passages that carry them. Filterable by
  // tag_type (simile/name/subject/number) so a Browse-side filter can
  // load just one slice. Returns the catalogue of distinct values plus
  // their hit counts; the per-passage join happens on demand.
  try {
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ tags: [] });
    const type = c.req.query('type') || null;
    const value = c.req.query('value') || null;
    if (value && type) {
      const rows = await sql`
        SELECT pt.passage_id, p.citation, p.title, p.work_slug
        FROM passage_tags pt
        JOIN passages p ON p.id = pt.passage_id
        WHERE pt.tag_type = ${type} AND pt.tag_value = ${value}
        ORDER BY p.citation
      `;
      return c.json({ tag_type: type, tag_value: value, passages: rows });
    }
    if (type) {
      const rows = await sql`
        SELECT tag_value, COUNT(*)::int AS n
        FROM passage_tags
        WHERE tag_type = ${type}
        GROUP BY tag_value ORDER BY n DESC, tag_value
      `;
      return c.json({ tag_type: type, values: rows });
    }
    const rows = await sql`
      SELECT tag_type, COUNT(DISTINCT tag_value)::int AS distinct_values, COUNT(*)::int AS total_tags
      FROM passage_tags
      GROUP BY tag_type ORDER BY total_tags DESC
    `;
    return c.json({ summary: rows });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/passage/:id/parallels', async (c) => {
  try {
    const id = c.req.param('id');
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ parallels: [] });
    // JOIN to passages for the targets that we have, so we can return
    // citation + title alongside the raw parallel_id. Targets not in
    // our passages table come back with null citation/title — the UI
    // renders them as plain text (informational).
    const rows = await sql`
      SELECT pp.parallel_id, pp.relation_type, pp.parallel_lang, pp.parallel_have,
             p.citation AS parallel_citation, p.title AS parallel_title
      FROM passage_parallels pp
      LEFT JOIN passages p ON p.id = pp.parallel_id
      WHERE pp.passage_id = ${id}
      ORDER BY pp.parallel_have DESC, pp.relation_type, pp.parallel_id
    `;
    return c.json({ passage_id: id, parallels: rows });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Sutta → commentary jump. For a canonical mūla sutta, returns its CST
// Aṭṭhakathā + Ṭīkā sections grouped by layer — the reader's
// "Commentary" section, mirroring /parallels. Each entry is one
// commentary section pointing at its first paragraph row, which the
// reader's group-fetch then expands. Returns empty arrays (not an
// error) when the passage has no commentary or is itself commentary.
// See getCommentaryFor in corpus.js for the id-alignment + limitations.
app.get('/api/passage/:id/commentary', async (c) => {
  try {
    return c.json(await getCommentaryFor(c.req.param('id')));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/passage/:id/translations', async (c) => {
  try {
    const id = c.req.param('id');
    const { sql } = await import('./db.js');
    if (!sql) return c.json({ translations: [] });
    const rows = await sql`
      SELECT translator, source, text, notes, copyright, license, source_url, position
      FROM translations
      WHERE passage_id = ${id}
      ORDER BY position, translator
    `;
    return c.json({ passage_id: id, translations: rows });
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
    // Stem/Meaning modes expand the query through the in-memory alias map,
    // which loads in the background at boot (start()). A search can race that
    // load on a freshly-woken machine, so await it lazily here (idempotent —
    // returns the cached ready promise) to guarantee alias expansion is never
    // silently skipped. Mirrors /api/lookup.
    await aliasesReady();
    const out = await runSearch({
      q: c.req.query('q'),
      mode: c.req.query('mode'),
      // ?scope=… is accepted as an alias for ?field=…. Docs/smoke
      // commands name the search target "scope" while the internal
      // param has historically been "field".
      field: c.req.query('field') || c.req.query('scope'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
      pitaka: c.req.query('pitaka'),
      layer: c.req.query('layer'),
      translator: c.req.query('translator'),
      tag: c.req.query('tag'),
      nosnippet: c.req.query('nosnippet'),
    });
    return c.json(out);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// /api/translators — list every distinct translator with metadata and
// passage count. Powers the Library "Translators" view that gives ATI
// maintainers (and any scholar) a navigable index of who translated
// what, with click-through to filter Search by translator.
app.get('/api/translators', async (c) => {
  try {
    const rows = await sql`
      SELECT translator, source, language,
             COUNT(DISTINCT passage_id)::int AS passage_count,
             MIN(copyright) AS sample_copyright
      FROM translations
      GROUP BY translator, source, language
      ORDER BY passage_count DESC, translator
    `;
    return c.json({ translators: rows });
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
    // runLookup derives cross-canon cognates from the in-memory alias
    // map; make sure it's loaded (idempotent — returns the cached ready
    // promise, already awaited at boot). Mirrors /api/search.
    await aliasesReady();
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

// Path-form deep-link redirects. The SPA routes off the URL hash
// (#/library/snp1.8), but humans copy-pasting URLs from email or
// chat sometimes drop the #/ — e.g. dhamma.fly.dev/library/snp1.8.
// Without these redirects, that lands on the default Tipiṭaka page
// instead of the article. Catch the well-known patterns server-side
// and 302 to the hash form. Order matters: register before the
// static-file fallback so the catch-all SPA serve doesn't swallow
// these first.
const HASH_REDIRECT_PREFIXES = ['library', 'read', 'search', 'dict', 'concordance', 'compare'];
for (const prefix of HASH_REDIRECT_PREFIXES) {
  app.get(`/${prefix}/:rest{.+}`, (c) => {
    const rest = c.req.param('rest');
    return c.redirect(`/#/${prefix}/${rest}`, 302);
  });
}

// Static SPA
if (fs.existsSync(STATIC_DIR)) {
  app.use('/*', serveStatic({ root: path.relative(process.cwd(), STATIC_DIR) || '.' }));
  app.notFound((c) => {
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return c.html(fs.readFileSync(indexPath, 'utf8'));
    return c.text('Not found', 404);
  });
}

function start() {
  // Bind the port FIRST, before any DB-dependent work. applySchema() and
  // aliasesReady() both need dhamma-pg; if a crash left a stale lock there,
  // awaiting either before serve() would block the port bind indefinitely (a
  // CREATE … IF NOT EXISTS parks on the lock, and Postgres lock waits never
  // time out), Fly would log "instance refused connection … 0.0.0.0:8080" and
  // cordon the machine — hard-down until someone restarts dhamma-pg. Binding
  // first means the machine always answers health checks; the DB-dependent
  // boot work runs in the background and is allowed to fail without taking the
  // port down.
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`dhamma server listening on :${info.port}`);
  });

  // Schema apply is idempotent and a metadata-only no-op on an already-
  // provisioned DB (the normal case), so serving before it finishes is safe.
  // db.js gives the connection a lock_timeout, so a stale lock makes this throw
  // fast (logged) instead of hanging forever. A brand-new empty DB is the only
  // case that would briefly 500 on data endpoints until this resolves.
  applySchema().catch((err) => console.error('[boot] schema apply failed:', err.message));

  // Aliases (cross-canon term expansion for Stem/Meaning search). Kicked off
  // here so the common case is warm by the first query; /api/search and
  // /api/lookup both await aliasesReady() lazily, so a query that races this
  // background load still expands aliases correctly once it resolves.
  aliasesReady().catch((err) => console.error('[boot] aliases load failed:', err.message));

  // Embedding model load is heavier (~3-5s warm, ~101s cold on shared CPU).
  // Background; the first Meaning-mode /api/search awaits the same ready promise.
  embedReady().catch((err) => console.error('[boot] embed init failed:', err.message));
}

start();
