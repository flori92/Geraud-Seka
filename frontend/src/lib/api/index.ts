/**
 * API Module Index
 *
 * Point d'entrée principal pour toutes les fonctions API.
 * Re-exporte tous les modules pour maintenir la compatibilité.
 *
 * Usage:
 *   import { api, login, getDocuments } from '@/lib/api';
 *   // ou
 *   import { login } from '@/lib/api/auth';
 *   import { getDocuments } from '@/lib/api/documents';
 */

// Client & Utils
export {
  api,
  API_BASE_URL,
  tokenManager,
  getApiErrorMessage,
  isNetworkError,
  isTimeoutError,
} from "./client";

export type { ApiErrorPayload } from "./client";

// Auth
export {
  login,
  logout,
  register,
  getCurrentUser,
  refreshAccessToken,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
  updateProfile,
  isAuthenticated,
} from "./auth";

export type {
  TokenPair,
  User,
  RegisterPayload,
  PasswordResetRequest,
  PasswordResetConfirm,
} from "./auth";

// Documents
export {
  uploadDocument,
  getDocuments,
  getDocumentsFiltered,
  getPendingDocuments,
  getATraiterDocuments,
  getPreTraiteesDocuments,
  getValidatedDocuments,
  getAccountingDocuments,
  getValidatedPurchaseDocuments,
  getValidatedSalesDocuments,
  getDocument,
  deleteDocument,
  validateDocument,
  rejectDocument,
  previewAccountingEntries,
  exportDocuments,
  getDocumentDownloadUrl,
  reprocessOcr,
  updateDocument,
  batchValidateDocuments,
} from "./documents";

export type {
  Document,
  DocumentStatus,
  DocumentType,
  DocumentFilters,
  DocumentValidationPayload,
  AccountingEntryPreview,
} from "./documents";

// ============================================
// Legacy Re-exports for Backward Compatibility
// ============================================

// Note: Ces fonctions sont dépréciées et seront supprimées dans une future version.
// Utilisez les imports directs des modules spécifiques.

/**
 * @deprecated Import directly from '@/lib/api/auth' instead
 */
export const loginUser = login;

/**
 * @deprecated Import directly from '@/lib/api/auth' instead
 */
export const registerUser = register;
