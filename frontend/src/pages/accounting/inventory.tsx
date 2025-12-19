import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download, Loader2 } from "lucide-react";
import { getAccountingInventory, type AccountingInventoryLine } from "@/lib/api";

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

export default function InventoryPage() {
  const router = useRouter();
  const [lines, setLines] = useState<AccountingInventoryLine[]>([]);
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
        const data = await getAccountingInventory(token);
        setLines(data.lines || []);
      } catch (e) {
        console.error("Error fetching inventory:", e);
        setError("Erreur lors du chargement de l'inventaire");
        setLines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleExport = () => {
    downloadCsv(
      `inventaire_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Article: l.item, Quantité: l.quantity, Coût_unitaire: l.unit_cost, Total: l.total }))
    );
  };

  return (
    <DashboardLayout title="Inventaire">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventaire</h1>
          <p className="text-sm text-gray-500 mt-1">Préparation de l’inventaire comptable</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Article</div>
          <div className="text-right">Quantité</div>
          <div className="text-right">Coût unitaire</div>
          <div className="text-right">Total</div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e3a5f]" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-700">{error}</div>
          ) : lines.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Aucune ligne d'inventaire</div>
          ) : (
            lines.map((l, idx) => (
              <div key={`${l.item}-${idx}`} className="grid grid-cols-4 px-4 py-3 text-sm">
                <div className="text-gray-900">{l.item}</div>
                <div className="text-right text-gray-900">{l.quantity.toLocaleString("fr-FR")}</div>
                <div className="text-right text-gray-900">{l.unit_cost.toLocaleString("fr-FR")}</div>
                <div className="text-right font-medium text-gray-900">{l.total.toLocaleString("fr-FR")}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
