import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Sparkles, MessageSquare, Lightbulb, TrendingUp, Calculator } from "lucide-react";

export default function AssistantPage() {
  return (
    <DashboardLayout title="ComptAssistant">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-3xl font-bold">ComptAssistant IA</h1>
          </div>
          <p className="text-lg opacity-90">Votre assistant comptable intelligent, disponible 24/7</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">Questions comptables</h3>
            <p className="text-sm text-gray-600">Posez vos questions sur la comptabilité, la fiscalité et la gestion</p>
          </Card>

          <Card className="p-6">
            <Lightbulb className="h-8 w-8 text-yellow-600 mb-3" />
            <h3 className="font-semibold mb-2">Suggestions intelligentes</h3>
            <p className="text-sm text-gray-600">Recevez des recommandations basées sur votre activité</p>
          </Card>

          <Card className="p-6">
            <Calculator className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold mb-2">Calculs automatiques</h3>
            <p className="text-sm text-gray-600">Obtenez des calculs de TVA, amortissements, etc.</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Posez votre question à ComptAssistant</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: Comment calculer ma TVA collectée ce mois-ci ?"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Demander
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Questions fréquentes :</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Comment enregistrer une facture ?",
                  "Quelle est ma TVA à payer ?",
                  "Comment clôturer mon mois ?",
                  "Qu'est-ce qu'un FEC ?"
                ].map((q, i) => (
                  <button key={i} className="text-left px-4 py-2 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
