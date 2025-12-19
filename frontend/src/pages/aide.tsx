import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { HelpCircle, Book, Video, MessageCircle, Mail, Phone, FileText } from "lucide-react";

export default function AidePage() {
  const helpCategories = [
    { title: "Documentation", icon: Book, description: "Guides et tutoriels complets", count: "50+ articles", color: "bg-blue-100 text-blue-600" },
    { title: "Vidéos", icon: Video, description: "Tutoriels vidéo pas à pas", count: "20+ vidéos", color: "bg-purple-100 text-purple-600" },
    { title: "FAQ", icon: HelpCircle, description: "Questions fréquemment posées", count: "100+ réponses", color: "bg-green-100 text-green-600" },
  ];

  const contactOptions = [
    { title: "Chat en direct", icon: MessageCircle, description: "Réponse en quelques minutes", action: "Démarrer le chat" },
    { title: "Email", icon: Mail, description: "support@seka-erp.com", action: "Envoyer un email" },
    { title: "Téléphone", icon: Phone, description: "+33 1 XX XX XX XX", action: "Nous appeler" },
  ];

  return (
    <>
      <Head>
        <title>Aide et Support - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Aide et Support</h1>
                <p className="text-sm text-gray-600 mt-0.5">Nous sommes là pour vous aider à réussir avec SEKA</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6 max-w-5xl">
            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {helpCategories.map((category) => (
                <div key={category.title} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center mb-3`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <p className="text-xs text-[#1e3a5f] font-medium">{category.count}</p>
                </div>
              ))}
            </div>

            {/* Popular Articles */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Articles populaires</h2>
              <div className="space-y-2">
                {[
                  "Comment créer une facture ?",
                  "Importer des transactions bancaires",
                  "Configurer le plan comptable OHADA",
                  "Générer un rapport de TVA",
                  "Clôturer un exercice comptable"
                ].map((article, idx) => (
                  <a key={idx} href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{article}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacter le support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contactOptions.map((option) => (
                  <div key={option.title} className="bg-white rounded-lg border border-gray-200 p-6">
                    <option.icon className="h-6 w-6 text-[#1e3a5f] mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                    <button className="w-full py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] transition-colors text-sm">
                      {option.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
