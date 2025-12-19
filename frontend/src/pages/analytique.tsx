import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { BarChart3, PieChart, TrendingUp, Filter } from "lucide-react";

export default function AnalytiquePage() {
  return (
    <>
      <Head><title>Analytique - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><BarChart3 className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Analytique</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Analyse multidimensionnelle de votre activité</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Filter className="h-4 w-4" /> Filtres
              </button>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Par Centre de Coûts</h3>
                </div>
                <p className="text-sm text-gray-600">Configurez vos centres analytiques pour suivre la rentabilité par projet, département ou activité.</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <PieChart className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Répartition CA</h3>
                </div>
                <p className="text-sm text-gray-600">Visualisez la distribution de votre chiffre d&apos;affaires par axe analytique.</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Évolution Charges</h3>
                </div>
                <p className="text-sm text-gray-600">Suivez l&apos;évolution de vos charges par centre de coûts.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration requise</h3>
                <p className="text-gray-600 mb-4">Pour activer l&apos;analytique, configurez d&apos;abord vos axes analytiques dans les paramètres.</p>
                <button className="px-6 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  Configurer les axes analytiques
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
