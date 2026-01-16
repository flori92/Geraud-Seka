/**
 * Page Plan Comptable SYSCOHADA
 * Vue en arbre des classes 1-7 avec possibilité d'ajouter des comptes personnalisés
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Plus, Search, Edit2, Trash2, ChevronRight, ChevronDown,
    Book, FolderOpen, Folder, AlertCircle, Save, X
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Account {
    code: string;
    name: string;
    type: "class" | "account" | "auxiliary";
    parent_code?: string;
    is_custom?: boolean;
    children?: Account[];
}

const SYSCOHADA_BASE: Account[] = [
    {
        code: "1",
        name: "Classe 1 - Comptes de capitaux",
        type: "class",
        children: [
            { code: "10", name: "Capital", type: "account" },
            { code: "11", name: "Réserves", type: "account" },
            { code: "12", name: "Report à nouveau", type: "account" },
            { code: "13", name: "Résultat net de l'exercice", type: "account" },
            { code: "14", name: "Subventions d'investissement", type: "account" },
            { code: "16", name: "Emprunts et dettes assimilées", type: "account" },
        ]
    },
    {
        code: "2",
        name: "Classe 2 - Comptes d'immobilisations",
        type: "class",
        children: [
            { code: "21", name: "Immobilisations incorporelles", type: "account" },
            { code: "22", name: "Terrains", type: "account" },
            { code: "23", name: "Bâtiments", type: "account" },
            { code: "24", name: "Matériel", type: "account" },
            { code: "2183", name: "Matériel informatique", type: "account" },
        ]
    },
    {
        code: "3",
        name: "Classe 3 - Comptes de stocks",
        type: "class",
        children: [
            { code: "31", name: "Marchandises", type: "account" },
            { code: "32", name: "Matières premières", type: "account" },
            { code: "33", name: "Autres approvisionnements", type: "account" },
            { code: "35", name: "Produits finis", type: "account" },
        ]
    },
    {
        code: "4",
        name: "Classe 4 - Comptes de tiers",
        type: "class",
        children: [
            { code: "401", name: "Fournisseurs", type: "account" },
            { code: "411", name: "Clients", type: "account" },
            { code: "421", name: "Personnel", type: "account" },
            { code: "431", name: "Sécurité sociale", type: "account" },
            { code: "445", name: "TVA", type: "account", children: [
                { code: "4452", name: "TVA récupérable sur immobilisations", type: "account" },
                { code: "4454", name: "TVA récupérable sur achats", type: "account" },
                { code: "4457", name: "TVA collectée", type: "account" },
            ]},
        ]
    },
    {
        code: "5",
        name: "Classe 5 - Comptes de trésorerie",
        type: "class",
        children: [
            { code: "521", name: "Banques", type: "account" },
            { code: "531", name: "Chèques postaux", type: "account" },
            { code: "571", name: "Caisse", type: "account" },
        ]
    },
    {
        code: "6",
        name: "Classe 6 - Comptes de charges",
        type: "class",
        children: [
            { code: "601", name: "Achats de marchandises", type: "account" },
            { code: "602", name: "Achats de matières premières", type: "account" },
            { code: "604", name: "Achats stockés de matières et fournitures", type: "account" },
            { code: "605", name: "Autres achats", type: "account" },
            { code: "6061", name: "Électricité", type: "account" },
            { code: "6062", name: "Eau", type: "account" },
            { code: "6063", name: "Carburants", type: "account" },
            { code: "6064", name: "Fournitures de bureau", type: "account" },
            { code: "6261", name: "Télécommunications", type: "account" },
            { code: "627", name: "Services bancaires", type: "account" },
            { code: "631", name: "Impôts et taxes", type: "account" },
            { code: "641", name: "Rémunérations du personnel", type: "account" },
            { code: "645", name: "Charges sociales", type: "account" },
        ]
    },
    {
        code: "7",
        name: "Classe 7 - Comptes de produits",
        type: "class",
        children: [
            { code: "701", name: "Ventes de marchandises", type: "account" },
            { code: "702", name: "Ventes de produits finis", type: "account" },
            { code: "704", name: "Travaux", type: "account" },
            { code: "706", name: "Prestations de services", type: "account" },
            { code: "707", name: "Produits accessoires", type: "account" },
        ]
    }
];

export default function PlanComptablePage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>(SYSCOHADA_BASE);
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>(SYSCOHADA_BASE);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["4", "6", "7"]));
    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        parent_code: ""
    });

    useEffect(() => {
        fetchCustomAccounts();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [accounts, searchTerm, classFilter]);

    const fetchCustomAccounts = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const customAccounts = await response.json();
                // Merge with SYSCOHADA base
                const merged = [...SYSCOHADA_BASE];
                // TODO: Insert custom accounts in the right place
                setAccounts(merged);
            }
        } catch (error) {
            console.error("Error fetching custom accounts:", error);
        }
    };

    const applyFilters = () => {
        let filtered = [...accounts];

        if (classFilter !== "all") {
            filtered = filtered.filter(a => a.code === classFilter);
        }

        if (searchTerm) {
            // Recursive search
            filtered = filterRecursive(filtered, searchTerm.toLowerCase());
        }

        setFilteredAccounts(filtered);
    };

    const filterRecursive = (nodes: Account[], term: string): Account[] => {
        return nodes.map(node => {
            const matches = node.code.toLowerCase().includes(term) || 
                          node.name.toLowerCase().includes(term);
            
            if (node.children) {
                const filteredChildren = filterRecursive(node.children, term);
                if (matches || filteredChildren.length > 0) {
                    return { ...node, children: filteredChildren };
                }
            }
            
            return matches ? node : null;
        }).filter(Boolean) as Account[];
    };

    const toggleNode = (code: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedNodes(newExpanded);
    };

    const handleAddAccount = async () => {
        if (!formData.code || !formData.name) {
            setError("Code et nom obligatoires");
            return;
        }

        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error("Erreur lors de la création");

            await fetchCustomAccounts();
            setShowModal(false);
            setFormData({ code: "", name: "", parent_code: "" });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const renderAccount = (account: Account, level: number = 0) => {
        const isExpanded = expandedNodes.has(account.code);
        const hasChildren = account.children && account.children.length > 0;
        const indent = level * 24;

        return (
            <div key={account.code}>
                <div 
                    className="flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer"
                    style={{ paddingLeft: `${indent + 16}px` }}
                    onClick={() => hasChildren && toggleNode(account.code)}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                        )
                    ) : (
                        <div className="w-4 h-4 mr-2" />
                    )}

                    {account.type === "class" ? (
                        <Folder className="h-4 w-4 text-blue-500 mr-2" />
                    ) : (
                        <Book className="h-4 w-4 text-gray-400 mr-2" />
                    )}

                    <span className={`font-mono text-sm ${account.type === "class" ? "font-bold text-gray-900" : "text-gray-700"}`}>
                        {account.code}
                    </span>

                    <span className={`ml-3 text-sm ${account.type === "class" ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                        {account.name}
                    </span>

                    {account.is_custom && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Personnalisé
                        </span>
                    )}
                </div>

                {isExpanded && hasChildren && (
                    <div>
                        {account.children!.map(child => renderAccount(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head>
                <title>Plan Comptable SYSCOHADA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Book className="h-6 w-6 text-[#1e3a5f]" />
                                PLAN COMPTABLE SYSCOHADA
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Classes 1 à 7 + comptes personnalisés
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Nouveau compte
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un compte..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                />
                            </div>

                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                            >
                                <option value="all">Toutes les classes</option>
                                <option value="1">Classe 1 - Capitaux</option>
                                <option value="2">Classe 2 - Immobilisations</option>
                                <option value="3">Classe 3 - Stocks</option>
                                <option value="4">Classe 4 - Tiers</option>
                                <option value="5">Classe 5 - Trésorerie</option>
                                <option value="6">Classe 6 - Charges</option>
                                <option value="7">Classe 7 - Produits</option>
                            </select>
                        </div>
                    </div>

                    {/* Tree View */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="max-h-[600px] overflow-y-auto">
                            {filteredAccounts.map(account => renderAccount(account))}
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                Plan comptable SYSCOHADA (Système Comptable OHADA)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add Account */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div 
                            className="fixed inset-0 bg-gray-500 bg-opacity-75"
                            onClick={() => setShowModal(false)}
                        />

                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="px-6 py-4 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Nouveau compte personnalisé</h3>
                                    <button onClick={() => setShowModal(false)}>
                                        <X className="h-5 w-5 text-gray-400" />
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
                                        Code compte *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Ex: 401SBEE, 411CLI001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du compte *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Fournisseur SBEE"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compte parent (optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.parent_code}
                                        onChange={(e) => setFormData({ ...formData, parent_code: e.target.value })}
                                        placeholder="Ex: 401"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAddAccount}
                                    className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Créer le compte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
