/**
 * Configuration centralisée du client API Axios
 *
 * Ce fichier contient:
 * - La configuration de base URL
 * - Les interceptors pour l'authentification
 * - La gestion des erreurs
 * - Les helpers pour les tokens
 */

import axios, { AxiosInstance, AxiosError } from "axios";

// ============================================
// Types
// ============================================

export type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
};

// ============================================
// Configuration
// ============================================

const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (process.env.NODE_ENV !== "production") {
    if (!baseUrl) return "";
  }

  if (!baseUrl) {
    return "https://api.sekagestion.com";
  }

  // Force HTTPS en production
  if (baseUrl.includes("api.sekagestion.com") && baseUrl.startsWith("http://")) {
    return baseUrl.replace("http://", "https://");
  }

  if (baseUrl.startsWith("http://") && process.env.NODE_ENV === "production") {
    return baseUrl.replace("http://", "https://");
  }

  return baseUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// ============================================
// Token Management
// ============================================

const TOKEN_KEYS = {
  ACCESS: "seka_access_token",
  REFRESH: "seka_refresh_token",
  USER: "user",
  SELECTED_CLIENT: "seka_selected_client",
  INVALID_HANDLED: "seka_invalid_token_handled",
} as const;

export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.REFRESH);
  },

  setTokens: (access: string, refresh: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
  },

  getSelectedClient: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.SELECTED_CLIENT);
  },

  setSelectedClient: (clientId: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEYS.SELECTED_CLIENT, clientId);
  },

  clearSelectedClient: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEYS.SELECTED_CLIENT);
  },
};

// ============================================
// Axios Instance
// ============================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ============================================
// Interceptors
// ============================================

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const selectedClientId = tokenManager.getSelectedClient();
  if (selectedClientId) {
    config.headers = config.headers ?? {};
    config.headers["X-Client-Id"] = selectedClientId;
  }

  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const data = error.response?.data;

    // Handle 401 - Invalid token
    if (status === 401 && typeof window !== "undefined") {
      const detail = typeof data?.detail === "string" ? data.detail : "";
      const message = typeof data?.message === "string" ? data.message : "";
      const looksInvalid = detail.includes("Invalid token") || message.includes("Invalid token");

      if (looksInvalid) {
        const alreadyHandled = sessionStorage.getItem(TOKEN_KEYS.INVALID_HANDLED) === "1";
        if (!alreadyHandled) {
          sessionStorage.setItem(TOKEN_KEYS.INVALID_HANDLED, "1");
          tokenManager.clearTokens();

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }
    }

    // Production 401 handling
    if (
      process.env.NODE_ENV === "production" &&
      status === 401 &&
      typeof window !== "undefined"
    ) {
      tokenManager.clearTokens();

      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }

    // Skip Sentry errors
    if (error.message?.includes("sentry") || url.includes("sentry")) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// ============================================
// Error Helpers
// ============================================

export function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as ApiErrorPayload | undefined;
  if (typeof data?.detail === "string" && data.detail.trim().length > 0) return data.detail;
  if (typeof data?.message === "string" && data.message.trim().length > 0) return data.message;
  if (typeof error.message === "string" && error.message.trim().length > 0) return error.message;
  return null;
}

export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return error.code === "ERR_NETWORK" || error.message === "Network Error";
}

export function isTimeoutError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return error.code === "ECONNABORTED" || error.message.includes("timeout");
}
