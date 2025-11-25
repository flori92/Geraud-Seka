import Head from 'next/head';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <>
            <Head>
                <title>Politique de Confidentialité - SEKA</title>
                <meta name="description" content="Politique de confidentialité de SEKA ERP" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-4xl font-bold text-gray-900">Politique de Confidentialité</h1>
                        </div>
                        <p className="text-gray-600">Dernière mise à jour : 25 novembre 2025</p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                            <p className="text-gray-600 leading-relaxed">
                                SEKA s'engage à protéger et respecter votre vie privée. Cette politique décrit comment nous collectons,
                                utilisons et protégeons vos données personnelles lorsque vous utilisez notre plateforme ERP.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données collectées</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                Nous collectons les données suivantes :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li><strong>Informations d'identification</strong> : nom, email, numéro de téléphone</li>
                                <li><strong>Données d'entreprise</strong> : nom de l'entreprise, secteur d'activité, données comptables</li>
                                <li><strong>Données d'utilisation</strong> : logs de connexion, fonctionnalités utilisées, préférences</li>
                                <li><strong>Données de paiement</strong> : informations de carte bancaire (via Stripe) ou Mobile Money (via KKiaPay)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation des données</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                Vos données sont utilisées pour :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li>Fournir et améliorer nos services ERP</li>
                                <li>Traiter vos paiements et gérer votre abonnement</li>
                                <li>Vous envoyer des notifications importantes concernant votre compte</li>
                                <li>Analyser l'utilisation de la plateforme pour améliorer l'expérience utilisateur</li>
                                <li>Respecter nos obligations légales et réglementaires</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Protection des données</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                                <li>Cryptage SSL/TLS pour toutes les transmissions de données</li>
                                <li>Serveurs hébergés dans des data centers certifiés ISO 27001</li>
                                <li>Sauvegardes quotidiennes automatiques</li>
                                <li>Accès restreint aux données personnelles</li>
                                <li>Authentification à deux facteurs disponible</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partage des données</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous ne vendons jamais vos données. Nous partageons vos données uniquement avec :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                                <li><strong>Prestataires de services</strong> : Stripe (paiements), KKiaPay (Mobile Money), Mindee (OCR)</li>
                                <li><strong>Autorités légales</strong> : si requis par la loi ou pour protéger nos droits</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vos droits</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                Conformément au RGPD et aux lois locales sur la protection des données, vous avez le droit de :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li>Accéder à vos données personnelles</li>
                                <li>Rectifier vos données inexactes</li>
                                <li>Supprimer vos données (droit à l'oubli)</li>
                                <li>Limiter le traitement de vos données</li>
                                <li>Exporter vos données (portabilité)</li>
                                <li>Vous opposer au traitement de vos données</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous utilisons des cookies essentiels pour le fonctionnement de la plateforme et des cookies analytiques
                                pour améliorer nos services. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Conservation des données</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous conservons vos données personnelles aussi longtemps que votre compte est actif ou selon les exigences légales.
                                Après suppression de votre compte, vos données sont anonymisées ou supprimées dans un délai de 30 jours,
                                sauf obligation légale de conservation plus longue.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Pour toute question concernant cette politique ou pour exercer vos droits, contactez-nous :
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-700"><strong>Email</strong> : privacy@sekagestion.com</p>
                                <p className="text-gray-700"><strong>Adresse</strong> : SEKA, Cotonou, Bénin</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. Les modifications
                                importantes vous seront notifiées par email ou via la plateforme.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
