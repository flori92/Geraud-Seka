import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getAccountingReport, AccountingReport } from "@/lib/api";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export default function AccountingReportsPage() {
  const [report, setReport] = useState<AccountingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getAccountingReport(token, period);
      setReport(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement du rapport");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Rapports comptables">
        <Card><Skeleton className="h-96" /></Card>
      </DashboardLayout>
    );
  }

  if (!report || error) {
    return (
      <DashboardLayout title="Rapports comptables">
        <Alert variant="error">{error || "Aucune donnée disponible"}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Rapports comptables">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyse financière</h2>
          <p className="text-sm text-accents-5">Performance comptable et financière</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
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
              <span className="font-medium text-foreground">{report.revenue.sales.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Services</span>
              <span className="font-medium text-foreground">{report.revenue.services.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Autres</span>
              <span className="font-medium text-foreground">{report.revenue.other.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-success/10 border border-success/20">
              <span className="text-sm font-semibold text-foreground">Total Produits</span>
              <span className="text-lg font-bold text-success">{report.revenue.total.toLocaleString()} FCFA</span>
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
              <span className="font-medium text-foreground">{report.expenses.salaries.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Loyer</span>
              <span className="font-medium text-foreground">{report.expenses.rent.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="text-sm text-accents-6">Fournitures</span>
              <span className="font-medium text-foreground">{report.expenses.supplies.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-error/10 border border-error/20">
              <span className="text-sm font-semibold text-foreground">Total Charges</span>
              <span className="text-lg font-bold text-error">{report.expenses.total.toLocaleString()} FCFA</span>
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
            <p className="text-3xl font-bold text-success">{report.net_profit.toLocaleString()} FCFA</p>
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
              {report.cash_flow.map((row) => {
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
