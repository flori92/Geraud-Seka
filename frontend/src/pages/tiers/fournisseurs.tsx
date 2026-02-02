/**
 * Page Fournisseurs - Conforme cahier des charges client
 * Gestion des fournisseurs avec comptes auxiliaires et règles d'imputation
 * 
 * Logique d'interconnexion SEKA Business:
 * - Chaque fournisseur peut avoir un compte auxiliaire (401SBEE, 401MTN, etc.)
 * - Chaque fournisseur peut avoir une règle d'imputation automatique
 * - La création d'un fournisseur peut automatiquement créer le compte auxiliaire
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Plus, Search, Edit2, Trash2, Building, FileText,
    Save, X, AlertCircle, Eye, CheckCircle, XCircle, Settings
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Supplier {
    id: string;
    code: string;
    name: string;
    nif?: string;
    rccm?: string;
    auxiliary_account_code?: string;  // Compte auxiliaire (401SBEE)
    has_active_rule?: boolean;  // A une règle d'imputation
    default_charge_account?: string;  // Compte de charge (6061)
    default_vat_account?: string;  // Compte TVA (4454)
    default_tax_rate?: number;  // Taux TVA (18)
    default_journal?: string;  // Journal (ACH)
    ocr_keywords?: string[];  // Mots-clés OCR
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    total_orders?: number;
    total_spent?: number;
}

export default function FournisseursPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        code: string;
        name: string;
        nif: string;
        contact_name: string;
        email: string;
        phone: string;
        address: string;
        create_auxiliary_account: boolean;
        create_rule: boolean;
        default_charge_account: string;
        default_vat_account: string;
        default_tax_rate: number;
        ocr_keywords: string;
    }>({
        code: "",
        name: "",
        nif: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        create_auxiliary_account: true,
        create_rule: false,
        default_charge_account: "",
        default_vat_account: "4454",
        default_tax_rate: 18,
        ocr_keywords: ""
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [suppliers, searchTerm]);

    const fetchSuppliers = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSuppliers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!searchTerm) {
            setFilteredSuppliers(suppliers);
            return;
        }

        const filtered = suppliers.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.auxiliary_account_code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSuppliers(filtered);
    };

    const handleSave = async () => {
        if (!formData.name) {
            setError("Le nom est obligatoire");
            return;
        }

        // Si on crée une règle, le compte de charge est obligatoire
        if (formData.create_rule && !formData.default_charge_account) {
            setError("Le compte de charge est obligatoire pour créer une règle");
            return;
        }

        setSaving(true);
        setError(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const url = editingSupplier?.id
                ? `${API_BASE_URL}/api/v1/suppliers/${editingSupplier.id}`
                : `${API_BASE_URL}/api/v1/suppliers/`;
            
            const method = editingSupplier?.id ? "PUT" : "POST";

            // Préparer les données pour l'API
            const payload = {
                name: formData.name,
                code: formData.code || formData.name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''),
                nif: formData.nif,
                contact_name: formData.contact_name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                create_auxiliary_account: formData.create_auxiliary_account,
                create_rule: formData.create_rule,
                default_charge_account: formData.default_charge_account,
                default_vat_account: formData.default_vat_account || "4454",
                default_tax_rate: formData.default_tax_rate || 18,
                ocr_keywords: formData.ocr_keywords 
                    ? formData.ocr_keywords.split(',').map(k => k.trim()).filter(k => k)
                    : [formData.name]
            };

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erreur lors de la sauvegarde");
            }

            await fetchSuppliers();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;

        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression");
            await fetchSuppliers();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erreur lors de la suppression");
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            code: supplier.code || "",
            name: supplier.name || "",
            nif: supplier.nif || "",
            contact_name: supplier.contact_name || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
            create_auxiliary_account: false,  // Ne pas recréer en mode édition
            create_rule: false,
            default_charge_account: supplier.default_charge_account || "",
            default_vat_account: supplier.default_vat_account || "4454",
            default_tax_rate: supplier.default_tax_rate || 18,
            ocr_keywords: supplier.ocr_keywords?.join(", ") || ""
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
        setFormData({
            code: "",
            name: "",
            nif: "",
            contact_name: "",
            email: "",
            phone: "",
            address: "",
            create_auxiliary_account: true,
            create_rule: false,
            default_charge_account: "",
            default_vat_account: "4454",
            default_tax_rate: 18,
            ocr_keywords: ""
        });
        setError(null);
    };

    const generateAuxiliaryCode = (name: string) => {
        // Génère automatiquement un code compte auxiliaire type 401XXXX
        const prefix = name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `401${prefix}`;
    };

    // Comptes de charge courants SYSCOHADA
    const CHARGE_ACCOUNTS = [
        { code: "6061", name: "Électricité" },
        { code: "6062", name: "Eau" },
        { code: "6063", name: "Carburants" },
        { code: "6064", name: "Fournitures de bureau" },
        { code: "6261", name: "Télécommunications" },
        { code: "601", name: "Achats de marchandises" },
        { code: "602", name: "Achats de matières premières" },
        { code: "604", name: "Achats stockés" },
        { code: "605", name: "Autres achats" },
        { code: "627", name: "Services bancaires" },
        { code: "631", name: "Impôts et taxes" },
    ];

    return (
        <>
            <Head>
                <title>Fournisseurs - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Building className="h-6 w-6 text-[#1e3a5f]" />
                                FOURNISSEURS
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez vos fournisseurs et leurs comptes auxiliaires
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Nouveau fournisseur
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un fournisseur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredSuppliers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun fournisseur</p>
                                <p className="text-sm mt-1">Créez votre premier fournisseur</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nom
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compte 401
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compte auxiliaire
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Comptes (Charge/TVA)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut règle
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {supplier.code || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{supplier.name}</div>
                                                        {supplier.contact_name && (
                                                            <div className="text-xs text-gray-500">{supplier.contact_name}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                                                    401
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {supplier.auxiliary_account_code ? (
                                                    <span className="font-mono text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                                        {supplier.auxiliary_account_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs">Non créé</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {supplier.has_active_rule && supplier.default_charge_account ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                                                {supplier.default_charge_account}
                                                            </span>
                                                            <span className="text-gray-400 text-xs">/</span>
                                                            <span className="font-mono text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                                                {supplier.default_vat_account || '4454'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {supplier.has_active_rule ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Créée
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                        <XCircle className="h-3 w-3" />
                                                        Non créée
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(supplier)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/settings/rules?supplier=${supplier.id}`)}
                                                    className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                                                    title="Gérer la règle"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                {filteredSuppliers.length} fournisseur(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div 
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={handleCloseModal}
                        />

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
                                    </h3>
                                    <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                {/* Section: Informations générales */}
                                <div className="border-b pb-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Code fournisseur
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.code || ""}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                placeholder="Ex: SBEE, MTN..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name || ""}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ex: SBEE"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            NIF / IFU
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nif || ""}
                                            onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                            placeholder="Numéro d'identification fiscale"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Section: Compte auxiliaire */}
                                {!editingSupplier && (
                                    <div className="border-b pb-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Compte auxiliaire</h4>
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="checkbox"
                                                id="create_auxiliary"
                                                checked={formData.create_auxiliary_account}
                                                onChange={(e) => setFormData({ ...formData, create_auxiliary_account: e.target.checked })}
                                                className="h-4 w-4 text-[#1e3a5f] rounded"
                                            />
                                            <label htmlFor="create_auxiliary" className="text-sm text-gray-700">
                                                Créer automatiquement un compte auxiliaire
                                            </label>
                                        </div>
                                        {formData.create_auxiliary_account && formData.name && (
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <p className="text-sm text-blue-700">
                                                    Compte généré: <span className="font-mono font-bold">{generateAuxiliaryCode(formData.name)}</span>
                                                </p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Ce compte sera créé dans le plan comptable sous 401 - Fournisseurs
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Section: Règle d'imputation */}
                                {!editingSupplier && (
                                    <div className="border-b pb-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Règle d'imputation</h4>
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="checkbox"
                                                id="create_rule"
                                                checked={formData.create_rule}
                                                onChange={(e) => setFormData({ ...formData, create_rule: e.target.checked })}
                                                className="h-4 w-4 text-[#1e3a5f] rounded"
                                            />
                                            <label htmlFor="create_rule" className="text-sm text-gray-700">
                                                Créer une règle d'imputation automatique
                                            </label>
                                        </div>
                                        {formData.create_rule && (
                                            <div className="space-y-3 pl-7">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Compte de charge *
                                                    </label>
                                                    <select
                                                        value={formData.default_charge_account}
                                                        onChange={(e) => setFormData({ ...formData, default_charge_account: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="">Sélectionner un compte...</option>
                                                        {CHARGE_ACCOUNTS.map(acc => (
                                                            <option key={acc.code} value={acc.code}>
                                                                {acc.code} - {acc.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Compte TVA
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.default_vat_account}
                                                            onChange={(e) => setFormData({ ...formData, default_vat_account: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Taux TVA (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.default_tax_rate}
                                                            onChange={(e) => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 18 })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Mots-clés OCR (séparés par virgule)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.ocr_keywords}
                                                        onChange={(e) => setFormData({ ...formData, ocr_keywords: e.target.value })}
                                                        placeholder="SBEE, Société Béninoise d'Énergie..."
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Ces mots-clés permettent de reconnaître automatiquement les factures
                                                    </p>
                                                </div>
                                                
                                                {/* Aperçu de l'écriture */}
                                                {formData.default_charge_account && (
                                                    <div className="bg-green-50 p-3 rounded-lg mt-3">
                                                        <p className="text-sm font-medium text-green-800 mb-2">Aperçu de l'écriture générée:</p>
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-green-700">
                                                                    <th className="text-left">Compte</th>
                                                                    <th className="text-right">Débit</th>
                                                                    <th className="text-right">Crédit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-green-900 font-mono">
                                                                <tr>
                                                                    <td>{formData.default_charge_account}</td>
                                                                    <td className="text-right">HT</td>
                                                                    <td className="text-right">-</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>{formData.default_vat_account}</td>
                                                                    <td className="text-right">TVA</td>
                                                                    <td className="text-right">-</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>{generateAuxiliaryCode(formData.name || "XXX")}</td>
                                                                    <td className="text-right">-</td>
                                                                    <td className="text-right">TTC</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Section: Contact */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Coordonnées</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom du contact
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.contact_name || ""}
                                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                                placeholder="Ex: Jean Dupont"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email || ""}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="contact@exemple.com"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Téléphone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone || ""}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="+229 XX XX XX XX"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Adresse
                                            </label>
                                            <textarea
                                                value={formData.address || ""}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Adresse complète..."
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Enregistrer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
