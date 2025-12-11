import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Search, 
  Filter, 
  Calendar,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  X,
  Settings2
} from "lucide-react";

type TransactionStatus = "non_justifiee" | "justifiee" | "demande_comptable";

interface Transaction {
  id: string;
  status: TransactionStatus;
  date: string;
  libelle: string;
  montant: number;
  categories: string[];
  tiers: string;
  codeAnalytique: string;
  justificatif: boolean;
}

const mockTransactions: Transaction[] = [
  { id: "1", status: "non_justifiee", date: "14 oct. 2025", libelle: "Donation Restos du cœur", montant: 159.00, categories: [], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "2", status: "non_justifiee", date: "13 oct. 2025", libelle: "PRLVMT FACERK META IE9892928", montant: -18724.77, categories: ["Marketing"], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "3", status: "non_justifiee", date: "12 oct. 2025", libelle: "VIRT MAISON RICHOUX ACOMPTE 1/2", montant: -800.00, categories: [], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "4", status: "non_justifiee", date: "12 oct. 2025", libelle: "UBER+TRIP", montant: 74.00, categories: ["Déplacements"], tiers: "UBER", codeAnalytique: "", justificatif: false },
  { id: "5", status: "non_justifiee", date: "11 oct. 2025", libelle: "VIRT TECH ET CIE", montant: -3360.00, categories: [], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "6", status: "non_justifiee", date: "10 oct. 2025", libelle: "LIXXBAIL CREDIT BAIL FM00187098733082BV...", montant: -1000.00, categories: [], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "7", status: "non_justifiee", date: "10 oct. 2025", libelle: "VIRT ASTRATECH", montant: 5820.00, categories: ["Prestations e..."], tiers: "", codeAnalytique: "PREST13", justificatif: false },
  { id: "8", status: "non_justifiee", date: "10 oct. 2025", libelle: "Donation Restos du cœur", montant: -291.00, categories: [], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "9", status: "non_justifiee", date: "8 oct. 2025", libelle: "RATP", montant: 172.00, categories: ["Déplacements"], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "10", status: "non_justifiee", date: "7 oct. 2025", libelle: "ARRETE COMPTE AU TEG 17,33 %", montant: -2.00, categories: ["Frais bancaires"], tiers: "", codeAnalytique: "", justificatif: false },
  { id: "11", status: "non_justifiee", date: "6 oct. 2025", libelle: "Remise chèque Papi Jean", montant: -148.00, categories: [], tiers: "", codeAnalytique: "", justificatif: false },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [activeTab, setActiveTab] = useState<"tout" | "non_justifiee" | "demande_comptable">("tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["11/12/2024 - 11/12/2026"]);

  const stats = {
    solde: 300401.03,
    demandesComptables: 5,
    rapprochementsSuggeres: 114,
    rapprochementsTotal: 271921.61,
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === "non_justifiee" && tx.status !== "non_justifiee") return false;
    if (activeTab === "demande_comptable" && tx.status !== "demande_comptable") return false;
    if (searchQuery && !tx.libelle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted} €` : `${formatted} €`;
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case "non_justifiee":
        return <X className="w-4 h-4 text-orange-500" />;
      case "justifiee":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "demande_comptable":
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case "non_justifiee":
        return <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium">Non justifiée</span>;
      case "justifiee":
        return <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">Justifiée</span>;
      case "demande_comptable":
        return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium">Demande comptable</span>;
    }
  };

  return (
    <>
      <Head>
        <title>Transactions - SEKA</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        
        <main className="ml-[220px] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium">
                <RefreshCw className="w-4 h-4" />
                Récupérer des transactions
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Synchronisés il y a environ 2 m...
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Solde</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {formatCurrency(stats.solde)}
                    </span>
                    <span className="text-red-500">🔴🔴</span>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Demandes comptables</p>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {stats.demandesComptables}
                </span>
                <span className="text-xl font-semibold text-gray-900">19 765,10 €</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Rapprochements suggérés</p>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {stats.rapprochementsSuggeres}
                </span>
                <span className="text-xl font-semibold text-gray-900">
                  {formatCurrency(stats.rapprochementsTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une transaction..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Statut
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                    <Calendar className="w-4 h-4" />
                    11/12/2024 - 11/12/2026
                    <X className="w-3 h-3" />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Montant
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Codes analytiques
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Catégories
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                    2 comptes
                    <X className="w-3 h-3" />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Rapprochement suggéré
                  </button>
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    Plus
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("tout")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "tout"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Tout <span className="text-gray-400 ml-1">458</span>
                </button>
                <button
                  onClick={() => setActiveTab("non_justifiee")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "non_justifiee"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Non justifiée <span className="text-gray-400 ml-1">401</span>
                </button>
                <button
                  onClick={() => setActiveTab("demande_comptable")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "demande_comptable"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Demande comptable <span className="text-emerald-500 ml-1">5</span>
                </button>
              </div>
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Settings2 className="w-4 h-4" />
                Personnaliser
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Libellé
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégories
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code analytique
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justif.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          {getStatusLabel(tx.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{tx.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{tx.libelle}</td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${tx.montant >= 0 ? "text-emerald-600" : "text-gray-900"}`}>
                        {formatCurrency(tx.montant)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {tx.categories.length > 0 ? (
                            tx.categories.map((cat, idx) => (
                              <span key={idx} className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">
                                {cat}
                              </span>
                            ))
                          ) : (
                            <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-500">
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.tiers}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.codeAnalytique}</td>
                      <td className="px-4 py-3 text-center">
                        {tx.justificatif ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-orange-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <span className="text-sm text-gray-500">1-25 sur 458</span>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">
                    &lt;
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-teal-600 text-white font-medium">
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    3
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    4
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    5
                  </button>
                  <span className="text-gray-400 px-1">...</span>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    19
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
