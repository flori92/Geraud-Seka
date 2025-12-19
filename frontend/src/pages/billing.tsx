import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { CreditCard, Smartphone, Calendar, CheckCircle, XCircle, Loader2, Receipt } from "lucide-react";
import { getSubscription, getBillingHistory, type Subscription, type BillingInvoice } from "@/lib/api";
import { CancelSubscriptionModal } from "@/components/modals/CancelSubscriptionModal";
import { ConfigureKKiaPayModal } from "@/components/modals/ConfigureKKiaPayModal";
import { AddPaymentMethodModal } from "@/components/modals/AddPaymentMethodModal";

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
        if (!token) { router.push("/login"); return; }
        const [subscriptionData, historyData] = await Promise.all([getSubscription(token), getBillingHistory(token)]);
        setSubscription(subscriptionData);
        setBillingHistory(historyData);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch billing data", err);
        setError("Impossible de charger les données de facturation");
      } finally {
        setLoading(false);
      }
    };
    fetchBillingData();
  }, [router]);

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = { starter: "bg-blue-100 text-blue-800", business: "bg-purple-100 text-purple-800", enterprise: "bg-indigo-100 text-indigo-800" };
    return colors[plan?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <Head><title>Facturation - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><Receipt className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Facturation &amp; Abonnement</h1>
                <p className="text-sm text-gray-600 mt-0.5">Gérez votre abonnement et vos moyens de paiement</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 max-w-4xl">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" /></div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Plan Actuel</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(subscription?.plan || "")}`}>{subscription?.plan}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      {subscription?.status === "active" ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                      <div><p className="text-sm text-gray-500">Statut</p><p className="font-medium capitalize">{subscription?.status}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Prochain paiement</p><p className="font-medium">{subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString("fr-FR") : "N/A"}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Montant</p><p className="font-medium">{subscription?.amount?.toLocaleString()} FCFA/mois</p></div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button onClick={() => router.push("/pricing")} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium">Changer de plan</button>
                    <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Annuler l&apos;abonnement</button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Moyens de paiement</h2>
                  <div className="space-y-3">
                    {subscription?.stripe_customer_id && (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                          <div><p className="font-medium text-gray-900">Carte bancaire (Stripe)</p><p className="text-sm text-gray-500">ID: {subscription.stripe_customer_id}</p></div>
                        </div>
                        <span className="text-sm text-green-600 font-medium">Par défaut</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-6 w-6 text-gray-400" />
                        <div><p className="font-medium text-gray-900">Mobile Money (KKiaPay)</p><p className="text-sm text-gray-500">Orange, MTN, Moov, Wave</p></div>
                      </div>
                      <button onClick={() => setShowKKiaPayModal(true)} className="text-sm text-[#1e3a5f] hover:underline font-medium">Configurer</button>
                    </div>
                  </div>
                  <button onClick={() => setShowAddPaymentModal(true)} className="mt-4 text-[#1e3a5f] hover:underline font-medium text-sm">+ Ajouter un moyen de paiement</button>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique de facturation</h2>
                  {billingHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-gray-50">
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
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{new Date(invoice.date).toLocaleDateString("fr-FR")}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{invoice.description}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{invoice.amount.toLocaleString()} FCFA</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status.toLowerCase() === "paid" || invoice.status.toLowerCase() === "payé" ? "bg-green-100 text-green-700" : invoice.status.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {invoice.invoice_url ? <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline">Télécharger</a> : <span className="text-gray-400">N/A</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">Aucun historique de facturation disponible</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <CancelSubscriptionModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} onSuccess={() => { setShowCancelModal(false); window.location.reload(); }} />
      <ConfigureKKiaPayModal isOpen={showKKiaPayModal} onClose={() => setShowKKiaPayModal(false)} onSuccess={() => { setShowKKiaPayModal(false); window.location.reload(); }} />
      <AddPaymentMethodModal isOpen={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} onSuccess={() => { setShowAddPaymentModal(false); window.location.reload(); }} />
    </>
  );
}
