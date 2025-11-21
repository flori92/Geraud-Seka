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

                {/* Pricing Section */}
                <div id="pricing" className="bg-gray-50 py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                Tarifs Simples et Transparents
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Choisissez le plan adapté à votre entreprise
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 lg:grid-cols-3">
                            {/* Starter Plan */}
                            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
                                <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                                <p className="mt-4 text-gray-600">Pour les TPE et freelances</p>
                                <div className="mt-6">
                                    <span className="text-4xl font-bold text-gray-900">17,000</span>
                                    <span className="text-gray-600"> FCFA/mois</span>
                                </div>
                                <ul className="mt-8 space-y-4">
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Jusqu'à 3 utilisateurs</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">5 clients max</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">OCR 50 documents/mois</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">5GB stockage</span>
                                    </li>
                                </ul>
                                <Link href="/register" className="mt-8 block rounded-lg border-2 border-blue-600 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50">
                                    Commencer
                                </Link>
                            </div>

                            {/* Business Plan */}
                            <div className="rounded-2xl border-2 border-blue-600 bg-white p-8 relative">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                                    Populaire
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Business</h3>
                                <p className="mt-4 text-gray-600">Pour les PME en croissance</p>
                                <div className="mt-6">
                                    <span className="text-4xl font-bold text-gray-900">60,000</span>
                                    <span className="text-gray-600"> FCFA/mois</span>
                                </div>
                                <ul className="mt-8 space-y-4">
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Jusqu'à 15 utilisateurs</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">50 clients max</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">OCR 500 documents/mois</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">50GB stockage</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">IA avancée</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Support prioritaire</span>
                                    </li>
                                </ul>
                                <Link href="/register" className="mt-8 block rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700">
                                    Commencer
                                </Link>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
                                <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
                                <p className="mt-4 text-gray-600">Pour les grandes organisations</p>
                                <div className="mt-6">
                                    <span className="text-4xl font-bold text-gray-900">Sur Devis</span>
                                </div>
                                <ul className="mt-8 space-y-4">
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Utilisateurs illimités</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Clients illimités</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">OCR illimité</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Stockage personnalisé</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Support 24/7</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span className="text-gray-600">Développement sur-mesure</span>
                                    </li>
                                </ul>
                                <a href="#contact" className="mt-8 block rounded-lg border-2 border-gray-300 py-3 text-center font-semibold text-gray-900 hover:border-gray-400">
                                    Nous Contacter
                                </a>
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
