import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Plus, 
  Upload, 
  FileText, 
  Receipt, 
  FolderOpen,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bell,
  MessageSquare,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  status: "pending" | "justified" | "error";
}

interface Invoice {
  id: string;
  client: string;
  date: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
}

export default function DashboardNew() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    solde: 300401.03,
    encaissements: 567264.20,
    decaissements: 458062.33,
    totalFacture: 589280.00,
    totalAchats: 146400.00,
  });
  
  const [transactionsToJustify, setTransactionsToJustify] = useState<Transaction[]>([
    { id: "1", description: "Donation Restos du cœur", date: "14/10/2025", amount: 150.00, status: "pending" },
    { id: "2", description: "PRLVMT FACERK META IE9892928", date: "13/10/2025", amount: -18724.77, status: "pending" },
    { id: "3", description: "VIRT MAISON RICHOUX ACOMPTE 1/2", date: "12/10/2025", amount: -800.00, status: "pending" },
    { id: "4", description: "UBER+TRIP", date: "12/10/2025", amount: 74.00, status: "pending" },
  ]);

  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([
    { id: "1", client: "AstraTech", date: "09/12/2025", amount: 4850.00, dueDate: "09/12/2025", isOverdue: true },
    { id: "2", client: "ArboréSens", date: "27/11/2025", amount: 1540.00, dueDate: "27/11/2025", isOverdue: true },
    { id: "3", client: "AutoFutur", date: "27/11/2025", amount: 11000.00, dueDate: "27/11/2025", isOverdue: true },
    { id: "4", client: "ArtGusto", date: "27/11/2025", amount: 20200.00, dueDate: "27/11/2025", isOverdue: true },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    // Fetch user data
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>Accueil - SEKA</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        
        {/* Main Content */}
        <main className="ml-[220px] p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              👋 Bienvenue {user?.full_name || ""}!
            </h1>
            <p className="text-gray-500 mt-1">
              Collaborez efficacement et suivez vos performances.
            </p>
          </div>

          {/* Document Upload Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Déposez vos documents</h2>
            <div className="grid grid-cols-3 gap-4">
              {/* Factures fournisseurs */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className="font-medium text-gray-900">Factures fournisseurs</span>
                </div>
                <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {/* Factures clients */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">Factures clients</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium border border-teal-600 rounded-md px-3 py-1.5">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                  <button className="flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium rounded-md px-3 py-1.5">
                    <Plus className="w-4 h-4" />
                    Créer
                  </button>
                </div>
              </div>

              {/* Autres documents */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">Autres documents</span>
                </div>
                <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Stats & Activity */}
            <div className="col-span-2 space-y-6">
              {/* Key Figures */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Analysez vos chiffres clés de</h2>
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                    <option>Cette année</option>
                    <option>Ce mois</option>
                    <option>Ce trimestre</option>
                  </select>
                </div>

                {/* Solde */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Solde des comptes</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.solde)}
                    </span>
                    <span className="text-red-500">🔴🔴</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Encaissements</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-lg font-semibold text-emerald-600">
                        {formatCurrency(stats.encaissements)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Décaissements</p>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-lg font-semibold text-red-600">
                        {formatCurrency(stats.decaissements)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total facturé</p>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stats.totalFacture)} <span className="text-sm font-normal text-gray-500">HT</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total achats</p>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stats.totalAchats)} <span className="text-sm font-normal text-gray-500">TTC</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Gérez votre activité de</h2>
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                    <option>Cette année</option>
                    <option>Ce mois</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Transactions to Justify */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Transactions à justifier</h3>
                      <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                        {transactionsToJustify.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {transactionsToJustify.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <span className="text-orange-500">✕</span>
                              {tx.description}
                            </p>
                            <p className="text-xs text-gray-500">{tx.date}</p>
                          </div>
                          <span className={`text-sm font-medium ${tx.amount >= 0 ? "text-emerald-600" : "text-gray-900"}`}>
                            {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link href="/transactions" className="flex items-center justify-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium mt-4">
                      Voir tout
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Overdue Invoices */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Factures clients en retard</h3>
                      <span className="text-sm text-gray-500">
                        {overdueInvoices.length} <span className="text-xs">HT</span>
                      </span>
                    </div>
                    <div className="space-y-3">
                      {overdueInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{inv.client}</p>
                            <p className="text-xs text-red-500">{inv.dueDate}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link href="/ventes/factures" className="flex items-center justify-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium mt-4">
                      Voir tout
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Inbox & Illustration */}
            <div className="space-y-6">
              {/* Inbox */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Boîte de réception</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      10
                    </span>
                    <span className="text-sm text-gray-500">Non lues & lues</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button className="px-4 py-2 text-sm font-medium text-teal-600 border-b-2 border-teal-600">
                    À faire
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Mentions
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Notifications
                  </button>
                </div>

                {/* Empty state or messages */}
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune notification</p>
                </div>
              </div>

              {/* Success Illustration */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <p className="text-gray-600 font-medium">Vous êtes à jour !</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
