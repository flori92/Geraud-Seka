import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Upload, Download, FileText, CheckCircle, XCircle, 
  Clock, RefreshCw, AlertTriangle
} from "lucide-react";

interface Job {
  id: string;
  job_type: string;
  entity_type: string;
  file_name: string;
  status: string;
  progress: number;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  created_at: string;
}

export default function ImportExportPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState("leads");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchJobs();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/data/jobs`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/data/import/upload?entity_type=${entityType}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("seka_access_token")}` },
          body: formData
        }
      );

      if (res.ok) {
        const data = await res.json();
        setUploadResult(data);
        setColumnMapping(data.suggested_mapping || {});
      }
    } catch (error) {
      console.error("Erreur upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const startImport = async () => {
    if (!uploadResult) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/data/import/${uploadResult.job_id}/start`,
        {
          method: "POST",
          headers: { ...getHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(columnMapping)
        }
      );

      if (res.ok) {
        setUploadResult(null);
        setSelectedFile(null);
        fetchJobs();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const exportData = async (type: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/data/export/${type}`, {
        headers: getHeaders()
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error("Erreur export:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" }> = {
      pending: { label: "En attente", variant: "default" },
      processing: { label: "En cours", variant: "warning" },
      completed: { label: "Terminé", variant: "success" },
      failed: { label: "Échoué", variant: "error" }
    };
    const s = config[status] || config.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const dbFields = {
    leads: ["first_name", "last_name", "email", "phone", "company", "job_title", "source", "status", "city", "country"],
    contacts: ["first_name", "last_name", "email", "phone", "mobile", "job_title", "department", "city", "country"]
  };

  return (
    <DashboardLayout title="Import / Export">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Import / Export de données</h1>
          <p className="text-sm text-accents-5">Importez ou exportez vos données CRM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importer des données
            </h2>

            {!uploadResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type de données</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="leads">Leads</option>
                    <option value="contacts">Contacts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fichier CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <Button 
                  onClick={handleFileUpload} 
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Analyse..." : "Analyser le fichier"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700">
                    Fichier analysé : {uploadResult.file_name}
                  </p>
                  <p className="text-xs text-green-600">
                    {uploadResult.total_rows} lignes détectées
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mapping des colonnes</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadResult.headers?.map((header: string) => (
                      <div key={header} className="flex items-center gap-2">
                        <span className="text-sm w-32 truncate">{header}</span>
                        <span className="text-accents-4">→</span>
                        <select
                          value={columnMapping[header] || ""}
                          onChange={(e) => setColumnMapping({
                            ...columnMapping,
                            [header]: e.target.value
                          })}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                        >
                          <option value="">-- Ignorer --</option>
                          {dbFields[entityType as keyof typeof dbFields]?.map((field) => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setUploadResult(null)} className="flex-1">
                    Annuler
                  </Button>
                  <Button onClick={startImport} className="flex-1">
                    Lancer l'import
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Export */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-green-500" />
              Exporter des données
            </h2>

            <div className="space-y-3">
              <Button 
                variant="secondary" 
                onClick={() => exportData("leads")}
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                Exporter les Leads (CSV)
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => exportData("contacts")}
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                Exporter les Contacts (CSV)
              </Button>
            </div>

            <div className="mt-6 p-4 bg-accents-1 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Format du fichier</h3>
              <ul className="text-xs text-accents-5 space-y-1">
                <li>• Format CSV (séparateur virgule)</li>
                <li>• Encodage UTF-8</li>
                <li>• Première ligne = en-têtes</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Jobs History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Historique des opérations</h2>
            <Button variant="ghost" size="sm" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8 text-accents-5">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune opération récente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accents-1">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Fichier</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Statut</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Progression</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Résultat</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-3">
                        <Badge>{job.job_type === "import" ? "Import" : "Export"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{job.file_name || "-"}</td>
                      <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3">
                        <div className="w-24 h-2 bg-accents-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-600">{job.success_rows}</span>
                        {job.error_rows > 0 && (
                          <span className="text-red-500 ml-2">/ {job.error_rows} erreurs</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-accents-5">
                        {new Date(job.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
