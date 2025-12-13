import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download, Loader2 } from "lucide-react";
import { getProvisions, type ProvisionLineApi } from "@/lib/api";

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

export default function ProvisionsPage() {
  const router = useRouter();
  const [lines, setLines] = useState<ProvisionLineApi[]>([]);
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
        const data = await getProvisions(token);
        setLines(data.lines || []);
      } catch (e) {
        console.error("Error fetching provisions:", e);
        setError("Erreur lors du chargement des provisions");
        setLines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleExport = () => {
    downloadCsv(
      `provisions_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Libellé: l.label, Type: l.type, Montant: l.amount }))
    );
  };

  return (
    <DashboardLayout title="Provisions">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Provisions</h1>
          <p className="text-sm text-gray-500 mt-1">Dotations et reprises</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Libellé</div>
          <div>Type</div>
          <div className="text-right">Montant</div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0d4a44]" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-700">{error}</div>
          ) : lines.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Aucune provision</div>
          ) : (
            lines.map((l, idx) => (
              <div key={`${l.label}-${idx}`} className="grid grid-cols-3 px-4 py-3 text-sm">
                <div className="text-gray-900">{l.label}</div>
                <div className="text-gray-700">{l.type}</div>
                <div className="text-right font-medium text-gray-900">{Number(l.amount || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
