/**
 * Hook pour la Balance Générale avec filtres et compactage
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Account, AccountGroup, TrialBalanceFilters, TrialBalanceMeta, 
  SortField, SortOrder 
} from '@/types/trial-balance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http:

interface UseTrialBalanceOptions {
  period?: { start: string; end: string };
  initialFilters?: Partial<TrialBalanceFilters>;
}

interface UseTrialBalanceReturn {
  accounts: Account[];
  groupedAccounts: AccountGroup[];
  meta: TrialBalanceMeta | null;
  filters: TrialBalanceFilters;
  loading: boolean;
  error: string | null;
  setFilters: (filters: Partial<TrialBalanceFilters>) => void;
  toggleGroup: (groupId: string) => void;
  toggleAccount: (accountId: string) => void;
  refetch: () => void;
  sortBy: (field: SortField, order: SortOrder) => void;
}

const defaultFilters: TrialBalanceFilters = {
  search: '',
  compactBy: 'none',
  showZeroBalances: false,
  showAuxiliaryAccounts: false,
  showAnalyticCodes: false,
  journals: [],
  accountClasses: [],
};

export function useTrialBalance(options: UseTrialBalanceOptions = {}): UseTrialBalanceReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [meta, setMeta] = useState<TrialBalanceMeta | null>(null);
  const [filters, setFiltersState] = useState<TrialBalanceFilters>({
    ...defaultFilters,
    ...options.initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const _ = expandedAccounts;
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('seka_access_token');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.compactBy !== 'none') params.append('compact_by', filters.compactBy);
      if (!filters.showZeroBalances) params.append('hide_zero', 'true');
      if (options.period) {
        params.append('date_from', options.period.start);
        params.append('date_to', options.period.end);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/accounting/advanced/trial-balance?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      
      const formattedAccounts: Account[] = (data.accounts || []).map((acc: any) => ({
        id: acc.id || acc.account_number,
        number: acc.account_number || acc.number,
        label: acc.name || acc.label,
        level: acc.level || (acc.account_number?.length <= 2 ? 0 : acc.account_number?.length <= 4 ? 1 : 2),
        hasChildren: acc.has_children || false,
        vatRate: acc.vat_rate,
        debit: parseFloat(acc.total_debit || acc.debit || 0),
        credit: parseFloat(acc.total_credit || acc.credit || 0),
        balance: parseFloat(acc.balance || 0),
        accountClass: acc.account_class || acc.account_number?.[0] || '',
        journal: acc.journal,
        entriesCount: acc.entries_count || 0,
      }));

      setAccounts(formattedAccounts);
      setMeta({
        totals: {
          debit: data.total_debit || formattedAccounts.reduce((sum, a) => sum + a.debit, 0),
          credit: data.total_credit || formattedAccounts.reduce((sum, a) => sum + a.credit, 0),
          difference: Math.abs((data.total_debit || 0) - (data.total_credit || 0)),
        },
        period: options.period || { start: '', end: '' },
        generatedAt: new Date().toISOString(),
        accountCount: formattedAccounts.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [filters, options.period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (acc) =>
          acc.number.toLowerCase().includes(search) ||
          acc.label.toLowerCase().includes(search)
      );
    }

    if (!filters.showZeroBalances) {
      result = result.filter((acc) => acc.balance !== 0);
    }

    if (filters.accountClasses.length > 0) {
      result = result.filter((acc) => filters.accountClasses.includes(acc.accountClass));
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'number':
          comparison = a.number.localeCompare(b.number);
          break;
        case 'label':
          comparison = a.label.localeCompare(b.label);
          break;
        case 'debit':
          comparison = a.debit - b.debit;
          break;
        case 'credit':
          comparison = a.credit - b.credit;
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [accounts, filters, sortField, sortOrder]);

  const groupedAccounts = useMemo((): AccountGroup[] => {
    if (filters.compactBy === 'none') return [];

    const groups = new Map<string, AccountGroup>();

    filteredAccounts.forEach((account) => {
      let groupKey: string;
      let groupLabel: string;

      switch (filters.compactBy) {
        case 'vat_rate':
          groupKey = account.vatRate?.toString() || 'N/A';
          groupLabel = account.vatRate ? `${account.vatRate}% TVA` : 'Sans TVA';
          break;
        case 'class':
          groupKey = account.accountClass;
          groupLabel = getClassLabel(account.accountClass);
          break;
        case 'journal':
          groupKey = account.journal || 'N/A';
          groupLabel = account.journal || 'Sans journal';
          break;
        default:
          return;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          label: groupLabel,
          vatRate: filters.compactBy === 'vat_rate' ? account.vatRate : undefined,
          accountClass: filters.compactBy === 'class' ? account.accountClass : undefined,
          journal: filters.compactBy === 'journal' ? account.journal : undefined,
          accounts: [],
          totalDebit: 0,
          totalCredit: 0,
          totalBalance: 0,
          expanded: expandedGroups.has(groupKey),
        });
      }

      const group = groups.get(groupKey)!;
      group.accounts.push(account);
      group.totalDebit += account.debit;
      group.totalCredit += account.credit;
      group.totalBalance += account.balance;
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (filters.compactBy === 'vat_rate') {
        return (b.vatRate || 0) - (a.vatRate || 0);
      }
      return a.label.localeCompare(b.label);
    });
  }, [filteredAccounts, filters.compactBy, expandedGroups]);

  const setFilters = useCallback((newFilters: Partial<TrialBalanceFilters>) => {
    setFiltersState((prev: TrialBalanceFilters) => ({ ...prev, ...newFilters }));
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const toggleAccount = useCallback((accountId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  }, []);

  const sortBy = useCallback((field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  return {
    accounts: filteredAccounts,
    groupedAccounts,
    meta,
    filters,
    loading,
    error,
    setFilters,
    toggleGroup,
    toggleAccount,
    refetch: fetchData,
    sortBy,
  };
}

function getClassLabel(accountClass: string): string {
  const labels: Record<string, string> = {
    '1': 'Classe 1 - Comptes de ressources durables',
    '2': 'Classe 2 - Actif immobilisé',
    '3': 'Classe 3 - Stocks',
    '4': 'Classe 4 - Comptes de tiers',
    '5': 'Classe 5 - Trésorerie',
    '6': 'Classe 6 - Charges',
    '7': 'Classe 7 - Produits',
    '8': 'Classe 8 - Autres charges et produits',
  };
  return labels[accountClass] || `Classe ${accountClass}`;
}

export function useAccountDetail(accountId: string | null) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('seka_access_token');
        const response = await fetch(
          `${API_BASE_URL}/api/v1/accounting/advanced/accounts/${accountId}/ledger`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setDetail(data);
        }
      } catch (err) {
        console.error('Erreur chargement détail compte:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [accountId]);

  return { detail, loading };
}
