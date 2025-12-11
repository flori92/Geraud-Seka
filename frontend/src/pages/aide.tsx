import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { HelpCircle, Book, Video, MessageCircle, Mail, Phone, FileText } from "lucide-react";

export default function AidePage() {
  const helpCategories = [
    { title: "Documentation", icon: Book, description: "Guides et tutoriels complets", count: "50+ articles" },
    { title: "Vidéos", icon: Video, description: "Tutoriels vidéo pas à pas", count: "20+ vidéos" },
    { title: "FAQ", icon: HelpCircle, description: "Questions fréquemment posées", count: "100+ réponses" },
  ];

  const contactOptions = [
    { title: "Chat en direct", icon: MessageCircle, description: "Réponse en quelques minutes", action: "Démarrer le chat" },
    { title: "Email", icon: Mail, description: "support@seka-erp.com", action: "Envoyer un email" },
    { title: "Téléphone", icon: Phone, description: "+33 1 XX XX XX XX", action: "Nous appeler" },
  ];

  return (
    <DashboardLayout title="Aide et Support">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Centre d'Aide</h1>
          <p className="text-gray-600">Nous sommes là pour vous aider à réussir avec SEKA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {helpCategories.map((category) => (
            <Card key={category.title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <category.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{category.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
              <p className="text-xs text-primary font-medium">{category.count}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Articles populaires</h2>
          <div className="space-y-3">
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
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4">Contacter le support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactOptions.map((option) => (
              <Card key={option.title} className="p-6">
                <option.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{option.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                <button className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  {option.action}
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
