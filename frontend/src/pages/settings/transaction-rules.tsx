import { useState } from "react";
import Head from "next/head";
import {
    Zap, Plus, Search, MoreVertical, Edit2, Trash2,
    CheckCircle, AlertCircle, Play, Pause, Settings,
    FileText, ArrowRight, Tag, Building2, DollarSign
} from "lucide-react";

interface Rule {
    id: string;
    name: string;
    description: string;
    type: "categorization" | "accounting" | "automation";
    conditions: string[];
    actions: string[];
    isActive: boolean;
    matchCount: number;
    confidence?: number;
    createdAt: string;
}

const mockRules: Rule[] = [
    {
        id: "1",
        name: "Orange Money - Télécommunications",
        description: "Catégorise automatiquement les paiements Orange",
        type: "categorization",
        conditions: ["Libellé contient 'ORANGE'", "Montant < 50000 FCFA"],
        actions: ["Catégorie: Télécommunications", "Compte: 626000"],
        isActive: true,
        matchCount: 45,
        confidence: 0.95,
        createdAt: "2024-01-15",
    },
    {
        id: "2",
        name: "Loyer mensuel",
        description: "Détecte et catégorise les paiements de loyer",
        type: "accounting",
        conditions: ["Libellé contient 'LOYER' ou 'BAIL'", "Récurrent mensuel"],
        actions: ["Compte débit: 613200", "Compte crédit: 401000", "TVA: 0%"],
        isActive: true,
        matchCount: 12,
        confidence: 0.98,
        createdAt: "2024-02-01",
    },
    {
        id: "3",
        name: "Fournitures de bureau",
        description: "Achats de fournitures et consommables",
        type: "categorization",
        conditions: ["Fournisseur: PAPETERIE*", "Montant < 100000 FCFA"],
        actions: ["Catégorie: Fournitures", "Compte: 606400", "TVA: 18%"],
        isActive: false,
        matchCount: 8,
        createdAt: "2024-02-10",
    },
    {
        id: "4",
        name: "Salaires employés",
        description: "Virements de salaire automatiques",
        type: "accounting",
        conditions: ["Type: Virement sortant", "Libellé contient 'SALAIRE'"],
        actions: ["Compte débit: 641000", "Compte crédit: 421000"],
        isActive: true,
        matchCount: 156,
        confidence: 0.99,
        createdAt: "2024-01-01",
    },
];

const typeLabels = {
    categorization: { label: "Catégorisation", color: "bg-blue-100 text-blue-700" },
    accounting: { label: "Comptable", color: "bg-purple-100 text-purple-700" },
    automation: { label: "Automatisation", color: "bg-orange-100 text-orange-700" },
};

export default function TransactionRulesPage() {
    const [rules, setRules] = useState<Rule[]>(mockRules);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    const filteredRules = rules.filter((rule) => {
        const matchesSearch =
            rule.name.toLowerCase().includes(search.toLowerCase()) ||
            rule.description.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === "all" || rule.type === filterType;
        return matchesSearch && matchesType;
    });

    const toggleRule = (ruleId: string) => {
        setRules((prev) =>
            prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
        );
    };

    return (
        <>
            <Head>
                <title>Règles de catégorisation - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Zap className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Règles de catégorisation</h1>
                                    <p className="text-sm text-gray-500">
                                        Automatisez la classification de vos transactions avec l&apos;IA
                                    </p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                                <Plus className="h-4 w-4" />
                                Nouvelle règle
                            </button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{rules.filter((r) => r.isActive).length}</p>
                                        <p className="text-sm text-gray-500">Règles actives</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Tag className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{rules.reduce((sum, r) => sum + r.matchCount, 0)}</p>
                                        <p className="text-sm text-gray-500">Correspondances</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Zap className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">94%</p>
                                        <p className="text-sm text-gray-500">Taux d&apos;automatisation</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">3</p>
                                        <p className="text-sm text-gray-500">À réviser</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Rechercher une règle..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {["all", "categorization", "accounting", "automation"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${filterType === type
                                                    ? "bg-purple-600 text-white"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            {type === "all" ? "Toutes" : typeLabels[type as keyof typeof typeLabels]?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Rules List */}
                        <div className="space-y-4">
                            {filteredRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className={`bg-white rounded-xl border ${rule.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
                                        } p-5 transition-all hover:shadow-md`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeLabels[rule.type].color
                                                    }`}>
                                                    {typeLabels[rule.type].label}
                                                </span>
                                                {rule.confidence && (
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                        {Math.round(rule.confidence * 100)}% confiance
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">{rule.description}</p>

                                            <div className="flex flex-wrap gap-6 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">Conditions</p>
                                                    <div className="space-y-1">
                                                        {rule.conditions.map((cond, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-gray-600">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                {cond}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-gray-300">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">Actions</p>
                                                    <div className="space-y-1">
                                                        {rule.actions.map((action, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-gray-600">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                {action}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">
                                                {rule.matchCount} matchs
                                            </span>
                                            <button
                                                onClick={() => toggleRule(rule.id)}
                                                className={`p-2 rounded-lg transition-colors ${rule.isActive
                                                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                    }`}
                                                title={rule.isActive ? "Désactiver" : "Activer"}
                                            >
                                                {rule.isActive ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredRules.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune règle trouvée</h3>
                                <p className="text-gray-500 mb-4">Créez votre première règle de catégorisation</p>
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                    <Plus className="h-4 w-4" />
                                    Nouvelle règle
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
