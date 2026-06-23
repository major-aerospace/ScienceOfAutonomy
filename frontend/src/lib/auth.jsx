import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";
import { ensureStreakReminderScheduled, cancelStreakReminder } from "./notifications";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = unknown
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    // Skip the bootstrap /me probe if we're on the Google OAuth callback —
    // AuthCallback will exchange the session_id and set the JWT. Avoids a
    // 401 race condition that flips us to "logged out" before the exchange completes.
    if (typeof window !== "undefined" && window.location.pathname === "/auth/callback") {
      setReady(true);
      return;
    }
    // Skip the bootstrap /me probe if we have no token — avoids harmless 401 noise.
    const token = typeof window !== "undefined" ? localStorage.getItem("soa_token") : null;
    if (!token) {
      setUser(false);
      setReady(true);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (e) {
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("soa_token", data.token);
    setUser(data.user);
    ensureStreakReminderScheduled().catch(() => {});
    return data.user;
  };
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (data.token) localStorage.setItem("soa_token", data.token);
    setUser(data.user);
    ensureStreakReminderScheduled().catch(() => {});
    return data.user;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) {}
    localStorage.removeItem("soa_token");
    cancelStreakReminder().catch(() => {});
    setUser(false);
  };
  const setGoal = async (goal) => {
    const { data } = await api.patch("/auth/goal", { goal });
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthCtx.Provider value={{ user, ready, refresh, login, register, logout, setGoal, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
