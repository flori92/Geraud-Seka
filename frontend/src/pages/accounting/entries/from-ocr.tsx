import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, Edit2, Save, Loader2, ThumbsUp, X } from "lucide-react";
import AccountAutocomplete, { type Account } from "@/components/AccountAutocomplete";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import Tesseract from 'tesseract.js';

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
  const [fileInfo, setFileInfo] = useState<{ url?: string; key?: string; page_count?: number; is_multi_page?: boolean; document_id?: string }>({});
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [entryLines, setEntryLines] = useState<EntryLine[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [validatingClassification, setValidatingClassification] = useState(false);
  const [classificationValidated, setClassificationValidated] = useState(false);
  const PdfViewer = dynamic(() => import('@/components/DocumentPdfViewer'), { ssr: false });

  // Fetch accounts for autocomplete
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        const response = await fetch(`/api/accounting/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const accountList = Array.isArray(data) ? data : data.accounts || [];
          setAccounts(accountList.map((acc: any) => ({
            code: acc.code || acc.account_code,
            name: acc.name || acc.label || acc.account_name,
            type: acc.type,
            class: acc.class,
          })));
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        setAccounts([
          { code: "401000", name: "Fournisseurs" },
          { code: "411000", name: "Clients" },
          { code: "445620", name: "TVA déductible sur immobilisations" },
          { code: "445660", name: "TVA déductible sur autres biens et services" },
          { code: "601000", name: "Achats de matières premières" },
          { code: "602000", name: "Achats de fournitures" },
          { code: "606400", name: "Fournitures administratives" },
          { code: "613200", name: "Locations immobilières" },
          { code: "615500", name: "Entretien et réparations" },
          { code: "622600", name: "Honoraires" },
          { code: "626000", name: "Frais postaux et télécommunications" },
          { code: "627000", name: "Services bancaires" },
        ]);
      }
    };
    fetchAccounts();
  }, []);

  const processWithLocalOCR = async (file: File) => {
    try {
      console.log("Starting local OCR fallback...");
      const result = await Tesseract.recognize(
        file,
        'fra',
        { logger: m => console.log(m) }
      );

      const text = result.data.text;
      console.log("Local OCR Text:", text);

      const dateRegex = /(\d{2}[/.-]\d{2}[/.-]\d{4})|(\d{1,2}\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s\d{4})/i;
      const amountRegex = /(\d{1,3}(?:[\s.]\d{3})*(?:,\d{2})?)\s?(?:€|EUR|FCFA|F\s?CFA)/gi;
      const referenceRegex = /(?:facture|ref|n°)\s?[:.]?\s?([a-z0-9-/]+)/i;

      // Find Date
      const dateMatch = text.match(dateRegex);
      let date = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        try {
          const d = dateMatch[0].replace(/[/.]/g, '-');
          // Naive parsing, works for some formats, fail safe to today
        } catch (e) { }
      }

      // Find Amounts
      const amounts = [];
      let match;
      while ((match = amountRegex.exec(text)) !== null) {
        const clean = match[1].replace(/\s/g, '').replace(',', '.');
        const val = parseFloat(clean);
        if (!isNaN(val)) amounts.push(val);
      }

      const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
      const amountTTC = maxAmount;
      const amountVAT = Math.round(amountTTC * 0.18 / 1.18);
      const amountHT = amountTTC - amountVAT;

      // Find Reference
      const refMatch = text.match(referenceRegex);
      const reference = refMatch ? refMatch[1] : `DOC-${Date.now()}`;

      const fallbackOcrData: OcrData = {
        reference_number: reference,
        date: date,
        amount_ht: amountHT,
        amount_vat: amountVAT,
        amount_ttc: amountTTC,
        supplier_name: "Fournisseur Inconnu (OCR Local)",
        is_multi_page: false,
        confidence: result.data.confidence / 100,
        fields_confidence: {
          supplier_name: 0.5,
          date: 0.6,
          amount_ttc: 0.7,
          reference_number: 0.6
        }
      };

      const fallbackSuggestions: Suggestion = {
        rule_name: "OCR Local Fallback",
        confidence: 0.5,
        suggested_debit_account: "601100",
        suggested_credit_account: "401100",
        suggested_label: `Achat ${reference}`,
        auto_apply: false
      };

      setOcrData(fallbackOcrData);
      setSuggestions(fallbackSuggestions);
      setEntryLines([
        { account_code: "601100", label: `Achat ${reference}`, debit: amountHT, credit: 0 },
        { account_code: "445200", label: "TVA Récupérable", debit: amountVAT, credit: 0 },
        { account_code: "401100", label: "Fournisseur (Attente)", debit: 0, credit: amountTTC }
      ]);
      setFileInfo({ url: URL.createObjectURL(file), page_count: 1, is_multi_page: false });

    } catch (err) {
      console.error("Local OCR failed:", err);
      alert("L'analyse locale du document a également échoué.");
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setClassificationValidated(false);

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
        console.warn("Server OCR failed (maybe CORS or 500), trying local fallback...");
        await processWithLocalOCR(file);
      }
    } catch (error) {
      console.error("Network or parsing error:", error);
      console.warn("Network error, trying local fallback...");
      await processWithLocalOCR(file);
    } finally {
      setUploading(false);
    }
  };

  const handleValidateClassification = async () => {
    if (!fileInfo.document_id || !suggestions) return;

    setValidatingClassification(true);
    try {
      const token = localStorage.getItem("seka_access_token");
      const debitLine = entryLines.find(l => l.debit > 0 && !l.label.toLowerCase().includes('tva'));
      const creditLine = entryLines.find(l => l.credit > 0);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-rules/entries/validate-classification?document_id=${fileInfo.document_id}&debit_account=${debitLine?.account_code || ''}&credit_account=${creditLine?.account_code || ''}&label=${encodeURIComponent(suggestions.suggested_label || '')}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setClassificationValidated(true);
        alert("Classification validée ! Cela améliorera les suggestions futures.");
      } else {
        const error = await response.json();
        alert(error.detail || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Error validating classification:", error);
      alert("Erreur lors de la validation de la classification");
    } finally {
      setValidatingClassification(false);
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
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) < 0.01) return lines;
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

  const getFieldConfidence = (fieldName: string): number | undefined => {
    return ocrData?.fields_confidence?.[fieldName];
  };

  return (
    <>
      <Head><title>Saisie avec OCR - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50 pt-14">
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold">Saisie Automatique avec OCR</h1>
                <p className="text-sm text-gray-500">Uploadez une facture PDF/image et laissez l&apos;IA créer l&apos;écriture</p>
              </div>
            </div>

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
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Traitement en cours...</h3>
                      <p className="text-sm text-gray-500">Analyse de la facture (Server/Local)...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Glissez-déposez une facture ici</h3>
                      <p className="text-gray-500 mb-4">PDF, JPG, PNG (multi-pages supporté)</p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('file-upload')?.click();
                          }}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Parcourir
                        </button>
                      </div>
                    </>
                  )}
                </label>
              </div>
            )}

            {ocrData && (
              <div className="space-y-6">
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ocrData.confidence > 0.9
                        ? 'bg-green-100 text-green-700'
                        : ocrData.confidence > 0.7
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        Confiance globale: {(ocrData.confidence * 100).toFixed(0)}%
                        {ocrData.supplier_name.includes("Local") && " (Fallback)"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-xs text-gray-500">Fournisseur</label>
                        {getFieldConfidence('supplier_name') !== undefined && (
                          <ConfidenceBadge confidence={getFieldConfidence('supplier_name')!} />
                        )}
                      </div>
                      <p className="font-medium">{ocrData.supplier_name}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-xs text-gray-500">Référence</label>
                        {getFieldConfidence('reference_number') !== undefined && (
                          <ConfidenceBadge confidence={getFieldConfidence('reference_number')!} />
                        )}
                      </div>
                      <p className="font-medium">{ocrData.reference_number}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-xs text-gray-500">Date</label>
                        {getFieldConfidence('date') !== undefined && (
                          <ConfidenceBadge confidence={getFieldConfidence('date')!} />
                        )}
                      </div>
                      <p className="font-medium">{ocrData.date}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-xs text-gray-500">Montant TTC</label>
                        {getFieldConfidence('amount_ttc') !== undefined && (
                          <ConfidenceBadge confidence={getFieldConfidence('amount_ttc')!} />
                        )}
                      </div>
                      <p className="font-medium text-lg">{ocrData.amount_ttc.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>

                {suggestions && (
                  <div className={`rounded-xl border-2 p-6 ${classificationValidated
                    ? 'bg-blue-50 border-blue-300'
                    : suggestions.auto_apply
                      ? 'bg-green-50 border-green-300'
                      : 'bg-yellow-50 border-yellow-300'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {classificationValidated ? (
                          <ThumbsUp className="h-6 w-6 text-blue-600" />
                        ) : suggestions.auto_apply ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-yellow-600" />
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {classificationValidated
                              ? "Classification validée"
                              : suggestions.rule_name || "Suggestion par défaut"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Confiance: {(suggestions.confidence * 100).toFixed(0)}%
                            {suggestions.auto_apply && !classificationValidated && " - Application automatique"}
                          </p>
                        </div>
                      </div>

                      {!classificationValidated && fileInfo.document_id && (
                        <button
                          onClick={handleValidateClassification}
                          disabled={validatingClassification}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {validatingClassification ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Validation...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-4 w-4" />
                              Valider classification
                            </>
                          )}
                        </button>
                      )}
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

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Écriture proposée</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={classificationValidated}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isEditing ? "Verrouiller" : "Modifier"}
                    </button>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-600 w-48">Compte</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-600">Libellé</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600 w-32">Débit</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600 w-32">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3">
                            {isEditing ? (
                              <AccountAutocomplete
                                value={line.account_code}
                                onChange={(code) => updateLine(idx, 'account_code', code)}
                                accounts={accounts}
                                placeholder="Rechercher..."
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

      {showPreview && fileInfo?.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] mx-4 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="font-semibold text-gray-800">Aperçu du document</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
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
