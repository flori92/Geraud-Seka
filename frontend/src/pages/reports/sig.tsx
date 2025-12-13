import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

type SigLine = {
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

export default function SigPage() {
  const sig = useMemo<SigLine[]>(
    () => [
      { label: "Chiffre d'affaires", amount: 0 },
      { label: "Marge commerciale", amount: 0 },
      { label: "Valeur ajoutée", amount: 0 },
      { label: "EBE", amount: 0 },
      { label: "Résultat d'exploitation", amount: 0 },
      { label: "Résultat financier", amount: 0 },
      { label: "Résultat courant", amount: 0 },
      { label: "Résultat net", amount: 0 },
    ],
    []
  );

  const handleExport = () => {
    downloadCsv(
      `sig_${new Date().toISOString().slice(0, 10)}.csv`,
      sig.map((l) => ({ Indicateur: l.label, Montant: l.amount }))
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
          Indicateurs
        </div>
        <div className="divide-y divide-gray-100">
          {sig.map((line) => (
            <div key={line.label} className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-gray-700">{line.label}</div>
              <div className="text-sm font-medium text-gray-900">
                {line.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
