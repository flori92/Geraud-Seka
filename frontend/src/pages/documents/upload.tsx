import { useState, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Upload, FileText, Loader2, AlertCircle, File, CheckCircle, X, Eye } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { API_BASE_URL } from "@/lib/api";
import { PdfSplitUpload } from "@/components/PdfSplitUpload";

export default function DocumentUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState<'simple' | 'advanced'>('simple');
    const [processMode, setProcessMode] = useState<'single' | 'split'>('single');
    const [pagesPerDoc, setPagesPerDoc] = useState<number>(1);
    const [showPreview, setShowPreview] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize PDF.js worker
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            if (selectedFile.type === 'application/pdf') {
                try {
                    const arrayBuffer = await selectedFile.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    setPageCount(pdf.numPages);
                    // Ne pas forcer le mode, laisser l'utilisateur choisir
                    setProcessMode('single');
                    setPagesPerDoc(1);
                } catch (err) {
                    console.error("Error reading PDF:", err);
                    setPageCount(0);
                }
            } else {
                setPageCount(1);
                setProcessMode('single');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const token = localStorage.getItem("seka_access_token");

        try {
            const formData = new FormData();
            formData.append('file', file);

            let url = `${API_BASE_URL}/api/v1/documents/`;

            if (processMode === 'split' && pageCount > 1) {
                // If it's a huge PDF treated as single, we still use normal upload
                // If it is split, use multipage endpoint
                url = `${API_BASE_URL}/api/v1/documents/upload-multipage?pages_per_document=${pagesPerDoc}`;
            }

            // Note: If user selected 'single' for a multi-page PDF, we use standard upload endpoint.
            // But if pageCount > 1 and processMode is 'single', we just use standard upload.

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                router.push("/documents/en-attente");
            } else {
                const errorText = await response.text();
                alert(`Erreur upload: ${errorText}`);
            }

        } catch (error) {
            console.error("Upload failed", error);
            alert("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            // Reuse handleFileSelect logic by creating a synthetic event or extracting logic
            // For brevity, just duplicating logic here slightly or calling a helper if refactored
            const selectedFile = e.dataTransfer.files[0];
            setFile(selectedFile);
            // ... PDF check logic ... (Simplified for this snippet, ideally refactor)
            if (selectedFile.type === 'application/pdf') {
                selectedFile.arrayBuffer().then(ab => {
                    pdfjsLib.getDocument({ data: ab }).promise.then(pdf => {
                        setPageCount(pdf.numPages);
                        if (pdf.numPages > 1) setProcessMode('split');
                    });
                });
            } else {
                setPageCount(1);
                setProcessMode('single');
            }
        }
    };

    return (
        <>
            <Head>
                <title>Upload Factures - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary-600" />
                            Upload de Factures
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Déposez vos factures pour extraction automatique
                        </p>
                    </div>

                    <div className="p-8">
                        {!file ? (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-all cursor-pointer"
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Glissez vos fichiers ici</h3>
                                <p className="text-sm text-gray-500 mb-6">ou cliquez pour parcourir</p>
                                <p className="text-xs text-gray-400">PDF, JPG, PNG acceptés</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount > 0 ? `${pageCount} page(s)` : '...'}
                                        </p>
                                    </div>
                                    <button onClick={() => { setFile(null); setPageCount(0); }} className="text-gray-400 hover:text-red-500">
                                        <AlertCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                {pageCount > 1 && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-3 block">
                                            Ce PDF contient {pageCount} pages. Comment le traiter ?
                                        </h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="processMode"
                                                    checked={processMode === 'split' && pagesPerDoc === 1}
                                                    onChange={() => { setProcessMode('split'); setPagesPerDoc(1); }}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-700">1 page = 1 facture <span className="text-gray-400">({pageCount} factures)</span></span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="processMode"
                                                    checked={processMode === 'split' && pagesPerDoc === 2}
                                                    onChange={() => { setProcessMode('split'); setPagesPerDoc(2); }}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-700">2 pages = 1 facture <span className="text-gray-400">({Math.ceil(pageCount / 2)} factures)</span></span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="processMode"
                                                    checked={processMode === 'single'}
                                                    onChange={() => { setProcessMode('single'); setPagesPerDoc(pageCount); }}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-700">Traiter comme 1 seule facture</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setFile(null); setPageCount(0); }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                        disabled={uploading}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="flex-1 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        {uploading ? 'Traitement...' : "Lancer l'extraction"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
