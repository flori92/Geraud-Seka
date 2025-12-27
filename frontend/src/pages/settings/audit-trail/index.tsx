/**
 * Audit Trail - SEKA
 * Traçabilité complète des modifications
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Search,
  Loader2,
  User,
  Calendar,
  Download,
  Eye,
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: "create" | "update" | "delete" | "validate" | "export" | "login";
  entity_type: string;
  entity_id: string;
  entity_name: string;
  changes: { field: string; old_value: string; new_value: string }[];
  ip_address: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const actionLabels: Record<string, { label: string; color: string }> = {
  create: { label: "Création", color: "green" },
  update: { label: "Modification", color: "blue" },
  delete: { label: "Suppression", color: "red" },
  validate: { label: "Validation", color: "purple" },
  export: { label: "Export", color: "gray" },
  login: { label: "Connexion", color: "yellow" },
};

export default function AuditTrailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/settings/audit-trail`);
      if (filterAction !== "all") url.searchParams.set("action", filterAction);
      if (filterEntity !== "all") url.searchParams.set("entity_type", filterEntity);
      if (dateFrom) url.searchParams.set("from", dateFrom);
      if (dateTo) url.searchParams.set("to", dateTo);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity, dateFrom, dateTo]);

  const exportLogs = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settings/audit-trail/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_trail_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      }
    } catch (err) { console.error(err); }
  };

  const getActionBadge = (action: string) => {
    const config = actionLabels[action] || { label: action, color: "gray" };
    const colors: Record<string, string> = {
      green: "bg-green-50 text-green-700",
      blue: "bg-blue-50 text-blue-700",
      red: "bg-red-50 text-red-700",
      purple: "bg-purple-50 text-purple-700",
      gray: "bg-gray-100 text-gray-600",
      yellow: "bg-yellow-50 text-yellow-700",
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[config.color]}`}>{config.label}</span>;
  };

  const entityTypes = [...new Set(logs.map(l => l.entity_type))];
  const filtered = logs.filter(l => {
    const matchesSearch = l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Audit Trail - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Audit Trail</h1>
                <p className="text-sm text-gray-500 mt-1">Historique complet des modifications du système</p>
              </div>
              <button onClick={exportLogs} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4" /> Exporter
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="all">Toutes actions</option>
                {Object.entries(actionLabels).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="all">Toutes entités</option>
                {entityTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Du" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Au" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entité</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élément</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Aucun enregistrement</td></tr>
                ) : filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-primary-600" />
                        </div>
                        <span className="text-sm text-gray-900">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.entity_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.entity_name}</td>
                    <td className="px-4 py-3 text-center">
                      {log.changes.length > 0 && (
                        <button onClick={() => setSelectedLog(log)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">{filtered.length} enregistrement(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails des modifications</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedLog.changes.map((change, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">{change.field}</p>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Avant:</span>
                      <span className="ml-1 text-red-600">{change.old_value || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Après:</span>
                      <span className="ml-1 text-green-600">{change.new_value || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
