import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const TOKEN_KEY = "autodoc_access_token";

/**
 * Global event name dispatched when any API call returns 401. The auth
 * provider listens for it and forces a logout so the rest of the app does not
 * have to know about token plumbing.
 */
export const SESSION_EXPIRED_EVENT = "autodoc:session-expired";

/**
 * Clock skew tolerance (ms) — we treat a token as expired this many ms
 * *before* its real `exp` to avoid the "expires while in flight" race.
 */
const EXPIRY_SKEW_MS = 5_000;

export const ROLE_HOME = {
  super_admin: "/super",
  enterprise_admin: "/enterprise",
  business_admin: "/business",
  // Regular tenant users (created by an enterprise/business admin via the
  // profile -> Manage users panel). They land on the document workspace.
  user: "/app",
};

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  try {
    return atob(padded);
  } catch {
    return null;
  }
};

const decodeToken = (token) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const getSessionFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.role || !ROLE_HOME[payload.role]) return null;
  const expMs = typeof payload.exp === "number" ? payload.exp * 1000 : null;
  if (expMs && Date.now() + EXPIRY_SKEW_MS >= expMs) return null;
  return {
    token,
    role: payload.role,
    userId: payload.sub ?? null,
    expiresAt: expMs,
  };
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const expiryTimerRef = useRef(null);

  /**
   * Hard reset: drop the token, clear the timer, drop the in-memory session.
   * Used by both manual logout and the global session-expired handler.
   */
  const clearSession = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, []);

  const restoreSession = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const restored = token ? getSessionFromToken(token) : null;
    if (restored) {
      setSession(restored);
    } else {
      // Bad / expired token — wipe localStorage so we don't keep retrying.
      if (token) localStorage.removeItem(TOKEN_KEY);
      setSession(null);
    }
    setLoading(false);
    return restored;
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ---- Proactive expiry: schedule auto-logout right when the JWT expires.
  useEffect(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    if (!session?.expiresAt) return undefined;
    const ms = session.expiresAt - Date.now() - EXPIRY_SKEW_MS;
    if (ms <= 0) {
      clearSession();
      return undefined;
    }
    expiryTimerRef.current = setTimeout(() => {
      clearSession();
      // Notify any open page so it can show a banner / redirect.
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { reason: "expired" },
      }));
    }, ms);
    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [session?.expiresAt, clearSession]);

  // ---- Reactive: any API call that returns 401 fires this event.
  useEffect(() => {
    const handler = () => {
      // Only react if we currently *think* we're logged in. Otherwise the
      // event was fired by a stale request after the user already logged out.
      if (session) clearSession();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [session, clearSession]);

  const loginWithToken = useCallback((token) => {
    const next = getSessionFromToken(token);
    if (!next) return null;
    localStorage.setItem(TOKEN_KEY, token);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      token: session?.token ?? null,
      expiresAt: session?.expiresAt ?? null,
      isAuthenticated: Boolean(session),
      loading,
      loginWithToken,
      logout,
      restoreSession,
    }),
    [session, loading, loginWithToken, logout, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export const getRoleHome = (role) => ROLE_HOME[role] || "/login";

/**
 * Convenience helper for non-React modules (e.g. fetch helpers) to signal that
 * the JWT is no longer valid. The provider listens for this event and clears
 * the session, which flips `isAuthenticated` to false and triggers the
 * `ProtectedRoute` redirect to /login.
 */
export const notifySessionExpired = (reason = "unauthorized") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
    detail: { reason },
  }));
};
