/**
 * Plan Comptable SYSCOHADA - Conforme cahier des charges client
 * 
 * Fonctionnalités:
 * - Chargement depuis l'API /accounting/chart-of-accounts
 * - Indication visuelle des comptes collectifs (401, 411)
 * - Indentation des comptes auxiliaires (401SBEE sous 401)
 * - Badges de type (Général / Auxiliaire / Collectif)
 * - Filtre par type et classe de compte
 * - Création de nouveaux comptes
 * - Initialisation du plan SYSCOHADA si vide
 */
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Book, Plus, Search, Eye, Save, X, ChevronRight, ChevronDown,
    RefreshCw, Loader2, AlertCircle, Building, Users, Zap
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Account {
    id: string;
    code: string;
    name: string;
    description?: string;
    account_class: string;
    account_type: string;
    balance: number;
    is_collective: boolean;
    is_auxiliary: boolean;
    collective_parent_code?: string;
    linked_supplier_id?: string;
    linked_client_id?: string;
    parent_id?: string;
    level: number;
}

const ACCOUNT_TYPES = {
    asset: "Actif",
    liability: "Passif",
    equity: "Capitaux",
    revenue: "Produit",
    expense: "Charge"
};

export default function PlanComptablePage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set(["4", "5", "6", "7"]));
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        account_class: "6",
        account_type: "expense",
        parent_code: "",
        is_collective: false,
        is_auxiliary: false,
        collective_parent_code: ""
    });
    const [saving, setSaving] = useState(false);

    const fetchAccounts = useCallback(async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/chart-of-accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Erreur lors du chargement du plan comptable");
            }

            const data = await response.json();
            setAccounts(data);
            
            // Si le plan comptable est vide, proposer l'initialisation
            if (data.length === 0) {
                setError("Plan comptable vide. Cliquez sur 'Initialiser SYSCOHADA' pour créer les comptes de base.");
            }
        } catch (err) {
            console.error("Erreur:", err);
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const initializeSYSCOHADA = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/chart-of-accounts/initialize`, {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'initialisation");
            }

            const result = await response.json();
            alert(`✅ ${result.message} - ${result.created || result.count} comptes`);
            fetchAccounts();
        } catch (err) {
            alert("❌ Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"));
        } finally {
            setSaving(false);
        }
    };

    const createAccount = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        if (!formData.code || !formData.name) {
            alert("Code et nom sont obligatoires");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/chart-of-accounts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Erreur lors de la création");
            }

            const result = await response.json();
            alert(`✅ Compte ${result.code} créé avec succès`);
            setShowModal(false);
            setFormData({
                code: "",
                name: "",
                description: "",
                account_class: "6",
                account_type: "expense",
                parent_code: "",
                is_collective: false,
                is_auxiliary: false,
                collective_parent_code: ""
            });
            fetchAccounts();
        } catch (err) {
            alert("❌ Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"));
        } finally {
            setSaving(false);
        }
    };

    // Organiser les comptes par classe et hiérarchie
    const organizeAccounts = () => {
        const classes: { [key: string]: Account[] } = {};
        
        accounts.forEach(account => {
            const accountClass = account.account_class || account.code.charAt(0);
            if (!classes[accountClass]) {
                classes[accountClass] = [];
            }
            classes[accountClass].push(account);
        });

        // Trier chaque classe par code
        Object.keys(classes).forEach(key => {
            classes[key].sort((a, b) => a.code.localeCompare(b.code));
        });

        return classes;
    };

    // Filtrer les comptes
    const filterAccounts = (accountList: Account[]) => {
        return accountList.filter(account => {
            const matchSearch = 
                account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.code.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchType = true;
            if (typeFilter === "collective") matchType = account.is_collective;
            else if (typeFilter === "auxiliary") matchType = account.is_auxiliary;
            else if (typeFilter === "general") matchType = !account.is_collective && !account.is_auxiliary;

            return matchSearch && matchType;
        });
    };

    const toggleClass = (classCode: string) => {
        const newExpanded = new Set(expandedClasses);
        if (newExpanded.has(classCode)) {
            newExpanded.delete(classCode);
        } else {
            newExpanded.add(classCode);
        }
        setExpandedClasses(newExpanded);
    };

    const getTypeBadge = (account: Account) => {
        if (account.is_collective) {
            return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Collectif</span>;
        }
        if (account.is_auxiliary) {
            return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Auxiliaire</span>;
        }
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Général</span>;
    };

    const getAccountIcon = (account: Account) => {
        if (account.is_collective) return <Users className="w-4 h-4 text-green-600" />;
        if (account.is_auxiliary) return <Building className="w-4 h-4 text-purple-600" />;
        return <Book className="w-4 h-4 text-gray-500" />;
    };

    const organizedAccounts = organizeAccounts();
    const classNames: { [key: string]: string } = {
        "1": "Classe 1 - Ressources durables",
        "2": "Classe 2 - Actif immobilisé",
        "3": "Classe 3 - Stocks",
        "4": "Classe 4 - Tiers",
        "5": "Classe 5 - Trésorerie",
        "6": "Classe 6 - Charges",
        "7": "Classe 7 - Produits",
        "8": "Classe 8 - Comptes spéciaux"
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Plan Comptable SYSCOHADA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Book className="w-7 h-7 text-[#1e3a5f]" />
                                Plan Comptable
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Structure des comptes SYSCOHADA avec comptes auxiliaires
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchAccounts}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                title="Rafraîchir"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            {accounts.length === 0 && (
                                <button
                                    onClick={initializeSYSCOHADA}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Zap className="w-4 h-4" />
                                    Initialiser SYSCOHADA
                                </button>
                            )}
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8f]"
                            >
                                <Plus className="w-4 h-4" />
                                Nouveau compte
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par code ou libellé..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                            >
                                <option value="all">Toutes les classes</option>
                                {Object.keys(classNames).map(c => (
                                    <option key={c} value={c}>Classe {c}</option>
                                ))}
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                            >
                                <option value="all">Tous les types</option>
                                <option value="collective">Collectifs (401, 411)</option>
                                <option value="auxiliary">Auxiliaires (401SBEE)</option>
                                <option value="general">Généraux</option>
                            </select>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <span className="text-yellow-800">{error}</span>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
                            <p className="text-sm text-gray-600">Total comptes</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <p className="text-2xl font-bold text-green-600">
                                {accounts.filter(a => a.is_collective).length}
                            </p>
                            <p className="text-sm text-gray-600">Collectifs</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <p className="text-2xl font-bold text-purple-600">
                                {accounts.filter(a => a.is_auxiliary).length}
                            </p>
                            <p className="text-sm text-gray-600">Auxiliaires</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <p className="text-2xl font-bold text-gray-600">
                                {accounts.filter(a => !a.is_collective && !a.is_auxiliary).length}
                            </p>
                            <p className="text-sm text-gray-600">Généraux</p>
                        </div>
                    </div>

                    {/* Accounts List */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {Object.entries(organizedAccounts)
                            .filter(([classCode]) => classFilter === "all" || classFilter === classCode)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([classCode, classAccounts]) => {
                                const filteredAccounts = filterAccounts(classAccounts);
                                if (filteredAccounts.length === 0 && searchTerm) return null;
                                
                                return (
                                    <div key={classCode} className="border-b border-gray-200 last:border-b-0">
                                        {/* Class Header */}
                                        <button
                                            onClick={() => toggleClass(classCode)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {expandedClasses.has(classCode) ? (
                                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                                )}
                                                <span className="font-semibold text-gray-900">
                                                    {classNames[classCode] || `Classe ${classCode}`}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {filteredAccounts.length} comptes
                                            </span>
                                        </button>

                                        {/* Class Accounts */}
                                        {expandedClasses.has(classCode) && (
                                            <div className="divide-y divide-gray-100">
                                                {filteredAccounts.map(account => (
                                                    <div
                                                        key={account.id}
                                                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                                                            account.is_auxiliary ? "pl-12 bg-purple-50/30" : ""
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {getAccountIcon(account)}
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-medium text-gray-900">
                                                                        {account.code}
                                                                    </span>
                                                                    {getTypeBadge(account)}
                                                                </div>
                                                                <p className="text-sm text-gray-600">
                                                                    {account.name}
                                                                    {account.collective_parent_code && (
                                                                        <span className="text-purple-600 ml-2">
                                                                            (sous {account.collective_parent_code})
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className={`text-sm font-medium ${
                                                                account.balance >= 0 ? "text-gray-900" : "text-red-600"
                                                            }`}>
                                                                {account.balance.toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                            <button
                                                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                                                title="Voir détails"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Modal Création de compte */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Nouveau compte</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Code du compte *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        placeholder="Ex: 6065"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Classe
                                    </label>
                                    <select
                                        value={formData.account_class}
                                        onChange={(e) => setFormData({...formData, account_class: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        {Object.entries(classNames).map(([code, name]) => (
                                            <option key={code} value={code}>{code} - {name.split(" - ")[1]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Libellé *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Internet et abonnements"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de compte
                                </label>
                                <select
                                    value={formData.account_type}
                                    onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_collective}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            is_collective: e.target.checked,
                                            is_auxiliary: e.target.checked ? false : formData.is_auxiliary
                                        })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">Compte collectif</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_auxiliary}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            is_auxiliary: e.target.checked,
                                            is_collective: e.target.checked ? false : formData.is_collective
                                        })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">Compte auxiliaire</span>
                                </label>
                            </div>

                            {formData.is_auxiliary && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compte collectif parent
                                    </label>
                                    <select
                                        value={formData.collective_parent_code}
                                        onChange={(e) => setFormData({...formData, collective_parent_code: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="401">401 - Fournisseurs</option>
                                        <option value="411">411 - Clients</option>
                                        <option value="512">512 - Banques</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optionnel)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={createAccount}
                                disabled={saving || !formData.code || !formData.name}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8f] disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Créer le compte
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
