/**
 * Page Règles Conditionnelles Avancées
 * 
 * Permet de créer des règles basées sur:
 * - Le montant (>, <, entre X et Y)
 * - La période (factures mensuelles récurrentes)
 * - La description (contient un mot)
 * - La date
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Plus, Settings, Trash2, Edit2, CheckCircle, XCircle,
    AlertCircle, Zap, Filter, DollarSign, Calendar, FileText,
    ChevronDown, ChevronUp, Save, X, Eye
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ConditionType {
    type: string;
    name: string;
    description: string;
    parameters: string[];
}

interface Condition {
    type: string;
    value?: number;
    min_value?: number;
    max_value?: number;
    start_date?: string;
    end_date?: string;
    expected_amount?: number;
    tolerance_percent?: number;
}

interface Action {
    type: string;
    debit_account?: string;
    credit_account?: string;
    vat_account?: string;
    vat_rate?: number;
}

interface ConditionalRule {
    id: string;
    name: string;
    description: string;
    priority: number;
    conditions: Condition[];
    actions: Action[];
    is_active: boolean;
}

interface Supplier {
    id: string;
    name: string;
    code: string;
    has_active_rule: boolean;
}

const CONDITION_TYPES: ConditionType[] = [
    {
        type: 'amount_greater',
        name: 'Montant supérieur à',
        description: "S'applique si le montant TTC dépasse la valeur",
        parameters: ['value']
    },
    {
        type: 'amount_less',
        name: 'Montant inférieur à',
        description: "S'applique si le montant TTC est en dessous de la valeur",
        parameters: ['value']
    },
    {
        type: 'amount_between',
        name: 'Montant entre',
        description: "S'applique si le montant TTC est compris entre min et max",
        parameters: ['min_value', 'max_value']
    },
    {
        type: 'period_monthly',
        name: 'Facture mensuelle récurrente',
        description: "Détecte les factures mensuelles avec montant fixe (ex: loyer, abonnement)",
        parameters: ['expected_amount', 'tolerance_percent']
    },
    {
        type: 'description_contains',
        name: 'Description contient',
        description: "S'applique si la description de la facture contient un mot spécifique",
        parameters: ['value']
    }
];

export default function ConditionnellesPage() {
    const router = useRouter();
    const [rules, setRules] = useState<ConditionalRule[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRule, setExpandedRule] = useState<string | null>(null);
    
    // Form state
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [ruleName, setRuleName] = useState('');
    const [priority, setPriority] = useState(10);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [actions, setActions] = useState<Action[]>([{
        type: 'assign_account',
        debit_account: '',
        vat_account: '4454',
        vat_rate: 18
    }]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('seka_access_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const [rulesRes, suppliersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/rules-advanced/conditional-rules`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/suppliers/`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (rulesRes.ok) {
                setRules(await rulesRes.json());
            }
            if (suppliersRes.ok) {
                setSuppliers(await suppliersRes.json());
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCondition = (type: string) => {
        const newCondition: Condition = { type };
        
        if (type === 'amount_greater' || type === 'amount_less') {
            newCondition.value = 0;
        } else if (type === 'amount_between') {
            newCondition.min_value = 0;
            newCondition.max_value = 0;
        } else if (type === 'period_monthly') {
            newCondition.expected_amount = 0;
            newCondition.tolerance_percent = 5;
        }
        
        setConditions([...conditions, newCondition]);
    };

    const handleUpdateCondition = (index: number, field: string, value: any) => {
        const updated = [...conditions];
        (updated[index] as any)[field] = value;
        setConditions(updated);
    };

    const handleRemoveCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!selectedSupplier) {
            setError('Veuillez sélectionner un fournisseur');
            return;
        }
        if (conditions.length === 0) {
            setError('Ajoutez au moins une condition');
            return;
        }
        if (!actions[0].debit_account) {
            setError('Spécifiez un compte de charge');
            return;
        }

        const token = localStorage.getItem('seka_access_token');
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rules-advanced/conditional-rules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    supplier_id: selectedSupplier,
                    name: ruleName || `Règle conditionnelle`,
                    conditions,
                    actions,
                    priority
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Erreur lors de la création');
            }

            await fetchData();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSupplier('');
        setRuleName('');
        setPriority(10);
        setConditions([]);
        setActions([{ type: 'assign_account', debit_account: '', vat_account: '4454', vat_rate: 18 }]);
        setError(null);
    };

    const getConditionIcon = (type: string) => {
        switch (type) {
            case 'amount_greater':
            case 'amount_less':
            case 'amount_between':
                return <DollarSign className="h-4 w-4" />;
            case 'period_monthly':
                return <Calendar className="h-4 w-4" />;
            case 'description_contains':
                return <FileText className="h-4 w-4" />;
            default:
                return <Filter className="h-4 w-4" />;
        }
    };

    const formatCondition = (condition: Condition) => {
        switch (condition.type) {
            case 'amount_greater':
                return `Montant > ${condition.value?.toLocaleString()} FCFA`;
            case 'amount_less':
                return `Montant < ${condition.value?.toLocaleString()} FCFA`;
            case 'amount_between':
                return `${condition.min_value?.toLocaleString()} < Montant < ${condition.max_value?.toLocaleString()} FCFA`;
            case 'period_monthly':
                return `Mensuel ~${condition.expected_amount?.toLocaleString()} FCFA (±${condition.tolerance_percent}%)`;
            case 'description_contains':
                return `Description contient "${condition.value}"`;
            default:
                return condition.type;
        }
    };

    return (
        <>
            <Head>
                <title>Règles Conditionnelles - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Filter className="h-6 w-6 text-[#1e3a5f]" />
                                    RÈGLES CONDITIONNELLES
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Créez des règles avancées basées sur le montant, la période ou la description
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/regles/fournisseurs')}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    <Settings className="h-4 w-4" />
                                    Règles simples
                                </button>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle règle
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900">Quand utiliser les règles conditionnelles ?</h4>
                                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                    <li>• <strong>Montant élevé</strong>: Imputer sur un compte différent si montant {'>'}1 000 000 FCFA</li>
                                    <li>• <strong>Facture mensuelle</strong>: Détecter automatiquement les loyers, abonnements fixes</li>
                                    <li>• <strong>Description spécifique</strong>: Différencier "maintenance" de "achat" pour un même fournisseur</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                            </div>
                        ) : rules.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucune règle conditionnelle</p>
                                <p className="text-sm mt-1">Créez votre première règle avancée</p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                                >
                                    <Plus className="h-4 w-4 inline mr-2" />
                                    Créer une règle
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="p-4">
                                        <div
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    <Filter className={`h-5 w-5 ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {rule.conditions.length} condition(s) • Priorité: {rule.priority}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {rule.is_active ? (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                                {expandedRule === rule.id ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedRule === rule.id && (
                                            <div className="mt-4 pl-12 space-y-3">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions:</h4>
                                                    <div className="space-y-2">
                                                        {rule.conditions.map((cond, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                                {getConditionIcon(cond.type)}
                                                                <span className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded">
                                                                    {formatCondition(cond)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Actions:</h4>
                                                    <div className="space-y-1 text-sm">
                                                        {rule.actions.map((action, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <span className="text-green-600">→</span>
                                                                <span>Débit: <span className="font-mono bg-green-50 px-1 rounded">{action.debit_account}</span></span>
                                                                {action.vat_account && (
                                                                    <span>TVA: <span className="font-mono bg-blue-50 px-1 rounded">{action.vat_account}</span></span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Nouvelle règle conditionnelle
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            {/* Fournisseur */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fournisseur *
                                </label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Sélectionner un fournisseur...</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Nom et Priorité */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom de la règle
                                    </label>
                                    <input
                                        type="text"
                                        value={ruleName}
                                        onChange={(e) => setRuleName(e.target.value)}
                                        placeholder="Ex: Grosse facture SBEE"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priorité (1 = plus haute)
                                    </label>
                                    <input
                                        type="number"
                                        value={priority}
                                        onChange={(e) => setPriority(parseInt(e.target.value) || 10)}
                                        min={1}
                                        max={100}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Conditions */}
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">Conditions</h4>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleAddCondition(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">+ Ajouter une condition</option>
                                        {CONDITION_TYPES.map((ct) => (
                                            <option key={ct.type} value={ct.type}>{ct.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {conditions.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Ajoutez au moins une condition
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {conditions.map((condition, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getConditionIcon(condition.type)}
                                                        <span className="text-sm font-medium">
                                                            {CONDITION_TYPES.find(ct => ct.type === condition.type)?.name}
                                                        </span>
                                                    </div>

                                                    {/* Paramètres selon le type */}
                                                    {(condition.type === 'amount_greater' || condition.type === 'amount_less') && (
                                                        <input
                                                            type="number"
                                                            value={condition.value || ''}
                                                            onChange={(e) => handleUpdateCondition(index, 'value', parseFloat(e.target.value))}
                                                            placeholder="Montant en FCFA"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                        />
                                                    )}

                                                    {condition.type === 'amount_between' && (
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={condition.min_value || ''}
                                                                onChange={(e) => handleUpdateCondition(index, 'min_value', parseFloat(e.target.value))}
                                                                placeholder="Min"
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                                                            />
                                                            <span className="text-gray-400">à</span>
                                                            <input
                                                                type="number"
                                                                value={condition.max_value || ''}
                                                                onChange={(e) => handleUpdateCondition(index, 'max_value', parseFloat(e.target.value))}
                                                                placeholder="Max"
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                                                            />
                                                        </div>
                                                    )}

                                                    {condition.type === 'period_monthly' && (
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={condition.expected_amount || ''}
                                                                onChange={(e) => handleUpdateCondition(index, 'expected_amount', parseFloat(e.target.value))}
                                                                placeholder="Montant mensuel"
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                                                            />
                                                            <span className="text-gray-400">±</span>
                                                            <input
                                                                type="number"
                                                                value={condition.tolerance_percent || 5}
                                                                onChange={(e) => handleUpdateCondition(index, 'tolerance_percent', parseFloat(e.target.value))}
                                                                placeholder="%"
                                                                className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                                                            />
                                                            <span className="text-gray-400">%</span>
                                                        </div>
                                                    )}

                                                    {condition.type === 'description_contains' && (
                                                        <input
                                                            type="text"
                                                            value={(condition as any).value || ''}
                                                            onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                                                            placeholder="Mot à rechercher"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                        />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCondition(index)}
                                                    className="p-1 text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Action (si conditions remplies)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Compte de charge</label>
                                        <input
                                            type="text"
                                            value={actions[0].debit_account || ''}
                                            onChange={(e) => setActions([{ ...actions[0], debit_account: e.target.value }])}
                                            placeholder="Ex: 6061"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Compte TVA</label>
                                        <input
                                            type="text"
                                            value={actions[0].vat_account || ''}
                                            onChange={(e) => setActions([{ ...actions[0], vat_account: e.target.value }])}
                                            placeholder="Ex: 4454"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Taux TVA (%)</label>
                                        <input
                                            type="number"
                                            value={actions[0].vat_rate || 18}
                                            onChange={(e) => setActions([{ ...actions[0], vat_rate: parseFloat(e.target.value) }])}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Créer la règle
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
