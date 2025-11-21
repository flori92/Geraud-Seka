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

export interface DashboardStats {
  total_clients: number;
  active_clients: number;
  documents_pending: number;
  documents_processed_this_month: number;
  tasks_overdue: number;
  tasks_due_this_week: number;
}

export async function getDashboardStats(accessToken: string): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/api/v1/dashboard/stats", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export async function uploadDocument(file: File, clientId: string, accessToken: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/api/v1/documents/?client_id=${clientId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export interface Document {
  id: string;
  filename: string;
  status: string;
  file_path?: string;
  total_amount?: number;
  tax_amount?: number;
  created_at: string;
  client_id: string;
}

export async function getDocuments(accessToken: string, clientId?: string): Promise<Document[]> {
  const url = clientId ? `/api/v1/documents/?client_id=${clientId}` : "/api/v1/documents/";
  const response = await api.get<Document[]>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function getDocument(documentId: string, accessToken: string): Promise<Document> {
  const response = await api.get<Document>(`/api/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  sector?: string;
  tenant_id: string;
}

export interface ClientCreate {
  name: string;
  slug: string;
  sector?: string;
}

export async function getClients(accessToken: string): Promise<Client[]> {
  const response = await api.get<Client[]>("/api/v1/clients/", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export async function createClient(clientData: ClientCreate, accessToken: string): Promise<Client> {
  const response = await api.post<Client>("/api/v1/clients/", clientData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export interface ValidationData {
  date: string;
  supplier_name: string;
  total_amount: number;
  tax_amount: number;
  description: string;
  account_number?: string;
  journal_code?: string;
}

export async function validateDocument(documentId: string, data: ValidationData, accessToken: string): Promise<any> {
  const response = await api.post(`/api/v1/documents/${documentId}/validate`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

// Activities
export interface Activity {
  id: string;
  type: "REVENUE" | "EXPENSE";
  date: string;
  amount: number;
  description?: string;
  client_id: string;
  tenant_id: string;
}

export interface ActivityCreate {
  type: "REVENUE" | "EXPENSE";
  date: string;
  amount: number;
  description?: string;
  client_id: string;
}

export async function getActivities(accessToken: string, clientId?: string): Promise<Activity[]> {
  const url = clientId ? `/api/v1/activities/?client_id=${clientId}` : "/api/v1/activities/";
  const response = await api.get<Activity[]>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createActivity(data: ActivityCreate, accessToken: string): Promise<Activity> {
  const response = await api.post<Activity>("/api/v1/activities/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Products
export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  min_stock_alert?: number;
  client_id: string;
  tenant_id: string;
}

export interface ProductCreate {
  name: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  min_stock_alert?: number;
  client_id: string;
}

export interface ProductUpdate {
  name?: string;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  min_stock_alert?: number;
}

export async function getProducts(accessToken: string, clientId?: string): Promise<Product[]> {
  const url = clientId ? `/api/v1/products/?client_id=${clientId}` : "/api/v1/products/";
  const response = await api.get<Product[]>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createProduct(data: ProductCreate, accessToken: string): Promise<Product> {
  const response = await api.post<Product>("/api/v1/products/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateProduct(id: string, data: ProductUpdate, accessToken: string): Promise<Product> {
  const response = await api.put<Product>(`/api/v1/products/${id}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
