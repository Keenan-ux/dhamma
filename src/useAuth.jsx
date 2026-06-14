// Optional magic-link auth for Dhamma. The app is a PUBLIC tool and works
// fully signed-out; this context only adds: persistent per-user bookmarks/
// notes when signed in, and the admin-gated Research tab for admin emails.
//
// /api/me returns { user: null } (200) when signed out, so booting the public
// SPA never errors. The verify redirect lands on /?auth=ok|invalid, which we
// consume once and strip from the URL.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

async function apiJson(url, opts) {
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [features, setFeatures] = useState({ auth: false, email: false });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null); // 'ok' | 'invalid' | null

  const refresh = useCallback(async () => {
    try {
      const data = await apiJson('/api/me');
      setUser(data.user || null);
      if (data.features) setFeatures(data.features);
      return data.user || null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Consume the ?auth=ok|invalid set by /api/auth/verify, then strip it so a
    // reload doesn't re-trigger the notice. The hash (route) is preserved.
    try {
      const params = new URLSearchParams(window.location.search);
      const a = params.get('auth');
      if (a === 'ok' || a === 'invalid') {
        setNotice(a);
        params.delete('auth');
        const qs = params.toString();
        window.history.replaceState(null, '',
          window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
      }
    } catch { /* ignore */ }
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const requestLink = useCallback((email) => apiJson('/api/auth/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  }), []);

  const logout = useCallback(async () => {
    try { await apiJson('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value = {
    user,
    isAdmin: !!user?.isAdmin,
    loading,
    features,
    notice,
    clearNotice: () => setNotice(null),
    requestLink,
    logout,
    refresh,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Safe even outside a provider (returns a signed-out stub) so any component can
// call it without a hard dependency on the tree shape.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null, isAdmin: false, loading: false, features: {}, notice: null,
      clearNotice() {}, requestLink: async () => ({}), logout: async () => {}, refresh: async () => null,
    };
  }
  return ctx;
}
