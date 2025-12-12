import { useState, useEffect } from "react";
import Head from "next/head";
import {
    Zap, Plus, Search, Edit2, Trash2,
    CheckCircle, AlertCircle, Play, Pause, ArrowRight, Tag, Loader2, X
} from "lucide-react";
import {
    getAccountingRules,
    deleteAccountingRule,
    toggleAccountingRule,
    createAccountingRule,
    type AccountingRule,
    type AccountingRuleCreate
} from "@/lib/api";

const typeLabels = {
    categorization: { label: "Catégorisation", color: "bg-blue-100 text-blue-700" },
    accounting: { label: "Comptable", color: "bg-purple-100 text-purple-700" },
    automation: { label: "Automatisation", color: "bg-orange-100 text-orange-700" },
};

export default function TransactionRulesPage() {
    const [rules, setRules] = useState<AccountingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newRule, setNewRule] = useState<Partial<AccountingRuleCreate>>({
        name: "",
        description: "",
        conditions: [{ type: "supplier_name", operator: "contains", value: "" }],
        actions: [{ type: "set_account", debit_account: "", credit_account: "" }],
        auto_apply: false,
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                const data = await getAccountingRules(token);
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch rules:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                await toggleAccountingRule(token, ruleId, !currentActive);
                setRules(prev => prev.map(r =>
                    r.id === ruleId ? { ...r, is_active: !currentActive } : r
                ));
            }
        } catch (error) {
            console.error("Failed to toggle rule:", error);
            alert("Erreur lors de la modification de la règle");
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette règle ?")) return;

        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                await deleteAccountingRule(token, ruleId);
                setRules(prev => prev.filter(r => r.id !== ruleId));
            }
        } catch (error) {
            console.error("Failed to delete rule:", error);
            alert("Erreur lors de la suppression de la règle");
        }
    };

    const handleCreateRule = async () => {
        if (!newRule.name || !newRule.conditions?.length || !newRule.actions?.length) {
            alert("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                const created = await createAccountingRule(token, newRule as AccountingRuleCreate);
                setRules(prev => [...prev, created]);
                setShowCreateModal(false);
                setNewRule({
                    name: "",
                    description: "",
                    conditions: [{ type: "supplier_name", operator: "contains", value: "" }],
                    actions: [{ type: "set_account", debit_account: "", credit_account: "" }],
                    auto_apply: false,
                });
            }
        } catch (error) {
            console.error("Failed to create rule:", error);
            alert("Erreur lors de la création de la règle");
        } finally {
            setSaving(false);
        }
    };

    // Helper to determine rule type from conditions/actions
    const getRuleType = (rule: AccountingRule): keyof typeof typeLabels => {
        if (rule.actions?.some(a => a.debit_account && a.credit_account)) return "accounting";
        if (rule.auto_apply) return "automation";
        return "categorization";
    };

    const filteredRules = rules.filter((rule) => {
        const matchesSearch =
            rule.name.toLowerCase().includes(search.toLowerCase()) ||
            rule.description?.toLowerCase().includes(search.toLowerCase());
        const ruleType = getRuleType(rule);
        const matchesType = filterType === "all" || ruleType === filterType;
        return matchesSearch && matchesType;
    });

    const activeRulesCount = rules.filter(r => r.is_active).length;
    const totalMatches = rules.reduce((sum, r) => sum + (r.match_count || 0), 0);
    const automationRate = rules.length > 0
        ? Math.round((rules.filter(r => r.auto_apply).length / rules.length) * 100)
        : 0;

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
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                            >
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
                                        <p className="text-2xl font-bold">{activeRulesCount}</p>
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
                                        <p className="text-2xl font-bold">{totalMatches}</p>
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
                                        <p className="text-2xl font-bold">{automationRate}%</p>
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
                                        <p className="text-2xl font-bold">{rules.filter(r => !r.is_active).length}</p>
                                        <p className="text-sm text-gray-500">Inactives</p>
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
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredRules.map((rule) => {
                                    const ruleType = getRuleType(rule);
                                    return (
                                        <div
                                            key={rule.id}
                                            className={`bg-white rounded-xl border ${rule.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
                                                } p-5 transition-all hover:shadow-md`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeLabels[ruleType].color}`}>
                                                            {typeLabels[ruleType].label}
                                                        </span>
                                                        {rule.confidence_threshold && (
                                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                                {Math.round(rule.confidence_threshold * 100)}% confiance
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-4">{rule.description || "Pas de description"}</p>

                                                    <div className="flex flex-wrap gap-6 text-sm">
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-1">Conditions</p>
                                                            <div className="space-y-1">
                                                                {rule.conditions?.map((cond, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 text-gray-600">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                        {cond.type} {cond.operator} &quot;{cond.value}&quot;
                                                                    </div>
                                                                )) || <span className="text-gray-400">Aucune condition</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center text-gray-300">
                                                            <ArrowRight className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-1">Actions</p>
                                                            <div className="space-y-1">
                                                                {rule.actions?.map((action, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 text-gray-600">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                        {action.debit_account && `Débit: ${action.debit_account}`}
                                                                        {action.credit_account && ` / Crédit: ${action.credit_account}`}
                                                                        {action.vat_rate !== undefined && ` (TVA: ${action.vat_rate}%)`}
                                                                    </div>
                                                                )) || <span className="text-gray-400">Aucune action</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">
                                                        {rule.match_count || 0} matchs
                                                    </span>
                                                    <button
                                                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                                                        className={`p-2 rounded-lg transition-colors ${rule.is_active
                                                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                            }`}
                                                        title={rule.is_active ? "Désactiver" : "Activer"}
                                                    >
                                                        {rule.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && filteredRules.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune règle trouvée</h3>
                                <p className="text-gray-500 mb-4">Créez votre première règle de catégorisation</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle règle
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Rule Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Nouvelle règle de catégorisation</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la règle *</label>
                                <input
                                    type="text"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Factures Orange"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newRule.description || ""}
                                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Description optionnelle..."
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={newRule.conditions?.[0]?.type || "supplier_name"}
                                        onChange={(e) => setNewRule({
                                            ...newRule,
                                            conditions: [{ ...newRule.conditions?.[0], type: e.target.value } as any]
                                        })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="supplier_name">Fournisseur</option>
                                        <option value="amount">Montant</option>
                                        <option value="description">Libellé</option>
                                        <option value="reference">Référence</option>
                                    </select>
                                    <select
                                        value={newRule.conditions?.[0]?.operator || "contains"}
                                        onChange={(e) => setNewRule({
                                            ...newRule,
                                            conditions: [{ ...newRule.conditions?.[0], operator: e.target.value } as any]
                                        })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="contains">Contient</option>
                                        <option value="equals">Égal à</option>
                                        <option value="starts_with">Commence par</option>
                                        <option value="greater_than">Supérieur à</option>
                                        <option value="less_than">Inférieur à</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={newRule.conditions?.[0]?.value || ""}
                                        onChange={(e) => setNewRule({
                                            ...newRule,
                                            conditions: [{ ...newRule.conditions?.[0], value: e.target.value } as any]
                                        })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Valeur"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Action comptable</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={newRule.actions?.[0]?.debit_account || ""}
                                        onChange={(e) => setNewRule({
                                            ...newRule,
                                            actions: [{ ...newRule.actions?.[0], type: "set_account", debit_account: e.target.value } as any]
                                        })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Compte débit (ex: 606100)"
                                    />
                                    <input
                                        type="text"
                                        value={newRule.actions?.[0]?.credit_account || ""}
                                        onChange={(e) => setNewRule({
                                            ...newRule,
                                            actions: [{ ...newRule.actions?.[0], type: "set_account", credit_account: e.target.value } as any]
                                        })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Compte crédit (ex: 401000)"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="auto_apply"
                                    checked={newRule.auto_apply || false}
                                    onChange={(e) => setNewRule({ ...newRule, auto_apply: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <label htmlFor="auto_apply" className="text-sm text-gray-700">
                                    Appliquer automatiquement cette règle
                                </label>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateRule}
                                disabled={saving || !newRule.name}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Créer la règle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
