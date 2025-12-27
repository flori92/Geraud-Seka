import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, Edit2, Save, Loader2, ThumbsUp, X } from "lucide-react";
import AccountAutocomplete, { type Account } from "@/components/AccountAutocomplete";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

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

function toNumberAmount(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const normalized = v.replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeEntryLines(lines: unknown): EntryLine[] {
  if (!Array.isArray(lines)) return [];
  return lines.map((l) => {
    const obj = l as Record<string, unknown>;
    return {
      account_code: String(obj.account_code ?? ""),
      label: String(obj.label ?? ""),
      debit: toNumberAmount(obj.debit),
      credit: toNumberAmount(obj.credit),
    };
  });
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

  type AccountApiLike = Record<string, unknown>;

  type OcrServerResponse = {
    ocr_data: OcrData;
    suggestions: Suggestion;
    proposed_entry: { lines: EntryLine[] };
    file_info?: { url?: string; key?: string; page_count?: number; is_multi_page?: boolean; document_id?: string };
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        const response = await fetch(`${apiPrefix}/accounting/advanced/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const accountList = Array.isArray(data) ? data : data.accounts || [];
          setAccounts(
            (accountList as AccountApiLike[]).map((acc) => {
              const code =
                (typeof acc.account_number === "string" && acc.account_number) ||
                (typeof acc.code === "string" && acc.code) ||
                (typeof acc.account_code === "string" && acc.account_code) ||
                "";

              const name =
                (typeof acc.name === "string" && acc.name) ||
                (typeof acc.label === "string" && acc.label) ||
                (typeof acc.account_name === "string" && acc.account_name) ||
                "";

              const type =
                (typeof acc.account_type === "string" && acc.account_type) ||
                (typeof acc.type === "string" && acc.type) ||
                undefined;

              const klass =
                (typeof acc.account_class === "string" && acc.account_class) ||
                (typeof acc.class === "string" && acc.class) ||
                undefined;

              return {
                code,
                name,
                type,
                class: klass,
              };
            })
          );
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
  }, [apiPrefix]);

  const convertPdfToImages = async (file: File, maxPages?: number): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    const limit = typeof maxPages === 'number' ? Math.min(pdf.numPages, maxPages) : pdf.numPages;
    for (let pageNum = 1; pageNum <= limit; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise;

      images.push(canvas.toDataURL('image/png'));
    }

    return images;
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const processWithLocalOCR = async (file: File) => {
    try {
      console.log("Starting local OCR fallback...");
      let allText = "";
      let pageCount = 1;
      let isMultiPage = false;

      const round2 = (n: number) => Math.round(n * 100) / 100;

      const fileToOcr = await (async () => {
        if (file.type === 'application/pdf') {
          const images = await convertPdfToImages(file, 1);
          pageCount = images.length > 0 ? images.length : 1;
          isMultiPage = true;
          if (images.length === 0) {
            throw new Error("Impossible de convertir le PDF en image pour l’OCR local.");
          }
          return dataUrlToFile(images[0], `ocr-page-1-${Date.now()}.png`);
        }
        return file;
      })();

      const result = await Tesseract.recognize(fileToOcr, 'fra', { logger: m => console.log(m) });
      allText = result.data.text;

      console.log("Local OCR Text:", allText);

      const dateRegex = /(\d{2}[/.-]\d{2}[/.-]\d{4})|(\d{1,2}\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s(?:\d{4}|N))/i;
      const amountRegex = /(\d{1,3}(?:[\s.]\d{3})*(?:,\d{2})?)/g;
      const referenceRegex = /(?:facture|invoice)\s*(?:n[°o]?\s*)?([a-z0-9-/]+)/i;

      const dateMatch = allText.match(dateRegex);
      let date = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        try {
          const raw = dateMatch[0].trim();
          const m1 = raw.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
          if (m1) {
            const yyyy = m1[3];
            const mm = m1[2];
            const dd = m1[1];
            date = `${yyyy}-${mm}-${dd}`;
          } else {
            const m2 = raw.match(/^(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4}|N)$/i);
            if (m2) {
              const day = parseInt(m2[1], 10);
              const monthName = m2[2].toLowerCase();
              const yearStr = m2[3].toUpperCase();
              const monthMap: Record<string, number> = {
                janvier: 1,
                février: 2,
                mars: 3,
                avril: 4,
                mai: 5,
                juin: 6,
                juillet: 7,
                août: 8,
                septembre: 9,
                octobre: 10,
                novembre: 11,
                décembre: 12,
              };
              const year = yearStr === 'N' ? new Date().getFullYear() : parseInt(yearStr, 10);
              const month = monthMap[monthName];
              if (month && !Number.isNaN(day) && !Number.isNaN(year)) {
                const mm = `${month}`.padStart(2, '0');
                const dd = `${day}`.padStart(2, '0');
                date = `${year}-${mm}-${dd}`;
              }
            }
          }
        } catch {
        }
      }

      const amounts = [];
      let match;
      while ((match = amountRegex.exec(allText)) !== null) {
        const raw = match[1];
        const looksLikeAmount = raw.includes(',') || /\d{1,3}[\s.]\d{3}/.test(raw);
        if (!looksLikeAmount) continue;
        const clean = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        const val = parseFloat(clean);
        if (!isNaN(val) && val > 0) amounts.push(val);
      }

      const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
      const amountTTC = maxAmount;
      const vatMatch = allText.match(/TVA\s*([0-9]{1,2})\s*%/i);
      const vatRate = vatMatch ? parseFloat(vatMatch[1]) / 100 : 0.18;
      const amountHT = amountTTC > 0 ? round2(amountTTC / (1 + vatRate)) : 0;
      const amountVAT = amountTTC > 0 ? round2(amountTTC - amountHT) : 0;

      const refMatch = allText.match(referenceRegex);
      const reference = refMatch ? refMatch[1] : `DOC-${Date.now()}`;

      const lines = allText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const supplierCandidate = lines.find(l => {
        if (l.length < 3 || l.length > 60) return false;
        if (!/[a-zà-ÿ]/i.test(l)) return false;
        if (/coordonn|facture|désignation|designation|quantité|quantite|prix|montant|total|tva|rabat|net/i.test(l)) return false;
        if (/\d/.test(l) && l.length < 8) return false;
        return true;
      });
      const supplierRegex = /(?:société|entreprise|sarl|sa|sas|eurl)\s+([a-zà-ÿ\s-]+)/i;
      const supplierMatch = allText.match(supplierRegex);
      const supplierName = (supplierCandidate || (supplierMatch ? supplierMatch[1] : "") || "Fournisseur Inconnu (OCR Local)").trim();

      const fallbackOcrData: OcrData = {
        reference_number: reference,
        date: date,
        amount_ht: amountHT,
        amount_vat: amountVAT,
        amount_ttc: amountTTC,
        supplier_name: supplierName,
        is_multi_page: isMultiPage,
        page_count: pageCount,
        confidence: 0.6,
        fields_confidence: {
          supplier_name: 0.5,
          date: 0.5,
          amount_ttc: 0.6,
          reference_number: 0.5
        }
      };

      const fallbackSuggestions: Suggestion = {
        rule_name: "OCR Local Fallback",
        confidence: 0.5,
        suggested_debit_account: "601100",
        suggested_credit_account: "401100",
        suggested_label: `Achat ${reference}`,
        auto_apply: false,
      };

      setOcrData(fallbackOcrData);
      setSuggestions(fallbackSuggestions);
      setEntryLines(
        normalizeEntryLines([
          { account_code: "601100", label: `Achat ${reference}`, debit: amountHT, credit: 0 },
          { account_code: "445200", label: "TVA Récupérable", debit: amountVAT, credit: 0 },
          { account_code: "401100", label: supplierName, debit: 0, credit: amountTTC },
        ])
      );
      setFileInfo({
        url: URL.createObjectURL(file),
        page_count: pageCount,
        is_multi_page: isMultiPage,
      });
    } catch (err: unknown) {
      console.error("Local OCR failed:", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setClassificationValidated(false);

    try {
      const token = localStorage.getItem("seka_access_token");

      const tryServer = async (f: File) => {
        const formData = new FormData();
        formData.append('file', f);
        const response = await fetch(
          `${apiPrefix}/accounting-rules/entries/from-document`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          if (response.status === 422 && detail.includes("GROQ_API_KEY")) {
            throw new Error("OCR_SERVER_NOT_CONFIGURED");
          }
          throw new Error(`Server OCR failed with status ${response.status}${detail ? `: ${detail}` : ''}`);
        }
        return response.json();
      };

      let result: OcrServerResponse;
      try {
        result = await tryServer(file);
      } catch (e) {
        if (file.type === 'application/pdf') {
          const images = await convertPdfToImages(file, 1);
          if (images.length > 0) {
            const imageFile = await dataUrlToFile(images[0], `ocr-page-1-${Date.now()}.png`);
            result = await tryServer(imageFile);
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }

      setOcrData(result.ocr_data);
      setSuggestions(result.suggestions);
      setEntryLines(normalizeEntryLines(result.proposed_entry.lines));
      setFileInfo(result.file_info || {});
    } catch (error) {
      if (error instanceof Error && error.message === "OCR_SERVER_NOT_CONFIGURED") {
        console.warn("OCR serveur indisponible en local (GROQ_API_KEY manquante) : fallback OCR local.");
      } else {
        console.error("Network or parsing error:", error);
        console.warn("Network error, trying local fallback...");
      }
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
        `${apiPrefix}/accounting-rules/entries/validate-classification?document_id=${fileInfo.document_id}&debit_account=${debitLine?.account_code || ''}&credit_account=${creditLine?.account_code || ''}&label=${encodeURIComponent(suggestions.suggested_label || '')}`,
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
      if (!token) {
        alert("Vous devez être connecté");
        return;
      }

      if (!entryLines || entryLines.length < 2) {
        alert("Une écriture doit avoir au moins 2 lignes");
        return;
      }

      if (entryLines.some((l) => !l.account_code || String(l.account_code).trim().length === 0)) {
        alert("Veuillez renseigner un compte pour chaque ligne");
        return;
      }

      const totalDebit = entryLines.reduce((s, l) => s + (toNumberAmount(l.debit) || 0), 0);
      const totalCredit = entryLines.reduce((s, l) => s + (toNumberAmount(l.credit) || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        alert(`L'écriture n'est pas équilibrée: Débit=${totalDebit.toFixed(2)}, Crédit=${totalCredit.toFixed(2)}`);
        return;
      }

      const entryDate = ocrData?.date ? String(ocrData.date) : new Date().toISOString().slice(0, 10);

      const response = await fetch(
        `${apiPrefix}/accounting-entries/entries/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            journal_type: 'ACH',
            date: entryDate,
            reference: ocrData?.reference_number,
            description: suggestions?.suggested_label || ocrData?.supplier_name,
            document_id: fileInfo.document_id,
            lines: entryLines.map(line => ({
              account_code: line.account_code,
              label: line.label,
              debit: toNumberAmount(line.debit) || 0,
              credit: toNumberAmount(line.credit) || 0
            }))
          })
        }
      );

      if (response.ok) {
        alert("Écriture enregistrée avec succès");
        router.push("/accounting/entries");
      } else {
        const detailText = await response.text().catch(() => "");
        alert(detailText || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const recalcTVA = (lines: EntryLine[]) => {
    const totalDebit = lines.reduce((s, l) => s + (toNumberAmount(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (toNumberAmount(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) < 0.01) return lines;
    const tvaIndex = lines.findIndex(l => l.label?.toLowerCase().includes('tva'));
    if (tvaIndex >= 0 && ocrData) {
      const ht = lines
        .filter((_, i) => i !== tvaIndex)
        .reduce((s, l) => s + (toNumberAmount(l.debit) || 0), 0);
      const ttc = lines.reduce((s, l) => s + (toNumberAmount(l.credit) || 0), 0);
      const newTVA = Math.max(0, ttc - ht);
      const clone = [...lines];
      clone[tvaIndex] = { ...clone[tvaIndex], debit: parseFloat(newTVA.toFixed(2)) };
      return clone;
    }
    return lines;
  };

  const updateLine = (index: number, field: keyof EntryLine, value: string | number) => {
    const newLines = [...entryLines];
    newLines[index] = { ...newLines[index], [field]: value } as EntryLine;
    setEntryLines(recalcTVA(newLines));
  };

  const getTotalDebit = () => entryLines.reduce((sum, line) => sum + (toNumberAmount(line.debit) || 0), 0);
  const getTotalCredit = () => entryLines.reduce((sum, line) => sum + (toNumberAmount(line.credit) || 0), 0);
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
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
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
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
