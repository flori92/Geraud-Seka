import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Eye, FileText, CreditCard, BarChart3, MessageSquare, Bell } from "lucide-react";
import { useRouter } from "next/router";

export default function PointVueClientPage() {
  const router = useRouter();

  return (
    <DashboardLayout title="Point de Vue Client">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Point de Vue Client</h1>
          </div>
          <p className="text-sm opacity-90">Visualisez votre dossier tel que votre expert-comptable le voit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Documents en attente</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Factures fournisseurs</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">3</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Justificatifs manquants</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">2</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Notifications cabinet</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">Clôture mensuelle</p>
                <p className="text-xs text-purple-600 mt-1">Votre expert-comptable a validé la clôture de novembre</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Conversations</h3>
            </div>
            <p className="text-sm text-gray-600">Échangez directement avec votre cabinet comptable sur vos documents et questions.</p>
            <button
              className="mt-4 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              onClick={() => router.push("/crm/contacts")}
            >
              Voir les conversations
            </button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Tableaux de bord partagés</h3>
            </div>
            <p className="text-sm text-gray-600">Consultez les rapports et analyses préparés par votre expert-comptable.</p>
            <button
              className="mt-4 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              onClick={() => router.push("/crm/reports")}
            >
              Accéder aux rapports
            </button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
