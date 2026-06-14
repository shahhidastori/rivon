import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { AdminProfile } from "../types";
import { authApi, getToken, setToken } from "../lib/api";

type AuthContextValue = {
  admin: AdminProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    let active = true;
    if (!getToken()) return;

    authApi
      .me()
      .then(({ admin: profile }) => {
        if (active) setAdmin(profile);
      })
      .catch(() => {
        setToken(null);
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      loading,
      login: async (email, password) => {
        const result = await authApi.login(email, password);
        setToken(result.token);
        setAdmin(result.admin);
      },
      logout: () => {
        setToken(null);
        setAdmin(null);
      }
    }),
    [admin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
