import { useState, useRef, ChangeEvent } from "react";
import { API_BASE_URL } from "@/lib/api";

interface DocumentUploadProps {
    onUploadSuccess?: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

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
                throw new Error("Upload failed");
            }

            const result = await response.json();
            
            // Afficher le résultat selon le type de réponse
            if (result.documents_created !== undefined) {
                // Réponse multipage
                setUploadStatus(`${result.documents_created} factures extraites de ${file.name}`);
            } else {
                setUploadStatus(`${file.name} téléchargé avec succès`);
            }

            if (onUploadSuccess) {
                setTimeout(() => onUploadSuccess(), 500);
            }
        } catch (error) {
            console.error("Upload failed", error);
            setUploadStatus(`Erreur lors de l'upload de ${file.name}`);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadStatus(""), 5000);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
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
                {uploadStatus && <p className="mt-2 text-sm font-medium">{uploadStatus}</p>}
            </div>

            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                </div>
            )}
        </div>
    );
}
