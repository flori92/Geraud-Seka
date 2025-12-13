import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download, Plus } from "lucide-react";

type OtherTaxLine = {
  name: string;
  period: string;
  base: number;
  rate: number;
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

export default function OtherTaxesPage() {
  const [lines, setLines] = useState<OtherTaxLine[]>(
    useMemo(
      () => [
        { name: "Taxe professionnelle", period: "2025", base: 0, rate: 0, amount: 0 },
        { name: "Patente", period: "2025", base: 0, rate: 0, amount: 0 },
      ],
      []
    )
  );

  const handleAdd = () => {
    setLines((prev) => [
      ...prev,
      { name: "Nouvelle taxe", period: new Date().getFullYear().toString(), base: 0, rate: 0, amount: 0 },
    ]);
  };

  const handleExport = () => {
    downloadCsv(
      `taxes_diverses_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.map((l) => ({ Taxe: l.name, Période: l.period, Base: l.base, Taux: l.rate, Montant: l.amount }))
    );
  };

  return (
    <DashboardLayout title="Taxes diverses">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Taxes diverses</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi des taxes hors TVA et IS/IR</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-5 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Taxe</div>
          <div>Période</div>
          <div className="text-right">Base</div>
          <div className="text-right">Taux</div>
          <div className="text-right">Montant</div>
        </div>
        <div className="divide-y divide-gray-100">
          {lines.map((l, idx) => (
            <div key={`${l.name}-${idx}`} className="grid grid-cols-5 px-4 py-3 text-sm">
              <div className="text-gray-800">{l.name}</div>
              <div className="text-gray-700">{l.period}</div>
              <div className="text-right text-gray-900">{l.base.toLocaleString("fr-FR")}</div>
              <div className="text-right text-gray-900">{(l.rate * 100).toFixed(2)}%</div>
              <div className="text-right font-medium text-gray-900">{l.amount.toLocaleString("fr-FR")}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
