import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreditCard, Smartphone, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { getSubscription, getBillingHistory, type Subscription, type BillingInvoice } from '@/lib/api';
import { CancelSubscriptionModal } from '@/components/modals/CancelSubscriptionModal';
import { ConfigureKKiaPayModal } from '@/components/modals/ConfigureKKiaPayModal';
import { AddPaymentMethodModal } from '@/components/modals/AddPaymentMethodModal';

export default function BillingPage() {
    const router = useRouter();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [billingHistory, setBillingHistory] = useState<BillingInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showKKiaPayModal, setShowKKiaPayModal] = useState(false);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

    useEffect(() => {
        const fetchBillingData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("seka_access_token");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const [subscriptionData, historyData] = await Promise.all([
                    getSubscription(token),
                    getBillingHistory(token),
                ]);

                setSubscription(subscriptionData);
                setBillingHistory(historyData);
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch billing data", err);
                if (err.response?.status === 401) {
                    localStorage.removeItem("seka_access_token");
                    router.push("/login");
                    return;
                }
                setError("Impossible de charger les données de facturation");
            } finally {
                setLoading(false);
            }
        };

        fetchBillingData();
    }, [router]);

    const getPlanColor = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'starter':
                return 'bg-blue-100 text-blue-800';
            case 'business':
                return 'bg-purple-100 text-purple-800';
            case 'enterprise':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        return status === 'active' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <XCircle className="h-5 w-5 text-red-500" />
        );
    };

    return (
        <DashboardLayout title="Facturation & Abonnement">
            <Head>
                <title>Facturation - SEKA Enterprise</title>
            </Head>

            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Facturation & Abonnement</h1>
                    <p className="text-gray-600 mt-2">Gérez votre abonnement et vos moyens de paiement</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Current Plan */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Plan Actuel</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(subscription?.plan || '')}`}>
                                    {subscription?.plan}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-3">
                                    {getStatusIcon(subscription?.status || '')}
                                    <div>
                                        <p className="text-sm text-gray-500">Statut</p>
                                        <p className="font-medium capitalize">{subscription?.status}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Prochain paiement</p>
                                        <p className="font-medium">
                                            {subscription?.next_billing_date
                                                ? new Date(subscription.next_billing_date).toLocaleDateString('fr-FR')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <CreditCard className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Montant</p>
                                        <p className="font-medium">{subscription?.amount?.toLocaleString()} FCFA/mois</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                                >
                                    Changer de plan
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Annuler l'abonnement
                                </button>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Moyens de paiement</h2>

                            <div className="space-y-3">
                                {subscription?.stripe_customer_id && (
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <CreditCard className="h-6 w-6 text-gray-400" />
                                            <div>
                                                <p className="font-medium">Carte bancaire (Stripe)</p>
                                                <p className="text-sm text-gray-500">ID: {subscription.stripe_customer_id}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-green-600 font-medium">Par défaut</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Smartphone className="h-6 w-6 text-gray-400" />
                                        <div>
                                            <p className="font-medium">Mobile Money (KKiaPay)</p>
                                            <p className="text-sm text-gray-500">Orange, MTN, Moov, Wave</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowKKiaPayModal(true)}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                    >
                                        Configurer
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAddPaymentModal(true)}
                                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                            >
                                + Ajouter un moyen de paiement
                            </button>
                        </div>

                        {/* Billing History */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Historique de facturation</h2>

                            {billingHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facture</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {billingHistory.map((invoice) => (
                                                <tr key={invoice.id}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.description}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {invoice.amount.toLocaleString()} FCFA
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            invoice.status.toLowerCase() === 'paid' || invoice.status.toLowerCase() === 'payé'
                                                                ? 'bg-green-100 text-green-800'
                                                                : invoice.status.toLowerCase() === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {invoice.invoice_url ? (
                                                            <a
                                                                href={invoice.invoice_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                Télécharger
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Aucun historique de facturation disponible</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <CancelSubscriptionModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onSuccess={() => {
                    setShowCancelModal(false);
                    window.location.reload();
                }}
            />

            <ConfigureKKiaPayModal
                isOpen={showKKiaPayModal}
                onClose={() => setShowKKiaPayModal(false)}
                onSuccess={() => {
                    setShowKKiaPayModal(false);
                    window.location.reload();
                }}
            />

            <AddPaymentMethodModal
                isOpen={showAddPaymentModal}
                onClose={() => setShowAddPaymentModal(false)}
                onSuccess={() => {
                    setShowAddPaymentModal(false);
                    window.location.reload();
                }}
            />
        </DashboardLayout>
    );
}
