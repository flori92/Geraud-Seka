import axios from "axios";

// Force HTTPS in production, never fall back to HTTP
const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;

  // If no env var, use production API with HTTPS
  if (!baseUrl) {
    return "https://api.sekagestion.com";
  }

  // ALWAYS force HTTPS for api.sekagestion.com (never use HTTP)
  // This prevents Mixed Content errors in production
  if (baseUrl.includes("api.sekagestion.com") && baseUrl.startsWith("http://")) {
    return baseUrl.replace("http://", "https://");
  }

  // Force HTTPS in production environment
  if (baseUrl.startsWith("http://") && process.env.NODE_ENV === "production") {
    return baseUrl.replace("http://", "https://");
  }

  return baseUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL in development for debugging
if (process.env.NODE_ENV === "development") {
  console.log("[API] Using API Base URL:", API_BASE_URL);
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000, // Augmenté pour les connexions lentes
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as any;
  if (typeof data?.detail === "string" && data.detail.trim().length > 0) return data.detail;
  if (typeof data?.message === "string" && data.message.trim().length > 0) return data.message;
  if (typeof error.message === "string" && error.message.trim().length > 0) return error.message;
  return null;
}

// Intercepteur pour gérer automatiquement les erreurs 401 (token invalide/expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si le token est invalide ou expiré (401), déconnecter l'utilisateur
    if (error.response?.status === 401) {
      // Vérifier si nous sommes dans un navigateur (pas côté serveur)
      if (typeof window !== "undefined") {
        // Effacer les données d'authentification
        localStorage.removeItem("seka_access_token");
        localStorage.removeItem("seka_refresh_token");
        localStorage.removeItem("user");

        // Rediriger vers la page de connexion seulement si on n'y est pas déjà
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          console.log("[API] Token invalide - redirection vers login");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

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
  const response = await api.post<User>("/auth/register", payload);
  return response.data;
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await api.post<TokenPair>("/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await api.get<User>("/auth/me", {
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
  total_revenue?: number;
  total_invoices?: number;
  pending_payments?: number;
  alerts?: Array<{
    type: string;
    title: string;
    message: string;
  }>;
  recent_activities?: Array<{
    action: string;
    client: string;
    amount?: string;
    time: string;
  }>;
}

export async function getDashboardStats(accessToken: string): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard/stats", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export async function uploadDocument(file: File, clientId: string, accessToken: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/documents/?client_id=${clientId}`, formData, {
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
  content_type?: string;
  file_size?: number;
  reference_number?: string;
  date?: string;
  due_date?: string;
  amount_ht?: number;
  amount_vat?: number;
  amount_ttc?: number;
  currency?: string;
  supplier_name?: string;
  supplier_address?: string;
  customer_name?: string;
  description?: string;
  total_amount?: number;
  tax_amount?: number;
  created_at: string;
  updated_at?: string;
  client_id: string;
}

export async function getDocuments(accessToken: string, clientId?: string): Promise<Document[]> {
  const url = clientId ? `/documents/?client_id=${clientId}` : "/documents/";
  const response = await api.get<Document[]>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function getDocument(documentId: string, accessToken: string): Promise<Document> {
  const response = await api.get<Document>(`/documents/${documentId}`, {
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
  const response = await api.get<Client[]>("/clients/", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export async function createClient(clientData: ClientCreate, accessToken: string): Promise<Client> {
  const response = await api.post<Client>("/clients/", clientData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export interface ValidationData {
  reference_number?: string;
  date?: string;
  due_date?: string;
  supplier_name?: string;
  amount_ht?: number;
  amount_vat?: number;
  amount_ttc?: number;
  description?: string;
  account_number?: string;
  journal_code?: string;
}

export async function validateDocument(documentId: string, data: ValidationData, accessToken: string): Promise<any> {
  const response = await api.post(`/documents/${documentId}/validate`, data, {
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
  const url = clientId ? `/activities/?client_id=${clientId}` : "/activities/";
  const response = await api.get<Activity[]>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createActivity(data: ActivityCreate, accessToken: string): Promise<Activity> {
  const response = await api.post<Activity>("/activities/", data, {
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
  client_id?: string; // Optional - backend will use tenant from JWT if not provided
}

export interface ProductUpdate {
  name?: string;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  min_stock_alert?: number;
}

export async function getProducts(accessToken: string, clientId?: string): Promise<Product[]> {
  const url = clientId ? `/products/?client_id=${clientId}` : "/products/";
  const response = await api.get<Product[]>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createProduct(data: ProductCreate, accessToken: string): Promise<Product> {
  const response = await api.post<Product>("/products/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateProduct(id: string, data: ProductUpdate, accessToken: string): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, data, {
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
  const response = await api.post("/payments/stripe/customer", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createStripeSubscription(data: StripeSubscriptionCreate, accessToken: string): Promise<any> {
  const response = await api.post("/payments/stripe/subscribe", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createKKiaPayLink(data: KKiaPayLinkCreate, accessToken: string): Promise<any> {
  const response = await api.post("/payments/kkiapay/link", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function verifyKKiaPayTransaction(transactionId: string, accessToken: string): Promise<any> {
  const response = await api.post("/payments/kkiapay/verify", { transaction_id: transactionId }, {
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

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  total_count?: number;
}

export async function getOpportunities(accessToken: string): Promise<Opportunity[]> {
  try {
    const response = await api.get<OpportunitiesResponse | Opportunity[]>("/crm/opportunities/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.opportunities || [];
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return [];
  }
}

export async function createOpportunity(data: OpportunityCreate, accessToken: string): Promise<Opportunity> {
  const response = await api.post<Opportunity>("/crm/opportunities/", data, {
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
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
}

interface LeadsResponse {
  leads: Lead[];
  total_count?: number;
}

export async function getLeads(accessToken: string): Promise<Lead[]> {
  try {
    const response = await api.get<LeadsResponse | Lead[]>("/crm/leads/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.leads || [];
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

export async function createLead(data: LeadCreate, accessToken: string): Promise<Lead> {
  const response = await api.post<Lead>("/crm/leads/", data, {
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
  subject: string;
  description?: string;
  due_date?: string;
  duration_minutes?: number;
  client_id?: string;
  assigned_to?: string; // Optional - backend will use authenticated user from JWT if not provided
}

interface ActivitiesResponse {
  activities: CRMActivity[];
  total_count?: number;
}

export async function getCRMActivities(accessToken: string): Promise<CRMActivity[]> {
  try {
    const response = await api.get<ActivitiesResponse | CRMActivity[]>("/crm/activities/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.activities || [];
  } catch (error) {
    console.error("Error fetching CRM activities:", error);
    return [];
  }
}

export async function createCRMActivity(data: CRMActivityCreate, accessToken: string): Promise<CRMActivity> {
  const response = await api.post<CRMActivity>("/crm/activities/", data, {
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
  title: string;
  client_id: string;
  issue_date: string;
  expiry_date: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

interface QuotesResponse {
  quotes: Quote[];
  total?: number;
}

export async function getQuotes(accessToken: string): Promise<Quote[]> {
  try {
    const response = await api.get<QuotesResponse | Quote[]>("/sales/quotes/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Handle both wrapped and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.quotes || [];
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

export async function createQuote(data: QuoteCreate, accessToken: string): Promise<Quote> {
  const response = await api.post<Quote>("/sales/quotes/", data, {
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
  title: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

interface InvoicesResponse {
  invoices: Invoice[];
  total?: number;
}

export async function getInvoices(accessToken: string): Promise<Invoice[]> {
  try {
    const response = await api.get<InvoicesResponse | Invoice[]>("/sales/invoices/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Handle both wrapped and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.invoices || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function createInvoice(data: InvoiceCreate, accessToken: string): Promise<Invoice> {
  const response = await api.post<Invoice>("/sales/invoices/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== HR APIs ==========

// Employees
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hire_date: string;
  salary?: number;
  status: "active" | "inactive" | "on_leave";
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hire_date: string;
  salary?: number;
  status?: string;
}

export async function getEmployees(accessToken: string): Promise<Employee[]> {
  try {
    const response = await api.get<Employee[]>("/hr/employees/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

export async function createEmployee(data: EmployeeCreate, accessToken: string): Promise<Employee> {
  const response = await api.post<Employee>("/hr/employees/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Contracts
export interface Contract {
  id: string;
  employee_id: string;
  employee_name?: string;
  contract_type: "CDI" | "CDD" | "Stage" | "Freelance";
  start_date: string;
  end_date?: string;
  salary: number;
  status: "active" | "expired" | "terminated";
  document_url?: string;
  created_at: string;
}

export interface ContractCreate {
  employee_id: string;
  contract_type: "CDI" | "CDD" | "Stage" | "Freelance";
  start_date: string;
  end_date?: string;
  salary: number;
  terms?: string;
}

export async function getContracts(accessToken: string): Promise<Contract[]> {
  try {
    const response = await api.get<Contract[]>("/hr/contracts/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return [];
  }
}

export async function createContract(data: ContractCreate, accessToken: string): Promise<Contract> {
  const response = await api.post<Contract>("/hr/contracts/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Payslips
export interface Payslip {
  id: string;
  employee_id: string;
  employee_name?: string;
  period_start: string;
  period_end: string;
  gross_salary: number;
  net_salary: number;
  deductions: number;
  bonuses: number;
  status: "draft" | "paid" | "pending";
  document_url?: string;
  created_at: string;
}

export interface PayslipCreate {
  employee_id: string;
  period_start: string;
  period_end: string;
  gross_salary: number;
  deductions?: number;
  bonuses?: number;
}

export async function getPayslips(accessToken: string): Promise<Payslip[]> {
  try {
    const response = await api.get<Payslip[]>("/hr/payslips/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return [];
  }
}

export async function createPayslip(data: PayslipCreate, accessToken: string): Promise<Payslip> {
  const response = await api.post<Payslip>("/hr/payslips/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Leaves
export interface Leave {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: "vacation" | "sick" | "personal" | "maternity" | "unpaid";
  start_date: string;
  end_date: string;
  days_count: number;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  created_at: string;
}

export interface LeaveCreate {
  employee_id: string;
  leave_type: "vacation" | "sick" | "personal" | "maternity" | "unpaid";
  start_date: string;
  end_date: string;
  reason?: string;
}

export async function getLeaves(accessToken: string): Promise<Leave[]> {
  try {
    const response = await api.get<Leave[]>("/hr/leaves/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return [];
  }
}

export async function createLeave(data: LeaveCreate, accessToken: string): Promise<Leave> {
  const response = await api.post<Leave>("/hr/leaves/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== ACCOUNTING APIs ==========

// Journal Entries
export interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  reference?: string;
  created_at: string;
}

export interface JournalEntryCreate {
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  reference?: string;
}

export async function getJournalEntries(accessToken: string): Promise<JournalEntry[]> {
  try {
    const response = await api.get<JournalEntry[]>("/accounting/journal/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return [];
  }
}

export async function createJournalEntry(data: JournalEntryCreate, accessToken: string): Promise<JournalEntry> {
  const response = await api.post<JournalEntry>("/accounting/journal/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Balance Sheet
export interface TrialBalanceItem {
  account_number: string;
  account_name: string;
  debit: number;
  credit: number;
  solde_debit: number;
  solde_credit: number;
}

export interface TrialBalanceResponse {
  accounts: TrialBalanceItem[];
  totals: {
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
  };
}

export interface BalanceSheet {
  assets: {
    current_assets: number;
    fixed_assets: number;
    total_assets: number;
  };
  liabilities: {
    current_liabilities: number;
    long_term_liabilities: number;
    total_liabilities: number;
  };
  equity: {
    share_capital: number;
    retained_earnings: number;
    total_equity: number;
  };
  period: string;
}

export const getTrialBalance = async (token: string, startDate?: string, endDate?: string): Promise<TrialBalanceResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await api.get(`/accounting/advanced/balance?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching trial balance:", error);
    return null;
  }
};

export const getBalanceSheet = async (token: string, date?: string): Promise<BalanceSheet> => {
  const params = date ? `?date=${date}` : "";
  const response = await api.get<BalanceSheet>(`/accounting/balance${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Ledger
export interface LedgerAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
  currency: string;
}

export interface LedgerAccountCreate {
  account_code: string;
  account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  currency?: string;
  initial_balance?: number;
}

export async function getLedgerAccounts(accessToken: string): Promise<LedgerAccount[]> {
  try {
    const response = await api.get<LedgerAccount[]>("/accounting/ledger/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching ledger accounts:", error);
    return [];
  }
}

export async function createLedgerAccount(data: LedgerAccountCreate, accessToken: string): Promise<LedgerAccount> {
  const response = await api.post<LedgerAccount>("/accounting/ledger/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Treasury Dashboard
export interface TreasuryDashboardData {
  total_balance: number;
  total_balance_by_currency: Record<string, number>;
  accounts_summary: any[];
  recent_transactions: any[];
  upcoming_payments: any[];
  cash_runway_days: number;
  alerts: any[];
  cash_flow_summary: {
    period_start: string;
    period_end: string;
    opening_balance: number;
    total_income: number;
    total_expenses: number;
    net_cash_flow: number;
    closing_balance: number;
    currency: string;
  };
}

export async function getTreasuryDashboard(accessToken: string): Promise<TreasuryDashboardData> {
  try {
    const response = await api.get<TreasuryDashboardData>("/treasury/dashboard", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data || {
      total_balance: 0,
      total_balance_by_currency: {},
      accounts_summary: [],
      recent_transactions: [],
      upcoming_payments: [],
      cash_runway_days: 0,
      alerts: [],
      cash_flow_summary: {
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        opening_balance: 0,
        total_income: 0,
        total_expenses: 0,
        net_cash_flow: 0,
        closing_balance: 0,
        currency: "XOF"
      }
    };
  } catch (error) {
    console.error("Error fetching treasury dashboard:", error);
    return {
      total_balance: 0,
      total_balance_by_currency: {},
      accounts_summary: [],
      recent_transactions: [],
      upcoming_payments: [],
      cash_runway_days: 0,
      alerts: [],
      cash_flow_summary: {
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        opening_balance: 0,
        total_income: 0,
        total_expenses: 0,
        net_cash_flow: 0,
        closing_balance: 0,
        currency: "XOF"
      }
    };
  }
}

// ========== STOCK APIs ==========

// Inventory
export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  available_quantity?: number;
  reserved_quantity?: number;
  unit_cost?: number;
  total_value?: number;
  location?: string;
  reorder_point?: number;
  last_updated?: string;
  last_restocked?: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  unit?: string;
}

interface InventoryResponse {
  inventory: InventoryItem[];
  total_count: number;
  summary?: {
    total_items: number;
    total_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
  };
}

export async function getInventory(accessToken: string): Promise<InventoryItem[]> {
  try {
    const response = await api.get<InventoryResponse | InventoryItem[]>("/stock/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Handle both wrapped and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.inventory || [];
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

// Stock Movements
export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  movement_type: "in" | "out" | "adjustment" | "transfer";
  type?: "in" | "out"; // Backend uses 'type' instead of 'movement_type'
  quantity: number;
  reference?: string;
  reason?: string;
  created_at: string;
  created_by?: string;
  unit_cost?: number;
  total_cost?: number;
}

export interface StockMovementCreate {
  product_id: string;
  movement_type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  reference?: string;
  reason?: string;
}

interface MovementsResponse {
  movements: StockMovement[];
  total_count: number;
  summary?: {
    total_in: number;
    total_out: number;
    net_movement: number;
  };
}

export async function getStockMovements(accessToken: string): Promise<StockMovement[]> {
  try {
    const response = await api.get<MovementsResponse | StockMovement[]>("/stock/movements/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Handle both wrapped and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.movements || [];
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return [];
  }
}

export async function createStockMovement(data: StockMovementCreate, accessToken: string): Promise<StockMovement> {
  const response = await api.post<StockMovement>("/stock/movements/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== SALES APIs (Extended) ==========

// Purchase Orders
export interface PurchaseOrder {
  id: string;
  number: string;
  supplier_id: string;
  supplier_name?: string;
  date: string;
  delivery_date: string;
  amount: number;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderCreate {
  supplier_id: string;
  date: string;
  delivery_date: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  notes?: string;
}

interface PurchaseOrdersResponse {
  purchase_orders: PurchaseOrder[];
  total?: number;
}

export async function getPurchaseOrders(accessToken: string): Promise<PurchaseOrder[]> {
  try {
    const response = await api.get<PurchaseOrdersResponse | PurchaseOrder[]>("/sales/purchase-orders/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Handle both wrapped and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.purchase_orders || [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

export async function createPurchaseOrder(data: PurchaseOrderCreate, accessToken: string): Promise<PurchaseOrder> {
  const response = await api.post<PurchaseOrder>("/sales/purchase-orders/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Delivery Notes
export interface DeliveryNote {
  id: string;
  number: string;
  client_id: string;
  client_name?: string;
  date: string;
  items_count: number;
  status: "preparing" | "in_transit" | "delivered" | "cancelled";
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryNoteCreate {
  client_id: string;
  date: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  notes?: string;
}

interface DeliveryNotesResponse {
  delivery_notes: DeliveryNote[];
  total?: number;
}

export async function getDeliveryNotes(accessToken: string): Promise<DeliveryNote[]> {
  try {
    const response = await api.get<DeliveryNotesResponse | DeliveryNote[]>("/sales/delivery-notes/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Handle both wrapped and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.delivery_notes || [];
  } catch (error) {
    console.error("Error fetching delivery notes:", error);
    return [];
  }
}

export async function createDeliveryNote(data: DeliveryNoteCreate, accessToken: string): Promise<DeliveryNote> {
  const response = await api.post<DeliveryNote>("/sales/delivery-notes/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== REPORTS APIs ==========

export interface SalesReport {
  period: string;
  total_revenue: number;
  total_sales: number;
  average_order_value: number;
  conversion_rate: number;
  top_products: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  sales_by_channel: Array<{
    channel: string;
    percentage: number;
    revenue: number;
  }>;
}

export async function getSalesReport(accessToken: string, period?: string): Promise<SalesReport> {
  const params = period ? `?period=${period}` : "";
  const response = await api.get<SalesReport>(`/reports/sales${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export interface AccountingReport {
  period: string;
  revenue: {
    sales: number;
    services: number;
    other: number;
    total: number;
  };
  expenses: {
    salaries: number;
    rent: number;
    supplies: number;
    utilities: number;
    other: number;
    total: number;
  };
  net_profit: number;
  cash_flow: Array<{
    month: string;
    operating: number;
    investing: number;
    financing: number;
  }>;
}

export async function getAccountingReport(accessToken: string, period?: string): Promise<AccountingReport> {
  const params = period ? `?period=${period}` : "";
  const response = await api.get<AccountingReport>(`/reports/accounting${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export interface HRReport {
  period: string;
  total_employees: number;
  new_hires: number;
  attendance_rate: number;
  total_payroll: number;
  headcount_by_department: Array<{
    department: string;
    count: number;
    change: string;
  }>;
  attendance_trend: Array<{
    month: string;
    present: number;
    absent: number;
    leaves: number;
  }>;
  turnover_rate: number;
  retention_rate: number;
  average_tenure: number;
}

export async function getHRReport(accessToken: string, period?: string): Promise<HRReport> {
  const params = period ? `?period=${period}` : "";
  const response = await api.get<HRReport>(`/reports/hr${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== TREASURY APIs ==========

export interface CashFlowData {
  label: string;
  in: number;
  out: number;
}

export async function getCashFlow(accessToken: string, period?: string): Promise<CashFlowData[]> {
  const params = period ? `?period=${period}` : "";
  const response = await api.get<CashFlowData[]>(`/treasury/cash-flow${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== BILLING APIs ==========

export interface Subscription {
  plan: string;
  status: string;
  stripe_customer_id?: string;
  next_billing_date?: string;
  amount?: number;
}

export interface BillingInvoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  invoice_url?: string;
}

export async function getSubscription(accessToken: string): Promise<Subscription> {
  const response = await api.get<Subscription>("/billing/subscription", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function getBillingHistory(accessToken: string): Promise<BillingInvoice[]> {
  const response = await api.get<BillingInvoice[]>("/billing/history", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== SUPPLIERS APIs ==========

export interface Supplier {
  id: string;
  name: string;
  nif?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  default_account?: string;
  default_tax_rate?: number;
  default_journal?: string;
  default_description?: string;
  total_orders: number;
  total_spent: number;
  status: string;
}

export interface SupplierCreate {
  name: string;
  nif?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  default_account?: string;
  default_tax_rate?: number;
  default_journal?: string;
  default_description?: string;
}

export async function getSuppliers(accessToken: string, search?: string): Promise<Supplier[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<Supplier[]>(`/suppliers${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function getSupplier(accessToken: string, supplierId: string): Promise<Supplier> {
  const response = await api.get<Supplier>(`/suppliers/${supplierId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createSupplier(accessToken: string, data: SupplierCreate): Promise<Supplier> {
  const response = await api.post<Supplier>("/suppliers", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateSupplier(accessToken: string, supplierId: string, data: Partial<SupplierCreate>): Promise<Supplier> {
  const response = await api.put<Supplier>(`/suppliers/${supplierId}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function deleteSupplier(accessToken: string, supplierId: string): Promise<void> {
  await api.delete(`/suppliers/${supplierId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ========== BANK TRANSACTIONS APIs ==========

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  description: string;
  amount: number;
  transaction_type: "credit" | "debit";
  category?: string;
  counterparty?: string;
  reference?: string;
  status: "pending" | "validated" | "reconciled";
  is_reconciled: boolean;
  reconciled_at?: string;
  bank_statement_line?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface BankTransactionCreate {
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  description: string;
  amount: number;
  transaction_type: "credit" | "debit";
  category?: string;
  counterparty?: string;
  reference?: string;
}

export interface BankTransactionFilters {
  bank_account_id?: string;
  transaction_type?: string;
  status?: string;
  is_reconciled?: boolean;
  start_date?: string;
  end_date?: string;
  category?: string;
}

export async function getBankTransactions(
  accessToken: string,
  filters?: BankTransactionFilters,
  skip: number = 0,
  limit: number = 100
): Promise<BankTransaction[]> {
  try {
    const params = new URLSearchParams();
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    if (filters) {
      if (filters.bank_account_id) params.append("bank_account_id", filters.bank_account_id);
      if (filters.transaction_type) params.append("transaction_type", filters.transaction_type);
      if (filters.status) params.append("status", filters.status);
      if (filters.is_reconciled !== undefined) params.append("is_reconciled", filters.is_reconciled.toString());
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.category) params.append("category", filters.category);
    }

    const response = await api.get<BankTransaction[]>(`/bank-transactions/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching bank transactions:", error);
    return [];
  }
}

export async function getBankTransaction(accessToken: string, transactionId: string): Promise<BankTransaction> {
  const response = await api.get<BankTransaction>(`/bank-transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createBankTransaction(accessToken: string, data: BankTransactionCreate): Promise<BankTransaction> {
  const response = await api.post<BankTransaction>("/bank-transactions/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateBankTransaction(
  accessToken: string,
  transactionId: string,
  data: Partial<BankTransactionCreate>
): Promise<BankTransaction> {
  const response = await api.put<BankTransaction>(`/bank-transactions/${transactionId}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function deleteBankTransaction(accessToken: string, transactionId: string): Promise<void> {
  await api.delete(`/bank-transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function reconcileBankTransaction(
  accessToken: string,
  transactionId: string,
  bankStatementLine?: string
): Promise<BankTransaction> {
  const response = await api.post<BankTransaction>(
    `/bank-transactions/${transactionId}/reconcile`,
    { bank_statement_line: bankStatementLine },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

export async function getUnreconciledTransactions(
  accessToken: string,
  bankAccountId?: string
): Promise<BankTransaction[]> {
  try {
    const params = bankAccountId ? `?bank_account_id=${bankAccountId}` : '';
    const response = await api.get<BankTransaction[]>(`/bank-transactions/unreconciled${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching unreconciled transactions:", error);
    return [];
  }
}

// ========== BANK ACCOUNTS APIs ==========

export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  iban?: string;
  bic?: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export async function getBankAccounts(accessToken: string): Promise<BankAccount[]> {
  try {
    const response = await api.get<BankAccount[]>("/bank-accounts/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return [];
  }
}

// ========== DASHBOARD STATS (Extended) ==========

export interface DashboardStatsExtended extends DashboardStats {
  solde_comptes: number;
  encaissements: number;
  decaissements: number;
  total_facture_ht: number;
  total_achats_ttc: number;
  transactions_a_justifier: number;
  factures_en_retard: number;
  demandes_comptables: number;
  rapprochements_suggeres: number;
}

export async function getDashboardStatsExtended(accessToken: string): Promise<DashboardStatsExtended> {
  try {
    const response = await api.get<DashboardStatsExtended>("/dashboard/stats/extended", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching extended dashboard stats:", error);
    // Return default values
    return {
      total_clients: 0,
      active_clients: 0,
      documents_pending: 0,
      documents_processed_this_month: 0,
      tasks_overdue: 0,
      tasks_due_this_week: 0,
      solde_comptes: 0,
      encaissements: 0,
      decaissements: 0,
      total_facture_ht: 0,
      total_achats_ttc: 0,
      transactions_a_justifier: 0,
      factures_en_retard: 0,
      demandes_comptables: 0,
      rapprochements_suggeres: 0,
    };
  }
}

// ========== ACCOUNTING RULES APIs ==========

export interface AccountingRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  conditions: Array<{
    type: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    debit_account?: string;
    credit_account?: string;
    vat_rate?: number;
    label_template?: string;
  }>;
  is_active: boolean;
  auto_apply: boolean;
  confidence_threshold?: number;
  match_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccountingRuleCreate {
  name: string;
  description?: string;
  priority?: number;
  conditions: Array<{
    type: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    debit_account?: string;
    credit_account?: string;
    vat_rate?: number;
    label_template?: string;
  }>;
  auto_apply?: boolean;
  confidence_threshold?: number;
}

export async function getAccountingRules(accessToken: string): Promise<AccountingRule[]> {
  try {
    const response = await api.get<AccountingRule[]>("/accounting-rules/rules", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching accounting rules:", error);
    return [];
  }
}

export async function createAccountingRule(
  accessToken: string,
  data: AccountingRuleCreate
): Promise<AccountingRule> {
  const response = await api.post<AccountingRule>("/accounting-rules/rules", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateAccountingRule(
  accessToken: string,
  ruleId: string,
  data: Partial<AccountingRuleCreate>
): Promise<AccountingRule> {
  const response = await api.put<AccountingRule>(`/accounting-rules/rules/${ruleId}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function deleteAccountingRule(accessToken: string, ruleId: string): Promise<void> {
  await api.delete(`/accounting-rules/rules/${ruleId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function toggleAccountingRule(
  accessToken: string,
  ruleId: string,
  isActive: boolean
): Promise<AccountingRule> {
  const response = await api.put<AccountingRule>(
    `/accounting-rules/rules/${ruleId}`,
    { is_active: isActive },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

// ========== JOURNALS APIs ==========

export interface Journal {
  id: string;
  code: string;
  name: string;
  type: "purchases" | "sales" | "bank" | "cash" | "misc";
  is_active: boolean;
  entries_count?: number;
  last_entry_date?: string;
  total_debit?: number;
  total_credit?: number;
  created_at?: string;
}

export async function getJournals(accessToken: string): Promise<Journal[]> {
  try {
    const response = await api.get<Journal[]>("/accounting/journals", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching journals:", error);
    return [];
  }
}

export async function getJournalEntriesFiltered(
  accessToken: string,
  journalCode?: string,
  startDate?: string,
  endDate?: string
): Promise<JournalEntry[]> {
  try {
    const params = new URLSearchParams();
    if (journalCode) params.append("journal_code", journalCode);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await api.get<JournalEntry[]>(`/accounting/journal/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return [];
  }
}

// ========== AI LEARNING APIs ==========

export interface AILearningModel {
  id: string;
  type: "classification" | "extraction" | "prediction";
  description: string;
  accuracy: number;
  samples_count: number;
  status: "learning" | "stable" | "needs_review";
  last_updated: string;
  created_at: string;
}

export interface AILearningStats {
  average_accuracy: number;
  total_samples: number;
  stable_models: number;
  improvement_rate: number;
  models: AILearningModel[];
}

export async function getAILearningStats(accessToken: string): Promise<AILearningStats> {
  try {
    const response = await api.get<AILearningStats>("/analytics/ai-learning", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AI learning stats:", error);
    // Return default if API doesn't exist yet
    return {
      average_accuracy: 0,
      total_samples: 0,
      stable_models: 0,
      improvement_rate: 0,
      models: [],
    };
  }
}

export async function submitAIFeedback(
  accessToken: string,
  modelId: string,
  isCorrect: boolean,
  corrections?: Record<string, any>
): Promise<void> {
  await api.post(
    "/analytics/ai-feedback",
    { model_id: modelId, is_correct: isCorrect, corrections },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

// ========== CRM CONTACTS APIs ==========

export interface CRMContact {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  contact_type?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  preferred_contact_method?: string;
  language?: string;
  linkedin_url?: string;
  is_primary?: boolean;
  is_active?: boolean;
  do_not_contact?: boolean;
  email_opt_out?: boolean;
  notes?: string;
  tags?: string[];
  client_id?: string;
  client_name?: string;
  lead_id?: string;
  assigned_to?: string;
  last_contact_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CRMContactCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  contact_type?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  preferred_contact_method?: string;
  linkedin_url?: string;
  is_primary?: boolean;
  notes?: string;
  tags?: string[];
  client_id?: string;
  lead_id?: string;
}

export async function getCRMContacts(accessToken: string, search?: string): Promise<CRMContact[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<CRMContact[]>(`/crm/contacts/${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching CRM contacts:", error);
    return [];
  }
}

export async function getCRMContact(accessToken: string, contactId: string): Promise<CRMContact | null> {
  try {
    const response = await api.get<CRMContact>(`/crm/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching CRM contact:", error);
    return null;
  }
}

export async function createCRMContact(accessToken: string, data: CRMContactCreate): Promise<CRMContact> {
  const response = await api.post<CRMContact>("/crm/contacts/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateCRMContact(
  accessToken: string,
  contactId: string,
  data: Partial<CRMContactCreate>
): Promise<CRMContact> {
  const response = await api.put<CRMContact>(`/crm/contacts/${contactId}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function deleteCRMContact(accessToken: string, contactId: string): Promise<void> {
  await api.delete(`/crm/contacts/${contactId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ========== EXTENDED CRM APIs ==========

export async function getCRMLeads(accessToken: string, status?: string): Promise<Lead[]> {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<Lead[]>(`/crm/leads/${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching CRM leads:", error);
    return [];
  }
}

export async function getCRMOpportunities(accessToken: string, stage?: string): Promise<Opportunity[]> {
  try {
    const params = stage ? `?stage=${stage}` : '';
    const response = await api.get<Opportunity[]>(`/crm/opportunities/${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching CRM opportunities:", error);
    return [];
  }
}

export async function getOpportunitiesPipeline(accessToken: string): Promise<{
  stages: Array<{ stage: string; count: number; total_amount: number; weighted_amount: number }>;
  total_value: number;
  total_weighted: number;
}> {
  try {
    const response = await api.get("/crm/opportunities/pipeline", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching opportunities pipeline:", error);
    return { stages: [], total_value: 0, total_weighted: 0 };
  }
}



