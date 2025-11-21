import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Merci ! Nous vous contacterons sur ${email}`);
        setEmail('');
    };

    return (
        <>
            <Head>
                <title>SEKA - ERP & CRM pour PME Africaines</title>
                <meta name="description" content="Solution ERP et CRM complète pour PME et cabinets comptables en Afrique. Comptabilité conforme SYSCOHADA, gestion de trésorerie, CRM intelligent." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-white">
                {/* Navigation */}
                <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <h1 className="text-xl font-semibold text-gray-900">SEKA</h1>
                            </div>
                            <div className="hidden md:flex md:items-center md:space-x-6">
                                <a href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900">Fonctionnalités</a>
                                <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">Tarifs</a>
                                <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-gray-900">Contact</a>
                                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                    Connexion
                                </Link>
                                <Link href="/register" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg">
                                    Essai Gratuit
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero - White with dot pattern */}
                <div className="relative overflow-hidden bg-white">
                    {/* Dot pattern background (Next.js style) */}
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #00000008 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}></div>

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white"></div>
                    <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 opacity-40 blur-3xl"></div>

                    <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
                        <div className="text-center">
                            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                                Votre solution tout-en-un
                                <br />
                                <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                                    de gestion d'entreprise
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-600">
                                Simplifiez votre gestion avec une solution complète : comptabilité conforme SYSCOHADA, trésorerie, clients et RH en un seul endroit.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-4">
                                <Link href="/register" className="group relative overflow-hidden rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white transition-all hover:bg-gray-800 hover:shadow-xl">
                                    <span className="relative">Commencer</span>
                                </Link>
                                <a href="#demo" className="text-base font-medium text-gray-700 transition-colors hover:text-gray-900">
                                    Voir une démo <span aria-hidden="true">→</span>
                                </a>
                            </div>
                            <p className="mt-6 text-sm text-gray-500">
                                14 jours d'essai gratuit • Sans carte bancaire • Annulation à tout moment
                            </p>
                        </div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="border-y border-gray-100 bg-gray-50 py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm font-medium text-gray-500">
                            Utilisé par des entreprises dans 4 pays d'Afrique de l'Ouest
                        </p>
                    </div>
                </div>

                {/* Features - White with subtle cards (Next.js style) */}
                <div id="features" className="relative overflow-hidden bg-white py-24 sm:py-32">
                    {/* Subtle dot pattern */}
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: 'radial-gradient(circle, #00000005 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}></div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center">
                            <h2 className="text-base font-semibold leading-7 text-gray-700">Une solution complète</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Tout ce dont vous avez besoin pour gérer votre entreprise
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3">
                                {[
                                    {
                                        title: 'Comptabilité intelligente',
                                        description: 'Extraction automatique des données avec OCR. Génération d\'écritures comptables conformes au plan SYSCOHADA.'
                                    },
                                    {
                                        title: 'Trésorerie prédictive',
                                        description: 'Prévisions de flux de trésorerie basées sur l\'historique. Alertes automatiques en cas de risque de rupture.'
                                    },
                                    {
                                        title: 'CRM avancé',
                                        description: 'Lead scoring automatique. Prédiction du churn. Recommandations personnalisées pour vos clients.'
                                    },
                                    {
                                        title: 'Gestion de stock',
                                        description: 'Optimisation des niveaux de stock. Prédiction de la demande. Alertes de rupture automatiques.'
                                    },
                                    {
                                        title: 'Paiements mobiles',
                                        description: 'Intégration complète avec Orange Money, MTN, Moov, Wave. Paiements par carte via Stripe.'
                                    },
                                    {
                                        title: 'Intelligence artificielle',
                                        description: 'Détection d\'anomalies. Recommandations fiscales. Insights automatiques sur vos données.'
                                    }
                                ].map((feature, index) => (
                                    <div key={index} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg">
                                        {/* Subtle gradient on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

                                        <div className="relative">
                                            <dt className="text-base font-semibold leading-7 text-gray-900">
                                                {feature.title}
                                            </dt>
                                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                                <p className="flex-auto">{feature.description}</p>
                                            </dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Pricing - Gray background with clean cards */}
                <div id="pricing" className="relative overflow-hidden bg-gray-50 py-24 sm:py-32">
                    {/* Dot pattern */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle, #00000008 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}></div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl sm:text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Tarifs simples et transparents</h2>
                            <p className="mt-6 text-lg leading-8 text-gray-600">
                                Choisissez le plan adapté à votre entreprise
                            </p>
                        </div>
                        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-3">
                            {/* Starter */}
                            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                <div className="relative">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Starter</h3>
                                    <p className="mt-4 flex items-baseline gap-x-2">
                                        <span className="text-5xl font-bold tracking-tight text-gray-900">17,000</span>
                                        <span className="text-base text-gray-500">FCFA/mois</span>
                                    </p>
                                    <p className="mt-6 text-base leading-7 text-gray-600">Pour les TPE et freelances</p>
                                    <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                        {['Jusqu\'à 3 utilisateurs', '5 clients maximum', '50 documents OCR/mois', '5GB de stockage'].map((item) => (
                                            <li key={item} className="flex gap-x-3">
                                                <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/register" className="mt-8 block rounded-lg bg-gray-900 px-3.5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg">
                                        Commencer
                                    </Link>
                                </div>
                            </div>

                            {/* Business - Featured with subtle gradient */}
                            <div className="group relative overflow-hidden rounded-3xl border-2 border-gray-900 bg-white p-8 shadow-lg sm:p-10">
                                <div className="absolute -top-5 left-0 right-0">
                                    <div className="mx-auto w-fit rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                                        Le plus populaire
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/[0.02] to-transparent"></div>

                                <div className="relative">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Business</h3>
                                    <p className="mt-4 flex items-baseline gap-x-2">
                                        <span className="text-5xl font-bold tracking-tight text-gray-900">60,000</span>
                                        <span className="text-base text-gray-600">FCFA/mois</span>
                                    </p>
                                    <p className="mt-6 text-base leading-7 text-gray-700">Pour les PME en croissance</p>
                                    <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-700">
                                        {['Jusqu\'à 15 utilisateurs', '50 clients maximum', '500 documents OCR/mois', '50GB de stockage', 'Support prioritaire'].map((item) => (
                                            <li key={item} className="flex gap-x-3">
                                                <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/register" className="mt-8 block rounded-lg bg-gray-900 px-3.5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg">
                                        Commencer
                                    </Link>
                                </div>
                            </div>

                            {/* Enterprise */}
                            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                <div className="relative">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Enterprise</h3>
                                    <p className="mt-4 flex items-baseline gap-x-2">
                                        <span className="text-3xl font-bold tracking-tight text-gray-900">Sur mesure</span>
                                    </p>
                                    <p className="mt-6 text-base leading-7 text-gray-600">Pour les grandes organisations</p>
                                    <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                        {['Utilisateurs illimités', 'OCR illimité', 'Stockage personnalisé', 'Support 24/7'].map((item) => (
                                            <li key={item} className="flex gap-x-3">
                                                <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <a href="#contact" className="mt-8 block rounded-lg bg-gray-900 px-3.5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg">
                                        Nous contacter
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA - White with gradient */}
                <div className="relative overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50 opacity-60"></div>
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #00000005 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}></div>

                    <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Prêt à simplifier votre gestion ?
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
                                Essayez SEKA gratuitement pendant 14 jours. Aucune carte bancaire requise.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link href="/register" className="rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white transition-all hover:bg-gray-800 hover:shadow-xl">
                                    Commencer gratuitement
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact - Gray */}
                <div id="contact" className="bg-gray-50 py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Restons en contact</h2>
                            <p className="mt-2 text-lg leading-8 text-gray-600">
                                Inscrivez-vous à notre newsletter pour recevoir les dernières actualités
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md">
                            <div className="flex gap-x-4">
                                <label htmlFor="email-address" className="sr-only">Email</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="min-w-0 flex-auto rounded-lg border border-gray-300 px-3.5 py-2 text-gray-900 shadow-sm transition-all focus:border-gray-900 focus:ring-2 focus:ring-gray-900 sm:text-sm sm:leading-6"
                                    placeholder="Votre email"
                                />
                                <button
                                    type="submit"
                                    className="flex-none rounded-lg bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-lg"
                                >
                                    S'inscrire
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer - White */}
                <footer className="border-t border-gray-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Produit</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#features" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Fonctionnalités</a></li>
                                    <li><a href="#pricing" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Tarifs</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Démo</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Support</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Documentation</a></li>
                                    <li><a href="#contact" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Contact</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">FAQ</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Entreprise</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">À propos</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Blog</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Légal</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">Confidentialité</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 transition-colors hover:text-gray-900">CGU</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-gray-200 pt-8">
                            <p className="text-xs leading-5 text-gray-500 text-center">
                                © 2025 SEKA. Tous droits réservés.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
