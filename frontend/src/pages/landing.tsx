import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Merci ! Nous vous contacterons sur ${email}`);
        setEmail('');
    };

    const faqs = [
        {
            question: "Comment fonctionne la période d'essai ?",
            answer: "Vous bénéficiez de 14 jours d'essai gratuit sans carte bancaire. Explorez toutes les fonctionnalités premium sans restriction."
        },
        {
            question: "Puis-je changer de plan à tout moment ?",
            answer: "Absolument ! Vous pouvez upgrader, downgrader ou annuler votre abonnement à tout moment depuis votre tableau de bord."
        },
        {
            question: "SEKA est-il conforme au SYSCOHADA ?",
            answer: "Oui, 100% ! SEKA génère automatiquement des écritures comptables conformes au plan comptable SYSCOHADA."
        },
        {
            question: "Mes données sont-elles sécurisées ?",
            answer: "Vos données sont chiffrées end-to-end et hébergées sur des serveurs sécurisés. Nous sommes conformes aux standards internationaux de sécurité."
        }
    ];

    const testimonials = [
        {
            name: "Amina Diallo",
            role: "CEO, TechAfrika",
            content: "SEKA a transformé notre gestion. L'OCR nous fait gagner 15h par semaine !",
            avatar: "👩🏾‍💼"
        },
        {
            name: "Koffi Mensah",
            role: "Expert-comptable, Accra",
            content: "Les prévisions de trésorerie par IA sont bluffantes. Un must-have pour tout cabinet.",
            avatar: "👨🏿‍💼"
        },
        {
            name: "Marie Kouassi",
            role: "DG, Ivoire Distribution",
            content: "Interface intuitive, support réactif. Exactement ce qu'on cherchait !",
            avatar: "👩🏽‍💼"
        }
    ];

    return (
        <>
            <Head>
                <title>SEKA - ERP/CRM Intelligent pour PME Africaines</title>
                <meta name="description" content="Gérez votre comptabilité, trésorerie, clients et RH avec l'intelligence artificielle. Solution tout-en-un pour PME et cabinets comptables en Afrique." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-white">
                {/* Navigation - Sticky */}
                <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                                    <span className="text-xl font-bold text-white">S</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">SEKA</h1>
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-center space-x-8">
                                    <a href="#features" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">Fonctionnalités</a>
                                    <a href="#pricing" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">Tarifs</a>
                                    <a href="#testimonials" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">Témoignages</a>
                                    <a href="#faq" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">FAQ</a>
                                    <Link href="/login" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
                                        Connexion
                                    </Link>
                                    <Link href="/register" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40">
                                        Essai Gratuit
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section - Modern */}
                <div className="relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
                        <div className="text-center">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                </span>
                                Nouveau : Intelligence Artificielle intégrée
                            </div>

                            {/* Headline */}
                            <h1 className="mt-8 text-6xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl">
                                L'ERP qui
                                <br />
                                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Comprend l'Afrique
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="mx-auto mt-8 max-w-2xl text-xl text-gray-600 leading-relaxed">
                                Gérez votre comptabilité, trésorerie, clients et RH en un seul endroit.
                                Avec l'IA qui automatise vos tâches répétitives.
                            </p>

                            {/* CTAs */}
                            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-blue-500/60">
                                    Commencer Gratuitement
                                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <a href="#demo" className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-all hover:border-gray-400 hover:shadow-lg">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Voir la Démo
                                </a>
                            </div>

                            {/* Trust signals */}
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    14 jours gratuits
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    Sans carte banc

                                    aire
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    Conforme SYSCOHADA
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Animated Background Gradients */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-400 to-pink-600 opacity-20 blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-600 opacity-10 blur-3xl"></div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="border-y border-gray-200 bg-gray-50 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                            Ils font confiance à SEKA
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
                            {['Bénin 🇧🇯', 'Côte d\'Ivoire 🇨🇮', 'Sénégal 🇸🇳', 'Togo 🇹🇬'].map((country) => (
                                <div key={country} className="flex justify-center">
                                    <div className="rounded-xl bg-white px-6 py-4 text-lg font-semibold text-gray-700 shadow-sm">{country}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-1.5 text-sm font-medium text-purple-700">
                                ✨ Fonctionnalités
                            </span>
                            <h2 className="mt-6 text-4xl font-bold text-gray-900 sm:text-5xl">
                                Tout Pour Gérer
                                <br />
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Votre Entreprise
                                </span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                                Des outils puissants et intelligents pour automatiser vos processus
                            </p>
                        </div>

                        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: '📊',
                                    title: 'Comptabilité Intelligente',
                                    description: 'OCR automatique des factures. Écritures conformes SYSCOHADA générées par IA.',
                                    gradient: 'from-blue-500 to-cyan-500'
                                },
                                {
                                    icon: '💰',
                                    title: 'Trés

orerie Prédictive',
                                    description: 'Prévisions de flux par ML. Alertes automatiques sur les risques.',
                            gradient: 'from-green-500 to-emerald-500'
                                },
                            {
                                icon: '👥',
                            title: 'CRM Avancé',
                            description: 'Lead scoring IA. Prédiction du churn. Recommandations personnalisées.',
                            gradient: 'from-purple-500 to-pink-500'
                                },
                            {
                                icon: '📦',
                            title: 'Gestion Stock',
                            description: 'Optimisation automatique. Prédiction demande. Alertes rupture.',
                            gradient: 'from-orange-500 to-red-500'
                                },
                            {
                                icon: '💳',
                            title: 'Paiements Mobiles',
                            description: 'Orange Money, MTN, Moov, Wave. Stripe. Facturation auto.',
                            gradient: 'from-red-500 to-pink-500'
                                },
                            {
                                icon: '🤖',
                            title: 'Intelligence IA',
                            description: 'Détection anomalies. Insights automatiques. Conseils fiscaux.',
                            gradient: 'from-indigo-500 to-purple-500'
                                }
                            ].map((feature) => (
                            <div key={feature.title} className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                                <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-2xl transition-all group-hover:opacity-20`}></div>
                                <div className="relative">
                                    <div className="text-5xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                                    <p className="mt-3 text-gray-600">{feature.description}</p>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* [Pricing section - déjà créée précédemment] */}

                {/* Testimonials */}
                <div id="testimonials" className="bg-gradient-to-b from-white to-gray-50 py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
                                💬 Témoignages
                            </span>
                            <h2 className="mt-6 text-4xl font-bold text-gray-900 sm:text-5xl">
                                Ce Que Disent
                                <br />
                                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    Nos Clients
                                </span>
                            </h2>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            {testimonials.map((testimonial) => (
                                <div key={testimonial.name} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="mt-6 text-gray-700 leading-relaxed">{testimonial.content}</p>
                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                            <p className="text-sm text-gray-600">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div id="faq" className="py-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700">
                                ❓ FAQ
                            </span>
                            <h2 className="mt-6 text-4xl font-bold text-gray-900">
                                Questions Fréquentes
                            </h2>
                        </div>

                        <div className="mt-12 space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                    <button
                                        onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                                        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
                                    >
                                        <span className="font-semibold text-gray-900">{faq.question}</span>
                                        <svg
                                            className={`h-5 w-5 text-gray-500 transition-transform ${faqOpen === index ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {faqOpen === index && (
                                        <div className="border-t border-gray-200 p-6 text-gray-600">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24">
                    <div className="absolute inset-0 bg-grid-white/10"></div>
                    <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                        <h2 className="text-4xl font-bold text-white sm:text-5xl">
                            Prêt à Transformer
                            <br />
                            Votre Gestion ?
                        </h2>
                        <p className="mt-6 text-xl text-blue-100">
                            Rejoignez des centaines d'entreprises africaines qui utilisent SEKA
                        </p>
                        <div className="mt-10">
                            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:shadow-white/20">
                                Essayer Gratuitement 14 Jours
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Contact/Newsletter */}
                <div id="contact" className="py-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Restez Informé
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Recevez nos dernières actualités et conseils
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-10">
                            <div className="flex gap-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className="flex-1 rounded-xl border border-gray-300 px-6 py-4 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                                >
                                    S'inscrire
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-gray-50 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-12 md:grid-cols-5">
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                                        <span className="text-xl font-bold text-white">S</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">SEKA</h3>
                                </div>
                                <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                                    L'ERP/CRM intelligent pensé pour les PME africaines.
                                    Automatisez, optimisez, croissez.
                                </p>
                                <div className="mt-6 flex gap-4">
                                    {['twitter', 'linkedin', 'facebook'].map((social) => (
                                        <a
                                            key={social}
                                            href={`#${social}`}
                                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300"
                                        >
                                            <span className="sr-only">{social}</span>
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Produit</h4>
                                <ul className="mt-4 space-y-2">
                                    {['Fonctionnalités', 'Tarifs', 'Démo', 'API'].map((item) => (
                                        <li key={item}>
                                            <a href={`#${item.toLowerCase()}`} className="text-sm text-gray-600 transition-colors hover:text-gray-900">{item}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Support</h4>
                                <ul className="mt-4 space-y-2">
                                    {['Documentation', 'Guides', 'Contact', 'FAQ'].map((item) => (
                                        <li key={item}>
                                            <a href={`#${item.toLowerCase()}`} className="text-sm text-gray-600 transition-colors hover:text-gray-900">{item}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Légal</h4>
                                <ul className="mt-4 space-y-2">
                                    {['Confidentialité', 'CGU', 'Mentions légales'].map((item) => (
                                        <li key={item}>
                                            <a href={`#${item.toLowerCase()}`} className="text-sm text-gray-600 transition-colors hover:text-gray-900">{item}</a>
                                        </li>
                                    ))}
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
