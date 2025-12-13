import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertTriangle, RefreshCw, Download, Loader2 } from "lucide-react";
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
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const data = await getConsistencyChecks(token, year);
      setChecks(data.checks || []);
    } catch (e) {
      console.error("Error fetching consistency checks:", e);
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

  const runChecks = () => {
    fetchData();
  };

  const handleExport = () => {
    downloadCsv(
      `controles_coherence_${new Date().toISOString().slice(0, 10)}.csv`,
      checks.map((c) => ({ Contrôle: c.label, Statut: c.status, Détails: c.details }))
    );
  };

  return (
    <DashboardLayout title="Contrôles de cohérence">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contrôles de cohérence</h1>
          <p className="text-sm text-gray-500 mt-1">Vérifications rapides avant révision/clôture</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={runChecks} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Relancer
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0d4a44]" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-700">{error}</div>
          ) : checks.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Aucun contrôle à afficher</div>
          ) : (
            checks.map((c) => (
              <div key={c.id} className="px-4 py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {c.status === "ok" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    <div className="font-medium text-gray-900">{c.label}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{c.details}</div>
                </div>
                <Button variant="secondary" onClick={() => {}}>
                  Détails
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
