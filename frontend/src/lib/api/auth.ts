/**
 * API Authentication Module
 *
 * Gestion de l'authentification:
 * - Login/Logout
 * - Registration
 * - Password reset
 * - User profile
 */

import { api, tokenManager } from "./client";

// ============================================
// Types
// ============================================

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  tenant_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterPayload {
  tenant_name: string;
  tenant_slug: string;
  tenant_country?: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Register a new user and tenant
 */
export async function register(payload: RegisterPayload): Promise<User> {
  const response = await api.post<User>("/auth/register", payload);
  return response.data;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<TokenPair> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await api.post<TokenPair>("/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  // Store tokens
  if (response.data.access_token && response.data.refresh_token) {
    tokenManager.setTokens(response.data.access_token, response.data.refresh_token);
  }

  return response.data;
}

/**
 * Logout - Clear all tokens
 */
export function logout(): void {
  tokenManager.clearTokens();
  tokenManager.clearSelectedClient();
  if (typeof window !== "undefined") {
    sessionStorage.clear();
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(accessToken?: string): Promise<User> {
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  const response = await api.get<User>("/auth/me", { headers });
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<TokenPair> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await api.post<TokenPair>("/auth/refresh", {
    refresh_token: refreshToken,
  });

  if (response.data.access_token && response.data.refresh_token) {
    tokenManager.setTokens(response.data.access_token, response.data.refresh_token);
  }

  return response.data;
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>("/auth/password-reset", { email });
  return response.data;
}

/**
 * Confirm password reset with token
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>("/auth/password-reset/confirm", {
    token,
    new_password: newPassword,
  });
  return response.data;
}

/**
 * Change current user's password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: Partial<User>): Promise<User> {
  const response = await api.patch<User>("/auth/me", data);
  return response.data;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!tokenManager.getAccessToken();
}
