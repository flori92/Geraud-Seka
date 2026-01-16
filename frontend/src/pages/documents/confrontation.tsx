/**
 * Page de Confrontation de Doublons
 * 
 * Affiche côte à côte:
 * - La nouvelle facture (uploadée)
 * - La facture existante (déjà dans le système)
 * 
 * Avec tableau comparatif et actions de résolution
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    AlertTriangle, FileText, Check, X, ArrowLeft,
    CheckCircle, XCircle, Files, Replace, AlertCircle,
    Eye, Download, ChevronDown
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface DocumentInfo {
    id: string;
    filename?: string;
    file_url?: string;
    status?: string;
    created_at?: string;
    validated_at?: string;
    exported_at?: string;
}

interface ComparisonField {
    field: string;
    label: string;
    value_1: string | number | null;
    value_2: string | number | null;
    identical: boolean;
}

interface CompareResponse {
    document_1: DocumentInfo;
    document_2: DocumentInfo;
    comparison: ComparisonField[];
    identical_fields: number;
    total_fields: number;
    all_identical: boolean;
    conclusion: string;
}

type ActionType = 'reject' | 'keep_both' | 'replace';

export default function ConfrontationPage() {
    const router = useRouter();
    const { new: newDocId, existing: existingDocId } = router.query;

    const [comparison, setComparison] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
    const [keepBothReason, setKeepBothReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (newDocId && existingDocId) {
            fetchComparison();
        }
    }, [newDocId, existingDocId]);

    const fetchComparison = async () => {
        const token = localStorage.getItem('seka_access_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/duplicates/compare/${newDocId}/${existingDocId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) {
                throw new Error('Erreur lors du chargement de la comparaison');
            }

            const data = await response.json();
            setComparison(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAction) {
            setError('Veuillez sélectionner une action');
            return;
        }

        if (selectedAction === 'keep_both' && !keepBothReason.trim()) {
            setError('Le motif est obligatoire pour conserver les deux factures');
            return;
        }

        const token = localStorage.getItem('seka_access_token');
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/duplicates/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_document_id: newDocId,
                    existing_document_id: existingDocId,
                    action: selectedAction,
                    reason: selectedAction === 'keep_both' ? keepBothReason : null
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Erreur lors de la résolution');
            }

            setSubmitted(true);
            setTimeout(() => {
                router.push('/documents/doublons');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatValue = (value: any) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') {
            return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
        }
        return value;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Chargement de la comparaison...</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center bg-white rounded-lg shadow-lg p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Doublon traité avec succès</h2>
                    <p className="text-gray-500 mt-2">Redirection en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Confrontation de Doublon - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-100">
                {/* Header Alert */}
                <div className="bg-red-600 text-white py-4 px-6">
                    <div className="max-w-7xl mx-auto flex items-center gap-4">
                        <AlertTriangle className="h-8 w-8" />
                        <div>
                            <h1 className="text-xl font-bold">🛑 DOUBLON DÉTECTÉ</h1>
                            <p className="text-red-100">
                                Cette facture existe déjà dans le système. Comparez les deux documents avant de continuer.
                            </p>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-700 rounded-lg hover:bg-red-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                            <button onClick={() => setError(null)} className="ml-auto">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {comparison && (
                        <>
                            {/* PDF Viewers Side by Side */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Nouvelle Facture */}
                                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <div className="bg-orange-500 text-white px-4 py-3">
                                        <h2 className="font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            📄 NOUVELLE FACTURE
                                        </h2>
                                        <p className="text-sm text-orange-100">Vient d'être uploadée</p>
                                    </div>
                                    <div className="h-96 bg-gray-200 flex items-center justify-center">
                                        {comparison.document_1.file_url ? (
                                            <iframe
                                                src={comparison.document_1.file_url}
                                                className="w-full h-full"
                                                title="Nouvelle facture"
                                            />
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <FileText className="h-16 w-16 mx-auto mb-2" />
                                                <p>Aperçu non disponible</p>
                                                <p className="text-sm">{comparison.document_1.filename}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 text-sm text-gray-600">
                                        <p>Uploadée le: {formatDate(comparison.document_1.created_at)}</p>
                                        <p>Statut: {comparison.document_1.status}</p>
                                    </div>
                                </div>

                                {/* Facture Existante */}
                                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <div className="bg-blue-600 text-white px-4 py-3">
                                        <h2 className="font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            📄 FACTURE EXISTANTE
                                        </h2>
                                        <p className="text-sm text-blue-100">Déjà dans le système</p>
                                    </div>
                                    <div className="h-96 bg-gray-200 flex items-center justify-center">
                                        {comparison.document_2.file_url ? (
                                            <iframe
                                                src={comparison.document_2.file_url}
                                                className="w-full h-full"
                                                title="Facture existante"
                                            />
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <FileText className="h-16 w-16 mx-auto mb-2" />
                                                <p>Aperçu non disponible</p>
                                                <p className="text-sm">{comparison.document_2.filename}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 text-sm text-gray-600">
                                        <p>Enregistrée le: {formatDate(comparison.document_2.created_at)}</p>
                                        <p>Statut: {comparison.document_2.status}</p>
                                        {comparison.document_2.validated_at && (
                                            <p>Validée le: {formatDate(comparison.document_2.validated_at)}</p>
                                        )}
                                        {comparison.document_2.exported_at && (
                                            <p>Exportée le: {formatDate(comparison.document_2.exported_at)}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Table */}
                            <div className="bg-white rounded-lg shadow-lg mb-6">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-900">COMPARAISON DÉTAILLÉE</h3>
                                </div>
                                <div className="p-6">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Champ</th>
                                                <th className="text-left py-3 px-4 text-orange-600 font-medium">Nouvelle</th>
                                                <th className="text-left py-3 px-4 text-blue-600 font-medium">Existante</th>
                                                <th className="text-center py-3 px-4 text-gray-500 font-medium">Identique ?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparison.comparison.map((field, idx) => (
                                                <tr key={idx} className={`border-b ${!field.identical ? 'bg-yellow-50' : ''}`}>
                                                    <td className="py-3 px-4 font-medium text-gray-700">{field.label}</td>
                                                    <td className="py-3 px-4">{formatValue(field.value_1)}</td>
                                                    <td className="py-3 px-4">{formatValue(field.value_2)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {field.identical ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500 inline" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-red-500 inline" />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Conclusion */}
                                    <div className={`mt-4 p-4 rounded-lg ${
                                        comparison.all_identical 
                                            ? 'bg-red-50 border border-red-200' 
                                            : 'bg-yellow-50 border border-yellow-200'
                                    }`}>
                                        <p className={`font-bold ${comparison.all_identical ? 'text-red-700' : 'text-yellow-700'}`}>
                                            {comparison.all_identical 
                                                ? '→ TOUS LES CHAMPS SONT IDENTIQUES = C\'EST UN DOUBLON'
                                                : `→ ${comparison.total_fields - comparison.identical_fields} DIFFÉRENCE(S) DÉTECTÉE(S)`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Selection */}
                            <div className="bg-white rounded-lg shadow-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-900">QUE VOULEZ-VOUS FAIRE ?</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Option 1: Rejeter */}
                                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedAction === 'reject' 
                                            ? 'border-red-500 bg-red-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="radio"
                                                name="action"
                                                checked={selectedAction === 'reject'}
                                                onChange={() => setSelectedAction('reject')}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                    C'est un doublon → Rejeter la nouvelle facture
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    La nouvelle facture sera rejetée. La facture existante sera conservée.
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option 2: Conserver les deux */}
                                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedAction === 'keep_both' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="radio"
                                                name="action"
                                                checked={selectedAction === 'keep_both'}
                                                onChange={() => setSelectedAction('keep_both')}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                    <Files className="h-5 w-5 text-blue-500" />
                                                    Ce n'est PAS un doublon → Conserver les deux
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Les deux factures seront conservées dans le système.
                                                </p>
                                                {selectedAction === 'keep_both' && (
                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Motif obligatoire *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={keepBothReason}
                                                            onChange={(e) => setKeepBothReason(e.target.value)}
                                                            placeholder="Ex: Facture rectificative, Avoir, etc."
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option 3: Remplacer */}
                                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedAction === 'replace' 
                                            ? 'border-orange-500 bg-orange-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="radio"
                                                name="action"
                                                checked={selectedAction === 'replace'}
                                                onChange={() => setSelectedAction('replace')}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                    <Replace className="h-5 w-5 text-orange-500" />
                                                    Remplacer l'existante → Utiliser la nouvelle version
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    L'ancienne facture sera archivée. La nouvelle sera utilisée.
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* Submit Buttons */}
                                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                    <button
                                        onClick={() => router.back()}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!selectedAction || submitting}
                                        className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Traitement...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Confirmer mon choix
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
