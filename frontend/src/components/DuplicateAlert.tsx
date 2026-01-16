/**
 * Composant d'alerte de doublon
 * 
 * Affiche une alerte lorsqu'un doublon est détecté lors de l'upload
 * Propose les actions: Voir la confrontation ou Continuer quand même
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    AlertTriangle, X, Eye, FileText, ChevronRight,
    XCircle, Files, Replace
} from 'lucide-react';

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
    validated_at?: string;
    exported_at?: string;
    file_url?: string;
}

interface DuplicateAlertProps {
    isOpen: boolean;
    onClose: () => void;
    newDocumentId: string;
    existingDocument: ExistingDocument;
    reason: string;
    reasonText: string;
    onResolve?: (action: 'reject' | 'keep_both' | 'replace', reason?: string) => Promise<void>;
}

export default function DuplicateAlert({
    isOpen,
    onClose,
    newDocumentId,
    existingDocument,
    reason,
    reasonText,
    onResolve
}: DuplicateAlertProps) {
    const router = useRouter();
    const [selectedAction, setSelectedAction] = useState<'reject' | 'keep_both' | 'replace' | null>(null);
    const [keepBothReason, setKeepBothReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const formatAmount = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR');
    };

    const handleViewConfrontation = () => {
        router.push(`/documents/confrontation?new=${newDocumentId}&existing=${existingDocument.id}`);
    };

    const handleQuickAction = async () => {
        if (!selectedAction) {
            setError('Veuillez sélectionner une action');
            return;
        }

        if (selectedAction === 'keep_both' && !keepBothReason.trim()) {
            setError('Le motif est obligatoire');
            return;
        }

        if (onResolve) {
            setSubmitting(true);
            setError(null);
            try {
                await onResolve(selectedAction, selectedAction === 'keep_both' ? keepBothReason : undefined);
                onClose();
            } catch (err: any) {
                setError(err.message || 'Erreur lors du traitement');
            } finally {
                setSubmitting(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header - Rouge pour alerter */}
                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6" />
                        <div>
                            <h2 className="text-lg font-bold">🛑 DOUBLON DÉTECTÉ</h2>
                            <p className="text-sm text-red-100">Cette facture existe déjà dans le système</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-red-100 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Raison du blocage */}
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-semibold text-red-800">
                            Raison du blocage: {reasonText}
                        </p>
                    </div>

                    {/* Infos document existant */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Facture existante dans le système
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-blue-600">Fournisseur:</span>
                                <span className="ml-2 font-medium">{existingDocument.supplier_name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-blue-600">N° facture:</span>
                                <span className="ml-2 font-medium">{existingDocument.reference_number || '-'}</span>
                            </div>
                            <div>
                                <span className="text-blue-600">Date:</span>
                                <span className="ml-2 font-medium">{formatDate(existingDocument.document_date)}</span>
                            </div>
                            <div>
                                <span className="text-blue-600">Montant TTC:</span>
                                <span className="ml-2 font-medium">{formatAmount(existingDocument.amount_ttc)}</span>
                            </div>
                            <div>
                                <span className="text-blue-600">Statut:</span>
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                    existingDocument.status === 'validated' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {existingDocument.status === 'validated' ? 'Validée' : existingDocument.status}
                                </span>
                            </div>
                            <div>
                                <span className="text-blue-600">Enregistrée le:</span>
                                <span className="ml-2 font-medium">{formatDate(existingDocument.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bouton voir confrontation */}
                    <button
                        onClick={handleViewConfrontation}
                        className="w-full mb-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition-colors text-left"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Eye className="h-6 w-6 text-orange-600" />
                                <div>
                                    <p className="font-semibold text-orange-900">Voir la confrontation complète</p>
                                    <p className="text-sm text-orange-700">Comparer les deux documents PDF côte à côte</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-orange-500" />
                        </div>
                    </button>

                    {/* Actions rapides */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Action rapide</h3>

                        {error && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            {/* Rejeter */}
                            <label className={`block p-3 border-2 rounded-lg cursor-pointer ${
                                selectedAction === 'reject' ? 'border-red-400 bg-red-50' : 'border-gray-200'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="quickAction"
                                        checked={selectedAction === 'reject'}
                                        onChange={() => setSelectedAction('reject')}
                                    />
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <span className="font-medium">Rejeter la nouvelle facture</span>
                                </div>
                            </label>

                            {/* Conserver les deux */}
                            <label className={`block p-3 border-2 rounded-lg cursor-pointer ${
                                selectedAction === 'keep_both' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="quickAction"
                                        checked={selectedAction === 'keep_both'}
                                        onChange={() => setSelectedAction('keep_both')}
                                    />
                                    <Files className="h-5 w-5 text-blue-500" />
                                    <span className="font-medium">Conserver les deux</span>
                                </div>
                                {selectedAction === 'keep_both' && (
                                    <input
                                        type="text"
                                        value={keepBothReason}
                                        onChange={(e) => setKeepBothReason(e.target.value)}
                                        placeholder="Motif obligatoire (ex: Facture rectificative)"
                                        className="mt-2 w-full px-3 py-2 border rounded text-sm"
                                    />
                                )}
                            </label>

                            {/* Remplacer */}
                            <label className={`block p-3 border-2 rounded-lg cursor-pointer ${
                                selectedAction === 'replace' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="quickAction"
                                        checked={selectedAction === 'replace'}
                                        onChange={() => setSelectedAction('replace')}
                                    />
                                    <Replace className="h-5 w-5 text-orange-500" />
                                    <span className="font-medium">Remplacer l'existante</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                        Annuler
                    </button>
                    {selectedAction && (
                        <button
                            onClick={handleQuickAction}
                            disabled={submitting}
                            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                        >
                            {submitting ? 'Traitement...' : 'Confirmer'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
