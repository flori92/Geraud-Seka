import { useState } from "react";
import Head from "next/head";
import { Download, FileText, CheckCircle, Calendar, Filter, AlertCircle, Eye } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type ExportFormat = "perfecto" | "saari" | "sage";

export default function ExportsPage() {
  const [format, setFormat] = useState<ExportFormat>("perfecto");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [journal, setJournal] = useState("all");
  const [validatedOnly, setValidatedOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);
  const [stats, setStats] = useState({ documents: 0, entries: 0 });

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner une période");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("seka_access_token");

    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (journal !== "all") {
        params.append("journal_type", journal);
      }

      if (validatedOnly) {
        params.append("status", "validated");
      }

      const endpoint = format === "perfecto" 
        ? "perfecto" 
        : format === "saari" 
        ? "saari" 
        : "sage";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/exports/${endpoint}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const extension = format === "perfecto" ? "txt" : "csv";
      const date = new Date().toISOString().split("T")[0];
      a.download = `export_${format}_${date}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur export:", error);
      alert("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    if (!startDate || !endDate) return;

    const token = localStorage.getItem("seka_access_token");
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (journal !== "all") {
        params.append("journal_type", journal);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/exports/perfecto?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const text = await response.text();
        const lines = text.split("\n").slice(0, 10);
        setPreview(lines);
        setStats({
          documents: Math.floor(lines.length / 3),
          entries: lines.length,
        });
      }
    } catch (error) {
      console.error("Erreur preview:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Exports - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Exporter les écritures</h1>
              <p className="text-sm text-gray-500 mt-1">
                Générez un fichier d&apos;export pour Perfecto, SAARI ou Sage
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Format d'export */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Format d&apos;export *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="format"
                      value="perfecto"
                      checked={format === "perfecto"}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Perfecto (.txt) - Format Bénin</div>
                      <div className="text-sm text-gray-500">
                        Format: DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref_piece;DateEcheance
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="format"
                      value="saari"
                      checked={format === "saari"}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">SAARI (.csv)</div>
                      <div className="text-sm text-gray-500">
                        Format CSV avec séparateur point-virgule
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="format"
                      value="sage"
                      checked={format === "sage"}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Sage (.csv)</div>
                      <div className="text-sm text-gray-500">
                        Format CSV compatible Sage
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Période */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Du</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value && endDate) loadPreview();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Au</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (startDate && e.target.value) loadPreview();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Journal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal
                </label>
                <select
                  value={journal}
                  onChange={(e) => {
                    setJournal(e.target.value);
                    if (startDate && endDate) loadPreview();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les journaux</option>
                  <option value="ACH">ACH - Achats</option>
                  <option value="VEN">VEN - Ventes</option>
                  <option value="BQ">BQ - Banque</option>
                  <option value="CAI">CAI - Caisse</option>
                  <option value="OD">OD - Opérations diverses</option>
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut des factures
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={validatedOnly}
                      onChange={(e) => {
                        setValidatedOnly(e.target.checked);
                        if (startDate && endDate) loadPreview();
                      }}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <span className="text-sm">Validées uniquement (recommandé)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!validatedOnly}
                      onChange={(e) => setValidatedOnly(!e.target.checked)}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <span className="text-sm">Inclure les factures pré-traitées</span>
                  </label>
                </div>
              </div>

              {/* Aperçu */}
              {preview.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      Aperçu ({stats.entries} écritures, {stats.documents} factures)
                    </h3>
                    <button
                      onClick={loadPreview}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Actualiser
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    {preview.map((line, idx) => (
                      <div key={idx} className="whitespace-nowrap">
                        {line}
                      </div>
                    ))}
                    {preview.length >= 10 && (
                      <div className="text-gray-500 mt-2">...</div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleExport}
                  disabled={loading || !startDate || !endDate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  {loading ? "Génération..." : "Télécharger l'export"}
                </button>
              </div>
            </div>

            {/* Historique */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Historique des exports</h2>
              <div className="text-sm text-gray-500 text-center py-8">
                L&apos;historique des exports sera disponible prochainement
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
