import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

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

export async function register(payload: RegisterPayload): Promise<User> {
  const response = await api.post<User>("/api/v1/auth/register", payload);
  return response.data;
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await api.post<TokenPair>("/api/v1/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await api.get<User>("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}
