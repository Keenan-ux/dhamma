// Magic-link (passwordless email) authentication, ported from Punchlist's
// implementation and adapted for Dhamma.
//
// IMPORTANT: auth here is ADDITIVE and OPTIONAL. Dhamma is a public scholarly
// tool and stays fully usable signed-out. Signing in only adds persistent
// per-user bookmarks/notes; the two ADMIN_EMAILS additionally see the
// admin-gated Research tab. No existing public route requires auth — only the
// /api/user/* (requireAuth) and /api/research (requireAdmin) routes do.

import crypto from 'node:crypto';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sql } from './db.js';
import { sendMagicLink } from './email.js';

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE = 'dhamma_session';
const LINK_TTL_MIN = 15;
const SESSION_DAYS = 30;

// Admins see the Research tab. Comma-separated env override; defaults to the
// two project owners so a fresh deploy works without extra config.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS
  || 'isaac11cyr@gmail.com,keenan@boothcheck.com')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

// Who may sign in at all. Dhamma is public, so the default is open ('*') —
// anyone can sign in to save bookmarks/notes. Set ALLOWED_EMAILS to a comma
// list to restrict sign-in (admins are always allowed).
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '*').trim();
function emailAllowed(email) {
  if (ALLOWED_EMAILS === '*' || ALLOWED_EMAILS === '') return true;
  const list = ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email) || ADMIN_EMAILS.includes(email);
}

// Session-signing secret. Required in production; an insecure dev fallback is
// used locally with a loud warning. If it's missing in prod we DON'T crash the
// public app — we just disable the auth routes (authConfigured() gates them),
// so the scholarly tool keeps serving.
const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (IS_PROD) {
    console.error('[auth] JWT_SECRET not set in production — sign-in disabled until it is.');
    return null;
  }
  console.warn('[auth] JWT_SECRET not set — using an insecure dev secret.');
  return 'dev-insecure-secret-change-me';
})();

export function authConfigured() { return !!JWT_SECRET && !!sql; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function appUrl() {
  return process.env.APP_URL || (IS_PROD ? 'https://dhamma.fly.dev' : 'http://localhost:5173');
}

function isAdminEmail(email) { return ADMIN_EMAILS.includes(email); }

// POST /api/auth/request  { email } -> emails a one-time sign-in link.
export async function requestLink(c) {
  if (!authConfigured()) return c.json({ error: 'Sign-in is not configured on this server.' }, 503);
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return c.json({ error: 'Enter a valid email address.' }, 400);
  if (!emailAllowed(email)) return c.json({ error: 'This email is not on the access list.' }, 403);
  // Light rate limit: one link per email per 60 seconds.
  const [recent] = await sql`
    SELECT 1 FROM magic_tokens
    WHERE email = ${email} AND created_at > now() - interval '60 seconds'
    LIMIT 1`;
  if (recent) return c.json({ error: 'A link was just sent. Check your email, or wait a minute.' }, 429);
  const token = crypto.randomBytes(32).toString('hex');
  await sql`
    INSERT INTO magic_tokens (token_hash, email, expires_at)
    VALUES (${sha256(token)}, ${email}, now() + ${`${LINK_TTL_MIN} minutes`}::interval)`;
  const link = `${appUrl()}/api/auth/verify?token=${token}`;
  let result;
  try {
    result = await sendMagicLink(email, link);
  } catch (err) {
    return c.json({ error: err.message }, 502);
  }
  return c.json({ ok: true, sent: result.sent, ...(result.devLink ? { devLink: result.devLink } : {}) });
}

// GET /api/auth/verify?token=... -> consume the token, set the session cookie,
// redirect into the app. Single-use + expiry enforced atomically in the UPDATE.
export async function verifyLink(c) {
  if (!authConfigured()) return c.redirect('/?auth=invalid');
  const token = c.req.query('token');
  if (!token) return c.redirect('/?auth=invalid');
  const [row] = await sql`
    UPDATE magic_tokens SET used_at = now()
    WHERE token_hash = ${sha256(String(token))}
      AND used_at IS NULL
      AND expires_at > now()
    RETURNING email`;
  if (!row) return c.redirect('/?auth=invalid');
  const email = row.email;
  const admin = isAdminEmail(email);
  const [user] = await sql`
    INSERT INTO users (email, is_admin, last_login_at)
    VALUES (${email}, ${admin}, now())
    ON CONFLICT (email) DO UPDATE SET last_login_at = now(), is_admin = ${admin}
    RETURNING id, email, display_name, is_admin`;
  await setSession(c, user);
  return c.redirect('/?auth=ok');
}

export async function setSession(c, user) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 3600;
  const jwt = await sign({ sub: String(user.id), email: user.email, exp }, JWT_SECRET);
  setCookie(c, COOKIE, jwt, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export function clearSession(c) { deleteCookie(c, COOKIE, { path: '/' }); }

// Resolve the signed-in user from the cookie, or null. Never throws — safe to
// call on optionally-authed routes (e.g. /api/me).
export async function currentUser(c) {
  if (!authConfigured()) return null;
  const jwt = getCookie(c, COOKIE);
  if (!jwt) return null;
  let payload;
  try {
    payload = await verify(jwt, JWT_SECRET, 'HS256');
  } catch {
    return null;
  }
  const [user] = await sql`
    SELECT id, email, display_name, is_admin FROM users WHERE id = ${payload.sub}`;
  return user || null;
}

// Shape a DB user row for the client (camelCase, no internal columns).
export function publicUser(user) {
  if (!user) return null;
  return { id: Number(user.id), email: user.email, displayName: user.display_name || null, isAdmin: !!user.is_admin };
}

export async function requireAuth(c, next) {
  const user = await currentUser(c);
  if (!user) return c.json({ error: 'Not signed in.' }, 401);
  c.set('user', user);
  await next();
}

export async function requireAdmin(c, next) {
  const user = await currentUser(c);
  if (!user) return c.json({ error: 'Not signed in.' }, 401);
  if (!user.is_admin) return c.json({ error: 'Admin only.' }, 403);
  c.set('user', user);
  await next();
}
