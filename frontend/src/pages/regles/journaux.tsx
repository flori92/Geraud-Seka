/**
 * Page Gestion des Journaux Comptables
 * ACH, VEN, OD, BQ, CAI...
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Plus, Search, Edit2, Trash2, BookOpen, Save, X, AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Journal {
    id?: string;
    code: string;
    name: string;
    type: "ACH" | "VEN" | "BQ" | "CAI" | "OD";
    is_default?: boolean;
}

const DEFAULT_JOURNALS: Journal[] = [
    { code: "ACH", name: "Journal des achats", type: "ACH", is_default: true },
    { code: "VEN", name: "Journal des ventes", type: "VEN", is_default: true },
    { code: "BQ", name: "Journal de banque", type: "BQ", is_default: true },
    { code: "CAI", name: "Journal de caisse", type: "CAI", is_default: true },
    { code: "OD", name: "Journal des opérations diverses", type: "OD", is_default: true },
];

export default function JournauxPage() {
    const router = useRouter();
    const [journals, setJournals] = useState<Journal[]>(DEFAULT_JOURNALS);
    const [filteredJournals, setFilteredJournals] = useState<Journal[]>(DEFAULT_JOURNALS);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Journal>>({
        code: "",
        name: "",
        type: "OD"
    });

    useEffect(() => {
        fetchJournals();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [journals, searchTerm]);

    const fetchJournals = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/journals`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Merge with defaults
                const customJournals = Array.isArray(data) ? data : [];
                const merged = [...DEFAULT_JOURNALS, ...customJournals];
                setJournals(merged);
            }
        } catch (error) {
            console.error("Error fetching journals:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!searchTerm) {
            setFilteredJournals(journals);
            return;
        }

        const filtered = journals.filter(j =>
            j.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredJournals(filtered);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.name) {
            setError("Code et nom obligatoires");
            return;
        }

        setSaving(true);
        setError(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const url = editingJournal?.id
                ? `${API_BASE_URL}/api/v1/accounting/journals/${editingJournal.id}`
                : `${API_BASE_URL}/api/v1/accounting/journals`;
            
            const method = editingJournal?.id ? "PUT" : "POST";

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

            await fetchJournals();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce journal ?")) return;

        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/journals/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression");
            await fetchJournals();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erreur lors de la suppression");
        }
    };

    const handleEdit = (journal: Journal) => {
        setEditingJournal(journal);
        setFormData(journal);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingJournal(null);
        setFormData({
            code: "",
            name: "",
            type: "OD"
        });
        setError(null);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            ACH: "Achats",
            VEN: "Ventes",
            BQ: "Banque",
            CAI: "Caisse",
            OD: "Opérations Diverses"
        };
        return labels[type] || type;
    };

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            ACH: "bg-red-100 text-red-800",
            VEN: "bg-green-100 text-green-800",
            BQ: "bg-blue-100 text-blue-800",
            CAI: "bg-yellow-100 text-yellow-800",
            OD: "bg-gray-100 text-gray-800"
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    return (
        <>
            <Head>
                <title>Journaux Comptables - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-[#1e3a5f]" />
                                JOURNAUX COMPTABLES
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez les journaux de votre comptabilité
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Nouveau journal
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">Journaux obligatoires</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Les 5 journaux principaux (ACH, VEN, BQ, CAI, OD) sont créés par défaut. 
                                    Vous pouvez ajouter des journaux personnalisés selon vos besoins.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un journal..."
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
                        ) : filteredJournals.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun journal</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Libellé
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredJournals.map((journal, index) => (
                                        <tr key={journal.id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm font-bold text-gray-900">
                                                    {journal.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-gray-400" />
                                                    <span>{journal.name}</span>
                                                    {journal.is_default && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            Par défaut
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(journal.type)}`}>
                                                    {getTypeLabel(journal.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(journal)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                    title="Modifier"
                                                    disabled={journal.is_default}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => journal.id && handleDelete(journal.id)}
                                                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Supprimer"
                                                    disabled={journal.is_default}
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
                                {filteredJournals.length} journal(aux)
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
                                        {editingJournal ? "Modifier le journal" : "Nouveau journal"}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code || ""}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="Ex: DIV, IMM..."
                                        maxLength={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        3-4 caractères majuscules
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Libellé *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Journal des immobilisations"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={formData.type || "OD"}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="ACH">Achats</option>
                                        <option value="VEN">Ventes</option>
                                        <option value="BQ">Banque</option>
                                        <option value="CAI">Caisse</option>
                                        <option value="OD">Opérations Diverses</option>
                                    </select>
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
