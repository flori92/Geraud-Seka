import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

type ProvisionLine = {
  label: string;
  amount: number;
  type: "dotation" | "reprise";
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

export default function ProvisionsPage() {
  const lines = useMemo<ProvisionLine[]>(
    () => [
      { label: "Provision pour risque", amount: 0, type: "dotation" },
      { label: "Reprise provision", amount: 0, type: "reprise" },
    ],
    []
  );

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
          {lines.map((l) => (
            <div key={l.label} className="grid grid-cols-3 px-4 py-3 text-sm">
              <div className="text-gray-900">{l.label}</div>
              <div className="text-gray-700">{l.type}</div>
              <div className="text-right font-medium text-gray-900">{l.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
