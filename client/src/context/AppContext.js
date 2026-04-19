"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";

const AppContext = createContext(null);

const LEGACY_TOKEN_KEY = "verifies_token";
const LEGACY_USER_KEY = "verifies_user";
const AUTH_TOKEN_KEY = "verifies_sb_token";

export function AppProvider({ children }) {
  const supabase = useMemo(() => createClient(), []);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return localStorage.getItem("verifies_theme") || "light";
  });

  const [auth, setAuth] = useState({ token: null, user: null, profile: null, loading: true });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("verifies_theme", theme);
  }, [theme]);

  const syncProfile = useCallback(async (token) => {
    if (!token) {
      return null;
    }

    const { data } = await api.get("/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data?.user || null;
  }, []);

  const applyLegacySession = useCallback(async () => {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    const legacyUserRaw = localStorage.getItem(LEGACY_USER_KEY);

    if (!legacyToken || !legacyUserRaw) {
      setAuth({ token: null, user: null, profile: null, loading: false });
      return;
    }

    try {
      const profile = await syncProfile(legacyToken);
      const legacyUser = JSON.parse(legacyUserRaw);
      localStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
      setAuth({ token: legacyToken, user: legacyUser, profile, loading: false });
    } catch (error) {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuth({ token: null, user: null, profile: null, loading: false });
    }
  }, [syncProfile]);

  const applySession = useCallback(async (session) => {
    const token = session?.access_token || null;
    const user = session?.user || null;

    if (!token || !user) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      await applyLegacySession();
      return;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);

    try {
      const profile = await syncProfile(token);
      setAuth({ token, user, profile, loading: false });
    } catch (error) {
      setAuth({ token, user, profile: null, loading: false });
    }
  }, [syncProfile, applyLegacySession]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) {
        await applySession(data.session || null);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) {
        return;
      }
      await applySession(session || null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, applySession]);

  const refreshProfile = useCallback(async () => {
    if (!auth.token) {
      return null;
    }

    const profile = await syncProfile(auth.token);
    setAuth((prev) => ({ ...prev, profile }));
    return profile;
  }, [auth.token, syncProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setAuth({ token: null, user: null, profile: null, loading: false });
  }, [supabase]);

  const changePassword = useCallback(async (nextPassword) => {
    const isLegacy = !auth.user?.aud;
    if (isLegacy) {
      throw new Error("For this account, please use Forgot password to change credentials.");
    }

    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) {
      throw error;
    }
  }, [supabase, auth.user]);

  const loginLegacy = useCallback(async (token, user) => {
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    try {
      const profile = await syncProfile(token);
      setAuth({ token, user, profile, loading: false });
    } catch (error) {
      setAuth({ token, user, profile: null, loading: false });
    }
  }, [syncProfile]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      auth,
      refreshProfile,
      loginLegacy,
      changePassword,
      logout,
      supabase,
    }),
    [theme, auth, refreshProfile, loginLegacy, changePassword, logout, supabase]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
