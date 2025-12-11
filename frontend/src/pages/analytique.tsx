import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { BarChart3, PieChart, TrendingUp, Filter } from "lucide-react";

export default function AnalytiquePage() {
  return (
    <DashboardLayout title="Analytique">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytique</h1>
            <p className="text-sm text-gray-500 mt-1">Analyse multidimensionnelle de votre activité</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            <Filter className="h-4 w-4" />
            Filtres
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Par Centre de Coûts</h3>
            </div>
            <p className="text-sm text-gray-600">Configurez vos centres analytiques pour suivre la rentabilité par projet, département ou activité.</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Répartition CA</h3>
            </div>
            <p className="text-sm text-gray-600">Visualisez la distribution de votre chiffre d'affaires par axe analytique.</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Évolution Charges</h3>
            </div>
            <p className="text-sm text-gray-600">Suivez l'évolution de vos charges par centre de coûts.</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuration requise</h3>
            <p className="text-gray-600 mb-4">Pour activer l'analytique, configurez d'abord vos axes analytiques dans les paramètres.</p>
            <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              Configurer les axes analytiques
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
