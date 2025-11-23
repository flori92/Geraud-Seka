import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export default function AccountingReportsPage() {
  const profitLoss = {
    revenue: {
      sales: 2400000,
      services: 800000,
      other: 150000,
      total: 3350000,
    },
    expenses: {
      salaries: 1200000,
      rent: 300000,
      supplies: 450000,
      utilities: 120000,
      other: 180000,
      total: 2250000,
    },
    netProfit: 1100000,
  };

  const cashFlow = [
    { month: "Juil", operating: 850000, investing: -200000, financing: 100000 },
    { month: "Août", operating: 920000, investing: -150000, financing: 50000 },
    { month: "Sept", operating: 1050000, investing: -300000, financing: 150000 },
    { month: "Oct", operating: 980000, investing: -100000, financing: 0 },
    { month: "Nov", operating: 1100000, investing: -250000, financing: 200000 },
  ];

  return (
    <DashboardLayout title="Rapports comptables">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyse financière</h2>
          <p className="text-sm text-accents-5">Performance comptable et financière</p>
        </div>
        <div className="flex gap-3">
          <Select>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </Select>
          <Button variant="secondary" size="md">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Profit & Loss */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Produits
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Ventes</span>
              <span className="font-medium text-foreground">{profitLoss.revenue.sales.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Services</span>
              <span className="font-medium text-foreground">{profitLoss.revenue.services.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Autres</span>
              <span className="font-medium text-foreground">{profitLoss.revenue.other.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-success/10 border border-success/20">
              <span className="text-sm font-semibold text-foreground">Total Produits</span>
              <span className="text-lg font-bold text-success">{profitLoss.revenue.total.toLocaleString()} FCFA</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-error" />
            Charges
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Salaires</span>
              <span className="font-medium text-foreground">{profitLoss.expenses.salaries.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Loyer</span>
              <span className="font-medium text-foreground">{profitLoss.expenses.rent.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Fournitures</span>
              <span className="font-medium text-foreground">{profitLoss.expenses.supplies.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-error/10 border border-error/20">
              <span className="text-sm font-semibold text-foreground">Total Charges</span>
              <span className="text-lg font-bold text-error">{profitLoss.expenses.total.toLocaleString()} FCFA</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Net Profit */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Résultat net</h3>
            <p className="text-sm text-accents-5">Produits - Charges</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-success">{profitLoss.netProfit.toLocaleString()} FCFA</p>
            <p className="text-sm text-success">+32.8% vs mois précédent</p>
          </div>
        </div>
      </Card>

      {/* Cash Flow */}
      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-4">Flux de trésorerie (5 derniers mois)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-accents-2">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Mois</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Exploitation</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Investissement</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Financement</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accents-2">
              {cashFlow.map((row) => {
                const total = row.operating + row.investing + row.financing;
                return (
                  <tr key={row.month}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{row.month}</td>
                    <td className="px-4 py-3 text-sm text-right text-success">{row.operating.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-error">{row.investing.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">{row.financing.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${total >= 0 ? "text-success" : "text-error"}`}>
                      {total.toLocaleString()} FCFA
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
