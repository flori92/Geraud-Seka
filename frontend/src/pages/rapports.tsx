import Head from "next/head";
import Link from "next/link";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { FileText, Download, Calendar, Scale, TrendingUp, BarChart3, PieChart } from "lucide-react";

export default function RapportsPage() {
  const reports = [
    { title: "Bilan comptable", icon: Scale, href: "/reports/balance-sheet", description: "État de la situation patrimoniale", color: "bg-blue-100 text-blue-600" },
    { title: "Compte de résultat", icon: TrendingUp, href: "/reports/income-statement", description: "Analyse des produits et charges", color: "bg-green-100 text-green-600" },
    { title: "Balance générale", icon: BarChart3, href: "/accounting/balance", description: "Balance des comptes", color: "bg-indigo-100 text-indigo-600" },
    { title: "Grand livre", icon: FileText, href: "/accounting/ledger", description: "Détail des écritures par compte", color: "bg-orange-100 text-orange-600" },
    { title: "Rapport de ventes", icon: TrendingUp, href: "/reports/sales", description: "Analyse des ventes", color: "bg-cyan-100 text-cyan-600" },
    { title: "Rapport RH", icon: PieChart, href: "/reports/hr", description: "Statistiques ressources humaines", color: "bg-pink-100 text-pink-600" },
  ];

  return (
    <>
      <Head><title>Rapports - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><FileText className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Rapports Comptables</h1>
                  <p className="text-sm text-gray-600 mt-0.5">États financiers et rapports d&apos;analyse</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Calendar className="h-4 w-4" /> Période
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Download className="h-4 w-4" /> Exporter
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Link key={report.href} href={report.href} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${report.color}`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#1e3a5f] transition-colors">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      <span className="mt-3 text-sm text-[#1e3a5f] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Consulter <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
