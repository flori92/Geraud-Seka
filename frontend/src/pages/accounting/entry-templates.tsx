import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { getEntryTemplates, type EntryTemplateItem } from "@/lib/api";

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

export default function EntryTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EntryTemplateItem[]>([]);
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
        const data = await getEntryTemplates(token);
        setTemplates(data.templates || []);
      } catch (e) {
        console.error("Error fetching templates:", e);
        setError("Erreur lors du chargement des modèles");
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleExport = () => {
    downloadCsv(
      `modeles_ecritures_${new Date().toISOString().slice(0, 10)}.csv`,
      templates.map((t) => ({ Nom: t.name, Description: t.description }))
    );
  };

  return (
    <DashboardLayout title="Modèles d'écritures">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Modèles d'écritures</h1>
          <p className="text-sm text-gray-500 mt-1">Préparer des écritures réutilisables</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Nom</div>
          <div>Description</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e3a5f]" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-700">{error}</div>
          ) : templates.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Aucun modèle</div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="grid grid-cols-3 px-4 py-3 text-sm items-center">
                <div className="text-gray-900 font-medium">{t.name}</div>
                <div className="text-gray-700">{t.description}</div>
                <div className="text-right">
                  <Button variant="secondary" disabled className="inline-flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
