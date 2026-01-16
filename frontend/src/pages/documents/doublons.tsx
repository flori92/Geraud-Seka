/**
 * Page de Gestion des Doublons
 * 
 * Affiche:
 * - Liste des doublons en attente de traitement
 * - Interface de confrontation (PDF côte à côte)
 * - Historique des doublons traités
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    AlertTriangle, FileText, Check, X, RefreshCw, Eye,
    ChevronRight, History, Clock, CheckCircle, XCircle,
    Replace, Files, AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface PendingDuplicate {
    id: string;
    supplier_name: string;
    reference_number: string;
    document_date: string;
    amount_ttc: number;
    created_at: string;
    duplicate_of_id: string;
    reason: string;
    reason_text: string;
}

interface HistoryItem {
    id: string;
    reference_number: string;
    supplier_name: string;
    amount_ttc: number;
    action: string;
    existing_document_id: string;
    reason: string;
    resolved_by: string;
    resolved_at: string;
}

interface DuplicateStats {
    total_detected: number;
    pending: number;
    resolved: number;
    by_action: {
        rejected: number;
        kept_both: number;
        replaced: number;
    };
}

export default function DoublonsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingDuplicates, setPendingDuplicates] = useState<PendingDuplicate[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [stats, setStats] = useState<DuplicateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDuplicate, setSelectedDuplicate] = useState<PendingDuplicate | null>(null);

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
            const [pendingRes, historyRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/duplicates/pending`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/duplicates/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/duplicates/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (pendingRes.ok) setPendingDuplicates(await pendingRes.json());
            if (historyRes.ok) setHistory(await historyRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenConfrontation = (duplicate: PendingDuplicate) => {
        // Ouvrir le modal de confrontation
        router.push(`/documents/confrontation?new=${duplicate.id}&existing=${duplicate.duplicate_of_id}`);
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'reject':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'keep_both':
                return <Files className="h-4 w-4 text-blue-500" />;
            case 'replace':
                return <Replace className="h-4 w-4 text-orange-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'reject':
                return 'Rejeté';
            case 'keep_both':
                return 'Conservé';
            case 'replace':
                return 'Remplacé';
            default:
                return action;
        }
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR');
    };

    return (
        <>
            <Head>
                <title>Gestion des Doublons - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                                    GESTION DES DOUBLONS
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Détection et résolution des factures en doublon
                                </p>
                            </div>
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Actualiser
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-5 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total détectés</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_detected}</p>
                                    </div>
                                    <div className="p-3 bg-gray-100 rounded-lg">
                                        <AlertTriangle className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-orange-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">En attente</p>
                                        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <Clock className="h-6 w-6 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-red-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Rejetés</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.by_action.rejected}</p>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-blue-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Conservés</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.by_action.kept_both}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Files className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-green-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Remplacés</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.by_action.replaced}</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Replace className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="mb-6 flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                                activeTab === 'pending'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                En attente ({pendingDuplicates.length})
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                                activeTab === 'history'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Historique ({history.length})
                            </span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                                <p className="text-gray-500 mt-2">Chargement...</p>
                            </div>
                        ) : activeTab === 'pending' ? (
                            /* Doublons en attente */
                            pendingDuplicates.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900">Aucun doublon en attente</h3>
                                    <p className="text-gray-500 mt-1">Toutes les factures ont été traitées</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {pendingDuplicates.map((dup) => (
                                        <div key={dup.id} className="p-4 hover:bg-orange-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-orange-100 rounded-lg">
                                                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900">
                                                                {dup.supplier_name}
                                                            </h3>
                                                            <span className="text-sm text-gray-500">
                                                                N° {dup.reference_number}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                            <span>{formatDate(dup.document_date)}</span>
                                                            <span className="font-medium text-gray-900">
                                                                {formatAmount(dup.amount_ttc)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 px-2 py-1 bg-orange-100 rounded text-xs text-orange-800 inline-block">
                                                            {dup.reason_text}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenConfrontation(dup)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Traiter
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            /* Historique */
                            history.length === 0 ? (
                                <div className="p-8 text-center">
                                    <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900">Aucun historique</h3>
                                    <p className="text-gray-500 mt-1">Les doublons traités apparaîtront ici</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Facture
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Montant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Action
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Motif
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {history.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {formatDate(item.resolved_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.supplier_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        N° {item.reference_number}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {item.amount_ttc ? formatAmount(item.amount_ttc) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                                                        {getActionIcon(item.action)}
                                                        {getActionLabel(item.action)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {item.reason || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900">Règles de détection</h4>
                                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                    <li>• <strong>Même fournisseur + Même N° facture</strong> → Doublon bloquant</li>
                                    <li>• <strong>Même fournisseur + Même montant + Même date</strong> → Doublon bloquant</li>
                                    <li>• Les abonnements récurrents (Canal+, MTN...) avec N° différents ne sont <strong>pas</strong> des doublons</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
