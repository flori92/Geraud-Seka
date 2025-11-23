import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";

export default function SalesReportsPage() {
  const stats = [
    { label: "CA du mois", value: "2.4M FCFA", trend: "+12.5%", trending: "up", icon: DollarSign, color: "bg-green-600" },
    { label: "Nombre de ventes", value: "142", trend: "+8.3%", trending: "up", icon: ShoppingCart, color: "bg-blue-600" },
    { label: "Panier moyen", value: "16.9K FCFA", trend: "-2.1%", trending: "down", icon: TrendingDown, color: "bg-orange-600" },
    { label: "Taux conversion", value: "34.2%", trend: "+5.7%", trending: "up", icon: TrendingUp, color: "bg-purple-600" },
  ];

  const topProducts = [
    { name: "Produit A", sales: 45, revenue: 675000 },
    { name: "Produit B", sales: 38, revenue: 570000 },
    { name: "Produit C", sales: 29, revenue: 435000 },
    { name: "Produit D", sales: 22, revenue: 330000 },
    { name: "Produit E", sales: 18, revenue: 270000 },
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
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <span className={`text-sm font-medium ${stat.trending === "up" ? "text-success" : "text-error"}`}>
                  {stat.trend}
                </span>
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
            {topProducts.map((product, idx) => (
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
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="font-medium text-foreground">En ligne</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-accents-2">
                  <div className="h-full rounded-full bg-success" style={{ width: "65%" }} />
                </div>
                <span className="font-bold text-foreground w-12 text-right">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="font-medium text-foreground">Magasin</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-accents-2">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: "25%" }} />
                </div>
                <span className="font-bold text-foreground w-12 text-right">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-accents-1">
              <span className="font-medium text-foreground">Téléphone</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-accents-2">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: "10%" }} />
                </div>
                <span className="font-bold text-foreground w-12 text-right">10%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
