import Head from 'next/head';
import { Book, Code, Zap, Users, FileText, Settings } from 'lucide-react';

const docSections = [
    {
        title: 'Démarrage Rapide',
        icon: Zap,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        articles: [
            { title: 'Créer votre premier compte', link: '#' },
            { title: 'Configuration initiale', link: '#' },
            { title: 'Importer vos données', link: '#' },
            { title: 'Inviter votre équipe', link: '#' },
        ]
    },
    {
        title: 'Modules',
        icon: Settings,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        articles: [
            { title: 'CRM - Gérer vos clients et leads', link: '#' },
            { title: 'Comptabilité - Journal et balance', link: '#' },
            { title: 'RH - Employés et paies', link: '#' },
            { title: 'Trésorerie - Flux et prévisions', link: '#' },
            { title: 'Stock - Inventaire et mouvements', link: '#' },
        ]
    },
    {
        title: 'Intégrations',
        icon: Code,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        articles: [
            { title: 'API REST Documentation', link: '#' },
            { title: 'Webhooks et événements', link: '#' },
            { title: 'Intégration Mobile Money', link: '#' },
            { title: 'Export de données', link: '#' },
        ]
    },
    {
        title: 'Ressources',
        icon: Book,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        articles: [
            { title: 'Tutoriels vidéo', link: '#' },
            { title: 'Meilleures pratiques', link: '#' },
            { title: 'Études de cas', link: '#' },
            { title: 'Changelog', link: '#' },
        ]
    },
];

export default function DocsPage() {
    return (
        <>
            <Head>
                <title>Documentation - SEKA</title>
                <meta name="description" content="Documentation complète de SEKA ERP" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Book className="h-10 w-10" />
                            <h1 className="text-4xl font-bold">Documentation SEKA</h1>
                        </div>
                        <p className="text-xl text-indigo-100 max-w-2xl">
                            Guides complets, tutoriels et documentation technique pour tirer le meilleur parti de SEKA
                        </p>

                        {/* Search Bar */}
                        <div className="mt-8 max-w-2xl">
                            <input
                                type="text"
                                placeholder="Rechercher dans la documentation..."
                                className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Documentation Sections */}
                <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-2">
                        {docSections.map((section, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                                        <section.icon className={`h-6 w-6 ${section.color}`} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                                </div>

                                <ul className="space-y-2">
                                    {section.articles.map((article, articleIndex) => (
                                        <li key={articleIndex}>
                                            <a
                                                href={article.link}
                                                className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center"
                                            >
                                                <span className="mr-2">→</span>
                                                {article.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Help Section */}
                    <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <Users className="h-10 w-10 mx-auto mb-3 text-indigo-600" />
                                <h3 className="font-bold text-gray-900 mb-2">Support</h3>
                                <p className="text-gray-600 text-sm mb-3">
                                    Notre équipe est disponible pour vous aider
                                </p>
                                <a href="mailto:support@sekagestion.com" className="text-indigo-600 hover:underline text-sm">
                                    support@sekagestion.com
                                </a>
                            </div>

                            <div className="text-center">
                                <FileText className="h-10 w-10 mx-auto mb-3 text-indigo-600" />
                                <h3 className="font-bold text-gray-900 mb-2">API Reference</h3>
                                <p className="text-gray-600 text-sm mb-3">
                                    Documentation technique pour les développeurs
                                </p>
                                <a href="#" className="text-indigo-600 hover:underline text-sm">
                                    Voir la référence API
                                </a>
                            </div>

                            <div className="text-center">
                                <Zap className="h-10 w-10 mx-auto mb-3 text-indigo-600" />
                                <h3 className="font-bold text-gray-900 mb-2">Changelog</h3>
                                <p className="text-gray-600 text-sm mb-3">
                                    Découvrez les dernières mises à jour
                                </p>
                                <a href="#" className="text-indigo-600 hover:underline text-sm">
                                    Voir les nouveautés
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
