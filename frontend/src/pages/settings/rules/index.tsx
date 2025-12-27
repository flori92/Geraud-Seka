/**
 * Centre de règles SEKA - Version fonctionnelle
 * Permet de définir des règles pour fournisseurs, clients, produits
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { 
  getSuppliers, getClients, getProducts,
  type Supplier, type Client, type Product
} from "@/lib/api";
import { 
  Search, Settings2, X, Save, Trash2, Zap, Loader2
} from "lucide-react";

type TabType = "fournisseurs" | "clients" | "produits";

interface Rule {
  id: string;
  entityId: string;
  entityName: string;
  entityType: TabType;
  defaultAccount: string;
  defaultTaxRate: string;
  autoCategory: string;
  isActive: boolean;
}

const accountOptions = [
  { value: "", label: "-- Sélectionner --" },
  { value: "401", label: "401 - Fournisseurs" },
  { value: "411", label: "411 - Clients" },
  { value: "512", label: "512 - Banque" },
  { value: "601", label: "601 - Achats stockés" },
  { value: "602", label: "602 - Achats non stockés" },
  { value: "606", label: "606 - Achats non stockables" },
  { value: "607", label: "607 - Achats de marchandises" },
  { value: "613", label: "613 - Locations" },
  { value: "615", label: "615 - Entretien et réparations" },
  { value: "616", label: "616 - Assurances" },
  { value: "622", label: "622 - Honoraires" },
  { value: "625", label: "625 - Déplacements" },
  { value: "626", label: "626 - Frais postaux" },
  { value: "627", label: "627 - Services bancaires" },
  { value: "706", label: "706 - Prestations de services" },
  { value: "707", label: "707 - Ventes de marchandises" },
];

const taxRateOptions = [
  { value: "", label: "-- Sélectionner --" },
  { value: "0", label: "0% - Exonéré" },
  { value: "5.5", label: "5,5% - Réduit" },
  { value: "10", label: "10% - Intermédiaire" },
  { value: "18", label: "18% - Normal (Afrique)" },
  { value: "20", label: "20% - Normal (France)" },
];

export default function RulesCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("fournisseurs");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [rules, setRules] = useState<Rule[]>([]);
  
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{id: string; name: string; type: TabType} | null>(null);
  
  const [ruleForm, setRuleForm] = useState({
    defaultAccount: "",
    defaultTaxRate: "",
    autoCategory: "",
    isActive: true,
  });

  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    account: true,
    taxRate: true,
    email: true,
    rules: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const [suppliersData, clientsData, productsData] = await Promise.all([
          getSuppliers(token),
          getClients(token),
          getProducts(token)
        ]);
        
        setSuppliers(suppliersData);
        setClients(clientsData);
        setProducts(productsData);
        
        const savedRules = localStorage.getItem("seka_rules");
        if (savedRules) {
          setRules(JSON.parse(savedRules));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const saveRules = (newRules: Rule[]) => {
    setRules(newRules);
    localStorage.setItem("seka_rules", JSON.stringify(newRules));
  };

  const openRuleModal = (entity: {id: string; name: string; type: TabType}) => {
    setSelectedEntity(entity);
    const existingRule = rules.find(r => r.entityId === entity.id && r.entityType === entity.type);
    if (existingRule) {
      setEditingRule(existingRule);
      setRuleForm({
        defaultAccount: existingRule.defaultAccount,
        defaultTaxRate: existingRule.defaultTaxRate,
        autoCategory: existingRule.autoCategory,
        isActive: existingRule.isActive,
      });
    } else {
      setEditingRule(null);
      setRuleForm({ defaultAccount: "", defaultTaxRate: "", autoCategory: "", isActive: true });
    }
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    if (!selectedEntity) return;
    
    const newRule: Rule = {
      id: editingRule?.id || Date.now().toString(),
      entityId: selectedEntity.id,
      entityName: selectedEntity.name,
      entityType: selectedEntity.type,
      ...ruleForm,
    };
    
    let updatedRules: Rule[];
    if (editingRule) {
      updatedRules = rules.map(r => r.id === editingRule.id ? newRule : r);
    } else {
      updatedRules = [...rules, newRule];
    }
    
    saveRules(updatedRules);
    setShowRuleModal(false);
    setSelectedEntity(null);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    saveRules(updatedRules);
  };

  const getRuleForEntity = (entityId: string, entityType: TabType) => {
    return rules.find(r => r.entityId === entityId && r.entityType === entityType);
  };

  const tabs = [
    { id: "fournisseurs" as TabType, label: "Fournisseurs", count: suppliers.length },
    { id: "clients" as TabType, label: "Clients", count: clients.length },
    { id: "produits" as TabType, label: "Produits", count: products.length },
  ];

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Centre de règles - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Centre de règles</h1>
              <p className="text-sm text-gray-500 mt-1">
                Définissez des règles comptables par fournisseur, client ou produit
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCustomizeModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Settings2 className="w-4 h-4" />
                Personnaliser
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          {/* Tabs & Content */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center border-b border-gray-200 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label} <span className="text-gray-400 ml-1">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Table Content - Fournisseurs */}
            {activeTab === "fournisseurs" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {visibleColumns.name && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>}
                      {visibleColumns.account && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte par défaut</th>}
                      {visibleColumns.taxRate && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>}
                      {visibleColumns.email && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>}
                      {visibleColumns.rules && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Règle</th>}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          Aucun fournisseur trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((supplier) => {
                        const rule = getRuleForEntity(supplier.id, "fournisseurs");
                        return (
                          <tr key={supplier.id} className="hover:bg-gray-50">
                            {visibleColumns.name && (
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.name}</td>
                            )}
                            {visibleColumns.account && (
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {rule?.defaultAccount || supplier.default_account || "-"}
                              </td>
                            )}
                            {visibleColumns.taxRate && (
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {rule?.defaultTaxRate ? `${rule.defaultTaxRate}%` : (supplier.default_tax_rate ? `${supplier.default_tax_rate}%` : "-")}
                              </td>
                            )}
                            {visibleColumns.email && (
                              <td className="px-4 py-3 text-sm text-gray-600">{supplier.email || "-"}</td>
                            )}
                            {visibleColumns.rules && (
                              <td className="px-4 py-3 text-center">
                                {rule ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                                    <Zap className="w-3 h-3" /> Actif
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Aucune</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openRuleModal({ id: supplier.id, name: supplier.name, type: "fournisseurs" })}
                                  className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                                  title="Définir une règle"
                                >
                                  <Zap className="w-4 h-4" />
                                </button>
                                {rule && (
                                  <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Supprimer la règle"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Content - Clients */}
            {activeTab === "clients" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {visibleColumns.name && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>}
                      {visibleColumns.account && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte par défaut</th>}
                      {visibleColumns.taxRate && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>}
                      {visibleColumns.rules && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Règle</th>}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          Aucun client trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const rule = getRuleForEntity(client.id, "clients");
                        return (
                          <tr key={client.id} className="hover:bg-gray-50">
                            {visibleColumns.name && (
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                            )}
                            {visibleColumns.account && (
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {rule?.defaultAccount || "-"}
                              </td>
                            )}
                            {visibleColumns.taxRate && (
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {rule?.defaultTaxRate ? `${rule.defaultTaxRate}%` : "-"}
                              </td>
                            )}
                            {visibleColumns.rules && (
                              <td className="px-4 py-3 text-center">
                                {rule ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                                    <Zap className="w-3 h-3" /> Actif
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Aucune</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openRuleModal({ id: client.id, name: client.name, type: "clients" })}
                                  className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                                  title="Définir une règle"
                                >
                                  <Zap className="w-4 h-4" />
                                </button>
                                {rule && (
                                  <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Supprimer la règle"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Content - Produits */}
            {activeTab === "produits" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {visibleColumns.name && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>}
                      {visibleColumns.account && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte par défaut</th>}
                      {visibleColumns.taxRate && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>}
                      {visibleColumns.rules && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Règle</th>}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          Aucun produit trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const rule = getRuleForEntity(product.id, "produits");
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            {visibleColumns.name && (
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                            )}
                            {visibleColumns.account && (
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {rule?.defaultAccount || "-"}
                              </td>
                            )}
                            {visibleColumns.taxRate && (
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {rule?.defaultTaxRate ? `${rule.defaultTaxRate}%` : "-"}
                              </td>
                            )}
                            {visibleColumns.rules && (
                              <td className="px-4 py-3 text-center">
                                {rule ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                                    <Zap className="w-3 h-3" /> Actif
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Aucune</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openRuleModal({ id: product.id, name: product.name, type: "produits" })}
                                  className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                                  title="Définir une règle"
                                >
                                  <Zap className="w-4 h-4" />
                                </button>
                                {rule && (
                                  <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Supprimer la règle"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">
                {activeTab === "fournisseurs" && `${filteredSuppliers.length} fournisseurs`}
                {activeTab === "clients" && `${filteredClients.length} clients`}
                {activeTab === "produits" && `${filteredProducts.length} produits`}
                {" • "}
                {rules.filter(r => r.entityType === activeTab).length} règles définies
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Définir Règle */}
      {showRuleModal && selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowRuleModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Définir une règle</h2>
                <p className="text-sm text-gray-500">{selectedEntity.name}</p>
              </div>
              <button onClick={() => setShowRuleModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte par défaut</label>
                <select
                  value={ruleForm.defaultAccount}
                  onChange={(e) => setRuleForm({ ...ruleForm, defaultAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {accountOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Ce compte sera utilisé automatiquement lors de la saisie
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA par défaut</label>
                <select
                  value={ruleForm.defaultTaxRate}
                  onChange={(e) => setRuleForm({ ...ruleForm, defaultTaxRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {taxRateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie automatique</label>
                <input
                  type="text"
                  value={ruleForm.autoCategory}
                  onChange={(e) => setRuleForm({ ...ruleForm, autoCategory: e.target.value })}
                  placeholder="Ex: Fournitures bureau"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ruleActive"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ruleActive" className="text-sm text-gray-700">Règle active</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRule}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Personnaliser */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCustomizeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Personnaliser l&apos;affichage</h2>
              <button onClick={() => setShowCustomizeModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {key === "taxRate" ? "Taux TVA" : key === "account" ? "Compte" : key === "rules" ? "Statut règle" : key}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
