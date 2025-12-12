import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { FileText, Download, Calendar, Scale, TrendingUp, BarChart3, PieChart } from "lucide-react";

export default function RapportsPage() {
  const reports = [
    { title: "Bilan comptable", icon: Scale, href: "/reports/balance-sheet", description: "État de la situation patrimoniale", color: "bg-blue-500" },
    { title: "Compte de résultat", icon: TrendingUp, href: "/reports/income-statement", description: "Analyse des produits et charges", color: "bg-green-500" },
    { title: "Balance générale", icon: BarChart3, href: "/accounting/balance", description: "Balance des comptes", color: "bg-purple-500" },
    { title: "Grand livre", icon: FileText, href: "/accounting/ledger", description: "Détail des écritures par compte", color: "bg-orange-500" },
    { title: "Rapport de ventes", icon: TrendingUp, href: "/reports/sales", description: "Analyse des ventes", color: "bg-blue-500" },
    { title: "Rapport RH", icon: PieChart, href: "/reports/hr", description: "Statistiques ressources humaines", color: "bg-pink-500" },
  ];

  return (
    <DashboardLayout title="Rapports Comptables">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rapports Comptables</h1>
            <p className="text-sm text-gray-500 mt-1">États financiers et rapports d'analyse</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Calendar className="h-4 w-4" />
              Période
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <report.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                    <button className="mt-3 text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Consulter
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
