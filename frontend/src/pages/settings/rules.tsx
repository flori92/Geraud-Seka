import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Download, Upload, Search } from "lucide-react";

type RuleType = 'transactions' | 'fournisseurs' | 'clients' | 'produits';

interface TransactionRule {
  id: string;
  name: string;
  keywords: string;
  account_code: string;
  category?: string;
  third_party?: string;
  vat_rate?: string;
  is_active: boolean;
}

interface SupplierRule {
  id: string;
  name: string;
  account_number: string;
  third_party?: string;
  category?: string;
  vat_rate?: string;
  balance?: number;
  is_active: boolean;
}

interface ClientRule {
  id: string;
  name: string;
  account_number: string;
  third_party?: string;
  vat_rate?: string;
  balance?: number;
  is_active: boolean;
}

interface ProductRule {
  id: string;
  name: string;
  reference?: string;
  category?: string;
  unit?: string;
  price_ht?: number;
  vat_rate?: string;
  price_ttc?: number;
}

export default function RulesCenter() {
  const [activeTab, setActiveTab] = useState<RuleType>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionRules, setTransactionRules] = useState<TransactionRule[]>([]);
  const [supplierRules, setSupplierRules] = useState<SupplierRule[]>([]);
  const [clientRules, setClientRules] = useState<ClientRule[]>([]);
  const [productRules, setProductRules] = useState<ProductRule[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'transactions' as RuleType, label: 'Transactions', count: transactionRules.length },
    { id: 'fournisseurs' as RuleType, label: 'Fournisseurs', count: supplierRules.length },
    { id: 'clients' as RuleType, label: 'Clients', count: clientRules.length },
    { id: 'produits' as RuleType, label: 'Produits', count: productRules.length },
  ];

  useEffect(() => {
    fetchRules();
  }, [activeTab]);

  const fetchRules = async () => {
    const token = localStorage.getItem("seka_access_token");
    setLoading(true);

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'transactions':
          endpoint = '/api/v1/accounting-rules/rules';
          break;
        case 'fournisseurs':
          endpoint = '/api/v1/suppliers';
          break;
        case 'clients':
          endpoint = '/api/v1/clients';
          break;
        case 'produits':
          endpoint = '/api/v1/products';
          break;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        switch (activeTab) {
          case 'transactions':
            setTransactionRules(Array.isArray(data) ? data : []);
            break;
          case 'fournisseurs':
            setSupplierRules(Array.isArray(data) ? data : []);
            break;
          case 'clients':
            setClientRules(Array.isArray(data) ? data : []);
            break;
          case 'produits':
            setProductRules(Array.isArray(data) ? data : []);
            break;
        }
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'transactions':
          endpoint = `/api/v1/accounting-rules/rules/${id}`;
          break;
        case 'fournisseurs':
          endpoint = `/api/v1/suppliers/${id}`;
          break;
        case 'clients':
          endpoint = `/api/v1/clients/${id}`;
          break;
        default:
          return;
      }

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_active: !currentStatus })
        }
      );
      fetchRules();
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;

    const token = localStorage.getItem("seka_access_token");
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'transactions':
          endpoint = `/api/v1/accounting-rules/rules/${id}`;
          break;
        case 'fournisseurs':
          endpoint = `/api/v1/suppliers/${id}`;
          break;
        case 'clients':
          endpoint = `/api/v1/clients/${id}`;
          break;
        case 'produits':
          endpoint = `/api/v1/products/${id}`;
          break;
      }

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const filteredData = () => {
    const query = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'transactions':
        return transactionRules.filter(r => r.name.toLowerCase().includes(query));
      case 'fournisseurs':
        return supplierRules.filter(r => r.name.toLowerCase().includes(query));
      case 'clients':
        return clientRules.filter(r => r.name.toLowerCase().includes(query));
      case 'produits':
        return productRules.filter(r => r.name.toLowerCase().includes(query));
    }
  };

  return (
    <>
      <Head><title>Centre de règles - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Centre de règles</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos transactions, tiers et produits automatiquement
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importer
                </button>
                <button className="px-4 py-2 bg-[#0d4a44] text-white rounded-lg hover:bg-[#0a3d38] flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle règle
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-900">
                ✨ Gagnez du temps ! Créez une règle en spécifiant un compte de charges et/ou un taux de TVA pour traiter automatiquement vos nouvelles factures.
                {' '}<a href="#" className="text-purple-700 underline">En savoir plus</a>
              </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? 'text-[#0d4a44] border-b-2 border-[#0d4a44]'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Rechercher ${activeTab === 'transactions' ? 'une règle' : activeTab === 'fournisseurs' ? 'un fournisseur' : activeTab === 'clients' ? 'un client' : 'un produit'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent"
                    />
                  </div>
                  {activeTab !== 'produits' && (
                    <>
                      <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                        <option>Règles actives</option>
                        <option>Toutes les règles</option>
                        <option>Règles inactives</option>
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : (
                  <>
                    {/* Transactions Table */}
                    {activeTab === 'transactions' && (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Nom de la règle</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Compte bancaire</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Mots clés</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Montant</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Catégories</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Tiers</th>
                            <th className="text-center py-3 text-sm font-medium text-gray-600">Justificatif</th>
                            <th className="text-center py-3 text-sm font-medium text-gray-600">Active</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData()?.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-gray-500">
                                Aucune règle trouvée
                              </td>
                            </tr>
                          ) : (
                            filteredData()?.map((rule: any) => (
                              <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 text-sm font-medium">{rule.name}</td>
                                <td className="py-3 text-sm text-gray-600">{rule.account_code || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">{rule.keywords || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">—</td>
                                <td className="py-3 text-sm text-gray-600">{rule.category || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">{rule.third_party || '—'}</td>
                                <td className="py-3 text-center">—</td>
                                <td className="py-3 text-center">
                                  <button
                                    onClick={() => toggleRule(rule.id, rule.is_active)}
                                    className="inline-flex items-center"
                                  >
                                    {rule.is_active ? (
                                      <ToggleRight className="h-6 w-6 text-green-600" />
                                    ) : (
                                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                      <Edit2 className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => deleteRule(rule.id)}
                                      className="p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* Fournisseurs Table */}
                    {activeTab === 'fournisseurs' && (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Nom</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Numéro de compte</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Contrepartie</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">TVA</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Catégories</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Solde</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData()?.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-500">
                                Aucun fournisseur trouvé
                              </td>
                            </tr>
                          ) : (
                            filteredData()?.map((supplier: any) => (
                              <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 text-sm font-medium">{supplier.name}</td>
                                <td className="py-3 text-sm text-gray-600 font-mono">{supplier.account_number || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">{supplier.third_party || 'Choisir...'}</td>
                                <td className="py-3 text-sm text-gray-600">{supplier.vat_rate || '20%'}</td>
                                <td className="py-3 text-sm text-gray-600">{supplier.category || '—'}</td>
                                <td className="py-3 text-sm text-right font-medium text-red-600">
                                  {supplier.balance ? `-${supplier.balance.toLocaleString()} FCFA` : '—'}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                      <Edit2 className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => deleteRule(supplier.id)}
                                      className="p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* Clients Table */}
                    {activeTab === 'clients' && (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Nom</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Numéro de compte</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Contrepartie</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">TVA</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Solde</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData()?.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-gray-500">
                                Aucun client trouvé
                              </td>
                            </tr>
                          ) : (
                            filteredData()?.map((client: any) => (
                              <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 text-sm font-medium">{client.name}</td>
                                <td className="py-3 text-sm text-gray-600 font-mono">{client.account_number || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">{client.third_party || 'Choisir...'}</td>
                                <td className="py-3 text-sm text-gray-600">{client.vat_rate || 'Aucune'}</td>
                                <td className="py-3 text-sm text-right font-medium text-blue-600">
                                  {client.balance ? `${client.balance.toLocaleString()} FCFA` : '—'}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                      <Edit2 className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => deleteRule(client.id)}
                                      className="p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* Produits Table */}
                    {activeTab === 'produits' && (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Nom</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Référence</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Catégories</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Unité</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Prix HT</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Taux de TVA</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Prix TTC</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData()?.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-gray-500">
                                Aucun produit trouvé
                              </td>
                            </tr>
                          ) : (
                            filteredData()?.map((product: any) => (
                              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 text-sm font-medium">{product.name}</td>
                                <td className="py-3 text-sm text-gray-600">{product.reference || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">{product.category || '—'}</td>
                                <td className="py-3 text-sm text-gray-600">{product.unit || 'unité'}</td>
                                <td className="py-3 text-sm text-right font-medium">
                                  {product.price_ht ? `${product.price_ht.toLocaleString()} FCFA` : '—'}
                                </td>
                                <td className="py-3 text-sm text-gray-600">{product.vat_rate || '20% (FR)'}</td>
                                <td className="py-3 text-sm text-right font-medium">
                                  {product.price_ttc ? `${product.price_ttc.toLocaleString()} FCFA` : '—'}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                      <Edit2 className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => deleteRule(product.id)}
                                      className="p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
