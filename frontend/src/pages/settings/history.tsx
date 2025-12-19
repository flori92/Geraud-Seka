/**
 * Historique des imports et exports - SEKA
 * Traçabilité de toutes les opérations d'import/export
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { 
  ArrowLeft, Download, Upload, Search, 
  CheckCircle, XCircle, Clock, FileText, RefreshCw,
  ChevronDown, Eye, Trash2
} from "lucide-react";
import Link from "next/link";

type TabType = "imports" | "exports";

interface HistoryItem {
  id: string;
  date: string;
  type: string;
  fileName: string;
  fileSize: string;
  status: "success" | "error" | "pending";
  records: number;
  user: string;
  details?: string;
}

// Données de démonstration
const demoImports: HistoryItem[] = [
  { id: "1", date: "2024-12-19 14:32", type: "FEC", fileName: "FEC_2024.txt", fileSize: "2.4 Mo", status: "success", records: 1250, user: "Admin", details: "Import FEC exercice 2024" },
  { id: "2", date: "2024-12-18 09:15", type: "CSV Clients", fileName: "clients_dec.csv", fileSize: "156 Ko", status: "success", records: 45, user: "Admin" },
  { id: "3", date: "2024-12-17 16:45", type: "Relevé bancaire", fileName: "releve_dec.ofx", fileSize: "89 Ko", status: "success", records: 127, user: "Comptable" },
  { id: "4", date: "2024-12-15 11:20", type: "Factures", fileName: "factures_batch.zip", fileSize: "12.3 Mo", status: "error", records: 0, user: "Admin", details: "Erreur de format" },
  { id: "5", date: "2024-12-10 08:00", type: "Plan comptable", fileName: "pcg_custom.csv", fileSize: "45 Ko", status: "success", records: 890, user: "Admin" },
];

const demoExports: HistoryItem[] = [
  { id: "1", date: "2024-12-19 15:00", type: "FEC", fileName: "FEC_SEKA_2024.txt", fileSize: "2.1 Mo", status: "success", records: 1250, user: "Admin" },
  { id: "2", date: "2024-12-18 17:30", type: "Balance", fileName: "balance_generale_dec.xlsx", fileSize: "234 Ko", status: "success", records: 156, user: "Comptable" },
  { id: "3", date: "2024-12-17 10:00", type: "Grand livre", fileName: "grand_livre_2024.pdf", fileSize: "1.8 Mo", status: "success", records: 890, user: "Admin" },
  { id: "4", date: "2024-12-15 14:45", type: "Clients", fileName: "export_clients.csv", fileSize: "67 Ko", status: "success", records: 45, user: "Admin" },
  { id: "5", date: "2024-12-12 09:30", type: "Bilan", fileName: "bilan_2024.pdf", fileSize: "456 Ko", status: "pending", records: 0, user: "Admin", details: "En cours de génération" },
];

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("imports");
  const [searchQuery, setSearchQuery] = useState("");
  const [imports, setImports] = useState<HistoryItem[]>(demoImports);
  const [exports, setExports] = useState<HistoryItem[]>(demoExports);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const currentData = activeTab === "imports" ? imports : exports;
  
  const filteredData = currentData.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" /> Réussi
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" /> Erreur
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" /> En cours
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = (id: string) => {
    if (activeTab === "imports") {
      setImports(imports.filter(i => i.id !== id));
    } else {
      setExports(exports.filter(e => e.id !== id));
    }
  };

  const stats = {
    total: currentData.length,
    success: currentData.filter(i => i.status === "success").length,
    error: currentData.filter(i => i.status === "error").length,
    pending: currentData.filter(i => i.status === "pending").length,
  };

  return (
    <>
      <Head>
        <title>Historique - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Retour aux paramètres
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Historique</h1>
            <p className="text-sm text-gray-500 mt-1">
              Consultez l&apos;historique de tous vos imports et exports de données.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab("imports")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "imports"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Upload className="h-4 w-4" />
              Imports
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === "imports" ? "bg-primary-500" : "bg-gray-100"
              }`}>
                {imports.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("exports")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "exports"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Download className="h-4 w-4" />
              Exports
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === "exports" ? "bg-primary-500" : "bg-gray-100"
              }`}>
                {exports.length}
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Réussis</p>
              <p className="text-2xl font-semibold text-green-600">{stats.success}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Erreurs</p>
              <p className="text-2xl font-semibold text-red-600">{stats.error}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">En cours</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de fichier ou type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="success">Réussis</option>
                  <option value="error">Erreurs</option>
                  <option value="pending">En cours</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lignes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Aucun {activeTab === "imports" ? "import" : "export"} trouvé
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{item.date}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          <FileText className="w-3 h-3" />
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.fileName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.fileSize}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.records || "-"}</td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.user}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {item.status === "success" && (
                            <button 
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === "pending" && (
                            <button 
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                              title="Rafraîchir"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {filteredData.length} {activeTab === "imports" ? "import(s)" : "export(s)"}
              </span>
              <div className="flex items-center gap-2">
                <Link href={activeTab === "imports" ? "/settings/import" : "/exports"}>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
                    {activeTab === "imports" ? <Upload className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    Nouvel {activeTab === "imports" ? "import" : "export"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
