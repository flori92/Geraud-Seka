import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { DocumentUpload } from "@/components/DocumentUpload";
import { getDocuments, type Document } from "@/lib/api";
import { FileText, Loader2, Upload, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (token) {
      try {
        const data = await getDocuments(token);
        setDocuments(data);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchDocuments(); 
  }, [fetchDocuments]);

  // Polling automatique pour les documents en cours de traitement OCR
  useEffect(() => {
    const hasProcessingDocs = documents.some(
      doc => doc.status === "OCR_PROCESSING" || doc.status === "UPLOADED"
    );
    
    if (!hasProcessingDocs) return;
    
    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000); // Vérifie toutes les 3 secondes
    
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleUploadSuccess = () => { 
    // Attendre un peu pour que le backend commence le traitement
    setTimeout(() => fetchDocuments(), 1000);
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!confirm(`Supprimer "${filename}" ?`)) return;
    
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setDocuments(docs => docs.filter(d => d.id !== docId));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-gray-100", text: "text-gray-700", label: "En attente" },
      OCR_PROCESSING: { bg: "bg-orange-100", text: "text-orange-700", label: "Traitement IA" },
      OCR_COMPLETED: { bg: "bg-blue-100", text: "text-blue-700", label: "Traité" },
      VALIDATED: { bg: "bg-green-100", text: "text-green-700", label: "Validé" },
      REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejeté" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  return (
    <>
      <Head><title>Documents - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><FileText className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestion des Documents</h1>
                <p className="text-sm text-gray-600 mt-0.5">Téléchargez et gérez vos pièces comptables</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-medium text-gray-900">Télécharger un document</h2>
              </div>
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Documents récents</h2>
              </div>
              {loading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                            Aucun document. Téléchargez votre première pièce ci-dessus.
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">{doc.filename}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {doc.amount_ttc ? `${doc.amount_ttc.toLocaleString()} FCFA` :
                               doc.total_amount ? `${doc.total_amount.toLocaleString()} FCFA` : "-"}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {(doc.status === "OCR_COMPLETED" || doc.status === "PENDING") && (
                                  <button onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                    className="text-sm text-[#1e3a5f] hover:underline font-medium">Valider</button>
                                )}
                                {doc.status === "VALIDATED" && (
                                  <button onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                    className="text-sm text-[#1e3a5f] hover:underline font-medium">Détails</button>
                                )}
                                <button 
                                  onClick={() => handleDelete(doc.id, doc.filename)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
