/**
 * Hook useAuth - Gestion sécurisée de l'authentification
 *
 * Ce hook centralise:
 * - L'état d'authentification
 * - Le login/logout
 * - La gestion des tokens
 * - Le refresh automatique
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout, isLoading } = useAuth();
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  refreshAccessToken,
  tokenManager,
} from "@/lib/api";
import type { User } from "@/lib/api";

// ============================================
// Types
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Constants
// ============================================

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes (before 15min expiry)
const USER_STORAGE_KEY = "seka_user";

// ============================================
// Helpers
// ============================================

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

// ============================================
// Hook
// ============================================

export function useAuth(): UseAuthReturn {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getAccessToken();

      if (!token) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Try to get stored user first for faster UI
      const storedUser = getStoredUser();
      if (storedUser) {
        setState({
          user: storedUser,
          isAuthenticated: true,
          isLoading: true, // Still loading to verify token
          error: null,
        });
      }

      // Verify token with server
      try {
        const user = await getCurrentUser(token);
        setStoredUser(user);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch {
        // Token invalid - clear everything
        tokenManager.clearTokens();
        setStoredUser(null);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    checkAuth();
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch {
        // Refresh failed - user needs to re-login
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          error: "Session expirée",
        }));
        router.push("/login");
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, router]);

  // Login handler
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const tokens = await apiLogin(email, password);

        if (!tokens.access_token) {
          throw new Error("No access token received");
        }

        const user = await getCurrentUser(tokens.access_token);
        setStoredUser(user);

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur de connexion";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));

        return false;
      }
    },
    []
  );

  // Logout handler
  const logout = useCallback(() => {
    apiLogout();
    setStoredUser(null);

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    router.push("/login");
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    const token = tokenManager.getAccessToken();
    if (!token) return;

    try {
      const user = await getCurrentUser(token);
      setStoredUser(user);
      setState((prev) => ({ ...prev, user }));
    } catch {
      // Ignore errors during refresh
    }
  }, [state.isAuthenticated]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Memoize return value
  return useMemo(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login,
      logout,
      refreshUser,
      clearError,
    }),
    [state, login, logout, refreshUser, clearError]
  );
}

export default useAuth;
