/**
 * Bank Transactions Page
 * View and manage bank transactions
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Plus, ArrowLeft, Building2 } from 'lucide-react';

interface BankAccount {
  id: string;
  name: string;
  account_number: string;
  bank_name: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface BankTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: string;
  category: string | null;
  is_reconciled: boolean;
  balance_after: number | null;
}

export default function BankTransactions() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    transaction_type: '',
    is_reconciled: '',
  });

  const [createForm, setCreateForm] = useState({
    bank_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    transaction_type: 'deposit',
    amount: '',
    status: 'cleared',
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('seka_access_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/treasury/accounts?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        setAccounts(await response.json());
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters.is_reconciled) params.append('is_reconciled', filters.is_reconciled);

      const token = localStorage.getItem('seka_access_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/treasury/transactions?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        setTransactions(await response.json());
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const resetCreateForm = () => {
    setCreateForm({
      bank_account_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      transaction_type: 'deposit',
      amount: '',
      status: 'cleared',
    });
  };

  const handleCreateTransaction = async () => {
    if (!createForm.bank_account_id) {
      alert('Veuillez sélectionner un compte');
      return;
    }
    if (!createForm.transaction_date) {
      alert('Veuillez sélectionner une date');
      return;
    }
    if (!createForm.description.trim()) {
      alert('Veuillez saisir un libellé');
      return;
    }
    if (!createForm.amount || Number.isNaN(Number(createForm.amount))) {
      alert('Veuillez saisir un montant');
      return;
    }

    const token = localStorage.getItem('seka_access_token');
    if (!token) return;

    const account = accounts.find((a) => a.id === createForm.bank_account_id);
    const absAmount = Math.abs(Number(createForm.amount));
    const signedAmount =
      createForm.transaction_type === 'withdrawal' || createForm.transaction_type === 'fee'
        ? -absAmount
        : absAmount;

    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/treasury/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          bank_account_id: createForm.bank_account_id,
          transaction_date: createForm.transaction_date,
          value_date: null,
          transaction_type: createForm.transaction_type,
          amount: signedAmount,
          currency: account?.currency || 'XOF',
          description: createForm.description,
          reference: null,
          check_number: null,
          counterparty: null,
          counterparty_account: null,
          category: null,
          notes: null,
          sales_invoice_id: null,
          purchase_order_id: null,
          status: createForm.status,
        })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        alert(detail || 'Erreur lors de la création');
        return;
      }

      setShowCreateModal(false);
      resetCreateForm();
      fetchTransactions();
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      cleared: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      reconciled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      deposit: 'Dépôt',
      withdrawal: 'Retrait',
      transfer: 'Virement',
      fee: 'Frais',
      interest: 'Intérêts',
      check: 'Chèque',
      card_payment: 'Paiement CB',
      direct_debit: 'Prélèvement',
      other: 'Autre',
    };
    return types[type] || type;
  };

  return (
    <DashboardLayout title="Transactions Bancaires">
      {/* Header cohérent */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/treasury" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Transactions Bancaires</h1>
          </div>
          <p className="text-gray-500">Historique de toutes vos transactions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/treasury">
            <Button variant="secondary" size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              Trésorerie
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCreateModal(true);
              if (accounts.length === 0) fetchAccounts();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Transaction
          </Button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle transaction</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte</label>
                <select
                  value={createForm.bank_account_id}
                  onChange={(e) => setCreateForm({ ...createForm, bank_account_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type === 'mobile_money' ? '📱' : '🏦'} {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={createForm.transaction_date}
                    onChange={(e) => setCreateForm({ ...createForm, transaction_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cleared">Compensé</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={createForm.transaction_type}
                    onChange={(e) => setCreateForm({ ...createForm, transaction_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="deposit">Dépôt</option>
                    <option value="withdrawal">Retrait</option>
                    <option value="transfer">Virement</option>
                    <option value="fee">Frais</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateTransaction} disabled={creating}>
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      ) : (
        <>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="cleared">Compensé</option>
                <option value="reconciled">Rapproché</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.transaction_type}
                onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous</option>
                <option value="deposit">Dépôt</option>
                <option value="withdrawal">Retrait</option>
                <option value="transfer">Virement</option>
                <option value="fee">Frais</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rapprochement</label>
              <select
                value={filters.is_reconciled}
                onChange={(e) => setFilters({ ...filters, is_reconciled: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous</option>
                <option value="true">Rapproché</option>
                <option value="false">Non rapproché</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        {transaction.category && (
                          <div className="text-xs text-gray-500 mt-1">{transaction.category}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getTypeLabel(transaction.transaction_type)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.balance_after !== null
                        ? formatCurrency(transaction.balance_after, transaction.currency)
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusBadge(transaction.status)}`}>
                          {transaction.status}
                        </span>
                        {transaction.is_reconciled && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            Rapproché
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-700 mr-3">
                        Voir
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune transaction</h3>
              <p className="text-gray-600">Aucune transaction ne correspond à vos filtres</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {transactions.length} transaction(s)
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                Précédent
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Suivant
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </DashboardLayout>
  );
}
