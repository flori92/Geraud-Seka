import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Plus, 
  FileText, 
  Receipt, 
  FolderOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ChevronRight,
  Bell,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import {
  getDashboardStatsExtended,
  getBankTransactions,
  getInvoices,
  type BankTransaction,
  type Invoice as APIInvoice,
  type DashboardStatsExtended
} from "@/lib/api";

interface DisplayTransaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  status: "pending" | "justified" | "error";
}

interface DisplayInvoice {
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsExtended>({
    total_clients: 0,
    active_clients: 0,
    documents_pending: 0,
    documents_processed_this_month: 0,
    tasks_overdue: 0,
    tasks_due_this_week: 0,
    solde_comptes: 0,
    encaissements: 0,
    decaissements: 0,
    total_facture_ht: 0,
    total_achats_ttc: 0,
    transactions_a_justifier: 0,
    factures_en_retard: 0,
    demandes_comptables: 0,
    rapprochements_suggeres: 0,
  });
  
  const [transactionsToJustify, setTransactionsToJustify] = useState<DisplayTransaction[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<DisplayInvoice[]>([]);

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

    // Fetch dashboard data from APIs
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch extended stats
        const statsData = await getDashboardStatsExtended(token);
        setStats(statsData);

        // Fetch pending transactions (not reconciled)
        const transactions = await getBankTransactions(token, { status: "pending" }, 0, 10);
        const displayTx: DisplayTransaction[] = transactions.map((tx: BankTransaction) => ({
          id: tx.id,
          description: tx.description,
          date: new Date(tx.transaction_date).toLocaleDateString("fr-FR"),
          amount: tx.transaction_type === "debit" ? -tx.amount : tx.amount,
          status: tx.status === "pending" ? "pending" : "justified"
        }));
        setTransactionsToJustify(displayTx);

        // Fetch overdue invoices
        const invoices = await getInvoices(token);
        const overdue: DisplayInvoice[] = invoices
          .filter((inv: APIInvoice) => inv.overdue)
          .slice(0, 5)
          .map((inv: APIInvoice) => ({
            id: inv.id,
            client: inv.client_name || "Client",
            date: new Date(inv.date).toLocaleDateString("fr-FR"),
            amount: inv.amount,
            dueDate: new Date(inv.due_date).toLocaleDateString("fr-FR"),
            isOverdue: true
          }));
        setOverdueInvoices(overdue);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="ml-2 text-gray-500">Chargement des données...</span>
            </div>
          )}

          {!loading && (
            <>

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
                  <button className="flex items-center gap-2 bg-[#1e3a5f] text-white hover:bg-[#172e4d] text-sm font-medium rounded-md px-3 py-1.5">
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
                      {formatCurrency(stats.solde_comptes)}
                    </span>
                    {stats.solde_comptes < 0 && <span className="text-red-500">🔴</span>}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Encaissements</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-lg font-semibold text-blue-600">
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
                      {formatCurrency(stats.total_facture_ht)} <span className="text-sm font-normal text-gray-500">HT</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total achats</p>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stats.total_achats_ttc)} <span className="text-sm font-normal text-gray-500">TTC</span>
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
                          <span className={`text-sm font-medium ${tx.amount >= 0 ? "text-blue-600" : "text-gray-900"}`}>
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
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-blue-500" />
                </div>
                <p className="text-gray-600 font-medium">Vous êtes à jour !</p>
              </div>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </>
  );
}
