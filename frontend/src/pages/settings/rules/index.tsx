import { useState } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Search, Plus, Download, Upload, Settings2, Check, X, 
  MoreHorizontal, ChevronDown, Edit2, Trash2, ToggleLeft, ToggleRight
} from "lucide-react";

type TabType = "transactions" | "fournisseurs" | "clients" | "produits";

interface Rule {
  id: string;
  name: string;
  compteBancaire: boolean;
  motsCles: string;
  montant: string;
  categories: string;
  contrepartie: string;
  tva: string;
  justificatif: boolean;
  active: boolean;
}

interface Supplier {
  id: string;
  nom: string;
  numeroCompte: string;
  contrepartie: string;
  tva: string;
  categories: string;
  solde: number;
}

interface Client {
  id: string;
  nom: string;
  numeroCompte: string;
  contrepartie: string;
  tva: string;
  categories: string;
  solde: number;
}

interface Product {
  id: string;
  nom: string;
  reference: string;
  categories: string;
  unite: string;
  prixHT: number;
  tauxTVA: string;
  prixTTC: number;
}

const mockRules: Rule[] = [
  { id: "1", name: "RETRAITE", compteBancaire: true, motsCles: "RETRAITE", montant: "", categories: "", contrepartie: "4371", tva: "", justificatif: false, active: true },
  { id: "2", name: "PREVOYANCE", compteBancaire: true, motsCles: "PREDICA PREVOYANCE", montant: "", categories: "RH", contrepartie: "4372", tva: "", justificatif: false, active: true },
  { id: "3", name: "MUTUELLE ALLIANZ", compteBancaire: true, motsCles: "ALLIANZ", montant: "", categories: "Assurance", contrepartie: "4373", tva: "", justificatif: false, active: true },
  { id: "4", name: "MATMUT", compteBancaire: true, motsCles: "PRLVMT MATMUT", montant: "", categories: "Comptabilité & Finance", contrepartie: "616", tva: "", justificatif: false, active: true },
  { id: "5", name: "CB Visa", compteBancaire: true, motsCles: "CB Visa", montant: "", categories: "", contrepartie: "6063", tva: "", justificatif: false, active: true },
  { id: "6", name: "GUIGUI BTP", compteBancaire: true, motsCles: "GUIGUI BTP", montant: "", categories: "Sous-traitance & Prestations", contrepartie: "401100016", tva: "", justificatif: false, active: true },
  { id: "7", name: "INTERETS", compteBancaire: true, motsCles: "INTERETS", montant: "> 0", categories: "Revenus financiers (intérêts etc)", contrepartie: "768", tva: "", justificatif: false, active: true },
];

const mockSuppliers: Supplier[] = [
  { id: "1", nom: "Action", numeroCompte: "401ACT2", contrepartie: "", tva: "", categories: "", solde: 0 },
  { id: "2", nom: "Agence Events", numeroCompte: "401100078", contrepartie: "", tva: "", categories: "", solde: 0 },
  { id: "3", nom: "AMAZON EU SARL", numeroCompte: "401100012", contrepartie: "2183 - Matéri...", tva: "20%", categories: "", solde: -6495.00 },
  { id: "4", nom: "Apple", numeroCompte: "401000008", contrepartie: "2183 - Matéri...", tva: "20%", categories: "", solde: -639.00 },
  { id: "5", nom: "APRR", numeroCompte: "401100077", contrepartie: "6251 - Voyage...", tva: "20%", categories: "", solde: 0 },
  { id: "6", nom: "AXA", numeroCompte: "401100039", contrepartie: "", tva: "", categories: "", solde: 499.80 },
];

const mockClients: Client[] = [
  { id: "1", nom: "AlgoNet", numeroCompte: "411000006", contrepartie: "706 - Prestati...", tva: "20%", categories: "", solde: 0 },
  { id: "2", nom: "AmureLux", numeroCompte: "411100234", contrepartie: "706 - Prestati...", tva: "20%", categories: "", solde: 0 },
  { id: "3", nom: "ArboréSens", numeroCompte: "411100235", contrepartie: "706 - Prestati...", tva: "20%", categories: "", solde: 0 },
  { id: "4", nom: "AromaVie", numeroCompte: "411100236", contrepartie: "706 - Prestati...", tva: "20%", categories: "", solde: 0 },
  { id: "5", nom: "AstraTech", numeroCompte: "411100238", contrepartie: "706 - Prestati...", tva: "20%", categories: "", solde: 0 },
];

const mockProducts: Product[] = [
  { id: "1", nom: "Audit environnemental", reference: "", categories: "", unite: "jour", prixHT: 1000.00, tauxTVA: "20% (FR)", prixTTC: 1200.00 },
  { id: "2", nom: "Audit et Étude d'Éco-conception", reference: "", categories: "", unite: "jour", prixHT: 1200.00, tauxTVA: "20% (FR)", prixTTC: 1440.00 },
  { id: "3", nom: "Certification environnementale", reference: "", categories: "", unite: "jour", prixHT: 3000.00, tauxTVA: "20% (FR)", prixTTC: 3600.00 },
  { id: "4", nom: "Économie circulaire", reference: "", categories: "", unite: "heure", prixHT: 200.00, tauxTVA: "20% (FR)", prixTTC: 240.00 },
  { id: "5", nom: "Étude d'impact environnemental", reference: "", categories: "", unite: "jour", prixHT: 600.00, tauxTVA: "20% (FR)", prixTTC: 720.00 },
];

export default function RulesCenter() {
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const [searchQuery, setSearchQuery] = useState("");

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? <span className="text-red-600">-{formatted} €</span> : <span>{formatted} €</span>;
  };

  const tabs = [
    { id: "transactions" as TabType, label: "Transactions", count: 327 },
    { id: "fournisseurs" as TabType, label: "Fournisseurs", count: 92 },
    { id: "clients" as TabType, label: "Clients", count: 219 },
    { id: "produits" as TabType, label: "Produits", count: 9 },
  ];

  return (
    <>
      <Head>
        <title>Centre de règles - SEKA</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        
        <main className="ml-[220px] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Centre de règles</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exporter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                Importer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                <Plus className="w-4 h-4" />
                Nouvelle règle
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center border-b border-gray-200 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label} <span className="text-gray-400 ml-1">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Info Banner for Clients/Fournisseurs */}
            {(activeTab === "clients" || activeTab === "fournisseurs") && (
              <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <span className="text-amber-500">💡</span>
                <p className="text-sm text-amber-800">
                  Gagnez du temps ! Créez une règle en spécifiant un compte de charges et/ou un taux de TVA pour traiter automatiquement vos nouvelles factures.
                </p>
                <a href="#" className="text-sm text-teal-600 hover:underline whitespace-nowrap">En savoir plus ↗</a>
              </div>
            )}

            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Rechercher un ${activeTab === "transactions" ? "mot-clé" : activeTab.slice(0, -1)}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                
                {activeTab === "transactions" && (
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Créé par
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Comptes bancaires
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Catégories
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Contrepartie
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      % TVA
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
                      Règles actives
                      <X className="w-3 h-3" />
                    </button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      Justificatif facultatif
                    </button>
                  </div>
                )}

                {(activeTab === "clients" || activeTab === "fournisseurs") && (
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Contrepartie
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      % TVA
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Catégories
                    </button>
                    {activeTab === "fournisseurs" && (
                      <>
                        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                          Visibilité
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                          IBAN
                        </button>
                      </>
                    )}
                  </div>
                )}

                <button className="ml-auto flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <Settings2 className="w-4 h-4" />
                  Personnaliser
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {activeTab === "transactions" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom de la règle</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Compte bancaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mots clés</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégories</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrepartie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Justificatif</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Active</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{rule.name}</td>
                        <td className="px-4 py-3 text-center">
                          {rule.compteBancaire && <Check className="w-4 h-4 text-teal-600 mx-auto" />}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rule.motsCles}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rule.montant}</td>
                        <td className="px-4 py-3">
                          {rule.categories && (
                            <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">{rule.categories}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rule.contrepartie}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rule.tva}</td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-gray-400 hover:text-gray-600">⊕</button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className={`w-10 h-5 rounded-full transition-colors ${rule.active ? "bg-teal-600" : "bg-gray-300"}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${rule.active ? "translate-x-5" : "translate-x-0.5"}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "fournisseurs" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro de compte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrepartie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégories</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{supplier.numeroCompte}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{supplier.contrepartie || <span className="text-gray-400">Choisir...</span>}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{supplier.tva || <span className="text-gray-400">-</span>}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{supplier.categories || <span className="text-gray-400">-</span>}</td>
                        <td className="px-4 py-3 text-sm text-right">{supplier.solde !== 0 ? formatCurrency(supplier.solde) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "clients" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro de compte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrepartie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégories</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.numeroCompte}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.contrepartie}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.tva}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.categories || <span className="text-gray-400">-</span>}</td>
                        <td className="px-4 py-3 text-sm text-right">{client.solde !== 0 ? formatCurrency(client.solde) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "produits" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégories</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix HT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux de TVA</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.reference || "-"}</td>
                        <td className="px-4 py-3">
                          <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-teal-500">
                            <Plus className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.unite}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(product.prixHT)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.tauxTVA}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(product.prixTTC)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">25</button>
                <button className="px-2 py-1 text-sm bg-teal-50 text-teal-700 rounded font-medium">50</button>
                <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">100</button>
                <span className="text-sm text-gray-500 ml-2">éléments par page</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">1-50 sur {tabs.find(t => t.id === activeTab)?.count}</span>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">&lt;</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-teal-600 text-white font-medium">1</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">2</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">3</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">&gt;</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
