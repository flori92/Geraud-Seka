/**
 * API Documents Module
 *
 * Gestion des documents:
 * - Upload/Download
 * - OCR processing
 * - Validation
 * - Export comptable
 */

import { api } from "./client";

// ============================================
// Types
// ============================================

export type DocumentStatus =
  | "UPLOADED"
  | "OCR_PROCESSING"
  | "OCR_COMPLETED"
  | "A_TRAITER"
  | "A_TRAITER_DOUBLON"
  | "PRE_TRAITEE"
  | "VALIDEE"
  | "EXPORTED"
  | "IN_ACCOUNTING"
  | "REJECTED"
  | "ARCHIVED";

export type DocumentType =
  | "INVOICE_PURCHASE"
  | "INVOICE_SALES"
  | "RECEIPT"
  | "EXPENSE_REPORT"
  | "QUOTE"
  | "DELIVERY_NOTE"
  | "PURCHASE_ORDER"
  | "OTHER";

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  content_type?: string;
  file_size?: number;
  status: DocumentStatus;
  type?: DocumentType;
  title?: string;
  description?: string;
  document_date?: string;
  due_date?: string;
  amount_ht?: number;
  amount_vat?: number;
  amount_ttc?: number;
  currency?: string;
  supplier_name?: string;
  supplier_id?: string;
  client_id?: string;
  ocr_data?: Record<string, unknown>;
  ocr_confidence?: number;
  matched_rule_id?: string;
  matched_rule_name?: string;
  auto_validable?: boolean;
  exported_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentFilters {
  status?: DocumentStatus;
  type?: DocumentType;
  supplier_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface DocumentValidationPayload {
  amount_ht?: number;
  amount_vat?: number;
  amount_ttc?: number;
  supplier_id?: string;
  document_date?: string;
  due_date?: string;
  description?: string;
}

export interface AccountingEntryPreview {
  journal_code: string;
  entry_date: string;
  description: string;
  lines: Array<{
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
  }>;
}

// ============================================
// API Functions
// ============================================

/**
 * Upload a document
 */
export async function uploadDocument(
  file: File,
  clientId?: string
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  if (clientId) {
    formData.append("client_id", clientId);
  }

  const response = await api.post<Document>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Get all documents
 */
export async function getDocuments(clientId?: string): Promise<Document[]> {
  const params = clientId ? { client_id: clientId } : undefined;
  const response = await api.get<Document[]>("/documents/", { params });
  return response.data;
}

/**
 * Get documents with filters
 */
export async function getDocumentsFiltered(
  filters?: DocumentFilters
): Promise<Document[]> {
  const response = await api.get<Document[]>("/documents/", { params: filters });
  return response.data;
}

/**
 * Get pending documents (needs processing)
 */
export async function getPendingDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter(
    (d) =>
      d.status === "A_TRAITER" ||
      d.status === "A_TRAITER_DOUBLON" ||
      d.status === "PRE_TRAITEE"
  );
}

/**
 * Get documents needing manual processing (A_TRAITER)
 */
export async function getATraiterDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter((d) => d.status === "A_TRAITER");
}

/**
 * Get pre-processed documents (PRE_TRAITEE)
 */
export async function getPreTraiteesDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter((d) => d.status === "PRE_TRAITEE");
}

/**
 * Get validated documents
 */
export async function getValidatedDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter((d) => d.status === "VALIDEE");
}

/**
 * Get documents in accounting
 */
export async function getAccountingDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter((d) => d.status === "IN_ACCOUNTING" || d.status === "EXPORTED");
}

/**
 * Get validated purchase invoices
 */
export async function getValidatedPurchaseDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter(
    (d) => d.status === "VALIDEE" && d.type === "INVOICE_PURCHASE"
  );
}

/**
 * Get validated sales invoices
 */
export async function getValidatedSalesDocuments(): Promise<Document[]> {
  const allDocs = await getDocuments();
  return allDocs.filter(
    (d) => d.status === "VALIDEE" && d.type === "INVOICE_SALES"
  );
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document> {
  const response = await api.get<Document>(`/documents/${documentId}`);
  return response.data;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await api.delete(`/documents/${documentId}`);
}

/**
 * Validate a document
 */
export async function validateDocument(
  documentId: string,
  payload?: DocumentValidationPayload
): Promise<Document> {
  const response = await api.post<Document>(
    `/documents/${documentId}/validate`,
    payload || {}
  );
  return response.data;
}

/**
 * Reject a document
 */
export async function rejectDocument(
  documentId: string,
  reason?: string
): Promise<Document> {
  const response = await api.post<Document>(`/documents/${documentId}/reject`, {
    reason,
  });
  return response.data;
}

/**
 * Preview accounting entries for a document
 */
export async function previewAccountingEntries(
  documentId: string
): Promise<AccountingEntryPreview> {
  const response = await api.get<AccountingEntryPreview>(
    `/documents/${documentId}/preview-entries`
  );
  return response.data;
}

/**
 * Export documents to accounting
 */
export async function exportDocuments(documentIds: string[]): Promise<boolean> {
  try {
    await api.post("/documents/export", { document_ids: documentIds });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get document download URL
 */
export function getDocumentDownloadUrl(documentId: string): string {
  return `${api.defaults.baseURL}/documents/${documentId}/download`;
}

/**
 * Re-process OCR for a document
 */
export async function reprocessOcr(documentId: string): Promise<Document> {
  const response = await api.post<Document>(
    `/documents/${documentId}/reprocess-ocr`
  );
  return response.data;
}

/**
 * Update document metadata
 */
export async function updateDocument(
  documentId: string,
  data: Partial<Document>
): Promise<Document> {
  const response = await api.patch<Document>(`/documents/${documentId}`, data);
  return response.data;
}

/**
 * Batch validate documents
 */
export async function batchValidateDocuments(
  documentIds: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const response = await api.post<{ success: string[]; failed: string[] }>(
    "/documents/batch-validate",
    { document_ids: documentIds }
  );
  return response.data;
}
