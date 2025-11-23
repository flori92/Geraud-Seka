import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export interface CashFlowPrediction {
  projection: {
    date: string;
    balance: number;
    daily_change: number;
  }[];
  trend: "up" | "down" | "stable";
  min_balance: number;
  max_balance: number;
  risk_alert: boolean;
}

export interface Anomaly {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  entry_id: string;
  date: string;
  amount: number;
}

export const getCashFlowPrediction = async (days: number = 30) => {
  const response = await api.get<CashFlowPrediction>(`/analytics/cash-flow-prediction?days=${days}`);
  return response.data;
};

export const getAnomalies = async () => {
  const response = await api.get<Anomaly[]>("/analytics/anomalies");
  return response.data;
};

// Payments
export interface StripeCustomerCreate {
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface StripeSubscriptionCreate {
  customer_id: string;
  price_id: string;
  trial_days?: number;
}

export interface KKiaPayLinkCreate {
  amount: number;
  reason: string;
  callback_url: string;
}

export async function createStripeCustomer(data: StripeCustomerCreate, accessToken: string): Promise<any> {
  const response = await api.post("/api/v1/payments/stripe/customer", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createStripeSubscription(data: StripeSubscriptionCreate, accessToken: string): Promise<any> {
  const response = await api.post("/api/v1/payments/stripe/subscribe", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createKKiaPayLink(data: KKiaPayLinkCreate, accessToken: string): Promise<any> {
  const response = await api.post("/api/v1/payments/kkiapay/link", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function verifyKKiaPayTransaction(transactionId: string, accessToken: string): Promise<any> {
  const response = await api.post("/api/v1/payments/kkiapay/verify", { transaction_id: transactionId }, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== CRM APIs ==========

// Opportunities
export interface Opportunity {
  id: string;
  title: string;
  client_id: string;
  client_name?: string;
  value: number;
  stage: string;
  probability: number;
  close_date: string;
  owner_id?: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreate {
  title: string;
  client_id: string;
  value: number;
  stage: string;
  probability: number;
  close_date: string;
  description?: string;
}

export async function getOpportunities(accessToken: string): Promise<Opportunity[]> {
  const response = await api.get<Opportunity[]>("/api/v1/crm/opportunities/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createOpportunity(data: OpportunityCreate, accessToken: string): Promise<Opportunity> {
  const response = await api.post<Opportunity>("/api/v1/crm/opportunities/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Leads
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  status: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  status?: string;
}

export async function getLeads(accessToken: string): Promise<Lead[]> {
  const response = await api.get<Lead[]>("/api/v1/crm/leads/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createLead(data: LeadCreate, accessToken: string): Promise<Lead> {
  const response = await api.post<Lead>("/api/v1/crm/leads/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// CRM Activities
export interface CRMActivity {
  id: string;
  type: "call" | "meeting" | "email" | "task";
  title: string;
  client_id?: string;
  client_name?: string;
  date: string;
  duration?: string;
  status: "scheduled" | "completed" | "pending" | "cancelled";
  notes?: string;
  owner_id?: string;
  owner_name?: string;
  created_at: string;
}

export interface CRMActivityCreate {
  type: "call" | "meeting" | "email" | "task";
  title: string;
  client_id?: string;
  date: string;
  duration?: string;
  status?: string;
  notes?: string;
}

export async function getCRMActivities(accessToken: string): Promise<CRMActivity[]> {
  const response = await api.get<CRMActivity[]>("/api/v1/crm/activities/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createCRMActivity(data: CRMActivityCreate, accessToken: string): Promise<CRMActivity> {
  const response = await api.post<CRMActivity>("/api/v1/crm/activities/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== SALES APIs ==========

// Quotes
export interface Quote {
  id: string;
  number: string;
  client_id: string;
  client_name?: string;
  date: string;
  valid_until: string;
  amount: number;
  status: string;
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteCreate {
  client_id: string;
  date: string;
  valid_until: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export async function getQuotes(accessToken: string): Promise<Quote[]> {
  const response = await api.get<Quote[]>("/api/v1/sales/quotes/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createQuote(data: QuoteCreate, accessToken: string): Promise<Quote> {
  const response = await api.post<Quote>("/api/v1/sales/quotes/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Invoices
export interface Invoice {
  id: string;
  number: string;
  client_id: string;
  client_name?: string;
  date: string;
  due_date: string;
  amount: number;
  paid: number;
  status: string;
  overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  client_id: string;
  date: string;
  due_date: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export async function getInvoices(accessToken: string): Promise<Invoice[]> {
  const response = await api.get<Invoice[]>("/api/v1/sales/invoices/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createInvoice(data: InvoiceCreate, accessToken: string): Promise<Invoice> {
  const response = await api.post<Invoice>("/api/v1/sales/invoices/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
