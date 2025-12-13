import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

type CashFlowLine = {
  section: string;
  label: string;
  amount: number;
};

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

export default function CashFlowPage() {
  const lines = useMemo<CashFlowLine[]>(
    () => [
      { section: "Exploitation", label: "Encaissements clients", amount: 0 },
      { section: "Exploitation", label: "Décaissements fournisseurs", amount: 0 },
      { section: "Investissement", label: "Acquisitions", amount: 0 },
      { section: "Investissement", label: "Cessions", amount: 0 },
      { section: "Financement", label: "Emprunts", amount: 0 },
      { section: "Financement", label: "Remboursements", amount: 0 },
    ],
    []
  );

  const handleExport = () => {
    downloadCsv(
      `tableau_financement_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Section: l.section, Libellé: l.label, Montant: l.amount }))
    );
  };

  return (
    <DashboardLayout title="Tableau de financement">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de financement</h1>
          <p className="text-sm text-gray-500 mt-1">Flux de trésorerie par nature</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
          Lignes
        </div>
        <div className="divide-y divide-gray-100">
          {lines.map((line) => (
            <div key={`${line.section}-${line.label}`} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">{line.section}</div>
                  <div className="text-sm text-gray-800">{line.label}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {line.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
