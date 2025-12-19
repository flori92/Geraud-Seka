import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { CheckCircle, AlertTriangle, RefreshCw, Download, Loader2, ClipboardCheck } from "lucide-react";
import { getConsistencyChecks, type ConsistencyCheckItem } from "@/lib/api";

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const headers = Object.keys(rows[0] || {});
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    if (/[\n\r",;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ConsistencyChecksPage() {
  const router = useRouter();
  const [checks, setChecks] = useState<ConsistencyCheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const data = await getConsistencyChecks(token, year);
      setChecks(data.checks || []);
    } catch {
      setError("Erreur lors du chargement des contrôles");
      setChecks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    downloadCsv(`controles_coherence_${new Date().toISOString().slice(0, 10)}.csv`,
      checks.map((c) => ({ Contrôle: c.label, Statut: c.status, Détails: c.details })));
  };

  const okCount = checks.filter(c => c.status === "ok").length;
  const warnCount = checks.filter(c => c.status !== "ok").length;

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>;
  }

  return (
    <>
      <Head><title>Contrôles de cohérence - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><ClipboardCheck className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Contrôles de cohérence</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Vérifications rapides avant révision/clôture</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" /> Relancer
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Download className="w-4 h-4" /> Exporter CSV
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center"><span className="text-lg font-bold text-white">{checks.length}</span></div>
                <p className="text-sm font-medium text-gray-600">Total contrôles</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center"><span className="text-lg font-bold text-white">{okCount}</span></div>
                <p className="text-sm font-medium text-gray-600">Validés</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-600 flex items-center justify-center"><span className="text-lg font-bold text-white">{warnCount}</span></div>
                <p className="text-sm font-medium text-gray-600">Avertissements</p>
              </div>
            </div>

            {/* Checks List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {checks.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500">Aucun contrôle à afficher</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {checks.map((c) => (
                    <div key={c.id} className="px-4 py-4 flex items-start justify-between gap-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        {c.status === "ok" ? <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />}
                        <div>
                          <div className="font-medium text-gray-900">{c.label}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{c.details}</div>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Détails</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
