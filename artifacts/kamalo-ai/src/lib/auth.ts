import { useCallback, useEffect, useState } from "react";
import { AUTH_FAILURE_EVENT, notifyAuthFailure } from "@workspace/api-client-react";

export type AuthRole = "customer" | "support" | "admin" | "system";

export type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: AuthRole;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authFailure: "required" | "denied" | null;
  login: () => void;
  logout: () => void;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authFailure, setAuthFailure] = useState<"required" | "denied" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handleAuthFailure = (event: Event) => {
      const status = (event as CustomEvent<{ status?: number }>).detail?.status;
      if (status === 401) {
        setUser(null);
        setAuthFailure("required");
      } else if (status === 403) {
        setAuthFailure("denied");
      }
    };
    window.addEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);

    fetch("/api/auth/user", { credentials: "include" })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          notifyAuthFailure(response.status);
        }
        if (!response.ok) throw new Error(`Auth request failed (${response.status})`);
        return response.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
    };
  }, []);

  const login = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo || "/")}`;
  }, []);

  const logout = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/logout?returnTo=${encodeURIComponent(returnTo || "/")}`;
  }, []);

  return { user, isLoading, isAuthenticated: Boolean(user) && authFailure !== "required", authFailure, login, logout };
}