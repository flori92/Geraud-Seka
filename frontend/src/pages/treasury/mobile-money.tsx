import { useState, useEffect } from "react";
import Head from "next/head";
import {
    Smartphone, Plus, Check, X, Loader2, RefreshCw, Wallet, ArrowLeftRight,
    AlertCircle, CheckCircle, Clock, Link2, Unlink, Eye, Settings, Trash2,
    Phone, User, Building2, Sparkles, Shield, Zap
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface MobileMoneyAccount {
    id: string;
    provider: "mtn" | "moov" | "celtiis";
    phone_number: string;
    account_name: string;
    status: "pending" | "verified" | "failed";
    balance?: number;
    last_sync?: string;
    created_at: string;
}

interface MobileMoneyTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    provider: string;
    reference: string;
    status: "pending" | "matched" | "unmatched";
}

const providerConfig = {
    mtn: { name: "MTN Mobile Money", color: "bg-yellow-500", logo: "/logos/mtn.png" },
    moov: { name: "Moov Money", color: "bg-blue-600", logo: "/logos/moov.png" },
    celtiis: { name: "Celtiis Cash", color: "bg-green-600", logo: "/logos/celtiis.png" }
};

export default function MobileMoneyPage() {
    const [accounts, setAccounts] = useState<MobileMoneyAccount[]>([]);
    const [transactions, setTransactions] = useState<MobileMoneyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [newAccount, setNewAccount] = useState({
        provider: "mtn" as "mtn" | "moov" | "celtiis",
        phone_number: "",
        account_name: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Mock data
            const mockAccounts: MobileMoneyAccount[] = [
                { id: "1", provider: "mtn", phone_number: "+229 97 12 34 56", account_name: "SEKA SARL", status: "verified", balance: 2500000, last_sync: "2024-12-12T10:30:00", created_at: "2024-01-15" },
                { id: "2", provider: "moov", phone_number: "+229 96 78 90 12", account_name: "SEKA SARL", status: "verified", balance: 1250000, last_sync: "2024-12-12T09:45:00", created_at: "2024-03-20" },
            ];

            const mockTransactions: MobileMoneyTransaction[] = [
                { id: "1", date: "2024-12-12", description: "Paiement client - Mme Adjo", amount: 150000, type: "credit", provider: "mtn", reference: "TXN2024121200001", status: "pending" },
                { id: "2", date: "2024-12-11", description: "Achat fournitures", amount: 45000, type: "debit", provider: "mtn", reference: "TXN2024121100002", status: "matched" },
                { id: "3", date: "2024-12-11", description: "Transfert reçu - M. Kouassi", amount: 200000, type: "credit", provider: "moov", reference: "TXN2024121100003", status: "pending" },
                { id: "4", date: "2024-12-10", description: "Paiement facture eau", amount: 35000, type: "debit", provider: "moov", reference: "TXN2024121000004", status: "matched" },
            ];

            setAccounts(mockAccounts);
            setTransactions(mockTransactions);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async () => {
        if (!newAccount.phone_number || !newAccount.account_name) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        setVerifying(true);

        // Simulate KKiaPay verification
        await new Promise(resolve => setTimeout(resolve, 3000));

        const newAcc: MobileMoneyAccount = {
            id: Date.now().toString(),
            provider: newAccount.provider,
            phone_number: newAccount.phone_number,
            account_name: newAccount.account_name,
            status: "verified",
            balance: 0,
            created_at: new Date().toISOString()
        };

        setAccounts(prev => [...prev, newAcc]);
        setShowAddModal(false);
        setNewAccount({ provider: "mtn", phone_number: "", account_name: "" });
        setVerifying(false);
    };

    const syncAccount = async (accountId: string) => {
        setSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        setAccounts(prev => prev.map(acc =>
            acc.id === accountId ? { ...acc, last_sync: new Date().toISOString() } : acc
        ));
        setSyncing(false);
    };

    const removeAccount = (accountId: string) => {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const pendingTransactions = transactions.filter(t => t.status === "pending").length;

    return (
        <>
            <Head>
                <title>Mobile Money - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <Smartphone className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Mobile Money</h1>
                                    <p className="text-sm text-gray-500">Connectez vos portefeuilles via KKiaPay</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Ajouter un compte
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Wallet className="h-6 w-6 opacity-80" />
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Total</span>
                                </div>
                                <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
                                <p className="text-sm opacity-80">Solde total Mobile Money</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Smartphone className="h-6 w-6 text-blue-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{accounts.length}</p>
                                <p className="text-sm text-gray-500">Comptes connectés</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="h-6 w-6 text-orange-500" />
                                </div>
                                <p className="text-3xl font-bold text-orange-600">{pendingTransactions}</p>
                                <p className="text-sm text-gray-500">Transactions à traiter</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-green-600">{transactions.filter(t => t.status === "matched").length}</p>
                                <p className="text-sm text-gray-500">Rapprochées ce mois</p>
                            </div>
                        </div>

                        {/* Accounts */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Comptes Mobile Money</h2>
                                <button onClick={fetchData} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                    Actualiser
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                </div>
                            ) : accounts.length === 0 ? (
                                <div className="text-center py-12">
                                    <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun compte connecté</h3>
                                    <p className="text-gray-500 mb-4">Connectez vos portefeuilles Mobile Money via KKiaPay</p>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ajouter un compte
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {accounts.map((account) => (
                                        <div key={account.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 ${providerConfig[account.provider].color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                                        {account.provider.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900">{providerConfig[account.provider].name}</p>
                                                            {account.status === "verified" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    Vérifié
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500">{account.phone_number} • {account.account_name}</p>
                                                        {account.last_sync && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Dernière sync: {new Date(account.last_sync).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-gray-900">{formatCurrency(account.balance || 0)}</p>
                                                        <p className="text-xs text-gray-500">Solde disponible</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => syncAccount(account.id)}
                                                            disabled={syncing}
                                                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                                            title="Synchroniser"
                                                        >
                                                            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                                                        </button>
                                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Paramètres">
                                                            <Settings className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeAccount(account.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                                            title="Déconnecter"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Transactions récentes</h2>
                                <a href="/accounting/bank-reconciliation" className="text-sm text-blue-600 hover:text-blue-700">
                                    Voir le rapprochement
                                </a>
                            </div>
                            {transactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Aucune transaction récente
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Opérateur</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                                            <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                                                    <p className="text-xs text-gray-500">Réf: {tx.reference}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${tx.provider === "mtn" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                                        } rounded-full`}>
                                                        {tx.provider.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-right text-sm font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                                    {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {tx.status === "matched" ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                            <Link2 className="h-3 w-3" />
                                                            Rapprochée
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                                            <Clock className="h-3 w-3" />
                                                            En attente
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* KKiaPay Info */}
                        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Sécurisé par KKiaPay</h3>
                                    <p className="text-sm text-gray-600">
                                        Vos données de paiement sont protégées par KKiaPay, agrégateur de paiement certifié.
                                        La synchronisation est automatique et vos transactions sont rapprochées avec vos écritures comptables.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !verifying && setShowAddModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Connecter un compte Mobile Money</h2>
                            <p className="text-sm text-gray-500 mt-1">Via KKiaPay - Agrégateur de paiement</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Opérateur</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(["mtn", "moov", "celtiis"] as const).map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => setNewAccount({ ...newAccount, provider })}
                                            className={`p-3 rounded-lg border-2 transition-all ${newAccount.provider === provider
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 ${providerConfig[provider].color} rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-1`}>
                                                {provider.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="text-xs font-medium text-gray-700">{providerConfig[provider].name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={newAccount.phone_number}
                                        onChange={(e) => setNewAccount({ ...newAccount, phone_number: e.target.value })}
                                        placeholder="+229 XX XX XX XX"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom sur le compte</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={newAccount.account_name}
                                        onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                                        placeholder="SEKA SARL"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                                <div className="flex items-start gap-2">
                                    <Zap className="h-4 w-4 mt-0.5" />
                                    <p>KKiaPay enverra un code de vérification par SMS pour confirmer que vous êtes le propriétaire de ce compte.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                disabled={verifying}
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddAccount}
                                disabled={verifying || !newAccount.phone_number || !newAccount.account_name}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Vérification...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4" />
                                        Connecter
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
