import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Intégrer avec API newsletter
        alert(`Merci ! Nous vous contacterons sur ${email}`);
        setEmail('');
    };

    return (
        <>
            <Head>
                <title>SEKA - ERP/CRM Intelligent pour PME Africaines</title>
                <meta name="description" content="Gérez votre comptabilité, trésorerie, clients et RH avec l'intelligence artificielle. Solution tout-en-un pour PME et cabinets comptables en Afrique." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-white">
                {/* Navigation */}
                <nav className="border-b border-gray-200">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold text-gray-900">SEKA</h1>
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-center space-x-8">
                                    <a href="#features" className="text-gray-700 hover:text-gray-900">Fonctionnalités</a>
                                    <a href="#pricing" className="text-gray-700 hover:text-gray-900">Tarifs</a>
                                    <a href="#contact" className="text-gray-700 hover:text-gray-900">Contact</a>
                                    <Link href="/login" className="text-gray-700 hover:text-gray-900">
                                        Connexion
                                    </Link>
                                    <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                        Essai Gratuit
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                                L'ERP/CRM Intelligent
                                <br />
                                <span className="text-blue-600">pour l'Afrique</span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                                Gérez votre comptabilité, trésorerie, clients et RH en un seul endroit.
                                Avec l'IA intégrée pour vous faire gagner du temps et optimiser vos finances.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-4">
                                <Link href="/register" className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700">
                                    Commencer Gratuitement
                                </Link>
                                <a href="#demo" className="rounded-lg border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-900 hover:border-gray-400">
                                    Voir la Démo
                                </a>
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                                14 jours d'essai gratuit • Sans carte bancaire • Annulation à tout moment
                            </p>
                        </div>
                    </div>

                    {/* Animated Background */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-100 opacity-50 blur-3xl"></div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="border-y border-gray-200 bg-gray-50 py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm font-semibold text-gray-500">
                            Déjà utilisé par des entreprises en Afrique de l'Ouest
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
                            {['Bénin', 'Côte d\'Ivoire', 'Sénégal', 'Togo'].map((country) => (
                                <div key={country} className="flex justify-center">
                                    <div className="text-lg font-semibold text-gray-400">{country}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                Tout ce dont vous avez besoin
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Une solution complète pour gérer votre entreprise efficacement
                            </p>
                        </div>

                        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                                    <span className="text-2xl text-white">📊</span>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">Comptabilité Intelligente</h3>
                                <p className="mt-2 text-gray-600">
                                    Extraction automatique des factures avec OCR. Génération d'écritures comptables conformes SYSCOHADA.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                                    <span className="text-2xl text-white">💰</span>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">Trésorerie Prédictive</h3>
                                <p className="mt-2 text-gray-600">
                                    Prévision de flux de trésorerie avec IA. Alertes automatiques sur les risques de rupture.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
                                    <span className="text-2xl text-white">👥</span>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">CRM Avancé</h3>
                                <p className="mt-2 text-gray-600">
                                    Lead scoring automatique. Prédiction du churn. Recommandations personnalisées.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-600">
                                    <span className="text-2xl text-white">📦</span>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">Gestion Stock</h3>
                                <p className="mt-2 text-gray-600">
                                    Optimisation des niveaux de stock. Prédiction de la demande. Alertes rupture.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600">
                                    <span className="text-2xl text-white">💳</span>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">Paiements Mobiles</h3>
                                <p className="mt-2 text-gray-600">
                                    Orange Money, MTN, Moov, Wave. Paiements par carte Stripe. Facturation automatique.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600">
                                    <span className="text-2xl text-white">🤖</span>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">Intelligence Artificielle</h3>
                                <p className="mt-2 text-gray-600">
                                    Détection d'anomalies. Recommandations fiscales. Insights automatiques sur vos données.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Section - Premium Design */}
                <div id="pricing" className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24">
                    {/* Background decoration */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-100 opacity-20 blur-3xl"></div>
                        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-100 opacity-20 blur-3xl"></div>
                    </div>

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                                💎 Tarification
                            </span>
                            <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                                Des Plans qui S'Adaptent
                                <br />
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    à Votre Croissance
                                </span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                                Économisez jusqu'à 20% avec la facturation annuelle
                            </p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <span className={`text-sm font-medium ${!useState ? 'text-gray-900' : 'text-gray-500'}`}>
                                Mensuel
                            </span>
                            <button
                                onClick={() => { }}
                                className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                            >
                                <span className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform translate-x-1" />
                            </button>
                            <span className="text-sm font-medium text-gray-500">
                                Annuel
                                <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                    -20%
                                </span>
                            </span>
                        </div>

                        {/* Pricing Cards */}
                        <div className="mt-16 grid gap-8 lg:grid-cols-3">
                            {/* Starter Plan */}
                            <div className="group relative rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
                                    <span className="text-4xl">🚀</span>
                                </div>
                                <p className="mt-4 text-gray-600">Pour les TPE et freelances</p>

                                <div className="mt-8">
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-bold tracking-tight text-gray-900">17,000</span>
                                        <span className="ml-2 text-lg text-gray-600">FCFA</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">par mois</p>
                                </div>

                                <ul className="mt-8 space-y-4">
                                    {[
                                        'Jusqu\'à 3 utilisateurs',
                                        '5 clients maximum',
                                        'OCR 50 documents/mois',
                                        '5GB de stockage',
                                        'Support par email',
                                        'Mises à jour incluses'
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className="mt-10 block w-full rounded-xl border-2 border-gray-900 bg-white py-3.5 text-center font-semibold text-gray-900 transition-all hover:bg-gray-900 hover:text-white"
                                >
                                    Commencer
                                </Link>
                            </div>

                            {/* Business Plan - Featured */}
                            <div className="group relative rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 shadow-2xl transition-all duration-300 hover:shadow-blue-500/50 hover:-translate-y-2 scale-105">
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                                        ⭐ LE PLUS POPULAIRE
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-white">Business</h3>
                                    <span className="text-4xl">💼</span>
                                </div>
                                <p className="mt-4 text-blue-100">Pour les PME en croissance</p>

                                <div className="mt-8">
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-bold tracking-tight text-white">60,000</span>
                                        <span className="ml-2 text-lg text-blue-100">FCFA</span>
                                    </div>
                                    <p className="mt-1 text-sm text-blue-200">par mois</p>
                                </div>

                                <ul className="mt-8 space-y-4">
                                    {[
                                        'Jusqu\'à 15 utilisateurs',
                                        '50 clients maximum',
                                        'OCR 500 documents/mois',
                                        '50GB de stockage',
                                        'IA avancée incluse',
                                        'Support prioritaire',
                                        'Rapports personnalisés',
                                        'API & Intégrations'
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <svg className="h-5 w-5 flex-shrink-0 text-blue-200 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-white font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className="mt-10 block w-full rounded-xl bg-white py-3.5 text-center font-bold text-blue-600 transition-all hover:bg-blue-50 hover:shadow-lg"
                                >
                                    Commencer Maintenant
                                </Link>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="group relative rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                                    <span className="text-4xl">🏢</span>
                                </div>
                                <p className="mt-4 text-gray-600">Pour les grandes organisations</p>

                                <div className="mt-8">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold tracking-tight text-gray-900">Sur mesure</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">devis personnalisé</p>
                                </div>

                                <ul className="mt-8 space-y-4">
                                    {[
                                        'Utilisateurs illimités',
                                        'Clients illimités',
                                        'OCR illimité',
                                        'Stockage personnalisé',
                                        'IA sur-mesure',
                                        'Support 24/7 dédié',
                                        'Formation personnalisée',
                                        'Développement custom',
                                        'SLA garanti à 99.9%',
                                        'Hébergement dédié'
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <svg className="h-5 w-5 flex-shrink-0 text-purple-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href="#contact"
                                    className="mt-10 block w-full rounded-xl border-2 border-purple-600 bg-white py-3.5 text-center font-semibold text-purple-600 transition-all hover:bg-purple-600 hover:text-white"
                                >
                                    Contactez-nous
                                </a>
                            </div>
                        </div>

                        {/* Trust Signals */}
                        <div className="mt-16 text-center">
                            <div className="inline-flex flex-wrap items-center justify-center gap-8 rounded-2xl bg-gray-50 px-8 py-6">
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">14 jours d'essai gratuit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Aucune carte requise</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Annulation flexible</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-blue-600 py-16">
                    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-white sm:text-4xl">
                            Prêt à transformer votre gestion ?
                        </h2>
                        <p className="mt-4 text-lg text-blue-100">
                            Rejoignez les entreprises qui font confiance à SEKA
                        </p>
                        <div className="mt-8">
                            <Link href="/register" className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-gray-100">
                                Essayer Gratuitement 14 Jours
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div id="contact" className="py-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Restons en Contact
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Inscrivez-vous à notre newsletter pour recevoir les dernières actualités
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-10">
                            <div className="flex gap-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
                                >
                                    S'inscrire
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-gray-50 py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 md:grid-cols-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">SEKA</h3>
                                <p className="mt-4 text-sm text-gray-600">
                                    ERP/CRM intelligent pour PME africaines
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Produit</h4>
                                <ul className="mt-4 space-y-2">
                                    <li><a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Fonctionnalités</a></li>
                                    <li><a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Tarifs</a></li>
                                    <li><a href="#demo" className="text-sm text-gray-600 hover:text-gray-900">Démo</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Support</h4>
                                <ul className="mt-4 space-y-2">
                                    <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Documentation</a></li>
                                    <li><a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</a></li>
                                    <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
                                <ul className="mt-4 space-y-2">
                                    <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Confidentialité</a></li>
                                    <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">CGU</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
                            <p className="text-sm text-gray-600">
                                © 2025 SEKA. Tous droits réservés. Made with ❤️ for Africa.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
