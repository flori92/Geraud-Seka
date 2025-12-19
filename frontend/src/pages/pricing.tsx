import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Check, CreditCard } from "lucide-react";
import { createStripeCustomer, createStripeSubscription, createKKiaPayLink } from "@/lib/api";

const tiers = [
  { name: "Starter", id: "tier-starter", priceMonthly: "29€", priceCfa: "19.000 FCFA", description: "Idéal pour les auto-entrepreneurs et TPE qui démarrent.",
    features: ["Gestion de 5 clients", "Facturation illimitée", "Paiements Mobile Money", "Support par email", "Accès mobile basique"],
    stripePriceId: "price_starter", amountCfa: 19000 },
  { name: "Business", id: "tier-business", priceMonthly: "99€", priceCfa: "65.000 FCFA", description: "Pour les PME en croissance avec des besoins avancés.", popular: true,
    features: ["Clients illimités", "Multi-utilisateurs (jusqu&apos;à 5)", "CRM Avancé & Pipeline", "Module RH complet", "Support prioritaire", "Analytique avancée"],
    stripePriceId: "price_business", amountCfa: 65000 },
  { name: "Enterprise", id: "tier-enterprise", priceMonthly: "Sur devis", priceCfa: "Sur devis", description: "Solutions sur mesure pour les grandes structures.",
    features: ["Utilisateurs illimités", "API dédiée & Intégrations", "Formation sur site", "Support dédié 24/7", "SLA garanti", "Déploiement personnalisé"],
    stripePriceId: "price_enterprise", amountCfa: 0 },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "kkiapay">("stripe");
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: typeof tiers[0]) => {
    if (tier.name === "Enterprise") { window.location.href = "mailto:sales@seka.app"; return; }
    setLoading(tier.id);
    setError(null);
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) { router.push("/login"); return; }
      if (paymentMethod === "stripe") {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const customer = await createStripeCustomer({ email: user.email || "test@example.com", name: user.full_name || "Test User" }, token);
        await createStripeSubscription({ customer_id: customer.id, price_id: tier.stripePriceId }, token);
        alert(`Abonnement ${tier.name} activé avec succès via Stripe !`);
      } else {
        const link = await createKKiaPayLink({ amount: tier.amountCfa, reason: `Abonnement SEKA ${tier.name}`, callback_url: `${window.location.origin}/payment/callback` }, token);
        if (link.url) { window.location.href = link.url; } else { setError("Erreur lors de la création du lien de paiement."); }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Une erreur est survenue lors du paiement.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Head><title>Tarifs - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><CreditCard className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Offres &amp; Tarifs</h1>
                <p className="text-sm text-gray-600 mt-0.5">Choisissez le plan adapté à vos besoins</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Des tarifs adaptés à votre croissance</h2>
                <p className="mt-4 text-lg text-gray-600">Choisissez le plan qui correspond le mieux à vos besoins. Changez à tout moment.</p>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">{error}</div>}

              <div className="flex justify-center mb-10">
                <div className="inline-flex rounded-full p-1 bg-gray-100">
                  <button onClick={() => setPaymentMethod("stripe")} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${paymentMethod === "stripe" ? "bg-[#1e3a5f] text-white" : "text-gray-600 hover:text-gray-900"}`}>
                    Carte Bancaire (Stripe)
                  </button>
                  <button onClick={() => setPaymentMethod("kkiapay")} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${paymentMethod === "kkiapay" ? "bg-[#1e3a5f] text-white" : "text-gray-600 hover:text-gray-900"}`}>
                    Mobile Money (KKiaPay)
                  </button>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {tiers.map((tier) => (
                  <div key={tier.id} className={`rounded-2xl p-8 ${tier.popular ? "bg-[#1e3a5f] text-white ring-2 ring-[#1e3a5f]" : "bg-white border border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold ${tier.popular ? "text-white" : "text-gray-900"}`}>{tier.name}</h3>
                      {tier.popular && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">Populaire</span>}
                    </div>
                    <p className={`text-sm mb-6 ${tier.popular ? "text-gray-300" : "text-gray-600"}`}>{tier.description}</p>
                    <p className="flex items-baseline gap-x-1 mb-6">
                      <span className={`text-4xl font-bold ${tier.popular ? "text-white" : "text-gray-900"}`}>
                        {paymentMethod === "stripe" ? tier.priceMonthly : tier.priceCfa}
                      </span>
                      <span className={`text-sm ${tier.popular ? "text-gray-300" : "text-gray-600"}`}>/mois</span>
                    </p>
                    <button onClick={() => handleSubscribe(tier)} disabled={loading === tier.id}
                      className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${tier.popular ? "bg-white text-[#1e3a5f] hover:bg-gray-100" : "bg-[#1e3a5f] text-white hover:bg-[#172e4d]"} ${loading === tier.id ? "opacity-50 cursor-not-allowed" : ""}`}>
                      {loading === tier.id ? "Traitement..." : tier.name === "Enterprise" ? "Contactez-nous" : "Choisir ce plan"}
                    </button>
                    <ul className={`mt-8 space-y-3 text-sm ${tier.popular ? "text-gray-300" : "text-gray-600"}`}>
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <Check className={`h-5 w-5 flex-shrink-0 ${tier.popular ? "text-white" : "text-[#1e3a5f]"}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
