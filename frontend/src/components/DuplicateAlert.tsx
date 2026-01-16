/**
 * Interface de Confrontation de Doublons
 * Conforme au document client: PDF côte à côte + Tableau comparatif
 */
import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

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

interface DuplicateAlertProps {
    isOpen: boolean;
    newDocumentId: string;
    existingDocument: ExistingDocument;
    reason: string;
    reasonText: string;
    onResolve: (action: 'reject' | 'keep_both' | 'replace', reason?: string) => Promise<void>;
    onClose: () => void;
}

export function DuplicateAlert({
    isOpen,
    newDocumentId,
    existingDocument,
    reason,
    reasonText,
    onResolve,
    onClose
}: DuplicateAlertProps) {
    const [selectedAction, setSelectedAction] = useState<'reject' | 'keep_both' | 'replace' | null>(null);
    const [keepBothReason, setKeepBothReason] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedAction) {
            setError('Veuillez sélectionner une action');
            return;
        }

        if (selectedAction === 'keep_both' && !keepBothReason.trim()) {
            setError('Le motif est obligatoire pour conserver les deux factures');
            return;
        }

        setIsResolving(true);
        setError('');

        try {
            await onResolve(selectedAction, selectedAction === 'keep_both' ? keepBothReason : undefined);
        } catch (err) {
            setError('Erreur lors de la résolution du doublon');
            setIsResolving(false);
        }
    };

    // Données pour le tableau comparatif
    const comparisonData = [
        {
            field: 'Fournisseur',
            new: existingDocument.supplier_name || 'N/A',
            existing: existingDocument.supplier_name || 'N/A',
            identical: true
        },
        {
            field: 'N° facture',
            new: existingDocument.reference_number || 'N/A',
            existing: existingDocument.reference_number || 'N/A',
            identical: true
        },
        {
            field: 'Date facture',
            new: existingDocument.document_date ? new Date(existingDocument.document_date).toLocaleDateString('fr-FR') : 'N/A',
            existing: existingDocument.document_date ? new Date(existingDocument.document_date).toLocaleDateString('fr-FR') : 'N/A',
            identical: true
        },
        {
            field: 'Montant HT',
            new: existingDocument.amount_ht ? `${existingDocument.amount_ht.toLocaleString()} FCFA` : 'N/A',
            existing: existingDocument.amount_ht ? `${existingDocument.amount_ht.toLocaleString()} FCFA` : 'N/A',
            identical: true
        },
        {
            field: 'TVA',
            new: existingDocument.amount_vat ? `${existingDocument.amount_vat.toLocaleString()} FCFA` : 'N/A',
            existing: existingDocument.amount_vat ? `${existingDocument.amount_vat.toLocaleString()} FCFA` : 'N/A',
            identical: true
        },
        {
            field: 'Montant TTC',
            new: existingDocument.amount_ttc ? `${existingDocument.amount_ttc.toLocaleString()} FCFA` : 'N/A',
            existing: existingDocument.amount_ttc ? `${existingDocument.amount_ttc.toLocaleString()} FCFA` : 'N/A',
            identical: true
        }
    ];

    const allIdentical = comparisonData.every(row => row.identical);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">🛑 DOUBLON DÉTECTÉ</h2>
                            <p className="text-red-100 text-sm mt-1">
                                Cette facture existe déjà dans le système. Comparez les deux documents avant de continuer.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isResolving}
                        className="p-2 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content avec scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* PDF côte à côte */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Nouvelle facture */}
                        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h3 className="font-bold text-gray-900">📄 NOUVELLE FACTURE</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">(vient d'être uploadée)</p>
                            
                            <div className="bg-white border border-gray-300 rounded-lg h-96 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <FileText className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">Visualiseur PDF</p>
                                    <p className="text-xs">(nouveau document)</p>
                                </div>
                            </div>

                            {/* Infos extraites */}
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="font-semibold text-gray-700 border-b pb-1">INFORMATIONS EXTRAITES</div>
                                <div><span className="text-gray-600">Fournisseur:</span> <span className="font-medium">{existingDocument.supplier_name}</span></div>
                                <div><span className="text-gray-600">N° facture:</span> <span className="font-medium">{existingDocument.reference_number}</span></div>
                                <div><span className="text-gray-600">Date:</span> <span className="font-medium">{existingDocument.document_date ? new Date(existingDocument.document_date).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                                <div><span className="text-gray-600">Montant HT:</span> <span className="font-medium">{existingDocument.amount_ht?.toLocaleString()} FCFA</span></div>
                                <div><span className="text-gray-600">TVA:</span> <span className="font-medium">{existingDocument.amount_vat?.toLocaleString()} FCFA</span></div>
                                <div><span className="text-gray-600">Montant TTC:</span> <span className="font-bold text-lg">{existingDocument.amount_ttc?.toLocaleString()} FCFA</span></div>
                            </div>
                        </div>

                        {/* Facture existante */}
                        <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h3 className="font-bold text-gray-900">📄 FACTURE EXISTANTE</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">(déjà dans le système)</p>
                            
                            <div className="bg-white border border-gray-300 rounded-lg h-96 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <FileText className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">Visualiseur PDF</p>
                                    <p className="text-xs">(document existant)</p>
                                </div>
                            </div>

                            {/* Infos enregistrées */}
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="font-semibold text-gray-700 border-b pb-1">INFORMATIONS ENREGISTRÉES</div>
                                <div><span className="text-gray-600">Fournisseur:</span> <span className="font-medium">{existingDocument.supplier_name}</span></div>
                                <div><span className="text-gray-600">N° facture:</span> <span className="font-medium">{existingDocument.reference_number}</span></div>
                                <div><span className="text-gray-600">Date:</span> <span className="font-medium">{existingDocument.document_date ? new Date(existingDocument.document_date).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                                <div><span className="text-gray-600">Montant HT:</span> <span className="font-medium">{existingDocument.amount_ht?.toLocaleString()} FCFA</span></div>
                                <div><span className="text-gray-600">TVA:</span> <span className="font-medium">{existingDocument.amount_vat?.toLocaleString()} FCFA</span></div>
                                <div><span className="text-gray-600">Montant TTC:</span> <span className="font-bold text-lg">{existingDocument.amount_ttc?.toLocaleString()} FCFA</span></div>
                                
                                <div className="pt-2 mt-2 border-t border-green-300">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="font-medium">STATUT: {existingDocument.status}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Enregistrée le: {existingDocument.created_at ? new Date(existingDocument.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Raison du blocage */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-amber-900 mb-1">RAISON DU BLOCAGE</div>
                                <div className="text-amber-800">{reasonText}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tableau comparatif */}
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-3">COMPARAISON DÉTAILLÉE</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-300">
                                        <th className="text-left py-2 px-3 bg-gray-100">Champ</th>
                                        <th className="text-left py-2 px-3 bg-blue-50">Nouvelle</th>
                                        <th className="text-left py-2 px-3 bg-green-50">Existante</th>
                                        <th className="text-center py-2 px-3 bg-gray-100">Identique ?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-2 px-3 font-medium text-gray-700">{row.field}</td>
                                            <td className="py-2 px-3">{row.new}</td>
                                            <td className="py-2 px-3">{row.existing}</td>
                                            <td className="py-2 px-3 text-center">
                                                {row.identical ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {allIdentical && (
                            <div className="mt-3 text-center font-bold text-red-600">
                                → TOUS LES CHAMPS SONT IDENTIQUES = C'EST UN DOUBLON
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-3">Que voulez-vous faire ?</h3>
                        
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* Option 1: Rejeter */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-white transition">
                                <input
                                    type="radio"
                                    name="action"
                                    value="reject"
                                    checked={selectedAction === 'reject'}
                                    onChange={() => setSelectedAction('reject')}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">C'est un doublon → Rejeter la nouvelle facture</div>
                                    <div className="text-sm text-gray-600">(la facture existante sera conservée)</div>
                                </div>
                            </label>

                            {/* Option 2: Conserver les deux */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-white transition">
                                <input
                                    type="radio"
                                    name="action"
                                    value="keep_both"
                                    checked={selectedAction === 'keep_both'}
                                    onChange={() => setSelectedAction('keep_both')}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Ce n'est PAS un doublon → Conserver les deux</div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        Motif <span className="text-red-600 font-bold">obligatoire</span> :
                                    </div>
                                    {selectedAction === 'keep_both' && (
                                        <input
                                            type="text"
                                            value={keepBothReason}
                                            onChange={(e) => setKeepBothReason(e.target.value)}
                                            placeholder='Ex: "Facture rectificative", "Avoir", "Complément"...'
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    )}
                                </div>
                            </label>

                            {/* Option 3: Remplacer */}
                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-white transition">
                                <input
                                    type="radio"
                                    name="action"
                                    value="replace"
                                    checked={selectedAction === 'replace'}
                                    onChange={() => setSelectedAction('replace')}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Remplacer l'existante → Utiliser la nouvelle version</div>
                                    <div className="text-sm text-gray-600">(l'ancienne sera archivée)</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-300 px-6 py-4 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isResolving}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedAction || isResolving}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isResolving ? 'Traitement...' : 'Confirmer mon choix'}
                    </button>
                </div>
            </div>
        </div>
    );
}
export default DuplicateAlert;
