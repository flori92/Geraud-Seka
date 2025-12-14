import Head from 'next/head';
import { Target, Users, Zap, Globe } from 'lucide-react';

export default function AboutPage() {
    return (
        <>
            <Head>
                <title>À propos - SEKA</title>
                <meta name="description" content="Découvrez SEKA, la solution ERP pour les entreprises africaines" />
            </Head>

            <div className="min-h-screen bg-white">
                {/* Hero */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
                        <h1 className="text-5xl font-bold mb-6">À propos de SEKA</h1>
                        <p className="text-xl text-indigo-100 max-w-3xl">
                            Nous digitalisons la gestion des entreprises africaines avec une solution ERP moderne,
                            adaptée aux réalités du continent.
                        </p>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 mb-20">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="h-8 w-8 text-indigo-600" />
                                <h2 className="text-3xl font-bold text-gray-900">Notre Mission</h2>
                            </div>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Permettre à chaque entreprise africaine, quelle que soit sa taille, d'accéder à des
                                outils de gestion professionnels qui répondent aux spécificités du marché local :
                                Mobile Money, réglementations africaines, multilangue.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="h-8 w-8 text-indigo-600" />
                                <h2 className="text-3xl font-bold text-gray-900">Notre Vision</h2>
                            </div>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Devenir la référence en matière de solutions de gestion d'entreprise en Afrique,
                                en combinant innovation technologique et compréhension profonde des enjeux locaux.
                            </p>
                        </div>
                    </div>

                    {/* Values */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nos Valeurs</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Accessibilité</h3>
                                <p className="text-gray-600">
                                    Des outils puissants accessibles à toutes les entreprises, avec des tarifs adaptés
                                    au marché africain.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Globe className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Local First</h3>
                                <p className="text-gray-600">
                                    Conçu pour l'Afrique : Mobile Money, multilangue (FR, EN, PT),
                                    conformité aux normes locales.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Zap className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
                                <p className="text-gray-600">
                                    IA, OCR automatique, tableaux de bord intelligents pour une gestion
                                    optimale de votre entreprise.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team (placeholder) */}
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Une Équipe Passionnée</h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            SEKA est développé par une équipe d'experts en technologie et gestion d'entreprise,
                            basée en Afrique et comprenant les défis uniques du continent.
                        </p>
                        <a
                            href="/landing#contact"
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Rejoignez-nous
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
