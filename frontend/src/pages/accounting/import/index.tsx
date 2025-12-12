
import { useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadFECFile } from "@/lib/api";

export default function ImportAccountingDataPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const token = localStorage.getItem("seka_access_token");
            if (!token) {
                router.push("/login");
                return;
            }

            const data = await uploadFECFile(file, token);
            setResult(data);
        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.response?.data?.detail || "Une erreur est survenue lors de l'import.");
        } finally {
            setUploading(false);
        }
    }, [router]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt', '.csv'],
            'text/csv': ['.csv', '.txt']
        },
        maxFiles: 1
    });

    return (
        <DashboardLayout title="Import Dossier Comptable">
            <Head>
                <title>Import Dossier Comptable (FEC) - SEKA</title>
            </Head>

            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Importer un dossier comptable</h1>
                    <p className="text-gray-500">
                        Importez un Fichier des Écritures Comptables (FEC) pour peupler automatiquement votre comptabilité.
                        Formats acceptés : .txt, .csv (Tabulation ou Pipe).
                    </p>
                </div>

                <Card className="p-8">
                    {!result ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <input {...getInputProps()} />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                                    <p className="text-lg font-medium text-gray-900">Analyse du fichier en cours...</p>
                                    <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques secondes selon la taille du fichier.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <p className="text-xl font-medium text-gray-900 mb-2">
                                        Glissez-déposez votre fichier FEC ici
                                    </p>
                                    <p className="text-gray-500 mb-6">ou cliquez pour sélectionner un fichier</p>
                                    <Button variant="secondary">Sélectionner un fichier</Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Import réussi !</h2>

                            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-8 text-left">
                                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Résumé de l'import</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">Lignes traitées:</span>
                                        <span className="font-medium">{result.stats?.total_lines}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">Écritures importées:</span>
                                        <span className="font-medium text-green-600">{result.stats?.imported_entries}</span>
                                    </li>
                                    {result.stats?.errors && result.stats.errors.length > 0 && (
                                        <li className="mt-4 pt-2 border-t">
                                            <span className="text-red-600 font-medium flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {result.stats.errors.length} erreurs rencontrées
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="flex justify-center gap-4">
                                <Button variant="secondary" onClick={() => setResult(null)}>
                                    Importer un autre fichier
                                </Button>
                                <Button onClick={() => router.push('/accounting/dashboard')}>
                                    Voir le Tableau de Bord
                                </Button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
