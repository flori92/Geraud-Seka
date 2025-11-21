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
                            <div className="hidden md:flex md:items-center md:space-x-1">
                                <a href="#features" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">Fonctionnalités</a>
                                <a href="#pricing" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">Tarifs</a>
                                <a href="#contact" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">Contact</a>
                                <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                                    Connexion
                                </Link>
                                <Link href="/register" className="ml-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg">
                                    Essai Gratuit
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero - Dark */}
                <div className="relative overflow-hidden bg-black">
                    {/* Background effects - reduced opacity for better readability */}
                    <div className="absolute inset-0">
                        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white opacity-[0.02] blur-3xl"></div>
                        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-white opacity-[0.015] blur-3xl"></div>
                        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white opacity-[0.015] blur-3xl"></div>
                    </div>

                    <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
                        <div className="text-center">
                            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                                Votre solution
                                <br />
                                de gestion d'entreprise
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-400">
                                Simplifiez votre gestion avec une solution complète : comptabilité conforme SYSCOHADA, trésorerie, clients et RH en un seul endroit.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-4">
                                <Link href="/register" className="group relative overflow-hidden rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 transition-all hover:shadow-xl hover:shadow-white/20">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 transition-opacity group-hover:opacity-100"></div>
                                    <span className="relative">Commencer</span>
                                </Link>
                                <a href="#demo" className="text-base font-medium text-gray-400 transition-colors hover:text-white">
                                    Voir une démo <span aria-hidden="true">→</span>
                                </a>
                            </div>
                            <p className="mt-6 text-sm text-gray-500">
                                14 jours d'essai gratuit • Sans carte bancaire • Annulation à tout moment
                            </p>
                        </div>
                    </div>
                </div>

                {/* Social Proof - White */}
                <div className="border-y border-gray-200 bg-white py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm font-medium text-gray-500">
                            Utilisé par des entreprises dans 4 pays d'Afrique de l'Ouest
                        </p>
                    </div>
                </div>

                {/* Features - Dark with Premium Cards */}
                <div id="features" className="relative overflow-hidden bg-black py-24 sm:py-32">
                    <div className="absolute inset-0">
                        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl"></div>
                        <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl"></div>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center">
                            <h2 className="text-base font-semibold leading-7 text-gray-400">Une solution complète</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
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
                                    <div key={index} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-white/20">
                                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                                        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10"></div>

                                        <div className="relative">
                                            <dt className="text-base font-semibold leading-7 text-white">
                                                {feature.title}
                                            </dt>
                                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                                                <p className="flex-auto">{feature.description}</p>
                                            </dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Pricing - White with subtle cards */}
                <div id="pricing" className="bg-white py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl sm:text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Tarifs simples et transparents</h2>
                            <p className="mt-6 text-lg leading-8 text-gray-600">
                                Choisissez le plan adapté à votre entreprise
                            </p>
                        </div>
                        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-3">
                            {/* Starter */}
                            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-xl sm:p-10">
                                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gray-900 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-5"></div>
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

                            {/* Business - Featured Dark */}
                            <div className="group relative overflow-hidden rounded-3xl border border-gray-900 bg-gray-900 p-8 shadow-2xl sm:p-10">
                                <div className="absolute -top-5 left-0 right-0">
                                    <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900">
                                        Le plus populaire
                                    </div>
                                </div>
                                <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10"></div>

                                <div className="relative">
                                    <h3 className="text-base font-semibold leading-7 text-white">Business</h3>
                                    <p className="mt-4 flex items-baseline gap-x-2">
                                        <span className="text-5xl font-bold tracking-tight text-white">60,000</span>
                                        <span className="text-base text-gray-400">FCFA/mois</span>
                                    </p>
                                    <p className="mt-6 text-base leading-7 text-gray-300">Pour les PME en croissance</p>
                                    <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                                        {['Jusqu\'à 15 utilisateurs', '50 clients maximum', '500 documents OCR/mois', '50GB de stockage', 'Support prioritaire'].map((item) => (
                                            <li key={item} className="flex gap-x-3">
                                                <svg className="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/register" className="mt-8 block rounded-lg bg-white px-3.5 py-2.5 text-center text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg">
                                        Commencer
                                    </Link>
                                </div>
                            </div>

                            {/* Enterprise */}
                            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-xl sm:p-10">
                                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gray-900 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-5"></div>
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

                {/* CTA - Dark */}
                <div className="relative overflow-hidden bg-black">
                    <div className="absolute inset-0">
                        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-5 blur-3xl"></div>
                    </div>
                    <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Prêt à simplifier votre gestion ?
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-400">
                                Essayez SEKA gratuitement pendant 14 jours. Aucune carte bancaire requise.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link href="/register" className="group relative overflow-hidden rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 transition-all hover:shadow-2xl hover:shadow-white/30">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 transition-opacity group-hover:opacity-100"></div>
                                    <span className="relative">Commencer gratuitement</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact - White */}
                <div id="contact" className="bg-white py-16 sm:py-24">
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

                {/* Footer - Dark */}
                <footer className="border-t border-white/10 bg-black">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Produit</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#features" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Fonctionnalités</a></li>
                                    <li><a href="#pricing" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Tarifs</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Démo</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Documentation</a></li>
                                    <li><a href="#contact" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Contact</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">FAQ</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Entreprise</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">À propos</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Blog</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Légal</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">Confidentialité</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-400 transition-colors hover:text-white">CGU</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-white/10 pt-8">
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
