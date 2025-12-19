/**
 * Types pour la Balance Générale style Pennylane
 */

export interface Account {
  id: string;
  number: string;
  label: string;
  level: number;
  parentId?: string;
  hasChildren: boolean;
  expanded?: boolean;
  vatRate?: number;
  debit: number;
  credit: number;
  balance: number;
  accountClass: string;
  journal?: string;
  isReconciled?: boolean;
  entriesCount?: number;
}

export interface AccountGroup {
  id: string;
  label: string;
  vatRate?: number;
  accountClass?: string;
  journal?: string;
  accounts: Account[];
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
  expanded: boolean;
}

export type CompactBy = 'none' | 'vat_rate' | 'class' | 'journal';
export type SortField = 'number' | 'label' | 'debit' | 'credit' | 'balance';
export type SortOrder = 'asc' | 'desc';

export interface TrialBalanceFilters {
  search: string;
  compactBy: CompactBy;
  showZeroBalances: boolean;
  showAuxiliaryAccounts: boolean;
  showAnalyticCodes: boolean;
  journals: string[];
  accountClasses: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface TrialBalanceTotals {
  debit: number;
  credit: number;
  difference: number;
}

export interface TrialBalanceMeta {
  totals: TrialBalanceTotals;
  period: { start: string; end: string };
  generatedAt: string;
  accountCount: number;
}

export interface TrialBalanceResponse {
  data: Account[];
  meta: TrialBalanceMeta;
}

export interface LedgerEntry {
  id: string;
  date: string;
  journal: string;
  reference: string;
  label: string;
  debit: number;
  credit: number;
  balance: number;
  isReconciled: boolean;
  reconciliationCode?: string;
  hasAttachment: boolean;
}

export interface AccountDetail {
  account: Account;
  entries: LedgerEntry[];
  monthlyData: { month: string; debit: number; credit: number }[];
}

export type ExportFormat = 'csv' | 'excel' | 'pdf';
