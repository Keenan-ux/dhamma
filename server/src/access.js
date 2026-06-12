// Access control — admin allowlist + feature flags.
//
// GROUNDWORK ONLY (2026-06-07). The auditable-translation workbench is
// unfinished work that must not be visible to ordinary visitors. This module
// is the single source of truth for "who is an admin" and "which features are
// gated", so when accounts land (Resend email auth → session carrying the
// signed-in email) the gate is a one-line wire-up, not a refactor.
//
// It is intentionally NOT yet wired to any auth: there is no session/email on
// requests today. `requireAdmin` is a ready-to-mount Hono middleware that
// reads the caller's email via an injected getter; until a real getter exists
// it denies by default (fail-closed), so mounting it early can never leak.

// Admin allowlist. Lowercased compare. Override/extend via ADMIN_EMAILS
// (comma-separated) without a code change.
const BUILTIN_ADMINS = ['keenan@boothcheck.com', 'isaac11cyr@gmail.com'];

export const ADMIN_EMAILS = new Set(
  [
    ...BUILTIN_ADMINS,
    ...String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ].map((s) => s.toLowerCase())
);

export function isAdmin(email) {
  if (!email || typeof email !== 'string') return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

// Feature flags. `adminOnly` features are hidden from non-admins until they
// graduate. The frontend should fetch its visible feature set from an endpoint
// that applies isAdmin() to the session, so unfinished work never renders for
// the public even if a route is reachable.
export const FEATURES = {
  auditableTranslation: {
    adminOnly: true,
    experimental: true,
    description:
      'Auditable translation workbench — choice-point surfacing, evidence ' +
      'apparatus, decision surface. Unfinished; admin-only until shipped.',
  },
};

export function featureVisibleTo(featureKey, email) {
  const f = FEATURES[featureKey];
  if (!f) return false;
  if (f.adminOnly) return isAdmin(email);
  return true;
}

// Returns the feature flags visible to a given email — what the frontend
// should gate its UI on. Admins see everything; the public sees only
// non-adminOnly features.
export function visibleFeatures(email) {
  const out = {};
  for (const [key, f] of Object.entries(FEATURES)) {
    if (!f.adminOnly || isAdmin(email)) out[key] = { ...f };
  }
  return out;
}

// Hono middleware factory. `getEmail(c)` extracts the authenticated email
// from the request context — supplied by the future auth layer (e.g.
// c.get('session')?.email). Until then, pass nothing and it fails closed.
//
//   import { requireAdmin } from './access.js';
//   app.use('/api/admin/*', requireAdmin((c) => c.get('session')?.email));
//
export function requireAdmin(getEmail = () => null) {
  return async (c, next) => {
    let email = null;
    try { email = getEmail(c); } catch { email = null; }
    if (!isAdmin(email)) {
      return c.json({ error: 'admin_only' }, 403);
    }
    return next();
  };
}
