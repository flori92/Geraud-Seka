import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getBankAccounts, getBankTransactions, getDocuments } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
    CheckCircle,
    XCircle,
    Search,
    Filter,
    RefreshCw,
    ArrowRight,
    AlertCircle,
    FileText,
    CreditCard,
    Plus,
    Loader2,
    Calendar,
    DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types simulés
interface BankTransaction {
    id: string;
    date: string;
    label: string;
    amount: number;
    status: 'pending' | 'matched';
    currency: string;
}

interface Document {
    id: string;
    date: string;
    supplier: string;
    amount_ttc: number;
    reference: string;
    status: 'pending' | 'matched';
}

export default function BankReconciliationPage() {
    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [reconciling, setReconciling] = useState(false);

    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const router = useRouter(); // Need to add useRouter import

    const fetchData = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            // router.push("/login"); // router needed
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch Bank Accounts
            const accounts = await getBankAccounts(token);
            setBankAccounts(accounts);

            if (accounts.length > 0 && !selectedAccountId) {
                setSelectedAccountId(accounts[0].id);
            }

            // 2. Fetch Documents (e.g. Invoices to reconcile)
            // Using getDocuments for now, ideally fetching supplier invoices specifically
            const docsData = await getDocuments(token);
            const formattedDocs = docsData.map((d: any) => ({
                id: d.id,
                date: d.created_at || new Date().toISOString(),
                supplier: d.client?.name || "Tier Tiers",
                amount_ttc: d.total_amount || 0,
                reference: d.number || "REF",
                status: 'pending' as 'pending'
            }));
            setDocuments(formattedDocs);

        } catch (error) {
            console.error("Error fetching reconciliation data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!selectedAccountId) return;
            const token = localStorage.getItem("seka_access_token");
            if (!token) return;

            try {
                const txs = await getBankTransactions(token, { bank_account_id: selectedAccountId });
                // Filter unreconciled client side or ensure API filtering
                const unreconciledTxs = txs.filter((t: any) => !t.is_reconciled).map((t: any) => ({
                    id: t.id,
                    date: t.date,
                    label: t.description || t.label, // backend uses description sometimes
                    amount: t.amount,
                    status: 'pending' as 'pending',
                    currency: t.currency || 'EUR'
                }));
                setBankTransactions(unreconciledTxs);
            } catch (err) {
                console.error("Error fetching transactions:", err);
            }
        };
        fetchTransactions();
    }, [selectedAccountId]);

    // Suggestions automatiques (Montant exact)
    const getSuggestions = (tx: BankTransaction) => {
        return documents.filter(d => Math.abs(d.amount_ttc - Math.abs(tx.amount)) < 0.01);
    };

    const handleReconcile = (txId: string, docId: string) => {
        setReconciling(true);
        setTimeout(() => {
            setBankTransactions(prev => prev.filter(t => t.id !== txId));
            setDocuments(prev => prev.filter(d => d.id !== docId));
            setSelectedTransaction(null);
            setReconciling(false);
        }, 600);
    };

    return (
        <DashboardLayout title="Rapprochement Bancaire">
            <div className="flex flex-col h-[calc(100vh-140px)]">

                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-4 items-center">
                        <div className="bg-white border rounded-lg p-3 flex gap-4 min-w-[300px]">
                            <div className="text-sm flex-1">
                                <span className="text-gray-500 block mb-1">Compte (Banque / Mobile Money)</span>
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="font-semibold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                >
                                    {bankAccounts.length === 0 && <option value="">Aucun compte trouvé</option>}
                                    {bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name.toLowerCase().includes('orange') || acc.name.toLowerCase().includes('mtn') || acc.name.toLowerCase().includes('moov') || acc.name.toLowerCase().includes('wave') || acc.bank_name?.toLowerCase().includes('mobile') ? '📱 ' : '🏦 '}
                                            {acc.name} ({acc.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button onClick={() => fetchData()} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Actualiser
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content - 2 Columns */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-2 gap-0 border rounded-xl overflow-hidden shadow-sm bg-white">

                        {/* Colonne Gauche: Transactions Bancaires */}
                        <div className="border-r bg-gray-50/50 flex flex-col">
                            <div className="p-4 border-b bg-white sticky top-0 z-10">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    Transactions à rapprocher ({bankTransactions.length})
                                </h3>
                            </div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                {bankTransactions.map(tx => (
                                    <div
                                        key={tx.id}
                                        onClick={() => setSelectedTransaction(tx.id)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedTransaction === tx.id
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900">{tx.label}</span>
                                            <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} €
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{format(new Date(tx.date), 'dd MMM yyyy', { locale: fr })}</span>
                                            {getSuggestions(tx).length > 0 && (
                                                <span className="text-green-600 font-medium flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Suggestion trouvée
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {bankTransactions.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                                        <p>Tout est rapproché ! 🎉</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Colonne Droite: Justificatifs / Actions */}
                        <div className="bg-white flex flex-col">
                            <div className="p-4 border-b bg-gray-50 sticky top-0 z-10 flex justify-between items-center">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    Justificatifs & Contreparties
                                </h3>
                                {selectedTransaction && (
                                    <button className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50">
                                        Créer une saisie manuelle
                                    </button>
                                )}
                            </div>

                            <div className="overflow-y-auto flex-1 p-4">
                                {selectedTransaction ? (
                                    <div className="space-y-6">
                                        {/* Suggestions */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                                Suggestions automatiques
                                            </h4>
                                            {getSuggestions(bankTransactions.find(t => t.id === selectedTransaction)!).length > 0 ? (
                                                <div className="space-y-3">
                                                    {getSuggestions(bankTransactions.find(t => t.id === selectedTransaction)!).map(doc => (
                                                        <div key={doc.id} className="border rounded-lg p-4 flex justify-between items-center bg-green-50 border-green-200">
                                                            <div>
                                                                <div className="font-medium">{doc.supplier}</div>
                                                                <div className="text-xs text-gray-500">{doc.reference} • {format(new Date(doc.date), 'dd MMM yyyy')}</div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="font-bold">{doc.amount_ttc.toFixed(2)} €</span>
                                                                <button
                                                                    onClick={() => handleReconcile(selectedTransaction, doc.id)}
                                                                    disabled={reconciling}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2"
                                                                >
                                                                    {reconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                                    Rapprocher
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-6 border-2 border-dashed rounded-lg text-center text-gray-500">
                                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p>Aucune suggestion évidente trouvée.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Recherche manuelle */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">
                                                Rechercher un justificatif
                                            </h4>
                                            <div className="space-y-2">
                                                {documents.filter(d => !getSuggestions(bankTransactions.find(t => t.id === selectedTransaction)!).includes(d)).map(doc => (
                                                    <div key={doc.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-gray-50 group">
                                                        <div>
                                                            <div className="font-medium">{doc.supplier}</div>
                                                            <div className="text-xs text-gray-500">{doc.reference} • {doc.amount_ttc.toFixed(2)} €</div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleReconcile(selectedTransaction, doc.id)}
                                                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-white transition-opacity"
                                                        >
                                                            Sélectionner
                                                        </button>
                                                    </div>
                                                ))}
                                                <button className="w-full py-3 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                    Importer un nouveau document
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-lg font-medium">Sélectionnez une transaction</p>
                                        <p className="text-sm">pour voir les suggestions de rapprochement</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
