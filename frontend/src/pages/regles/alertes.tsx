/**
 * Page Alertes et Apprentissage - Règles d'imputation
 * 
 * Affiche:
 * - Les alertes (fournisseurs sans règles, règles à réviser)
 * - Les suggestions d'apprentissage basées sur les corrections
 * - Les statistiques d'utilisation
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    AlertCircle, Bell, CheckCircle, XCircle, TrendingUp,
    Brain, Lightbulb, ArrowRight, RefreshCw, Building,
    Settings, Eye, ChevronRight, AlertTriangle, Info
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Alert {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    supplier_id?: string;
    supplier_name?: string;
    correction_count?: number;
    action?: {
        type: string;
        label: string;
        url: string;
    };
    created_at: string;
}

interface LearningSuggestion {
    supplier_id: string;
    supplier_name: string;
    current_account: string;
    suggested_account: string;
    correction_count: number;
    confidence: number;
}

interface AlertSummary {
    total: number;
    by_type: {
        supplier_no_rule: number;
        invoice_no_match: number;
        low_confidence: number;
    };
    by_severity: {
        error: number;
        warning: number;
        info: number;
    };
}

export default function AlertesPage() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [summary, setSummary] = useState<AlertSummary | null>(null);
    const [learningSuggestions, setLearningSuggestions] = useState<LearningSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [applyingLearning, setApplyingLearning] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'alerts' | 'learning'>('alerts');

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
            const [alertsRes, summaryRes, learningRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/rules-advanced/alerts`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/rules-advanced/alerts/summary`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/rules-advanced/learning/suggestions`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (alertsRes.ok) {
                setAlerts(await alertsRes.json());
            }
            if (summaryRes.ok) {
                setSummary(await summaryRes.json());
            }
            if (learningRes.ok) {
                setLearningSuggestions(await learningRes.json());
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLearning = async (supplierId: string, newAccount: string) => {
        const token = localStorage.getItem('seka_access_token');
        setApplyingLearning(supplierId);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rules-advanced/learning/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    supplier_id: supplierId,
                    new_charge_account: newAccount
                })
            });

            if (response.ok) {
                // Retirer de la liste des suggestions
                setLearningSuggestions(prev => prev.filter(s => s.supplier_id !== supplierId));
            }
        } catch (err) {
            console.error('Error applying learning:', err);
        } finally {
            setApplyingLearning(null);
        }
    };

    const handleDismissAlert = (alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'error':
                return 'border-red-200 bg-red-50';
            case 'warning':
                return 'border-orange-200 bg-orange-50';
            default:
                return 'border-blue-200 bg-blue-50';
        }
    };

    return (
        <>
            <Head>
                <title>Alertes & Apprentissage - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Bell className="h-6 w-6 text-[#1e3a5f]" />
                                    ALERTES & APPRENTISSAGE
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Surveillez vos règles d'imputation et améliorez-les automatiquement
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={fetchData}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Actualiser
                                </button>
                                <button
                                    onClick={() => router.push('/regles/fournisseurs')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                                >
                                    <Settings className="h-4 w-4" />
                                    Gérer les règles
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total alertes</p>
                                        <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                                    </div>
                                    <div className="p-3 bg-gray-100 rounded-lg">
                                        <Bell className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Sans règle</p>
                                        <p className="text-2xl font-bold text-orange-600">{summary.by_type.supplier_no_rule}</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <AlertCircle className="h-6 w-6 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">À réviser</p>
                                        <p className="text-2xl font-bold text-blue-600">{summary.by_type.low_confidence}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Eye className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Suggestions IA</p>
                                        <p className="text-2xl font-bold text-purple-600">{learningSuggestions.length}</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Brain className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="mb-6 flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('alerts')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                                activeTab === 'alerts'
                                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Alertes ({alerts.length})
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('learning')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                                activeTab === 'learning'
                                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                Apprentissage ({learningSuggestions.length})
                            </span>
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                            <p className="text-gray-500 mt-2">Chargement...</p>
                        </div>
                    ) : activeTab === 'alerts' ? (
                        /* Alerts Tab */
                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900">Tout est en ordre !</h3>
                                    <p className="text-gray-500 mt-1">Aucune alerte à signaler</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`bg-white rounded-lg border p-4 ${getSeverityClass(alert.severity)}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                {getSeverityIcon(alert.severity)}
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                                    {alert.supplier_name && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Building className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-500">{alert.supplier_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {alert.action && (
                                                    <button
                                                        onClick={() => router.push(alert.action!.url)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#172e4d]"
                                                    >
                                                        {alert.action.label}
                                                        <ChevronRight className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDismissAlert(alert.id)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                                    title="Ignorer"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Learning Tab */
                        <div className="space-y-4">
                            {/* Info Box */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-purple-900">Comment fonctionne l'apprentissage ?</h4>
                                        <p className="text-sm text-purple-700 mt-1">
                                            Quand vous corrigez manuellement une suggestion de compte, SEKA mémorise cette correction.
                                            Après plusieurs corrections similaires, le système suggère de mettre à jour automatiquement la règle.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {learningSuggestions.length === 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900">Pas de suggestions pour le moment</h3>
                                    <p className="text-gray-500 mt-1">
                                        Les suggestions apparaîtront après quelques corrections manuelles
                                    </p>
                                </div>
                            ) : (
                                learningSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.supplier_id}
                                        className="bg-white rounded-lg border border-gray-200 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-100 rounded-lg">
                                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{suggestion.supplier_name}</h4>
                                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                                        <span className="font-mono bg-red-50 text-red-600 px-2 py-0.5 rounded">
                                                            {suggestion.current_account || 'Aucun'}
                                                        </span>
                                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                                        <span className="font-mono bg-green-50 text-green-600 px-2 py-0.5 rounded">
                                                            {suggestion.suggested_account}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Basé sur {suggestion.correction_count} correction(s) • 
                                                        Confiance: {Math.round(suggestion.confidence * 100)}%
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApplyLearning(
                                                        suggestion.supplier_id,
                                                        suggestion.suggested_account
                                                    )}
                                                    disabled={applyingLearning === suggestion.supplier_id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {applyingLearning === suggestion.supplier_id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            Application...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4" />
                                                            Appliquer
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setLearningSuggestions(prev => 
                                                        prev.filter(s => s.supplier_id !== suggestion.supplier_id)
                                                    )}
                                                    className="p-2 text-gray-400 hover:text-gray-600 rounded"
                                                    title="Ignorer"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confidence Bar */}
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                <span>Confiance</span>
                                                <span>{Math.round(suggestion.confidence * 100)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        suggestion.confidence >= 0.8 ? 'bg-green-500' :
                                                        suggestion.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                                                    }`}
                                                    style={{ width: `${suggestion.confidence * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
