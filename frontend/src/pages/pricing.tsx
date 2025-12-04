import { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Check } from 'lucide-react';
import { createStripeCustomer, createStripeSubscription, createKKiaPayLink } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContainer';
import { useRouter } from 'next/router';

const tiers = [
    {
        name: 'Starter',
        id: 'tier-starter',
        href: '#',
        priceMonthly: '29€',
        priceCfa: '19.000 FCFA',
        description: 'Idéal pour les auto-entrepreneurs et TPE qui démarrent.',
        features: [
            'Gestion de 5 clients',
            'Facturation illimitée',
            'Paiements Mobile Money',
            'Support par email',
            'Accès mobile basique',
        ],
        stripePriceId: 'price_starter',
        amountCfa: 19000,
    },
    {
        name: 'Business',
        id: 'tier-business',
        href: '#',
        priceMonthly: '99€',
        priceCfa: '65.000 FCFA',
        description: 'Pour les PME en croissance avec des besoins avancés.',
        features: [
            'Clients illimités',
            'Multi-utilisateurs (jusqu\'à 5)',
            'CRM Avancé & Pipeline',
            'Module RH complet',
            'Support prioritaire',
            'Analytique avancée',
        ],
        stripePriceId: 'price_business',
        amountCfa: 65000,
    },
    {
        name: 'Enterprise',
        id: 'tier-enterprise',
        href: '#',
        priceMonthly: 'Sur devis',
        priceCfa: 'Sur devis',
        description: 'Solutions sur mesure pour les grandes structures.',
        features: [
            'Utilisateurs illimités',
            'API dédiée & Intégrations',
            'Formation sur site',
            'Support dédié 24/7',
            'SLA garanti',
            'Déploiement personnalisé',
        ],
        stripePriceId: 'price_enterprise',
        amountCfa: 0,
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'kkiapay'>('stripe');

    const handleSubscribe = async (tier: typeof tiers[0]) => {
        if (tier.name === 'Enterprise') {
            window.location.href = 'mailto:sales@seka.app';
            return;
        }

        setLoading(tier.id);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            if (paymentMethod === 'stripe') {
                // 1. Create Customer (Mock logic, usually done once)
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const customer = await createStripeCustomer({
                    email: user.email || 'test@example.com',
                    name: user.full_name || 'Test User',
                }, token);

                // 2. Create Subscription
                await createStripeSubscription({
                    customer_id: customer.id,
                    price_id: tier.stripePriceId,
                }, token);

                success(`Abonnement ${tier.name} activé avec succès via Stripe !`);
            } else {
                // KKiaPay
                const link = await createKKiaPayLink({
                    amount: tier.amountCfa,
                    reason: `Abonnement SEKA ${tier.name}`,
                    callback_url: `${window.location.origin}/payment/callback`,
                }, token);

                if (link.url) {
                    window.location.href = link.url;
                } else {
                    showError('Erreur lors de la création du lien de paiement.');
                }
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            showError(error.response?.data?.detail || 'Une erreur est survenue lors du paiement.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <DashboardLayout title="Offres & Tarifs">
            <Head>
                <title>Tarifs - SEKA Enterprise</title>
            </Head>

            <div className="py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-base font-semibold leading-7 text-indigo-600">Tarification</h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                            Des tarifs adaptés à votre croissance
                        </p>
                    </div>
                    <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
                        Choisissez le plan qui correspond le mieux à vos besoins. Changez à tout moment.
                    </p>

                    {/* Payment Method Toggle */}
                    <div className="mt-8 flex justify-center">
                        <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200">
                            <button
                                onClick={() => setPaymentMethod('stripe')}
                                className={`${paymentMethod === 'stripe' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
                                    } cursor-pointer rounded-full px-2.5 py-1`}
                            >
                                Carte Bancaire (Stripe)
                            </button>
                            <button
                                onClick={() => setPaymentMethod('kkiapay')}
                                className={`${paymentMethod === 'kkiapay' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
                                    } cursor-pointer rounded-full px-2.5 py-1`}
                            >
                                Mobile Money (KKiaPay)
                            </button>
                        </div>
                    </div>

                    <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl lg:grid-cols-3">
                        {tiers.map((tier) => (
                            <div
                                key={tier.id}
                                className={`rounded-3xl p-8 ring-1 ring-gray-200 ${tier.name === 'Business' ? 'bg-gray-900 ring-gray-900' : 'bg-white'
                                    } xl:p-10`}
                            >
                                <div className="flex items-center justify-between gap-x-4">
                                    <h3
                                        id={tier.id}
                                        className={`text-lg font-semibold leading-8 ${tier.name === 'Business' ? 'text-white' : 'text-gray-900'
                                            }`}
                                    >
                                        {tier.name}
                                    </h3>
                                    {tier.name === 'Business' ? (
                                        <p className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-400">
                                            Populaire
                                        </p>
                                    ) : null}
                                </div>
                                <p className={`mt-4 text-sm leading-6 ${tier.name === 'Business' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    {tier.description}
                                </p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className={`text-4xl font-bold tracking-tight ${tier.name === 'Business' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {paymentMethod === 'stripe' ? tier.priceMonthly : tier.priceCfa}
                                    </span>
                                    <span className={`text-sm font-semibold leading-6 ${tier.name === 'Business' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                        /mois
                                    </span>
                                </p>
                                <button
                                    onClick={() => handleSubscribe(tier)}
                                    disabled={loading === tier.id}
                                    className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tier.name === 'Business'
                                            ? 'bg-white text-gray-900 hover:bg-gray-100 focus-visible:outline-white'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                                        } ${loading === tier.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading === tier.id ? 'Traitement...' : tier.name === 'Enterprise' ? 'Contactez-nous' : 'Choisir ce plan'}
                                </button>
                                <ul
                                    role="list"
                                    className={`mt-8 space-y-3 text-sm leading-6 ${tier.name === 'Business' ? 'text-gray-300' : 'text-gray-600'
                                        }`}
                                >
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <Check className={`h-6 w-5 flex-none ${tier.name === 'Business' ? 'text-white' : 'text-indigo-600'
                                                }`} aria-hidden="true" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
