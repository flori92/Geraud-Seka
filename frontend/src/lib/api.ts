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
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
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
  subject: string;
  description?: string;
  due_date?: string;
  duration_minutes?: number;
  client_id?: string;
  assigned_to: string;
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
  const response = await api.get<Employee[]>("/api/v1/hr/employees/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createEmployee(data: EmployeeCreate, accessToken: string): Promise<Employee> {
  const response = await api.post<Employee>("/api/v1/hr/employees/", data, {
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
  const response = await api.get<Contract[]>("/api/v1/hr/contracts/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createContract(data: ContractCreate, accessToken: string): Promise<Contract> {
  const response = await api.post<Contract>("/api/v1/hr/contracts/", data, {
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
  const response = await api.get<Payslip[]>("/api/v1/hr/payslips/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createPayslip(data: PayslipCreate, accessToken: string): Promise<Payslip> {
  const response = await api.post<Payslip>("/api/v1/hr/payslips/", data, {
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
  const response = await api.get<Leave[]>("/api/v1/hr/leaves/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createLeave(data: LeaveCreate, accessToken: string): Promise<Leave> {
  const response = await api.post<Leave>("/api/v1/hr/leaves/", data, {
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
  const response = await api.get<JournalEntry[]>("/api/v1/accounting/journal/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createJournalEntry(data: JournalEntryCreate, accessToken: string): Promise<JournalEntry> {
  const response = await api.post<JournalEntry>("/api/v1/accounting/journal/", data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Balance Sheet
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

export async function getBalanceSheet(accessToken: string, period?: string): Promise<BalanceSheet> {
  const params = period ? `?period=${period}` : "";
  const response = await api.get<BalanceSheet>(`/api/v1/accounting/balance${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Ledger
export interface LedgerAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
  currency: string;
}

export async function getLedgerAccounts(accessToken: string): Promise<LedgerAccount[]> {
  const response = await api.get<LedgerAccount[]>("/api/v1/accounting/ledger/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// ========== STOCK APIs ==========

// Inventory
export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  location?: string;
  last_updated: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export async function getInventory(accessToken: string): Promise<InventoryItem[]> {
  const response = await api.get<InventoryItem[]>("/api/v1/stock/inventory/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

// Stock Movements
export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  movement_type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  reference?: string;
  reason?: string;
  created_at: string;
  created_by?: string;
}

export interface StockMovementCreate {
  product_id: string;
  movement_type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  reference?: string;
  reason?: string;
}

export async function getStockMovements(accessToken: string): Promise<StockMovement[]> {
  const response = await api.get<StockMovement[]>("/api/v1/stock/movements/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createStockMovement(data: StockMovementCreate, accessToken: string): Promise<StockMovement> {
  const response = await api.post<StockMovement>("/api/v1/stock/movements/", data, {
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

export async function getPurchaseOrders(accessToken: string): Promise<PurchaseOrder[]> {
  const response = await api.get<PurchaseOrder[]>("/api/v1/sales/purchase-orders/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createPurchaseOrder(data: PurchaseOrderCreate, accessToken: string): Promise<PurchaseOrder> {
  const response = await api.post<PurchaseOrder>("/api/v1/sales/purchase-orders/", data, {
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

export async function getDeliveryNotes(accessToken: string): Promise<DeliveryNote[]> {
  const response = await api.get<DeliveryNote[]>("/api/v1/sales/delivery-notes/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createDeliveryNote(data: DeliveryNoteCreate, accessToken: string): Promise<DeliveryNote> {
  const response = await api.post<DeliveryNote>("/api/v1/sales/delivery-notes/", data, {
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
  const response = await api.get<SalesReport>(`/api/v1/reports/sales${params}`, {
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
  const response = await api.get<AccountingReport>(`/api/v1/reports/accounting${params}`, {
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
  const response = await api.get<HRReport>(`/api/v1/reports/hr${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
