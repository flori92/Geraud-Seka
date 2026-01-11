/**
 * Page Fournisseurs - Conforme cahier des charges client
 * Gestion des fournisseurs avec comptes auxiliaires
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Plus, Search, Edit2, Trash2, Building, FileText,
    Save, X, AlertCircle, Eye
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Supplier {
    id: string;
    code: string;
    name: string;
    auxiliary_account: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    invoice_count?: number;
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

    const [formData, setFormData] = useState<Partial<Supplier>>({
        code: "",
        name: "",
        auxiliary_account: "",
        contact_name: "",
        email: "",
        phone: "",
        address: ""
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
            s.auxiliary_account?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSuppliers(filtered);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.auxiliary_account) {
            setError("Nom et compte auxiliaire obligatoires");
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

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
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
        setFormData(supplier);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
        setFormData({
            code: "",
            name: "",
            auxiliary_account: "",
            contact_name: "",
            email: "",
            phone: "",
            address: ""
        });
        setError(null);
    };

    const generateAuxiliaryAccount = (name: string) => {
        // Génère automatiquement un compte auxiliaire type 401XXXX
        const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `401${prefix}`;
    };

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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nom
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compte auxiliaire
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nb factures
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {supplier.code || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="font-mono text-blue-600 font-medium">
                                                    {supplier.auxiliary_account}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {supplier.invoice_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(supplier)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="h-4 w-4" />
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

                            <div className="px-6 py-4 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Code fournisseur
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code || ""}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                setFormData({ 
                                                    ...formData, 
                                                    name,
                                                    auxiliary_account: formData.auxiliary_account || generateAuxiliaryAccount(name)
                                                });
                                            }}
                                            placeholder="Ex: SBEE"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compte auxiliaire (401XXX) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.auxiliary_account || ""}
                                        onChange={(e) => setFormData({ ...formData, auxiliary_account: e.target.value })}
                                        placeholder="Ex: 401SBEE"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Généré automatiquement à partir du nom
                                    </p>
                                </div>

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
