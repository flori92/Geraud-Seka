import Head from 'next/head';
import { FileText } from 'lucide-react';

export default function TermsPage() {
    return (
        <>
            <Head>
                <title>Conditions Générales d'Utilisation - SEKA</title>
                <meta name="description" content="Conditions générales d'utilisation de SEKA ERP" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-4xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
                        </div>
                        <p className="text-gray-600">Dernière mise à jour : 25 novembre 2025</p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des conditions</h2>
                            <p className="text-gray-600 leading-relaxed">
                                En accédant et en utilisant la plateforme SEKA, vous acceptez d'être lié par les présentes conditions
                                générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du service</h2>
                            <p className="text-gray-600 leading-relaxed">
                                SEKA est une plateforme ERP (Enterprise Resource Planning) qui fournit des outils de gestion pour :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                                <li>La gestion de la relation client (CRM)</li>
                                <li>La comptabilité et la finance</li>
                                <li>Les ressources humaines</li>
                                <li>La gestion des stocks</li>
                                <li>La trésorerie et les flux de paiement</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compte utilisateur</h2>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Création de compte</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Pour utiliser SEKA, vous devez créer un compte en fournissant des informations exactes, complètes et à jour.
                                Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Responsabilité du compte</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Vous êtes responsable de toutes les activités effectuées sous votre compte. En cas d'utilisation non autorisée,
                                vous devez immédiatement nous en informer.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Abonnement et paiement</h2>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Plans d'abonnement</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                SEKA propose plusieurs plans d'abonnement (Starter, Business, Enterprise). Les tarifs sont indiqués sur notre
                                page de tarification et sont facturés mensuellement ou annuellement selon votre choix.
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">4.2 Paiement</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Les paiements sont effectués via Stripe (cartes bancaires) ou KKiaPay (Mobile Money). Les frais d'abonnement
                                sont prélevés automatiquement à chaque période de facturation.
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">4.3 Annulation</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Vous pouvez annuler votre abonnement à tout moment. L'annulation prend effet à la fin de la période de
                                facturation en cours. Aucun remboursement n'est accordé pour les périodes déjà payées.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Utilisation acceptable</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                Vous vous engagez à ne pas :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li>Utiliser le service à des fins illégales ou frauduleuses</li>
                                <li>Tenter d'accéder à des comptes ou des données d'autres utilisateurs</li>
                                <li>Perturber ou interférer avec la sécurité ou le fonctionnement du service</li>
                                <li>Utiliser le service pour envoyer du spam ou du contenu malveillant</li>
                                <li>Copier, modifier ou distribuer le code source de la plateforme</li>
                                <li>Utiliser des robots ou scripts automatisés sans autorisation</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriété intellectuelle</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Tous les droits de propriété intellectuelle relatifs à SEKA (code, design, logo, marques) appartiennent à SEKA
                                ou à ses concédants de licence. Vous conservez la propriété de vos données, mais nous accordez une licence
                                pour les héberger et les traiter dans le cadre de la fourniture de nos services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Garanties et responsabilités</h2>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">7.1 Disponibilité du service</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Nous nous efforçons de maintenir le service disponible 24/7, mais ne garantissons pas une disponibilité
                                continue. Des interruptions peuvent survenir pour maintenance ou raisons techniques.
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">7.2 Limitation de responsabilité</h3>
                            <p className="text-gray-600 leading-relaxed">
                                SEKA n'est pas responsable des dommages indirects, accessoires ou consécutifs résultant de l'utilisation ou
                                de l'impossibilité d'utiliser le service. Notre responsabilité totale est limitée au montant payé par vous
                                au cours des 12 derniers mois.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Résiliation</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation de ces conditions,
                                de non-paiement, ou d'utilisation abusive du service. En cas de résiliation, vos données seront supprimées
                                conformément à notre politique de confidentialité.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications des conditions</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Nous pouvons modifier ces conditions à tout moment. Les modifications importantes vous seront notifiées
                                par email au moins 30 jours avant leur entrée en vigueur. Votre utilisation continue du service après
                                l'entrée en vigueur constitue votre acceptation des nouvelles conditions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Droit applicable</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Ces conditions sont régies par les lois de la République du Bénin. Tout litige sera soumis à la juridiction
                                exclusive des tribunaux de Cotonou, Bénin.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Pour toute question concernant ces conditions :
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-700"><strong>Email</strong> : legal@sekagestion.com</p>
                                <p className="text-gray-700"><strong>Adresse</strong> : SEKA, Cotonou, Bénin</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
