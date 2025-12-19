import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Download, Loader2, Plus, RefreshCw, Receipt } from "lucide-react";
import { getOtherTaxes, type OtherTaxLine } from "@/lib/api";

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

export default function OtherTaxesPage() {
  const router = useRouter();
  const [lines, setLines] = useState<OtherTaxLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const data = await getOtherTaxes(token, year);
      setLines(data.lines || []);
    } catch {
      setError("Erreur lors du chargement des taxes diverses");
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    downloadCsv(`taxes_diverses_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Taxe: l.name, Période: l.period, Base: l.base, Taux: l.rate, Montant: l.amount })));
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>;
  }

  return (
    <>
      <Head><title>Taxes diverses - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Receipt className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Taxes diverses</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Suivi des taxes hors TVA et IS/IR</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"><RefreshCw className="h-5 w-5" /></button>
                <button disabled className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-400 text-sm rounded-lg cursor-not-allowed">
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Download className="h-4 w-4" /> Exporter CSV
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taux</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Aucune donnée disponible</td></tr>
                  ) : (
                    lines.map((l, idx) => (
                      <tr key={`${l.name}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{l.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{l.period}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{l.base.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{(l.rate * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{l.amount.toLocaleString("fr-FR")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-500">{lines.length} taxe(s)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
