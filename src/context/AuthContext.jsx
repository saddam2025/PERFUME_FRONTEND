// AuthContext.jsx — only the import and the useEffect change, rest of file stays the same
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { TOKEN_STORAGE_KEY } from "../api/axios";
import api from "../api/axios";

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "toronto_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const login = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  // FIX: fetches the real current user (name/email/role/status) from the
  // backend and re-syncs localStorage + state. Without this, a role
  // change made by a Manager (e.g. approving an affiliate application)
  // never reached an already-logged-in browser tab — that user's cached
  // `user.role` stayed "Customer" forever until they manually logged out
  // and back in.
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/auth/me");
      if (data?.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (error) {
      // If the token itself is invalid/expired, axios's interceptor
      // already handles clearing it on the relevant 401 cases — nothing
      // extra to do here.
      console.error("Failed to refresh user:", error);
    }
  }, [token]);

  // Re-sync once per app load / token change, so a role promoted since
  // the last login is picked up automatically the next time the app
  // mounts (e.g. next page visit or refresh) without needing to log out.
  // FIX: previously only re-synced on token change (i.e. once per login),
  // which meant an already-open tab never picked up a role promotion made
  // by a Manager mid-session — only a full page reload or fresh login did.
  // Re-running this on every route change (still cheap: one GET request)
  // means navigating to /affiliate/dashboard after being approved works
  // immediately, without requiring the user to know to hard-refresh.
  const location = useLocation();

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, location.pathname]);

  const value = {
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: Boolean(token),
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}