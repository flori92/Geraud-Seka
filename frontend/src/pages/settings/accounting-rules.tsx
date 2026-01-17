import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Zap, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
    CheckCircle, XCircle, TrendingUp, FileText, Search,
    AlertCircle, Save, X as XIcon, Info
} from 'lucide-react';
import { PennylaneSidebar } from '@/components/layout/PennylaneSidebar';
import { api } from '@/lib/api';

interface AccountingRule {
    id: string;
    name: string;
    description: string;
    priority: number;
    is_active: boolean;
    auto_apply: boolean;
    confidence_threshold: number;
    conditions: any[];
    actions: any[];
    created_at?: string;
    matched_documents_count?: number;
}

interface RuleStats {
    rule_id: string;
    rule_name: string;
    matched_count: number;
    validated_count: number;
    last_match?: string;
}

export default function AccountingRulesPage() {
    const router = useRouter();
    const [rules, setRules] = useState<AccountingRule[]>([]);
    const [stats, setStats] = useState<RuleStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRule, setEditingRule] = useState<AccountingRule | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 5,
        is_active: true,
        auto_apply: true,
        confidence_threshold: 0.8,
        conditions: [] as any[],
        actions: [] as any[]
    });

    useEffect(() => {
        loadRules();
        loadStats();
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/accounting-rules/rules');
            setRules(response.data);
        } catch (error) {
            console.error('Erreur chargement règles:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await api.get('/accounting-rules/stats');
            setStats(response.data || []);
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    const handleToggleActive = async (ruleId: string, currentState: boolean) => {
        try {
            await api.patch(`/accounting-rules/rules/${ruleId}`, {
                is_active: !currentState
            });
            await loadRules();
        } catch (error) {
            console.error('Erreur toggle règle:', error);
            alert('Erreur lors de la modification');
        }
    };

    const handleDeleteRule = async (ruleId: string, ruleName: string) => {
        if (!confirm(`Supprimer la règle "${ruleName}" ?`)) return;

        try {
            await api.delete(`/accounting-rules/rules/${ruleId}`);
            await loadRules();
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleCreateRule = () => {
        setFormData({
            name: '',
            description: '',
            priority: 5,
            is_active: true,
            auto_apply: true,
            confidence_threshold: 0.8,
            conditions: [],
            actions: []
        });
        setEditingRule(null);
        setShowCreateModal(true);
    };

    const handleEditRule = (rule: AccountingRule) => {
        setFormData({
            name: rule.name,
            description: rule.description,
            priority: rule.priority,
            is_active: rule.is_active,
            auto_apply: rule.auto_apply,
            confidence_threshold: rule.confidence_threshold,
            conditions: rule.conditions || [],
            actions: rule.actions || []
        });
        setEditingRule(rule);
        setShowCreateModal(true);
    };

    const handleSaveRule = async () => {
        if (!formData.name.trim()) {
            alert('Le nom de la règle est requis');
            return;
        }

        setSaving(true);
        try {
            if (editingRule) {
                await api.put(`/accounting-rules/rules/${editingRule.id}`, formData);
            } else {
                await api.post('/accounting-rules/rules', formData);
            }
            setShowCreateModal(false);
            await loadRules();
            await loadStats();
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            alert(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const filteredRules = rules.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeRulesCount = rules.filter(r => r.is_active).length;
    const totalMatches = stats.reduce((sum, s) => sum + s.matched_count, 0);

    return (
        <>
            <Head>
                <title>Règles Comptables - SEKA</title>
            </Head>

            <div className="flex h-screen bg-gray-50">
                <PennylaneSidebar />

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <Zap className="h-7 w-7 text-purple-600" />
                                    Règles Comptables
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Automatisez la validation et la comptabilisation avec des règles intelligentes
                                </p>
                            </div>
                            <button
                                onClick={handleCreateRule}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg transition"
                            >
                                <Plus className="h-5 w-5" />
                                Nouvelle règle
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Total de règles</div>
                            <div className="text-3xl font-bold text-gray-900">{rules.length}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                            <div className="text-sm text-green-700 mb-1">Règles actives</div>
                            <div className="text-3xl font-bold text-green-900">{activeRulesCount}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                            <div className="text-sm text-purple-700 mb-1">Documents traités</div>
                            <div className="text-3xl font-bold text-purple-900">{totalMatches}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                            <div className="text-sm text-blue-700 mb-1">Taux d'automatisation</div>
                            <div className="text-3xl font-bold text-blue-900">
                                {rules.length > 0 ? Math.round((activeRulesCount / rules.length) * 100) : 0}%
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher une règle..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="flex-1 overflow-auto px-6 pb-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-gray-500">Chargement...</div>
                            </div>
                        ) : filteredRules.length === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {searchQuery ? 'Aucune règle trouvée' : 'Aucune règle créée'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {searchQuery
                                        ? 'Essayez avec un autre terme de recherche'
                                        : 'Créez votre première règle pour automatiser votre comptabilité'
                                    }
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={handleCreateRule}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Créer une règle
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredRules.map((rule) => {
                                    const ruleStat = stats.find(s => s.rule_id === rule.id);

                                    return (
                                        <div
                                            key={rule.id}
                                            className={`bg-white rounded-lg border-2 p-5 transition ${rule.is_active
                                                ? 'border-purple-200 hover:border-purple-300'
                                                : 'border-gray-200 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {rule.name}
                                                        </h3>
                                                        {rule.is_active ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                <XCircle className="h-3 w-3" />
                                                                Inactive
                                                            </span>
                                                        )}
                                                        {rule.auto_apply && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                                <Zap className="h-3 w-3" />
                                                                Auto
                                                            </span>
                                                        )}
                                                    </div>

                                                    {rule.description && (
                                                        <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                                                    )}

                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" />
                                                            Priorité: {rule.priority}
                                                        </span>
                                                        {ruleStat && (
                                                            <span className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                {ruleStat.matched_count} document(s) traité(s)
                                                            </span>
                                                        )}
                                                        <span>
                                                            Confiance: {(rule.confidence_threshold * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleToggleActive(rule.id, rule.is_active)}
                                                        className={`p-2 rounded-lg transition ${rule.is_active
                                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                            }`}
                                                        title={rule.is_active ? 'Désactiver' : 'Activer'}
                                                    >
                                                        {rule.is_active ? (
                                                            <ToggleRight className="h-5 w-5" />
                                                        ) : (
                                                            <ToggleLeft className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditRule(rule)}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-purple-600 p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {editingRule ? 'Modifier la règle' : 'Nouvelle règle'}
                                    </h2>
                                    <p className="text-purple-100 mt-1">
                                        Définissez les critères et actions de votre règle
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition"
                                >
                                    <XIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Nom */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de la règle *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: SBEE Petits Montants"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Factures SBEE inférieures à 50 000 FCFA"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priorité
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseFloat(e.target.value) })}
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seuil de confiance
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.confidence_threshold}
                                        onChange={(e) => setFormData({ ...formData, confidence_threshold: parseFloat(e.target.value) })}
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">Règle active</div>
                                        <div className="text-sm text-gray-500">Appliquer cette règle aux nouveaux documents</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.auto_apply}
                                        onChange={(e) => setFormData({ ...formData, auto_apply: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">Application automatique</div>
                                        <div className="text-sm text-gray-500">Valider automatiquement sans confirmation</div>
                                    </div>
                                </label>
                            </div>

                            {/* Info box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <strong>Note:</strong> Les conditions et actions détaillées peuvent être configurées via l'API.
                                    Cette interface permet de gérer le nom, l'activation et les paramètres principaux.
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-200 p-6 flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveRule}
                                disabled={saving || !formData.name.trim()}
                                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        {editingRule ? 'Mettre à jour' : 'Créer la règle'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
