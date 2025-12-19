import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { getIsIr, type IsIrLine } from "@/lib/api";

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

export default function IsIrPage() {
  const router = useRouter();
  const [lines, setLines] = useState<IsIrLine[]>([]);
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
        const data = await getIsIr(token, year);
        setLines(data.lines || []);
      } catch (e) {
        console.error("Error fetching IS/IR:", e);
        setError("Erreur lors du chargement de l'IS/IR");
        setLines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleExport = () => {
    downloadCsv(
      `is_ir_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Libellé: l.label, Base: l.base, Taux: l.rate, Montant: l.amount }))
    );
  };

  return (
    <>
      <Head>
        <title>IS / IR - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">IS / IR</h1>
                <p className="text-sm text-gray-600 mt-0.5">Calcul et suivi de l&apos;impôt sur le résultat</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taux</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1e3a5f] mx-auto" />
                        <p className="text-sm text-gray-600 mt-3">Chargement...</p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-sm text-red-700">{error}</td>
                    </tr>
                  ) : lines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">Aucune donnée disponible</td>
                    </tr>
                  ) : (
                    lines.map((l) => (
                      <tr key={l.label} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{l.label}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">{l.base.toLocaleString("fr-FR")} FCFA</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">{(l.rate * 100).toFixed(2)}%</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{l.amount.toLocaleString("fr-FR")} FCFA</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
