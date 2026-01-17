/**
 * Modal de confrontation de doublons
 * Affiche deux documents côte à côte pour comparaison
 */
import { useState } from "react";
import { X, AlertCircle, CheckCircle, FileText } from "lucide-react";

interface DuplicateDocument {
    id: string;
    filename: string;
    supplier_name: string;
    reference_number: string;
    document_date: string | null;
    amount_ttc: number | null;
    status?: string;
    file_path: string;
    created_at?: string;
}

interface ComparisonField {
    name: string;
    label: string;
    new_value: any;
    existing_value: any;
    identical: boolean;
}

interface Duplicate {
    id: string;
    detection_reason: string;
    new_document: DuplicateDocument;
    existing_document: DuplicateDocument;
    comparison: {
        fields: ComparisonField[];
        all_identical: boolean;
    };
}

interface DuplicateConfrontationModalProps {
    duplicate: Duplicate;
    onClose: () => void;
    onResolve: (duplicateId: string, resolution: string, reason?: string) => Promise<void>;
}

export default function DuplicateConfrontationModal({
    duplicate,
    onClose,
    onResolve
}: DuplicateConfrontationModalProps) {
    const [selectedResolution, setSelectedResolution] = useState<string>("");
    const [resolutionReason, setResolutionReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!selectedResolution) {
            alert("Veuillez choisir une action");
            return;
        }

        if (selectedResolution === "kept_both" && !resolutionReason.trim()) {
            alert("Veuillez indiquer un motif pour conserver les deux documents");
            return;
        }

        setLoading(true);
        try {
            await onResolve(duplicate.id, selectedResolution, resolutionReason);
            onClose();
        } catch (error) {
            console.error("Error resolving duplicate:", error);
            alert("Erreur lors de la résolution du doublon");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("fr-FR");
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            same_invoice_number: "Même fournisseur + Même N° facture",
            same_amount_date: "Même fournisseur + Même montant + Même date"
        };
        return labels[reason] || reason;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-red-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">🛑 DOUBLON DÉTECTÉ</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Cette facture existe déjà dans le système. Comparez les deux documents avant de continuer.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Documents comparison */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* New Document */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    📄 NOUVELLE FACTURE
                                </h3>
                                <p className="text-xs text-blue-700 mt-1">(vient d'être uploadée)</p>
                            </div>

                            {/* PDF Viewer placeholder */}
                            <div className="bg-gray-100 h-64 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <FileText className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">{duplicate.new_document.filename}</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-2 bg-white">
                                <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
                                    Informations extraites
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Fournisseur:</span>
                                        <span className="font-medium">{duplicate.new_document.supplier_name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">N° facture:</span>
                                        <span className="font-medium font-mono">{duplicate.new_document.reference_number || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{formatDate(duplicate.new_document.document_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Montant TTC:</span>
                                        <span className="font-medium">{formatCurrency(duplicate.new_document.amount_ttc)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Existing Document */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                                <h3 className="font-semibold text-green-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    📄 FACTURE EXISTANTE
                                </h3>
                                <p className="text-xs text-green-700 mt-1">(déjà dans le système)</p>
                            </div>

                            {/* PDF Viewer placeholder */}
                            <div className="bg-gray-100 h-64 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <FileText className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">{duplicate.existing_document.filename}</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-2 bg-white">
                                <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
                                    Informations enregistrées
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Fournisseur:</span>
                                        <span className="font-medium">{duplicate.existing_document.supplier_name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">N° facture:</span>
                                        <span className="font-medium font-mono">{duplicate.existing_document.reference_number || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{formatDate(duplicate.existing_document.document_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Montant TTC:</span>
                                        <span className="font-medium">{formatCurrency(duplicate.existing_document.amount_ttc)}</span>
                                    </div>
                                </div>

                                {duplicate.existing_document.status && (
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-700">
                                                Statut: {duplicate.existing_document.status}
                                            </span>
                                        </div>
                                        {duplicate.existing_document.created_at && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Enregistrée le: {formatDate(duplicate.existing_document.created_at)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium text-yellow-900">
                            <strong>RAISON DU BLOCAGE:</strong> {getReasonLabel(duplicate.detection_reason)}
                        </p>
                    </div>

                    {/* Comparison Table */}
                    {duplicate.comparison && duplicate.comparison.fields && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Comparaison détaillée</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Champ</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nouvelle</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Existante</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Identique?</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {duplicate.comparison.fields.map((field, idx) => (
                                            <tr key={idx} className={field.identical ? "" : "bg-red-50"}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{field.label}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{field.new_value || "-"}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{field.existing_value || "-"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {field.identical ? (
                                                        <span className="text-green-600">✓ Oui</span>
                                                    ) : (
                                                        <span className="text-red-600">✗ Non</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {duplicate.comparison.all_identical && (
                                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                                    <p className="text-sm font-medium text-red-900">
                                        → TOUS LES CHAMPS SONT IDENTIQUES = C'EST UN DOUBLON
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resolution options */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Que voulez-vous faire ?</h3>

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white">
                                <input
                                    type="radio"
                                    name="resolution"
                                    value="rejected"
                                    checked={selectedResolution === "rejected"}
                                    onChange={(e) => setSelectedResolution(e.target.value)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">C'est un doublon → Rejeter la nouvelle facture</p>
                                    <p className="text-sm text-gray-600 mt-1">(la facture existante sera conservée)</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white">
                                <input
                                    type="radio"
                                    name="resolution"
                                    value="kept_both"
                                    checked={selectedResolution === "kept_both"}
                                    onChange={(e) => setSelectedResolution(e.target.value)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Ce n'est PAS un doublon → Conserver les deux</p>
                                    <p className="text-sm text-gray-600 mt-1">Motif obligatoire:</p>
                                    {selectedResolution === "kept_both" && (
                                        <input
                                            type="text"
                                            value={resolutionReason}
                                            onChange={(e) => setResolutionReason(e.target.value)}
                                            placeholder='Ex: "Facture rectificative", "Avoir", etc.'
                                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    )}
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white">
                                <input
                                    type="radio"
                                    name="resolution"
                                    value="replaced"
                                    checked={selectedResolution === "replaced"}
                                    onChange={(e) => setSelectedResolution(e.target.value)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Remplacer l'existante → Utiliser la nouvelle version</p>
                                    <p className="text-sm text-gray-600 mt-1">(l'ancienne sera archivée)</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedResolution || loading}
                        className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Traitement..." : "Confirmer mon choix"}
                    </button>
                </div>
            </div>
        </div>
    );
}
