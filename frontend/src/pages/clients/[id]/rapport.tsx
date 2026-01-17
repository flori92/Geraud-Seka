/**
 * Rapport Client - Vue détaillée avec factures et plan comptable
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    ArrowLeft, Users, FileText, DollarSign, Calendar,
    TrendingUp, AlertCircle, CheckCircle, Clock, BookOpen
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Client {
    id: string;
    code: string;
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    auxiliary_account_code?: string;
    auxiliary_account_id?: string;
    has_active_rule?: boolean;
    default_revenue_account?: string;
    default_vat_account?: string;
    default_tax_rate?: number;
}

interface Invoice {
    id: string;
    reference_number: string;
    invoice_date: string;
    due_date: string;
    total_ht: number;
    total_tax: number;
    total_ttc: number;
    status: string;
    payment_status?: string;
}

interface AccountInfo {
    id: string;
    account_number: string;
    name: string;
    account_type: string;
    current_debit: number;
    current_credit: number;
    balance: number;
}

export default function ClientRapportPage() {
    const router = useRouter();
    const { id } = router.query;

    const [client, setClient] = useState<Client | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch client info
            const clientRes = await fetch(`${API_BASE_URL}/api/v1/clients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!clientRes.ok) throw new Error("Client introuvable");
            const clientData = await clientRes.json();
            setClient(clientData);

            // 2. Fetch invoices
            const invoicesRes = await fetch(
                `${API_BASE_URL}/api/v1/sales-invoices?client_id=${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (invoicesRes.ok) {
                const invoicesData = await invoicesRes.json();
                setInvoices(Array.isArray(invoicesData) ? invoicesData : invoicesData.items || []);
            }

            // 3. Fetch account info if auxiliary account exists
            if (clientData.auxiliary_account_id) {
                const accountRes = await fetch(
                    `${API_BASE_URL}/api/v1/accounting/advanced/accounts/${clientData.auxiliary_account_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (accountRes.ok) {
                    const accountData = await accountRes.json();
                    setAccountInfo(accountData);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("fr-FR");
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
            draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: Clock },
            pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
            paid: { label: "Payée", color: "bg-green-100 text-green-700", icon: CheckCircle },
            overdue: { label: "En retard", color: "bg-red-100 text-red-700", icon: AlertCircle },
        };

        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === "paid" || inv.payment_status === "paid");
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
    const totalDue = totalInvoiced - totalPaid;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du rapport...</p>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium mb-2">Erreur</p>
                    <p className="text-gray-600">{error || "Client introuvable"}</p>
                    <button
                        onClick={() => router.push("/tiers/clients")}
                        className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                    >
                        Retour aux clients
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Rapport Client - {client.name} - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.push("/tiers/clients")}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour aux clients
                        </button>

                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="h-6 w-6 text-[#1e3a5f]" />
                                    Rapport Client - {client.name}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Code: {client.code} • Compte auxiliaire: {client.auxiliary_account_code || "Non créé"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total facturé</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {formatCurrency(totalInvoiced)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total payé</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {formatCurrency(totalPaid)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Solde dû</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {formatCurrency(totalDue)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Nb factures</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {invoices.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Client Info & Account */}
                        <div className="space-y-6">
                            {/* Client Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#1e3a5f]" />
                                    Informations client
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Nom</p>
                                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Code</p>
                                        <p className="text-sm font-medium text-gray-900">{client.code || "-"}</p>
                                    </div>
                                    {client.contact_name && (
                                        <div>
                                            <p className="text-xs text-gray-500">Contact</p>
                                            <p className="text-sm font-medium text-gray-900">{client.contact_name}</p>
                                        </div>
                                    )}
                                    {client.email && (
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{client.email}</p>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div>
                                            <p className="text-xs text-gray-500">Téléphone</p>
                                            <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Info */}
                            {accountInfo && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
                                        Compte auxiliaire
                                    </h2>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Numéro de compte</p>
                                            <p className="text-sm font-mono font-bold text-green-600">
                                                {accountInfo.account_number}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Libellé</p>
                                            <p className="text-sm font-medium text-gray-900">{accountInfo.name}</p>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Débit</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(accountInfo.current_debit || 0)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Crédit</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(accountInfo.current_credit || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-xs text-gray-500">Solde</p>
                                                <p className="text-lg font-bold text-[#1e3a5f]">
                                                    {formatCurrency(accountInfo.balance || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Accounting Rule Info */}
                            {client.has_active_rule && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-green-900">
                                                Règle d'imputation active
                                            </p>
                                            <p className="text-xs text-green-700 mt-1">
                                                Les factures de ce client sont automatiquement imputées
                                            </p>
                                            {client.default_revenue_account && (
                                                <p className="text-xs text-green-600 mt-2 font-mono">
                                                    Compte produit: {client.default_revenue_account}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Invoices */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-[#1e3a5f]" />
                                        Factures ({invoices.length})
                                    </h2>
                                </div>

                                <div className="overflow-x-auto">
                                    {invoices.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p className="font-medium">Aucune facture</p>
                                            <p className="text-sm mt-1">Ce client n'a pas encore de facture</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Référence
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Échéance
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Montant TTC
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Statut
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invoices.map((invoice) => (
                                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {invoice.reference_number}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(invoice.invoice_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(invoice.due_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                            {formatCurrency(invoice.total_ttc)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {getStatusBadge(invoice.status)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
