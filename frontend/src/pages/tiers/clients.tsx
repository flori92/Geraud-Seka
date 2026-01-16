/**
 * Page Clients - Même structure que Fournisseurs
 * Gestion des clients avec comptes auxiliaires 411XXX
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Plus, Search, Edit2, Trash2, Users, FileText,
    Save, X, AlertCircle, Eye
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Client {
    id: string;
    code: string;
    name: string;
    slug?: string;
    sector?: string;
    nif?: string;
    rccm?: string;
    auxiliary_account_code?: string;  // Compte auxiliaire (411CLI01)
    has_active_rule?: boolean;  // A une règle d'imputation
    default_revenue_account?: string;  // Compte de produit (701, 706)
    default_vat_account?: string;  // Compte TVA (4457)
    default_tax_rate?: number;  // Taux TVA (18)
    default_journal?: string;  // Journal (VTE)
    ocr_keywords?: string[];  // Mots-clés OCR
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    invoice_count?: number;
}

export default function ClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        slug: "",
        sector: "",
        nif: "",
        rccm: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        country: "Bénin",
        create_auxiliary_account: true,
        create_rule: false,
        revenue_account: "",
        vat_account: "4457",
        tax_rate: 18,
        journal_code: "VTE",
        ocr_keywords: ""
    });

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [clients, searchTerm]);

    const fetchClients = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/clients`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setClients(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!searchTerm) {
            setFilteredClients(clients);
            return;
        }

        const filtered = clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.auxiliary_account_code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredClients(filtered);
    };

    const handleSave = async () => {
        if (!formData.name) {
            setError("Nom obligatoire");
            return;
        }

        setSaving(true);
        setError(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const url = editingClient?.id
                ? `${API_BASE_URL}/api/v1/clients/${editingClient.id}`
                : `${API_BASE_URL}/api/v1/clients`;
            
            const method = editingClient?.id ? "PUT" : "POST";

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

            await fetchClients();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;

        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/clients/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression");
            await fetchClients();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erreur lors de la suppression");
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setFormData(client);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setFormData({
            code: "",
            name: "",
            contact_name: "",
            email: "",
            phone: "",
            address: ""
        });
        setError(null);
    };

    const generateAuxiliaryAccount = (name: string) => {
        // Génère automatiquement un compte auxiliaire type 411XXXX
        const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `411${prefix}`;
    };

    return (
        <>
            <Head>
                <title>Clients - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="h-6 w-6 text-[#1e3a5f]" />
                                CLIENTS
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez vos clients et leurs comptes auxiliaires
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Nouveau client
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
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
                        ) : filteredClients.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun client</p>
                                <p className="text-sm mt-1">Créez votre premier client</p>
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
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Règle active
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
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {client.code || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{client.name}</div>
                                                        {client.contact_name && (
                                                            <div className="text-xs text-gray-500">{client.contact_name}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="font-mono text-green-600 font-medium">
                                                    {client.auxiliary_account_code || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                {client.has_active_rule ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✓ Oui
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        ✗ Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {client.invoice_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
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
                                {filteredClients.length} client(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal - Identique à fournisseurs mais pour clients */}
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
                                        {editingClient ? "Modifier le client" : "Nouveau client"}
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
                                            Code client
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code || ""}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="Ex: CLI001"
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
                                                    name
                                                });
                                            }}
                                            placeholder="Ex: Entreprise ABC"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Section: Compte auxiliaire */}
                                {!editingClient && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Compte auxiliaire</h4>
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="checkbox"
                                                id="create_auxiliary_account"
                                                checked={formData.create_auxiliary_account}
                                                onChange={(e) => setFormData({ ...formData, create_auxiliary_account: e.target.checked })}
                                                className="h-4 w-4 text-[#1e3a5f] rounded"
                                            />
                                            <label htmlFor="create_auxiliary_account" className="text-sm text-gray-700">
                                                Créer automatiquement un compte auxiliaire (411XXX)
                                            </label>
                                        </div>
                                        {formData.create_auxiliary_account && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Compte généré:</strong> 411{(formData.code || formData.name.substring(0, 6)).toUpperCase().replace(/\s/g, "")}
                                                </p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Ce compte sera créé dans le plan comptable sous 411 - Clients
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Section: Règle d'imputation */}
                                {!editingClient && (
                                    <div className="border-t pt-4">
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
                                                Créer une règle d'imputation pour les factures de vente
                                            </label>
                                        </div>
                                        {formData.create_rule && (
                                            <div className="space-y-3 pl-7">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Compte de produit *
                                                    </label>
                                                    <select
                                                        value={formData.revenue_account}
                                                        onChange={(e) => setFormData({ ...formData, revenue_account: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="">Sélectionner un compte...</option>
                                                        <option value="701">701 - Ventes de marchandises</option>
                                                        <option value="702">702 - Ventes de produits finis</option>
                                                        <option value="706">706 - Prestations de services</option>
                                                        <option value="707">707 - Produits accessoires</option>
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Compte TVA
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.vat_account}
                                                            onChange={(e) => setFormData({ ...formData, vat_account: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Taux TVA (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.tax_rate}
                                                            onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 18 })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du contact
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contact_name || ""}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        placeholder="Ex: Marie Martin"
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
                                            placeholder="contact@client.com"
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
