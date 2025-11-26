import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FileText, TrendingUp, Users, ShoppingCart, Download, BarChart3 } from "lucide-react";

const reports = [
  {
    id: "accounting",
    title: "Rapport Comptable",
    description: "Revenus, dépenses, cash-flow et compte de résultat détaillé",
    icon: FileText,
    href: "/reports/accounting",
    color: "bg-blue-600",
    stats: [
      { label: "Période", value: "Mois en cours" },
      { label: "Données", value: "Temps réel" },
    ],
  },
  {
    id: "sales",
    title: "Rapport Ventes",
    description: "Chiffre d'affaires, produits phares, canaux de vente et conversion",
    icon: ShoppingCart,
    href: "/reports/sales",
    color: "bg-green-600",
    stats: [
      { label: "Période", value: "Mois en cours" },
      { label: "Données", value: "Temps réel" },
    ],
  },
  {
    id: "hr",
    title: "Rapport RH",
    description: "Effectifs, embauches, taux de présence et masse salariale",
    icon: Users,
    href: "/reports/hr",
    color: "bg-purple-600",
    stats: [
      { label: "Période", value: "Mois en cours" },
      { label: "Données", value: "Temps réel" },
    ],
  },
];

export default function ReportsDashboardPage() {
  return (
    <DashboardLayout title="Reporting">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Centre de Reporting</h1>
        <p className="text-accents-6">
          Consultez vos rapports d'activité, analyses financières et tableaux de bord en temps réel
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-sm text-accents-6">Rapports disponibles</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-sm text-accents-6">Données en temps réel</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">PDF</p>
              <p className="text-sm text-accents-6">Export disponible</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-orange-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Multi</p>
              <p className="text-sm text-accents-6">Périodes configurables</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-14 w-14 rounded-lg ${report.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{report.title}</h3>
                    <p className="text-sm text-accents-6">{report.description}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {report.stats.map((stat, idx) => (
                    <div key={idx} className="bg-accents-1 rounded-lg p-3">
                      <p className="text-xs text-accents-5 mb-1">{stat.label}</p>
                      <p className="text-sm font-medium text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <Link href={report.href} className="flex-1">
                    <Button variant="primary" size="md" className="w-full">
                      Consulter
                    </Button>
                  </Link>
                  <Button variant="secondary" size="md">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Resources */}
      <Card className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Exports Comptables</h3>
            <p className="text-sm text-accents-6">
              Exportez vos données comptables au format FEC, CSV ou Excel
            </p>
          </div>
          <Link href="/exports">
            <Button variant="secondary" size="md">
              Accéder aux exports
            </Button>
          </Link>
        </div>
      </Card>
    </DashboardLayout>
  );
}
