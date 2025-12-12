import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, Edit2, Save, Loader2 } from "lucide-react";

interface OcrData {
  reference_number: string;
  date: string;
  due_date?: string;
  amount_ht: number;
  amount_vat: number;
  amount_ttc: number;
  supplier_name: string;
  page_count?: number;
  is_multi_page?: boolean;
  confidence: number;
  fields_confidence?: Record<string, number>;
  line_items_confidence?: number[];
}

interface Suggestion {
  rule_name?: string;
  confidence: number;
  suggested_debit_account?: string;
  suggested_credit_account?: string;
  suggested_label?: string;
  auto_apply?: boolean;
}

interface EntryLine {
  account_code: string;
  label: string;
  debit: number;
  credit: number;
}

export default function AccountingEntryFromOCR() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [ocrData, setOcrData] = useState<OcrData | null>(null);
  const [fileInfo, setFileInfo] = useState<{url?: string; key?: string; page_count?: number; is_multi_page?: boolean}>({});
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [entryLines, setEntryLines] = useState<EntryLine[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const PdfViewer = dynamic(() => import('@/components/DocumentPdfViewer'), { ssr: false });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("seka_access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-rules/entries/from-document`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        setOcrData(result.ocr_data);
        setSuggestions(result.suggestions);
        setEntryLines(result.proposed_entry.lines);
        setFileInfo(result.file_info || {});
      } else {
        alert("Erreur lors du traitement du document");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEntry = async () => {
    setSaving(true);
    const token = localStorage.getItem("seka_access_token");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            journal_type: 'ACH',
            date: ocrData?.date,
            reference: ocrData?.reference_number,
            description: suggestions?.suggested_label || ocrData?.supplier_name,
            lines: entryLines.map(line => ({
              account_id: line.account_code,
              label: line.label,
              debit: line.debit,
              credit: line.credit
            }))
          })
        }
      );

      if (response.ok) {
        alert("Écriture enregistrée avec succès");
        router.push("/accounting/entries");
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const recalcTVA = (lines: EntryLine[]) => {
    // Simple heuristic: ensure Debit(HT)+Debit(TVA)=Credit(TTC) when possible
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) < 0.01) return lines;
    // Try adjust TVA line if present
    const tvaIndex = lines.findIndex(l => l.label?.toLowerCase().includes('tva'));
    if (tvaIndex >= 0 && ocrData) {
      const ht = lines.filter((_, i) => i !== tvaIndex).reduce((s, l) => s + (l.debit || 0), 0);
      const ttc = lines.reduce((s, l) => s + (l.credit || 0), 0);
      const newTVA = Math.max(0, ttc - ht);
      const clone = [...lines];
      clone[tvaIndex] = { ...clone[tvaIndex], debit: parseFloat(newTVA.toFixed(2)) };
      return clone;
    }
    return lines;
  };

  const updateLine = (index: number, field: keyof EntryLine, value: string | number) => {
    const newLines = [...entryLines];
    (newLines[index] as any)[field] = value;
    setEntryLines(recalcTVA(newLines));
  };

  const getTotalDebit = () => entryLines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const getTotalCredit = () => entryLines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;

  return (
    <>
      <Head><title>Saisie avec OCR - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold">Saisie Automatique avec OCR</h1>
                <p className="text-sm text-gray-500">Uploadez une facture PDF/image et laissez l&apos;IA créer l&apos;écriture</p>
              </div>
            </div>

            {/* Upload Zone */}
            {!ocrData && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-16 w-16 mx-auto text-purple-600 animate-spin mb-4" />
                  ) : (
                    <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  )}
                  <h3 className="text-lg font-semibold mb-2">
                    {uploading ? "Traitement en cours..." : "Glissez-déposez une facture ici"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {uploading
                      ? "OCR + Application des règles comptables..."
                      : "PDF, JPG, PNG (multi-pages supporté)"
                    }
                  </p>
                  {!uploading && (
                    <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      Parcourir
                    </button>
                  )}
                </label>
              </div>
            )}

            {/* OCR Results */}
            {ocrData && (
              <div className="space-y-6">
                {/* OCR Data Card */}
                {/* Preview with pagination if available */}
                {fileInfo?.url && ocrData?.is_multi_page && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold mb-2">Aperçu du document</h3>
                    <p className="text-xs text-gray-500 mb-3">Document multi-pages détecté ({ocrData.page_count} pages). Ouvrir le viewer pour naviguer page par page.</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-sm border rounded">Ouvrir le viewer</button>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Données extraites par OCR</h3>
                      {ocrData.is_multi_page && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {ocrData.page_count} pages
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ocrData.confidence > 0.9
                          ? 'bg-green-100 text-green-700'
                          : ocrData.confidence > 0.7
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        Confiance: {(ocrData.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Fournisseur</label>
                      <p className="font-medium">{ocrData.supplier_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Référence</label>
                      <p className="font-medium">{ocrData.reference_number}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Date</label>
                      <p className="font-medium">{ocrData.date}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Montant TTC</label>
                      <p className="font-medium text-lg">{ocrData.amount_ttc.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>

                {/* Suggestions Card */}
                {suggestions && (
                  <div className={`rounded-xl border-2 p-6 ${
                    suggestions.auto_apply
                      ? 'bg-green-50 border-green-300'
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {suggestions.auto_apply ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {suggestions.rule_name || "Suggestion par défaut"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Confiance: {(suggestions.confidence * 100).toFixed(0)}%
                          {suggestions.auto_apply && " - Application automatique"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Compte débit:</span>
                        <p className="font-mono font-medium">{suggestions.suggested_debit_account}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Compte crédit:</span>
                        <p className="font-mono font-medium">{suggestions.suggested_credit_account}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Libellé:</span>
                        <p className="font-medium">{suggestions.suggested_label}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Entry Lines */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Écriture proposée</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isEditing ? "Verrouiller" : "Modifier"}
                    </button>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Compte</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Libellé</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600">Débit</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={line.account_code}
                                onChange={(e) => updateLine(idx, 'account_code', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-sm"
                              />
                            ) : (
                              <span className="font-mono text-sm">{line.account_code}</span>
                            )}
                          </td>
                          <td className="py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={line.label}
                                onChange={(e) => updateLine(idx, 'label', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{line.label}</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                value={line.debit}
                                onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            ) : (
                              <span className="text-sm">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                value={line.credit}
                                onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            ) : (
                              <span className="text-sm">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-50">
                        <td colSpan={2} className="py-3">Total</td>
                        <td className="py-3 text-right">{getTotalDebit().toLocaleString()}</td>
                        <td className="py-3 text-right">{getTotalCredit().toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Écriture équilibrée</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">
                            Déséquilibre: {Math.abs(getTotalDebit() - getTotalCredit()).toLocaleString()} FCFA
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push("/accounting/entries")}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveEntry}
                        disabled={!isBalanced || saving}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Enregistrer l&apos;écriture
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal PDF Viewer */}
      {showPreview && fileInfo?.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] mx-4 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="font-semibold text-gray-800">Aperçu du document</h3>
              <button onClick={() => setShowPreview(false)} className="px-2 py-1 rounded hover:bg-gray-100">Fermer</button>
            </div>
            <div className="p-4 h-[calc(80vh-48px)] overflow-hidden">
              <PdfViewer url={fileInfo.url} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
