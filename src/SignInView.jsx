// Sign-in view (magic-link). Academic register to match the rest of the tool:
// serif, thin gold rules, no card chrome, no marketing copy. Reachable at
// #/signin. Signing in is optional — it only adds persistent bookmarks/notes
// (and, for admins, the Research tab).

import { useState } from 'react';
import { useAuth } from './useAuth.jsx';

const SERIF = '"Noto Serif", Georgia, serif';

export default function SignInView() {
  const { user, isAdmin, features, requestLink, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await requestLink(email.trim());
      setSent(true);
      if (res && res.devLink) setDevLink(res.devLink);
    } catch (err) {
      setError(err.message || 'Could not send the link.');
    } finally {
      setBusy(false);
    }
  }

  // Signed-in: show account state instead of the form.
  if (user) {
    return (
      <div style={wrap}>
        <div style={panel}>
          <div style={rule} />
          <h1 style={title}>Account</h1>
          <p style={lead}>
            Signed in as <span style={{ color: 'var(--bc-text-primary)' }}>{user.email}</span>
            {isAdmin ? ' · admin' : ''}.
          </p>
          <p style={fine}>
            Your bookmarks and notes are saved to your account and will follow you across devices.
            {isAdmin ? ' The Research tab is visible in the sidebar.' : ''}
          </p>
          <button type="button" onClick={logout} style={btn}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={panel}>
        <div style={rule} />
        <h1 style={title}>Sign in</h1>
        <p style={lead}>
          Signing in is optional. It saves your bookmarks and notes to your account so they
          persist across devices. The corpus and all tools work without an account.
        </p>

        {sent ? (
          <div>
            <p style={{ ...lead, color: 'var(--bc-text-primary)' }}>Check your email</p>
            <p style={fine}>
              A sign-in link is on its way to {email}. It works once and expires in 15 minutes.
            </p>
            {devLink && (
              <a href={devLink} style={btn}>Dev sign-in (no email configured)</a>
            )}
            <div style={{ marginTop: 16 }}>
              <button type="button" onClick={() => { setSent(false); setDevLink(null); setError(null); }} style={linkBtn}>
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={input}
              aria-label="Email address"
            />
            <button type="submit" disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            {error && <p style={errText}>{error}</p>}
            {features && features.email === false && (
              <p style={fine}>
                Email sending is not configured on this server, so the link will be shown here after
                you request it (development mode).
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

const wrap = { position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56, display: 'flex', justifyContent: 'center' };
const panel = { width: '100%', maxWidth: 420, padding: '72px 28px 64px' };
const rule = { height: 1, background: 'rgba(var(--bc-accent-rgb), 0.32)', marginBottom: 22 };
const title = {
  margin: '0 0 14px', fontFamily: SERIF, fontSize: 26, fontWeight: 500,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bc-text-primary)', paddingLeft: '0.18em',
};
const lead = { margin: '0 0 16px', fontFamily: SERIF, fontSize: 15, lineHeight: 1.7, color: 'var(--bc-text-secondary)' };
const fine = { margin: '0 0 16px', fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, lineHeight: 1.65, color: 'var(--bc-text-tertiary)' };
const input = {
  width: '100%', boxSizing: 'border-box', padding: '10px 0', marginBottom: 18,
  background: 'transparent', border: 'none', borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.4)',
  fontFamily: SERIF, fontSize: 16, color: 'var(--bc-text-primary)', outline: 'none',
};
const btn = {
  display: 'inline-block', width: '100%', boxSizing: 'border-box', textAlign: 'center',
  padding: '11px 22px', background: 'transparent', cursor: 'pointer',
  border: '1px solid var(--bc-accent)', borderRadius: 4, color: 'var(--bc-text-primary)',
  fontFamily: SERIF, fontSize: 14, letterSpacing: '0.02em', textDecoration: 'none',
};
const linkBtn = {
  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
  color: 'var(--bc-accent)', fontFamily: SERIF, fontSize: 13.5, textDecoration: 'underline', textUnderlineOffset: 3,
};
const errText = { margin: '14px 0 0', fontFamily: SERIF, fontSize: 13.5, color: 'var(--bc-loss-text, #b3261e)' };
