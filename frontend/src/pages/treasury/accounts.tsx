/**
 * Bank Accounts Page
 * Manage bank accounts with CRUD operations
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { DashboardLayout } from '@/components/DashboardLayout';
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
  is_active: boolean;
  is_default: boolean;
}

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    branch: '',
    account_type: 'checking',
    // RIB
    bank_code: '',
    branch_code: '',
    account_number: '',
    rib_key: '',
    // International
    iban: '',
    swift_bic: '',
    // Other
    currency: 'XOF',
    initial_balance: 0,
    is_default: false,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/treasury/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/treasury/accounts', formData);
      setShowModal(false);
      setFormData({
        name: '',
        bank_name: '',
        branch: '',
        account_type: 'checking',
        bank_code: '',
        branch_code: '',
        account_number: '',
        rib_key: '',
        iban: '',
        swift_bic: '',
        currency: 'XOF',
        initial_balance: 0,
        is_default: false,
      });
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la création du compte');
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

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      checking: 'Compte Courant',
      savings: 'Compte Épargne',
      loan: 'Prêt',
      credit_card: 'Carte de Crédit',
      other: 'Autre',
    };
    return types[type] || type;
  };

  return (
    <DashboardLayout title="Comptes Bancaires">
      {/* Header cohérent */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/treasury" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Comptes Bancaires</h1>
          </div>
          <p className="text-gray-500">Gérez vos comptes bancaires</p>
        </div>
        <div className="flex gap-3">
          <Link href="/treasury">
            <Button variant="secondary" size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              Trésorerie
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Compte
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map(account => (
            <div key={account.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{account.name}</h3>
                  <p className="text-sm text-gray-600">{account.bank_name}</p>
                </div>
                {account.is_default && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Par défaut
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Solde</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{getAccountTypeLabel(account.account_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro:</span>
                  <span className="font-medium">{account.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`font-medium ${account.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {account.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <button className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Voir détails
                </button>
                <button className="flex-1 text-sm text-gray-600 hover:text-gray-700 font-medium">
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>

        {accounts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun compte bancaire</h3>
            <p className="text-gray-600 mb-4">Ajoutez votre premier compte bancaire pour commencer</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Ajouter un Compte
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouveau Compte Bancaire</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section: Informations de base */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations de base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Libellé du compte *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Compte Principal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de compte
                      </label>
                      <select
                        value={formData.account_type}
                        onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="checking">Compte Courant</option>
                        <option value="savings">Compte Épargne</option>
                        <option value="loan">Prêt</option>
                        <option value="credit_card">Carte de Crédit</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la banque *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Ecobank, BOA, SGBF..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agence
                      </label>
                      <input
                        type="text"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Agence Cotonou Centre"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Informations RIB */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Relevé d'Identité Bancaire (RIB)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code banque
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={formData.bank_code}
                        onChange={(e) => setFormData({ ...formData, bank_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="00000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code guichet
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={formData.branch_code}
                        onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="00000"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        N° de compte *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={20}
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="000000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clé RIB
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.rib_key}
                        onChange={(e) => setFormData({ ...formData, rib_key: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="00"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Format RIB UEMOA : Code banque (5) | Code guichet (5) | N° compte (12) | Clé (2)
                  </p>
                </div>

                {/* Section: Informations internationales */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations internationales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN
                      </label>
                      <input
                        type="text"
                        maxLength={34}
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="BJ00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code SWIFT/BIC
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        value={formData.swift_bic}
                        onChange={(e) => setFormData({ ...formData, swift_bic: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="EABORBJJ"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Solde et options */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Solde et options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Solde initial (FCFA)
                      </label>
                      <input
                        type="number"
                        value={formData.initial_balance}
                        onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                        Définir comme compte par défaut
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Créer le compte
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </>
      )}
    </DashboardLayout>
  );
}
