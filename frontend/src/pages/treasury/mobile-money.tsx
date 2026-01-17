import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    Smartphone, CreditCard, TrendingUp, 
    Search, Plus, Eye, Download,
    DollarSign, Activity, Loader2, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { getKKiaPayTransactions, type KKiaPayTransaction } from "@/lib/api";

interface MobileMoneyStats {
    total_transactions: number;
    total_volume: number;
    total_fees: number;
    successful_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    provider_breakdown: Record<string, { count: number; volume: number }>;
}

export default function MobileMoneyPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<KKiaPayTransaction[]>([]);
    const [stats, setStats] = useState<MobileMoneyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            // Utiliser l'API KKIAPAY réelle
            const kkiapayTransactions = await getKKiaPayTransactions(token);
            setTransactions(kkiapayTransactions);

            // Calculer les statistiques
            const statsData: MobileMoneyStats = {
                total_transactions: kkiapayTransactions.length,
                total_volume: kkiapayTransactions.reduce((sum, t) => sum + t.amount, 0),
                total_fees: kkiapayTransactions.reduce((sum, t) => sum + t.fees, 0),
                successful_transactions: kkiapayTransactions.filter(t => t.status === 'SUCCESS').length,
                pending_transactions: kkiapayTransactions.filter(t => t.status === 'PENDING').length,
                failed_transactions: kkiapayTransactions.filter(t => t.status === 'FAILED').length,
                provider_breakdown: kkiapayTransactions.reduce((acc, t) => {
                    const provider = t.provider.toLowerCase();
                    if (!acc[provider]) {
                        acc[provider] = { count: 0, volume: 0 };
                    }
                    acc[provider].count += 1;
                    acc[provider].volume += t.amount;
                    return acc;
                }, {} as Record<string, { count: number; volume: number }>)
            };

            setStats(statsData);
        } catch (error) {
            console.error("Erreur lors du chargement des données KKIAPAY:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = searchQuery === '' || 
            transaction.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.reason.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesProvider = selectedProvider === 'all' || transaction.provider === selectedProvider;
        const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
        
        return matchesSearch && matchesProvider && matchesStatus;
    });

    const getProviderLabel = (provider: string) => {
        switch (provider) {
            case 'orange': return 'Orange Money';
            case 'mtn': return 'MTN Mobile Money';
            case 'moov': return 'Moov Money';
            case 'wave': return 'Wave';
            default: return 'Autre';
        }
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'orange': return 'bg-orange-100 text-orange-800';
            case 'mtn': return 'bg-yellow-100 text-yellow-800';
            case 'moov': return 'bg-blue-100 text-blue-800';
            case 'wave': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'Complété';
            case 'PENDING': return 'En attente';
            case 'FAILED': return 'Échoué';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatAmount = (amount: number, currency: string = 'XOF') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency === 'XOF' ? 'XOF' : currency
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Chargement des transactions Mobile Money...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Mobile Money - Trésorerie | SEKA</title>
                <meta name="description" content="Gestion des transactions Mobile Money" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Mobile Money</h1>
                                    <p className="text-sm text-gray-500">
                                        {stats?.total_transactions || 0} transaction{stats?.total_transactions && stats.total_transactions > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => router.push('/treasury')}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Retour trésorerie
                                </button>
                                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouvelle transaction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <Activity className="h-8 w-8 text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total transactions</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_transactions}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Volume total</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.total_volume)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Succès</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.successful_transactions}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <CreditCard className="h-8 w-8 text-orange-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Frais totaux</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.total_fees)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Provider Breakdown */}
                        <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par fournisseur</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {Object.entries(stats.provider_breakdown).map(([provider, data]) => (
                                    <div key={provider} className="text-center">
                                        <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getProviderColor(provider)}`}>
                                            {getProviderLabel(provider)}
                                        </div>
                                        <p className="mt-2 text-lg font-semibold text-gray-900">{data.count}</p>
                                        <p className="text-sm text-gray-500">{formatAmount(data.volume)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                                    />
                                </div>
                                <select
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Tous fournisseurs</option>
                                    <option value="orange">Orange Money</option>
                                    <option value="mtn">MTN Mobile Money</option>
                                    <option value="moov">Moov Money</option>
                                    <option value="wave">Wave</option>
                                </select>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Tous types</option>
                                    <option value="deposit">Dépôts</option>
                                    <option value="withdrawal">Retraits</option>
                                    <option value="transfer">Transferts</option>
                                </select>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Tous statuts</option>
                                    <option value="completed">Complétés</option>
                                    <option value="pending">En attente</option>
                                    <option value="failed">Échoués</option>
                                    <option value="cancelled">Annulés</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="bg-white shadow rounded-lg">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-12">
                                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {transactions.length === 0 ? 'Aucune transaction' : 'Aucune transaction trouvée'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {transactions.length === 0 
                                        ? 'Les transactions Mobile Money apparaîtront ici une fois enregistrées.'
                                        : 'Essayez de modifier vos filtres de recherche.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Transaction
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fournisseur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Client
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Montant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTransactions.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Smartphone className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {transaction.requestId}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {transaction.reason}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(transaction.provider)}`}>
                                                        {getProviderLabel(transaction.provider)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <ArrowDownRight className="h-4 w-4 text-blue-600 mr-1" />
                                                        <span className="text-sm text-gray-900">
                                                            Paiement
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {transaction.customer}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {transaction.phone}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatAmount(transaction.amount, transaction.currency)}
                                                    </div>
                                                    {transaction.fees && (
                                                        <div className="text-xs text-gray-500">
                                                            Frais: {formatAmount(transaction.fees, transaction.currency)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                                                        {getStatusLabel(transaction.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(transaction.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Voir les détails"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Télécharger le reçu"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
