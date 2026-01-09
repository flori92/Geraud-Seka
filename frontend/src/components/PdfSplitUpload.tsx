import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, X, Settings2 } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

interface PdfSplitUploadProps {
  onUploadComplete: (files: ProcessedFile[]) => void;
  apiPrefix: string;
}

interface ProcessedFile {
  id: string;
  name: string;
  pageCount: number;
  url: string;
  status: "pending" | "processing" | "completed" | "error";
}

type SplitMode = "single" | "one_per_page" | "two_per_invoice" | "custom";

export function PdfSplitUpload({ onUploadComplete, apiPrefix }: PdfSplitUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>("one_per_page");
  const [customPages, setCustomPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExpectedInvoices = (): number => {
    if (pageCount === 0) return 0;
    switch (splitMode) {
      case "single":
        return 1;
      case "one_per_page":
        return pageCount;
      case "two_per_invoice":
        return Math.ceil(pageCount / 2);
      case "custom":
        return Math.ceil(pageCount / customPages);
      default:
        return pageCount;
    }
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setShowOptions(false);

    if (selectedFile.type === "application/pdf") {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdf.numPages);
        
        if (pdf.numPages > 1) {
          setShowOptions(true);
        }
      } catch (err) {
        console.error("Error reading PDF:", err);
        setPageCount(1);
      }
    } else {
      setPageCount(1);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const token = localStorage.getItem("seka_access_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("split_mode", splitMode);
    if (splitMode === "custom") {
      formData.append("pages_per_invoice", customPages.toString());
    }

    try {
      const response = await fetch(`${apiPrefix}/documents/upload-split`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUploadComplete(data.processed_files || []);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Erreur lors du téléversement");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPageCount(0);
    setSplitMode("one_per_page");
    setCustomPages(1);
    setShowOptions(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Upload de Factures</h2>

      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("pdf-upload-input")?.click()}
        >
          <input
            id="pdf-upload-input"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-base font-medium mb-2">Glissez vos fichiers ici</h3>
          <p className="text-sm text-gray-500 mb-4">ou cliquez pour parcourir</p>
          <p className="text-xs text-gray-400">Formats acceptés : PDF, JPG, PNG</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-gray-500">
                {pageCount > 1 
                  ? `Ce PDF contient ${pageCount} pages`
                  : "1 page détectée"
                }
              </p>
            </div>
            <button
              onClick={resetForm}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Split Options for multi-page PDFs */}
          {showOptions && pageCount > 1 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Comment voulez-vous le traiter ?</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="splitMode"
                    value="one_per_page"
                    checked={splitMode === "one_per_page"}
                    onChange={() => setSplitMode("one_per_page")}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <p className="text-sm font-medium">1 page = 1 facture</p>
                    <p className="text-xs text-gray-500">→ {pageCount} factures</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="splitMode"
                    value="two_per_invoice"
                    checked={splitMode === "two_per_invoice"}
                    onChange={() => setSplitMode("two_per_invoice")}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <p className="text-sm font-medium">2 pages = 1 facture</p>
                    <p className="text-xs text-gray-500">→ {Math.ceil(pageCount / 2)} factures</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="splitMode"
                    value="single"
                    checked={splitMode === "single"}
                    onChange={() => setSplitMode("single")}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <p className="text-sm font-medium">Traiter comme 1 seule facture</p>
                    <p className="text-xs text-gray-500">→ 1 facture ({pageCount} pages)</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="splitMode"
                    value="custom"
                    checked={splitMode === "custom"}
                    onChange={() => setSplitMode("custom")}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Personnalisé</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max={pageCount}
                        value={customPages}
                        onChange={(e) => setCustomPages(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={splitMode !== "custom"}
                        className="w-16 px-2 py-1 text-sm border rounded disabled:bg-gray-100"
                      />
                      <span className="text-xs text-gray-500">
                        pages par facture → {getExpectedInvoices()} factures
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                {getExpectedInvoices()} facture{getExpectedInvoices() > 1 ? "s" : ""} sera{getExpectedInvoices() > 1 ? "ont" : ""} créée{getExpectedInvoices() > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Lancer l&apos;extraction
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
