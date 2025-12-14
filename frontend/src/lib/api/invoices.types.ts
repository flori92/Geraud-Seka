/**
 * Types TypeScript pour l'API Invoices
 * Synchronisés avec les Pydantic schemas du backend
 */

export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";

export interface InvoiceItemResponse {
  id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_ht: number;
  total_ttc: number;
}

export interface InvoiceResponse {
  id: string;
  reference_number: string;
  client_id: string;
  invoice_date: string;
  due_date: string;
  description?: string;
  notes?: string;
  status: InvoiceStatus;
  items: InvoiceItemResponse[];
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceListResponse {
  items: InvoiceResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface InvoiceStats {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  draft_count: number;
  pending_count: number;
  paid_count: number;
  overdue_count: number;
}
