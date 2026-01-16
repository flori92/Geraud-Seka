/**
 * Plan Comptable SYSCOHADA - Version améliorée avec hiérarchie visuelle
 * Conforme aux spécifications client:
 * - Indication visuelle des comptes collectifs (401, 411)
 * - Indentation des comptes auxiliaires (401SBEE sous 401)
 * - Badges de type (Général / Auxiliaire / Collectif)
 * - Filtre par type de compte
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Book, Plus, Search, Eye, Save, X, ChevronRight, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Account {
    code: string;
    name: string;
    type: "class" | "account" | "collective" | "auxiliary";
    parent_code?: string;
    children?: Account[];
}

// Base SYSCOHADA avec indication des comptes collectifs
const SYSCOHADA_BASE: Account[] = [
    {
        code: "4",
        name: "Classe 4 - Comptes de tiers",
        type: "class",
        children: [
            { code: "401", name: "Fournisseurs", type: "collective" },
            { code: "401SBEE", name: "Fournisseur SBEE", type: "auxiliary", parent_code: "401" },
            { code: "401MTN", name: "Fournisseur MTN Bénin", type: "auxiliary", parent_code: "401" },
            { code: "411", name: "Clients", type: "collective" },
            { code: "411CLI01", name: "Client Entreprise ABC", type: "auxiliary", parent_code: "411" },
            { code: "445", name: "TVA", type: "collective" },
            { code: "4452", name: "TVA récupérable sur immobilisations", type: "account", parent_code: "445" },
            { code: "4454", name: "TVA récupérable sur achats", type: "account", parent_code: "445" },
            { code: "4457", name: "TVA collectée", type: "account", parent_code: "445" },
        ]
    },
    {
        code: "6",
        name: "Classe 6 - Comptes de charges",
        type: "class",
        children: [
            { code: "601", name: "Achats de marchandises", type: "account" },
            { code: "6061", name: "Électricité", type: "account" },
            { code: "6062", name: "Eau", type: "account" },
            { code: "6063", name: "Carburants", type: "account" },
            { code: "6261", name: "Télécommunications", type: "account" },
        ]
    },
    {
        code: "7",
        name: "Classe 7 - Comptes de produits",
        type: "class",
        children: [
            { code: "701", name: "Ventes de marchandises", type: "account" },
            { code: "706", name: "Prestations de services", type: "account" },
        ]
    }
];

export default function PlanComptableEnhanced() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>(SYSCOHADA_BASE);
    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["4", "6", "7"]));
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        parent_code: "",
        type: "account"
    });

    // Flatten accounts for display
    const flattenAccounts = (accounts: Account[]): Account[] => {
        const result: Account[] = [];
        accounts.forEach(account => {
            result.push(account);
            if (account.children && expandedNodes.has(account.code)) {
                result.push(...flattenAccounts(account.children));
            }
        });
        return result;
    };

    // Filter accounts
    const filteredAccounts = flattenAccounts(accounts).filter(account => {
        const matchSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchClass = classFilter === "all" || account.code.startsWith(classFilter);
        
        let matchType = true;
        if (typeFilter === "collective") {
            matchType = account.type === "collective";
        } else if (typeFilter === "auxiliary") {
            matchType = account.type === "auxiliary";
        } else if (typeFilter === "general") {
            matchType = account.type === "account";
        }
        
        return matchSearch && matchClass && matchType;
    });

    const toggleNode = (code: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedNodes(newExpanded);
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "class":
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Classe</span>;
            case "collective":
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Collectif</span>;
            case "auxiliary":
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Auxiliaire</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Général</span>;
        }
    };

    const getIndentation = (account: Account) => {
        if (account.type === "auxiliary") return "pl-8";
        if (account.parent_code && account.type === "account") return "pl-8";
        return "";
    };

    return (
        <>
            <Head>
                <title>Plan Comptable - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Book className="h-6 w-6 text-[#1e3a5f]" />
                                Plan Comptable
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Comptes généraux, collectifs et auxiliaires
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
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="all">Toutes les classes</option>
                                <option value="4">Classe 4 - Tiers</option>
                                <option value="6">Classe 6 - Charges</option>
                                <option value="7">Classe 7 - Produits</option>
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="all">Tous types</option>
                                <option value="collective">Comptes collectifs</option>
                                <option value="auxiliary">Comptes auxiliaires</option>
                                <option value="general">Comptes généraux</option>
                            </select>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
                            <span className="text-gray-600 font-medium">Légende:</span>
                            <div className="flex items-center gap-2">
                                {getTypeBadge("collective")}
                                <span className="text-gray-600">= Compte de regroupement (401, 411)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getTypeBadge("auxiliary")}
                                <span className="text-gray-600">= Sous-compte spécifique (401SBEE, 411CLI01)</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Collectif</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAccounts.map((account) => {
                                    const isClass = account.type === "class";
                                    const isAuxiliary = account.type === "auxiliary";
                                    const isCollective = account.type === "collective";
                                    const hasChildren = account.children && account.children.length > 0;
                                    const isExpanded = expandedNodes.has(account.code);
                                    
                                    return (
                                        <tr 
                                            key={account.code}
                                            className={`${
                                                isClass ? 'bg-blue-50 font-semibold' :
                                                isAuxiliary ? 'bg-purple-50/20' :
                                                isCollective ? 'bg-green-50/30' :
                                                'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className={`px-4 py-3 font-mono text-sm ${getIndentation(account)}`}>
                                                <div className="flex items-center gap-2">
                                                    {hasChildren && (
                                                        <button 
                                                            onClick={() => toggleNode(account.code)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                    {isAuxiliary && <span className="text-gray-400">└─</span>}
                                                    <span className={isClass ? "font-bold" : ""}>{account.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {account.name}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getTypeBadge(account.type)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-500">
                                                {isCollective ? "Oui" : account.parent_code || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-blue-600 hover:text-blue-800">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                {filteredAccounts.length} compte(s) affiché(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div 
                            className="fixed inset-0 bg-gray-500 bg-opacity-75"
                            onClick={() => setShowModal(false)}
                        />

                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Nouveau compte</h3>
                                    <button onClick={() => setShowModal(false)}>
                                        <X className="h-5 w-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Code compte *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Ex: 401SBEE"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Libellé *
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
                                        Type de compte *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="account">Général</option>
                                        <option value="auxiliary">Auxiliaire</option>
                                        <option value="collective">Collectif</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compte parent (si auxiliaire)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.parent_code}
                                        onChange={(e) => setFormData({ ...formData, parent_code: e.target.value })}
                                        placeholder="Ex: 401"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Laissez vide si compte général ou collectif
                                    </p>
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
