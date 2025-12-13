import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { getSigReport, type SigLine } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContainer";

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

export default function SigPage() {
  const router = useRouter();
  const { error: showErrorToast } = useToast();
  const [lines, setLines] = useState<SigLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const data = await getSigReport(token, year);
        setLines(data.lines || []);
        if (data.lines && data.lines.length === 0) {
          setError("Aucune donnée disponible pour cette année");
        }
      } catch (e: any) {
        console.error("Error fetching SIG:", e);
        let errorMessage = "Erreur lors du chargement du SIG";
        if (e?.response?.status === 500) {
          errorMessage = "Erreur serveur. L'endpoint SIG n'est pas disponible pour le moment.";
        } else if (e?.response?.status === 404) {
          errorMessage = "L'endpoint SIG n'est pas disponible.";
        }
        setError(errorMessage);
        setLines([]);
        showErrorToast(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, showErrorToast]);

  const handleExport = () => {
    downloadCsv(
      `sig_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Indicateur: l.label, Montant: l.amount }))
    );
  };

  return (
    <DashboardLayout title="SIG">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Soldes Intermédiaires de Gestion (SIG)</h1>
          <p className="text-sm text-gray-500 mt-1">Vue synthétique des marges et résultats</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0d4a44]" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-sm text-yellow-800 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
            Indicateurs
          </div>
          <div className="divide-y divide-gray-100">
            {lines.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">Aucune donnée disponible</div>
            ) : (
              lines.map((line) => (
                <div key={line.label} className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-700">{line.label}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {line.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
