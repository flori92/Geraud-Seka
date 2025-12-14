import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getSalesReport, SalesReport } from "@/lib/api";
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function SalesReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
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
      const data = await getSalesReport(token, period);
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
      <DashboardLayout title="Rapports des ventes">
        <Card><Skeleton className="h-96" /></Card>
      </DashboardLayout>
    );
  }

  if (!report || error) {
    return (
      <DashboardLayout title="Rapports des ventes">
        <Alert variant="error">{error || "Aucune donnée disponible"}</Alert>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "CA du mois", value: formatCurrency(report.total_revenue), icon: DollarSign, color: "bg-green-600" },
    { label: "Nombre de ventes", value: report.total_sales.toString(), icon: ShoppingCart, color: "bg-primary-600" },
    { label: "Panier moyen", value: formatCurrency(report.average_order_value), icon: TrendingDown, color: "bg-orange-600" },
    { label: "Taux conversion", value: `${report.conversion_rate}%`, icon: TrendingUp, color: "bg-purple-600" },
  ];

  return (
    <DashboardLayout title="Rapports des ventes">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyse des ventes</h2>
          <p className="text-sm text-accents-5">Vue d'ensemble des performances commerciales</p>
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-accents-5">{stat.label}</span>
                <div className={`rounded-lg ${stat.color} p-2`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Produits</h3>
          <div className="space-y-3">
            {report.top_products.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded bg-accents-1">
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-accents-5">{product.sales} ventes</p>
                </div>
                <p className="font-bold text-foreground">{product.revenue.toLocaleString()} FCFA</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Sales by Channel */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Ventes par canal</h3>
          <div className="space-y-3">
            {report.sales_by_channel.map((channel, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded bg-accents-1">
                <span className="font-medium text-foreground">{channel.channel}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 rounded-full bg-accents-2">
                    <div
                      className={`h-full rounded-full ${idx === 0 ? "bg-success" : idx === 1 ? "bg-blue-500" : "bg-orange-500"}`}
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                  <span className="font-bold text-foreground w-12 text-right">{channel.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
