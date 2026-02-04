/**
 * Modal de création rapide de fournisseur avec règle d'imputation
 * Utilisée quand l'OCR détecte un fournisseur inconnu
 */
import { useState, useEffect } from "react";
import { X, Building2, Hash, CreditCard, Percent, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface SupplierSuggestion {
    type: string;
    message: string;
    suggested_name: string;
    suggested_code: string;
    suggested_auxiliary_account: string;
    suggested_ocr_keywords: string[];
    default_charge_account: string | null;
    default_vat_account: string;
    default_tax_rate: number;
}

interface RuleConditionType {
    value: string;
    label: string;
    description: string;
}

interface SupplierQuickCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (supplier: Record<string, unknown>) => void;
    suggestion?: SupplierSuggestion | null;
    supplierName?: string;
}

export default function SupplierQuickCreateModal({
    isOpen,
    onClose,
    onSuccess,
    suggestion,
    supplierName
}: SupplierQuickCreateModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conditionTypes, setConditionTypes] = useState<RuleConditionType[]>([]);
    
    // Formulaire
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        charge_account: "",
        vat_account: "4454",
        tax_rate: 18,
        supplier_account: "",
        ocr_keywords: [] as string[],
        rule_condition_type: "contains",
        create_rule: true,
        nif: "",
        email: "",
        phone: "",
        address: ""
    });

    // Charger les types de conditions
    useEffect(() => {
        const fetchConditionTypes = async () => {
            try {
                const token = localStorage.getItem("seka_access_token");
                const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/rule-condition-types`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setConditionTypes(data);
                }
            } catch (err) {
                console.error("Erreur chargement types conditions:", err);
            }
        };
        
        if (isOpen) {
            fetchConditionTypes();
        }
    }, [isOpen]);

    // Pré-remplir avec la suggestion
    useEffect(() => {
        if (suggestion) {
            setFormData(prev => ({
                ...prev,
                name: suggestion.suggested_name || supplierName || "",
                code: suggestion.suggested_code || "",
                supplier_account: suggestion.suggested_auxiliary_account || "",
                vat_account: suggestion.default_vat_account || "4454",
                tax_rate: suggestion.default_tax_rate || 18,
                ocr_keywords: suggestion.suggested_ocr_keywords || []
            }));
        } else if (supplierName) {
            setFormData(prev => ({
                ...prev,
                name: supplierName
            }));
        }
    }, [suggestion, supplierName]);

    // Générer automatiquement le code et compte auxiliaire
    useEffect(() => {
        if (formData.name) {
            setFormData(prev => {
                // Ne pas écraser si déjà défini manuellement
                if (prev.code) return prev;
                
                const words = formData.name.replace(/[^a-zA-Z\s]/g, '').toUpperCase().split(' ').filter(w => w);
                let code = "";
                if (words.length === 1) {
                    code = words[0].slice(0, 6);
                } else if (words.length === 2) {
                    code = words[0].slice(0, 3) + words[1].slice(0, 3);
                } else {
                    code = words.slice(0, 3).map(w => w[0]).join('') + words[0].slice(1, 3);
                }
                return {
                    ...prev,
                    code: code.slice(0, 8),
                    supplier_account: `401${code.slice(0, 8)}`
                };
            });
        }
    }, [formData.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("seka_access_token");
            const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/quick-create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    ocr_keywords: formData.ocr_keywords.length > 0 
                        ? formData.ocr_keywords 
                        : [formData.name]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erreur lors de la création");
            }

            const data = await response.json();
            onSuccess(data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#1e3a5f] p-6 text-white rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Building2 className="h-6 w-6" />
                                Nouveau Fournisseur
                            </h2>
                            <p className="text-blue-200 text-sm mt-1">
                                Créez le fournisseur et sa règle d&apos;imputation automatique
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Alerte suggestion */}
                {suggestion && (
                    <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800 font-medium">Fournisseur non reconnu</p>
                            <p className="text-xs text-amber-700 mt-0.5">{suggestion.message}</p>
                        </div>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Section Informations de base */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Informations du fournisseur</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom du fournisseur *
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                        placeholder="Ex: SBEE, MTN Bénin..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Code court
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            code: e.target.value.toUpperCase(),
                                            supplier_account: `401${e.target.value.toUpperCase()}`
                                        }))}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent uppercase"
                                        placeholder="SBEE"
                                        maxLength={8}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NIF / IFU
                                </label>
                                <input
                                    type="text"
                                    value={formData.nif}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nif: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                    placeholder="Numéro fiscal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Téléphone
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                    placeholder="+229 XX XX XX XX"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Comptes comptables */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Comptes comptables
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Compte de charge *
                                </label>
                                <input
                                    type="text"
                                    required={formData.create_rule}
                                    value={formData.charge_account}
                                    onChange={(e) => setFormData(prev => ({ ...prev, charge_account: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent font-mono"
                                    placeholder="6061, 6261..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Compte débité (classe 6)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Compte fournisseur
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplier_account}
                                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_account: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent font-mono"
                                    placeholder="401SBEE"
                                />
                                <p className="text-xs text-gray-500 mt-1">Compte auxiliaire crédité</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Compte TVA
                                </label>
                                <input
                                    type="text"
                                    value={formData.vat_account}
                                    onChange={(e) => setFormData(prev => ({ ...prev, vat_account: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent font-mono"
                                    placeholder="4454"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Percent className="inline h-3 w-3 mr-1" />
                                    Taux TVA
                                </label>
                                <select
                                    value={formData.tax_rate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                >
                                    <option value={18}>18% (Standard)</option>
                                    <option value={0}>0% (Exonéré)</option>
                                    <option value={10}>10%</option>
                                    <option value={5}>5%</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section Règle d'imputation */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Règle d&apos;imputation automatique
                            </h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.create_rule}
                                    onChange={(e) => setFormData(prev => ({ ...prev, create_rule: e.target.checked }))}
                                    className="rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                                />
                                <span className="text-sm text-gray-600">Créer une règle</span>
                            </label>
                        </div>

                        {formData.create_rule && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Condition de reconnaissance
                                    </label>
                                    <select
                                        value={formData.rule_condition_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, rule_condition_type: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                    >
                                        {conditionTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {conditionTypes.find(t => t.value === formData.rule_condition_type)?.description || 
                                         "Comment identifier ce fournisseur dans les futures factures"}
                                    </p>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-800">
                                        <strong>Règle créée :</strong> Si le nom fournisseur <em>{formData.rule_condition_type === 'equals' ? 'est égal à' : formData.rule_condition_type === 'contains' ? 'contient' : formData.rule_condition_type === 'starts_with' ? 'commence par' : 'finit par'}</em> &quot;{formData.name || '...'}&quot;, 
                                        alors imputer sur le compte <strong>{formData.charge_account || '...'}</strong> avec TVA sur <strong>{formData.vat_account}</strong>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#1e3a5f] hover:bg-[#172e4d] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Créer le fournisseur
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
