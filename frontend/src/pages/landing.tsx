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
                <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
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
                                <Link href="/register" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                                    Essai Gratuit
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <div className="relative">
                    <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
                        <div className="text-center">
                            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                                ERP & CRM pour l'Afrique
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-600">
                                Simplifiez votre gestion avec une solution complète : comptabilité conforme SYSCOHADA, trésorerie, clients et RH en un seul endroit.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-4">
                                <Link href="/register" className="rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">
                                    Commencer
                                </Link>
                                <a href="#demo" className="text-base font-medium text-gray-900 hover:text-gray-700">
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
                <div className="border-y border-gray-200 bg-gray-50 py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm font-medium text-gray-500">
                            Utilisé par des entreprises dans 4 pays d'Afrique de l'Ouest
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div id="features" className="py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center">
                            <h2 className="text-base font-semibold leading-7 text-gray-900">Une solution complète</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Tout ce dont vous avez besoin pour gérer votre entreprise
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                                <div className="flex flex-col">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        Comptabilité intelligente
                                    </dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">Extraction automatique des données avec OCR. Génération d'écritures comptables conformes au plan SYSCOHADA.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        Trésorerie prédictive
                                    </dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">Prévisions de flux de trésorerie basées sur l'historique. Alertes automatiques en cas de risque de rupture.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        CRM avancé
                                    </dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">Lead scoring automatique. Prédiction du churn. Recommandations personnalisées pour vos clients.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        Gestion de stock
                                    </dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">Optimisation des niveaux de stock. Prédiction de la demande. Alertes de rupture automatiques.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        Paiements mobiles
                                    </dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">Intégration complète avec Orange Money, MTN, Moov, Wave. Paiements par carte via Stripe.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        Intelligence artificielle
                                    </dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">Détection d'anomalies. Recommandations fiscales. Insights automatiques sur vos données.</p>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div id="pricing" className="bg-gray-50 py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl sm:text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Tarifs simples et transparents</h2>
                            <p className="mt-6 text-lg leading-8 text-gray-600">
                                Choisissez le plan adapté à votre entreprise
                            </p>
                        </div>
                        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
                            {/* Starter */}
                            <div className="rounded-3xl bg-white p-8 ring-1 ring-gray-200 sm:p-10 lg:rounded-l-3xl lg:rounded-r-none">
                                <h3 className="text-base font-semibold leading-7 text-gray-900">Starter</h3>
                                <p className="mt-4 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-bold tracking-tight text-gray-900">17,000</span>
                                    <span className="text-base text-gray-500">FCFA/mois</span>
                                </p>
                                <p className="mt-6 text-base leading-7 text-gray-600">Pour les TPE et freelances</p>
                                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Jusqu'à 3 utilisateurs
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        5 clients maximum
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        50 documents OCR/mois
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        5GB de stockage
                                    </li>
                                </ul>
                                <Link href="/register" className="mt-8 block rounded-lg bg-gray-900 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-gray-800">
                                    Commencer
                                </Link>
                            </div>

                            {/* Business - Featured */}
                            <div className="relative rounded-3xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-900 sm:p-10">
                                <div className="absolute -top-5 left-0 right-0">
                                    <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900">
                                        Le plus populaire
                                    </div>
                                </div>
                                <h3 className="text-base font-semibold leading-7 text-white">Business</h3>
                                <p className="mt-4 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-bold tracking-tight text-white">60,000</span>
                                    <span className="text-base text-gray-400">FCFA/mois</span>
                                </p>
                                <p className="mt-6 text-base leading-7 text-gray-300">Pour les PME en croissance</p>
                                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Jusqu'à 15 utilisateurs
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        50 clients maximum
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        500 documents OCR/mois
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        50GB de stockage
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Support prioritaire
                                    </li>
                                </ul>
                                <Link href="/register" className="mt-8 block rounded-lg bg-white px-3.5 py-2.5 text-center text-sm font-semibold text-gray-900 hover:bg-gray-100">
                                    Commencer
                                </Link>
                            </div>

                            {/* Enterprise */}
                            <div className="rounded-3xl bg-white p-8 ring-1 ring-gray-200 sm:p-10 lg:rounded-l-none lg:rounded-r-3xl">
                                <h3 className="text-base font-semibold leading-7 text-gray-900">Enterprise</h3>
                                <p className="mt-4 flex items-baseline gap-x-2">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900">Sur mesure</span>
                                </p>
                                <p className="mt-6 text-base leading-7 text-gray-600">Pour les grandes organisations</p>
                                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Utilisateurs illimités
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        OCR illimité
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Stockage personnalisé
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-6 w-5 flex-none text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Support 24/7
                                    </li>
                                </ul>
                                <a href="#contact" className="mt-8 block rounded-lg bg-gray-900 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-gray-800">
                                    Nous contacter
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Prêt à simplifier votre gestion ?
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
                                Essayez SEKA gratuitement pendant 14 jours. Aucune carte bancaire requise.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link href="/register" className="rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">
                                    Commencer gratuitement
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact */}
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
                                <label htmlFor="email-address" className="sr-only">
                                    Email
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="min-w-0 flex-auto rounded-lg border border-gray-300 px-3.5 py-2 text-gray-900 shadow-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 sm:text-sm sm:leading-6"
                                    placeholder="Votre email"
                                />
                                <button
                                    type="submit"
                                    className="flex-none rounded-lg bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                                >
                                    S'inscrire
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Produit</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#features" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Fonctionnalités</a></li>
                                    <li><a href="#pricing" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Tarifs</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Démo</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Support</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Documentation</a></li>
                                    <li><a href="#contact" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Contact</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">FAQ</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Entreprise</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">À propos</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Blog</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900">Légal</h3>
                                <ul className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Confidentialité</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-gray-600 hover:text-gray-900">CGU</a></li>
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
