import { useState, useEffect } from "react";
import Head from "next/head";
import {
    ArrowLeftRight, Check, X, Zap, RefreshCw, Loader2, Search, Filter,
    Download, AlertCircle, CheckCircle, Clock, Building2, Calendar,
    ChevronDown, ChevronRight, Sparkles, Eye, Link2, Unlink
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    account_name: string;
    reference?: string;
    status: "pending" | "matched" | "manual";
}

interface AccountingEntry {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    amount: number;
    account_code: string;
    account_name: string;
    status: "unmatched" | "matched";
}

interface ReconciliationSuggestion {
    id: string;
    bank_transaction: BankTransaction;
    suggested_entry: AccountingEntry | null;
    confidence: number;
    reason: string;
}

export default function BankReconciliationPage() {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("month");
    const [showMatched, setShowMatched] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        matched: 0,
        pending: 0,
        total_amount: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                // Fetch bank transactions and accounting entries
                // For now, using mock data to demonstrate the UI
                const mockTransactions: BankTransaction[] = [
                    { id: "1", date: "2024-12-10", description: "VIREMENT ENTRANT - CLIENT ABC", amount: 1250000, type: "credit", account_name: "Compte courant", reference: "VIR202412001", status: "pending" },
                    { id: "2", date: "2024-12-09", description: "PAIEMENT FOURNISSEUR SARL XYZ", amount: 450000, type: "debit", account_name: "Compte courant", reference: "CHQ789456", status: "pending" },
                    { id: "3", date: "2024-12-08", description: "FACTURE ELECTRICITE SBEE", amount: 87500, type: "debit", account_name: "Compte courant", status: "pending" },
                    { id: "4", date: "2024-12-07", description: "VIREMENT CLIENT DEF SARL", amount: 780000, type: "credit", account_name: "Compte courant", status: "matched" },
                    { id: "5", date: "2024-12-05", description: "FRAIS BANCAIRES MENSUELS", amount: 15000, type: "debit", account_name: "Compte courant", status: "pending" },
                ];

                const mockSuggestions: ReconciliationSuggestion[] = [
                    {
                        id: "s1",
                        bank_transaction: mockTransactions[0],
                        suggested_entry: { id: "e1", entry_number: "VE-2024-0125", date: "2024-12-10", description: "Facture client ABC Corp", amount: 1250000, account_code: "411000", account_name: "Clients", status: "unmatched" },
                        confidence: 95,
                        reason: "Montant exact et nom client correspondant"
                    },
                    {
                        id: "s2",
                        bank_transaction: mockTransactions[1],
                        suggested_entry: { id: "e2", entry_number: "AC-2024-0089", date: "2024-12-08", description: "Achat fournitures XYZ", amount: 450000, account_code: "401000", account_name: "Fournisseurs", status: "unmatched" },
                        confidence: 87,
                        reason: "Montant et fournisseur similaires"
                    },
                    {
                        id: "s3",
                        bank_transaction: mockTransactions[2],
                        suggested_entry: null,
                        confidence: 0,
                        reason: "Aucune écriture comptable correspondante trouvée"
                    },
                    {
                        id: "s4",
                        bank_transaction: mockTransactions[4],
                        suggested_entry: { id: "e3", entry_number: "OD-2024-0012", date: "2024-12-01", description: "Provision frais bancaires", amount: 15000, account_code: "627000", account_name: "Frais bancaires", status: "unmatched" },
                        confidence: 92,
                        reason: "Libellé et montant correspondants"
                    }
                ];

                setTransactions(mockTransactions);
                setSuggestions(mockSuggestions);
                setStats({
                    total: mockTransactions.length,
                    matched: mockTransactions.filter(t => t.status === "matched").length,
                    pending: mockTransactions.filter(t => t.status === "pending").length,
                    total_amount: mockTransactions.reduce((sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount), 0)
                });
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const runAIAnalysis = async () => {
        setAnalyzing(true);
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        setAnalyzing(false);
    };

    const handleApprove = (suggestionId: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        setStats(prev => ({ ...prev, matched: prev.matched + 1, pending: prev.pending - 1 }));
    };

    const handleReject = (suggestionId: string) => {
        setSuggestions(prev => prev.map(s =>
            s.id === suggestionId ? { ...s, suggested_entry: null, confidence: 0, reason: "Suggestion rejetée" } : s
        ));
    };

    const filteredSuggestions = suggestions.filter(s =>
        s.bank_transaction.description.toLowerCase().includes(search.toLowerCase()) ||
        s.suggested_entry?.description.toLowerCase().includes(search.toLowerCase())
    );

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 90) return "bg-green-100 text-green-700";
        if (confidence >= 70) return "bg-yellow-100 text-yellow-700";
        if (confidence >= 50) return "bg-orange-100 text-orange-700";
        return "bg-gray-100 text-gray-600";
    };

    return (
        <>
            <Head>
                <title>Rapprochement Bancaire - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <ArrowLeftRight className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Rapprochement Bancaire</h1>
                                    <p className="text-sm text-gray-500">Réconciliez automatiquement vos transactions avec l&apos;IA</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={runAIAnalysis}
                                    disabled={analyzing}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {analyzing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    {analyzing ? "Analyse en cours..." : "Analyser avec IA"}
                                </button>
                                <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                    Actualiser
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm text-gray-500">Transactions totales</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600">{stats.matched}</p>
                                <p className="text-sm text-gray-500">Rapprochées</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="h-5 w-5 text-orange-500" />
                                </div>
                                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                                <p className="text-sm text-gray-500">En attente</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Zap className="h-5 w-5 opacity-80" />
                                </div>
                                <p className="text-2xl font-bold">{suggestions.filter(s => s.confidence >= 80).length}</p>
                                <p className="text-sm opacity-80">Suggestions fiables</p>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Rechercher dans les transactions..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="week">Cette semaine</option>
                                    <option value="month">Ce mois</option>
                                    <option value="quarter">Ce trimestre</option>
                                    <option value="year">Cette année</option>
                                </select>
                                <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={showMatched}
                                        onChange={(e) => setShowMatched(e.target.checked)}
                                        className="rounded text-blue-600"
                                    />
                                    <span className="text-sm text-gray-600">Afficher rapprochées</span>
                                </label>
                            </div>
                        </div>

                        {/* Suggestions List */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-blue-500" />
                                    Suggestions de rapprochement
                                </h2>
                                <span className="text-sm text-gray-500">{filteredSuggestions.length} suggestions</span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                </div>
                            ) : filteredSuggestions.length === 0 ? (
                                <div className="text-center py-20">
                                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tout est rapproché !</h3>
                                    <p className="text-gray-500">Aucune transaction en attente de rapprochement</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredSuggestions.map((suggestion) => (
                                        <div key={suggestion.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-6">
                                                {/* Bank Transaction */}
                                                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Building2 className="h-4 w-4 text-gray-400" />
                                                        <span className="text-xs font-medium text-gray-500 uppercase">Transaction Bancaire</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900 mb-1">{suggestion.bank_transaction.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{new Date(suggestion.bank_transaction.date).toLocaleDateString()}</span>
                                                        <span className={`font-semibold ${suggestion.bank_transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                                            {suggestion.bank_transaction.type === "credit" ? "+" : "-"}{formatCurrency(suggestion.bank_transaction.amount)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="flex flex-col items-center justify-center py-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${suggestion.confidence >= 80 ? "bg-green-100" :
                                                            suggestion.confidence >= 50 ? "bg-yellow-100" : "bg-gray-100"
                                                        }`}>
                                                        {suggestion.suggested_entry ? (
                                                            <Link2 className={`h-5 w-5 ${suggestion.confidence >= 80 ? "text-green-600" :
                                                                    suggestion.confidence >= 50 ? "text-yellow-600" : "text-gray-400"
                                                                }`} />
                                                        ) : (
                                                            <Unlink className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    {suggestion.confidence > 0 && (
                                                        <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${getConfidenceColor(suggestion.confidence)}`}>
                                                            {suggestion.confidence}%
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Suggested Entry */}
                                                <div className="flex-1 bg-blue-50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles className="h-4 w-4 text-blue-500" />
                                                        <span className="text-xs font-medium text-blue-600 uppercase">Écriture suggérée</span>
                                                    </div>
                                                    {suggestion.suggested_entry ? (
                                                        <>
                                                            <p className="font-medium text-gray-900 mb-1">{suggestion.suggested_entry.description}</p>
                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                <span className="font-mono text-blue-600">{suggestion.suggested_entry.entry_number}</span>
                                                                <span>{formatCurrency(suggestion.suggested_entry.amount)}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center text-gray-500 py-2">
                                                            <p className="text-sm">Aucune correspondance trouvée</p>
                                                            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                                Créer une écriture
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {suggestion.suggested_entry && (
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => handleApprove(suggestion.id)}
                                                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                                            title="Valider"
                                                        >
                                                            <Check className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(suggestion.id)}
                                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                                            title="Rejeter"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                        <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors" title="Voir détails">
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {suggestion.reason && (
                                                <p className="mt-3 text-xs text-gray-500 italic pl-4 border-l-2 border-blue-200">
                                                    {suggestion.reason}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Rapprochement automatique avec IA</h3>
                                    <p className="text-sm text-gray-600">
                                        L&apos;IA analyse vos transactions bancaires et les compare à vos écritures comptables pour suggérer
                                        des correspondances. Plus vous validez de suggestions, plus le système devient précis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
