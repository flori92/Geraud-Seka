import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Eye, FileText, BarChart3, MessageSquare, Bell } from "lucide-react";

export default function PointVueClientPage() {
  const router = useRouter();

  return (
    <>
      <Head><title>Point de Vue Client - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] px-6 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Point de Vue Client</h1>
            </div>
            <p className="text-sm text-white/80">Visualisez votre dossier tel que votre expert-comptable le voit</p>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Documents en attente</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Factures fournisseurs</span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">3</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Justificatifs manquants</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">2</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Notifications cabinet</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Clôture mensuelle</p>
                    <p className="text-xs text-purple-600 mt-1">Votre expert-comptable a validé la clôture de novembre</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Conversations</h3>
                </div>
                <p className="text-sm text-gray-600">Échangez directement avec votre cabinet comptable sur vos documents et questions.</p>
                <button onClick={() => router.push("/dashboard")} className="mt-4 w-full py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                  Voir les conversations
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Tableaux de bord partagés</h3>
                </div>
                <p className="text-sm text-gray-600">Consultez les rapports et analyses préparés par votre expert-comptable.</p>
                <button onClick={() => router.push("/dashboard")} className="mt-4 w-full py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                  Accéder aux rapports
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
