import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/router";
import { API_BASE_URL } from "@/lib/api";
import DuplicateAlert from "./DuplicateAlert";
import { useToast } from "@/components/ui/ToastContainer";

interface ExistingDocument {
    id: string;
    supplier_name?: string;
    reference_number?: string;
    document_date?: string;
    amount_ht?: number;
    amount_vat?: number;
    amount_ttc?: number;
    status?: string;
    created_at?: string;
    file_url?: string;
}

interface DuplicateInfo {
    is_duplicate: boolean;
    reason: string;
    reason_text: string;
    existing_document: ExistingDocument;
    new_document_id: string;
}

interface DocumentUploadProps {
    onUploadSuccess?: () => void;
    onDuplicateDetected?: (info: DuplicateInfo) => void;
}

export function DocumentUpload({ onUploadSuccess, onDuplicateDetected }: DocumentUploadProps) {
    const router = useRouter();
    const toast = useToast();
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [statusType, setStatusType] = useState<"success" | "error" | "warning" | "">("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
    const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        setUploading(true);
        setUploadStatus("");
        setStatusType("");
        
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            alert("Vous devez être connecté");
            setUploading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Utiliser l'endpoint multipage pour les PDFs
            const isPdf = file.name.toLowerCase().endsWith('.pdf');
            const endpoint = isPdf 
                ? `${API_BASE_URL}/api/v1/documents/upload-multipage`
                : `${API_BASE_URL}/api/v1/documents/`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 409) {
                    // Fichier en double
                    setUploadStatus(errorData.detail || "Ce fichier existe déjà");
                    setStatusType("error");
                    return;
                }
                throw new Error(errorData.detail || "Upload failed");
            }

            const result = await response.json();
            const documentId = result.id || result.document_id;
            const extractedData = result.ai_extracted_data || result.extracted_data || {};

            // 1. Vérifier si le backend a déjà détecté un doublon via le statut
            if (result.status === 'A_TRAITER_DOUBLON') {
                const displayName = result.supplier_name || result.reference_number || file.name;
                setUploadStatus(`⚠️ Doublon détecté pour "${displayName}"`);
                setStatusType("warning");

                // Afficher une notification toast bien visible
                toast.warning(
                    `🛑 DOUBLON DÉTECTÉ: "${displayName}" - Ce document a été identifié comme un doublon potentiel. Veuillez le traiter avant validation.`,
                    10000 // 10 secondes
                );

                // Émettre une notification pour l'interface
                const event = new CustomEvent('seka:duplicate-detected', {
                    detail: {
                        type: 'duplicate',
                        documentId: documentId,
                        supplierName: result.supplier_name,
                        referenceNumber: result.reference_number,
                        message: 'Ce document a été détecté comme un doublon potentiel'
                    }
                });
                window.dispatchEvent(event);

                if (onUploadSuccess) {
                    setTimeout(() => onUploadSuccess(), 500);
                }
                return;
            }

            // 2. Sinon, faire une vérification supplémentaire via l'API
            if (documentId && (extractedData.supplier_name || extractedData.reference_number)) {
                const duplicateCheck = await checkForDuplicate(
                    token,
                    documentId,
                    extractedData.supplier_name,
                    extractedData.reference_number,
                    extractedData.amount_ttc,
                    extractedData.document_date || extractedData.invoice_date
                );

                if (duplicateCheck && duplicateCheck.is_duplicate) {
                    const info: DuplicateInfo = {
                        ...duplicateCheck,
                        new_document_id: documentId
                    };

                    setDuplicateInfo(info);
                    setShowDuplicateAlert(true);
                    setUploadStatus(`⚠️ Doublon détecté: ${duplicateCheck.reason_text}`);
                    setStatusType("warning");

                    // Afficher une notification toast bien visible
                    toast.warning(
                        `🛑 DOUBLON DÉTECTÉ: ${duplicateCheck.reason_text}. Veuillez résoudre ce doublon avant validation.`,
                        10000 // 10 secondes
                    );

                    if (onDuplicateDetected) {
                        onDuplicateDetected(info);
                    }

                    emitDuplicateNotification(info);
                    return;
                }
            }

            if (result.documents_created !== undefined) {
                setUploadStatus(`✅ ${result.documents_created} factures extraites de ${file.name}`);
            } else {
                setUploadStatus(`✅ ${file.name} téléchargé avec succès`);
            }
            setStatusType("success");

            if (onUploadSuccess) {
                setTimeout(() => onUploadSuccess(), 500);
            }
        } catch (error) {
            console.error("Upload failed", error);
            setUploadStatus(`❌ Erreur lors de l'upload de ${file.name}`);
            setStatusType("error");
        } finally {
            setUploading(false);
            setTimeout(() => setUploadStatus(""), 8000);
        }
    };
    
    const checkForDuplicate = async (
        token: string,
        documentId: string,
        supplierName?: string,
        invoiceNumber?: string,
        amountTtc?: number,
        invoiceDate?: string
    ) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/duplicates/check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    supplier_name: supplierName,
                    invoice_number: invoiceNumber,
                    amount_ttc: amountTtc,
                    invoice_date: invoiceDate,
                    exclude_document_id: documentId
                }),
            });
            
            if (response.ok) {
                const result = await response.json();
                return result;
            }
        } catch (error) {
            console.error("Duplicate check failed:", error);
        }
        return null;
    };
    
    const emitDuplicateNotification = (info: DuplicateInfo) => {
        const event = new CustomEvent('seka:duplicate-detected', {
            detail: {
                type: 'duplicate',
                severity: 'warning',
                title: '🛑 Doublon détecté',
                message: `La facture "${info.existing_document.reference_number || 'N/A'}" de ${info.existing_document.supplier_name || 'fournisseur inconnu'} existe déjà.`,
                reason: info.reason_text,
                newDocumentId: info.new_document_id,
                existingDocumentId: info.existing_document.id,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SEKA - Doublon détecté', {
                body: info.reason_text,
                icon: '/favicon.ico',
                tag: `duplicate-${info.new_document_id}`
            });
        }
    };
    
    const handleResolveDuplicate = async (action: 'reject' | 'keep_both' | 'replace', reason?: string) => {
        if (!duplicateInfo) return;
        
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/api/v1/duplicates/resolve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                new_document_id: duplicateInfo.new_document_id,
                existing_document_id: duplicateInfo.existing_document.id,
                action,
                reason
            }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors de la résolution');
        }
        
        setShowDuplicateAlert(false);
        setDuplicateInfo(null);
        
        if (action !== 'reject' && onUploadSuccess) {
            onUploadSuccess();
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <>
            <div
                className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${dragActive ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                />

                <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-slate-400">
                        <svg
                            className="h-full w-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                        <span
                            className="cursor-pointer font-semibold text-slate-900 hover:text-slate-700"
                            onClick={onButtonClick}
                        >
                            Cliquez pour uploader
                        </span>{" "}
                        ou glissez-déposez
                    </p>
                    <p className="mt-1 text-xs text-slate-500">PDF, PNG, JPG (max 10MB)</p>
                    {uploadStatus && (
                        <p className={`mt-2 text-sm font-medium ${
                            statusType === 'error' ? 'text-red-600' : 
                            statusType === 'warning' ? 'text-amber-600' : 
                            statusType === 'success' ? 'text-green-600' : ''
                        }`}>
                            {uploadStatus}
                        </p>
                    )}
                </div>

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                    </div>
                )}
            </div>

            {showDuplicateAlert && duplicateInfo && (
                <DuplicateAlert
                    isOpen={showDuplicateAlert}
                    newDocumentId={duplicateInfo.new_document_id}
                    existingDocument={duplicateInfo.existing_document}
                    reason={duplicateInfo.reason}
                    reasonText={duplicateInfo.reason_text}
                    onResolve={handleResolveDuplicate}
                    onClose={() => setShowDuplicateAlert(false)}
                />
            )}
        </>
    );
}
