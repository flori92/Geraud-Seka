import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

type LiasseItem = {
  code: string;
  label: string;
  status: "à préparer" | "prêt";
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

export default function LiasseFiscalePage() {
  const items = useMemo<LiasseItem[]>(
    () => [
      { code: "BIL", label: "Bilan", status: "à préparer" },
      { code: "CR", label: "Compte de résultat", status: "à préparer" },
      { code: "ANN", label: "Annexes", status: "à préparer" },
      { code: "SIG", label: "SIG", status: "à préparer" },
    ],
    []
  );

  const handleExport = () => {
    downloadCsv(
      `liasse_fiscale_${new Date().toISOString().slice(0, 10)}.csv`,
      items.map((i) => ({ Code: i.code, Libellé: i.label, Statut: i.status }))
    );
  };

  return (
    <DashboardLayout title="Liasse fiscale">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Liasse fiscale</h1>
          <p className="text-sm text-gray-500 mt-1">Préparation des états fiscaux</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Code</div>
          <div>Document</div>
          <div>Statut</div>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((i) => (
            <div key={i.code} className="grid grid-cols-3 px-4 py-3 text-sm">
              <div className="font-mono text-gray-900">{i.code}</div>
              <div className="text-gray-800">{i.label}</div>
              <div className="text-gray-700">{i.status}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
