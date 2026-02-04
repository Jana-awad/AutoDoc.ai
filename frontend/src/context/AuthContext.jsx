import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const TOKEN_KEY = "autodoc_access_token";

export const ROLE_HOME = {
  super_admin: "/super",
  enterprise_admin: "/enterprise",
  business_admin: "/business",
};

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
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
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) return null;
  return {
    token,
    role: payload.role,
    userId: payload.sub ?? null,
  };
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const restored = token ? getSessionFromToken(token) : null;
    if (restored) {
      setSession(restored);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setSession(null);
    }
    setLoading(false);
    return restored;
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const loginWithToken = useCallback((token) => {
    const next = getSessionFromToken(token);
    if (!next) return null;
    localStorage.setItem(TOKEN_KEY, token);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      loading,
      loginWithToken,
      logout,
      restoreSession,
    }),
    [session, loading, loginWithToken, logout, restoreSession]
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
