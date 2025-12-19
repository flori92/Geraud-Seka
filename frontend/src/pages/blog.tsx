import Head from 'next/head';
import { Calendar, User, ArrowRight } from 'lucide-react';

const blogPosts = [
    {
        title: 'Comment digitaliser votre comptabilité en 5 étapes',
        excerpt: 'Découvrez notre guide complet pour passer d\'une comptabilité manuelle à un système digital efficace.',
        author: 'Équipe SEKA',
        date: '15 Nov 2025',
        category: 'Comptabilité',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    },
    {
        title: 'Mobile Money : L\'avenir des paiements B2B en Afrique',
        excerpt: 'Analyse des tendances et opportunités du Mobile Money pour les transactions professionnelles.',
        author: 'Équipe SEKA',
        date: '10 Nov 2025',
        category: 'Finance',
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    },
    {
        title: 'CRM : 10 astuces pour booster vos ventes',
        excerpt: 'Optimisez votre gestion client avec ces techniques éprouvées par nos utilisateurs.',
        author: 'Équipe SEKA',
        date: '5 Nov 2025',
        category: 'CRM',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    },
    {
        title: 'L\'IA au service de la gestion d\'entreprise',
        excerpt: 'Comment l\'intelligence artificielle transforme la gestion quotidienne des PME africaines.',
        author: 'Équipe SEKA',
        date: '1 Nov 2025',
        category: 'Innovation',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    },
];

export default function BlogPage() {
    return (
        <>
            <Head>
                <title>Blog - SEKA</title>
                <meta name="description" content="Conseils, actualités et bonnes pratiques pour la gestion d'entreprise" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog SEKA</h1>
                        <p className="text-xl text-gray-600">
                            Conseils, actualités et bonnes pratiques pour optimiser la gestion de votre entreprise
                        </p>
                    </div>
                </div>

                {/* Blog Posts Grid */}
                <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
                        {blogPosts.map((post, index) => (
                            <article
                                key={index}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                            >
                                <div className="aspect-video bg-gray-200 overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                            {post.category}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {post.date}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <User className="h-4 w-4" />
                                            {post.author}
                                        </div>
                                        <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                                            Lire plus
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Newsletter CTA */}
                    <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center text-white">
                        <h3 className="text-2xl font-bold mb-3">Restez informé</h3>
                        <p className="mb-6 text-indigo-100">
                            Recevez nos derniers articles et conseils directement dans votre boîte mail
                        </p>
                        <div className="flex gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Votre email"
                                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                            />
                            <button className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                                S&apos;abonner
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
