import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Sparkles, MessageSquare, Lightbulb, Calculator } from "lucide-react";

export default function AssistantPage() {
  return (
    <>
      <Head><title>ComptAssistant - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] px-6 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">ComptAssistant IA</h1>
            </div>
            <p className="text-white/80">Votre assistant comptable intelligent, disponible 24/7</p>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Questions comptables</h3>
                <p className="text-sm text-gray-600">Posez vos questions sur la comptabilité, la fiscalité et la gestion</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Lightbulb className="h-8 w-8 text-yellow-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Suggestions intelligentes</h3>
                <p className="text-sm text-gray-600">Recevez des recommandations basées sur votre activité</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Calculator className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Calculs automatiques</h3>
                <p className="text-sm text-gray-600">Obtenez des calculs de TVA, amortissements, etc.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Posez votre question à ComptAssistant</label>
                  <div className="flex gap-3">
                    <input type="text" placeholder="Ex: Comment calculer ma TVA collectée ce mois-ci ?"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                    <button className="px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] transition-colors flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Demander
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
                      "Qu&apos;est-ce qu&apos;un FEC ?"
                    ].map((q, i) => (
                      <button key={i} className="text-left px-4 py-2 border border-gray-200 rounded-lg hover:border-[#1e3a5f] hover:bg-blue-50 transition-colors text-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
