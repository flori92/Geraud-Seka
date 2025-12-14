import Head from 'next/head';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    {
        category: 'Général',
        question: 'Qu\'est-ce que SEKA ?',
        answer: 'SEKA est une plateforme ERP complète conçue pour les entreprises africaines. Elle centralise la gestion de votre comptabilité, CRM, ressources humaines, trésorerie et stocks dans une seule solution intelligente.'
    },
    {
        category: 'Général',
        question: 'Pour qui est destiné SEKA ?',
        answer: 'SEKA est conçu pour les PME et startups africaines qui cherchent à digitaliser leurs opérations. Notre solution s\'adapte aux spécificités du marché africain, notamment le Mobile Money et les réglementations locales.'
    },
    {
        category: 'Tarification',
        question: 'Quels sont les modes de paiement acceptés ?',
        answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard) via Stripe et le Mobile Money (Orange Money, MTN Mobile Money, Moov Money, Wave) via KKiaPay.'
    },
    {
        category: 'Tarification',
        question: 'Puis-je changer de plan à tout moment ?',
        answer: 'Oui, vous pouvez passer à un plan supérieur immédiatement. Si vous souhaitez rétrograder, le changement prendra effet à la fin de votre période de facturation en cours.'
    },
    {
        category: 'Tarification',
        question: 'Y a-t-il une période d\'essai gratuite ?',
        answer: 'Oui, nous offrons une période d\'essai de 14 jours sur tous nos plans. Aucune carte bancaire n\'est requise pour commencer.'
    },
    {
        category: 'Fonctionnalités',
        question: 'Est-ce que SEKA gère l\'OCR pour les documents ?',
        answer: 'Oui, SEKA intègre l\'OCR via Mindee pour extraire automatiquement les données de vos factures et documents. Cette fonctionnalité vous fait gagner un temps considérable dans la saisie manuelle.'
    },
    {
        category: 'Fonctionnalités',
        question: 'Puis-je gérer plusieurs entreprises ?',
        answer: 'Oui, SEKA est multi-tenant. Vous pouvez gérer plusieurs entreprises depuis un seul compte et basculer facilement entre elles.'
    },
    {
        category: 'Support',
        question: 'Comment contacter le support ?',
        answer: 'Vous pouvez nous contacter via email à support@sekagestion.com ou via le formulaire de contact sur notre site. Notre équipe répond généralement sous 24h.'
    },
    {
        category: 'Support',
        question: 'Y a-t-il une formation disponible ?',
        answer: 'Oui, nous proposons des tutoriels vidéo, une documentation complète et des sessions de formation en ligne pour vous aider à tirer le meilleur parti de SEKA.'
    },
    {
        category: 'Sécurité',
        question: 'Mes données sont-elles sécurisées ?',
        answer: 'Absolument. Nous utilisons un cryptage SSL/TLS, nos serveurs sont hébergés sur des infrastructures certifiées, et nous effectuons des sauvegardes quotidiennes automatiques.'
    },
];

function FAQAccordion({ item }: { item: FAQItem }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-left hover:text-indigo-600 transition-colors"
            >
                <span className="font-medium text-gray-900">{item.question}</span>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 ml-4" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-4" />
                )}
            </button>
            {isOpen && (
                <div className="pb-4 text-gray-600">
                    {item.answer}
                </div>
            )}
        </div>
    );
}

export default function FAQPage() {
    const categories = Array.from(new Set(faqData.map(item => item.category)));

    return (
        <>
            <Head>
                <title>FAQ - SEKA</title>
                <meta name="description" content="Questions fréquemment posées sur SEKA ERP" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Questions Fréquemment Posées
                        </h1>
                        <p className="text-xl text-gray-600">
                            Trouvez rapidement des réponses à vos questions sur SEKA
                        </p>
                    </div>
                </div>

                {/* FAQ Content */}
                <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    {categories.map((category) => (
                        <div key={category} className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                {faqData
                                    .filter(item => item.category === category)
                                    .map((item, index) => (
                                        <FAQAccordion key={index} item={item} />
                                    ))}
                            </div>
                        </div>
                    ))}

                    {/* Contact CTA */}
                    <div className="bg-indigo-50 rounded-lg p-8 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Vous n'avez pas trouvé votre réponse ?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Notre équipe est là pour vous aider
                        </p>
                        <a
                            href="/landing#contact"
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Nous contacter
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
