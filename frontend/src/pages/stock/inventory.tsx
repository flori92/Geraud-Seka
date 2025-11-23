import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getInventory, InventoryItem } from "@/lib/api";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getInventory(token);
      setInventory(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement de l'inventaire");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total articles", value: inventory.length.toString(), color: "bg-blue-600" },
    { label: "En stock", value: inventory.filter(i => i.status === "in_stock").length.toString(), color: "bg-green-600" },
    { label: "Stock bas", value: inventory.filter(i => i.status === "low_stock").length.toString(), color: "bg-orange-600" },
    { label: "Rupture", value: inventory.filter(i => i.status === "out_of_stock").length.toString(), color: "bg-red-600" },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "in_stock": "success",
      "low_stock": "warning",
      "out_of_stock": "error",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "in_stock": "En stock",
      "low_stock": "Stock bas",
      "out_of_stock": "Rupture",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    if (status === "in_stock") return <CheckCircle className="h-4 w-4" />;
    if (status === "low_stock") return <AlertTriangle className="h-4 w-4" />;
    if (status === "out_of_stock") return <Package className="h-4 w-4" />;
    return null;
  };

  return (
    <DashboardLayout title="Inventaire">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-accents-6">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {inventory.filter(i => i.status === "out_of_stock").length > 0 && (
        <Alert variant="error" className="mb-6">
          {inventory.filter(i => i.status === "out_of_stock").length} article(s) en rupture de stock
        </Alert>
      )}
      {inventory.filter(i => i.status === "low_stock").length > 0 && (
        <Alert variant="warning" className="mb-6">
          {inventory.filter(i => i.status === "low_stock").length} article(s) avec un stock bas
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <Input placeholder="Rechercher un article..." className="flex-1" />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock bas</option>
              <option value="out_of_stock">Rupture</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Package className="mr-2 h-4 w-4" />
            Ajuster le stock
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-accents-2">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Emplacement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Quantité</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Dernière MàJ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-accents-5" />
                        <span className="text-sm font-medium text-foreground">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-accents-6">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-accents-6">{item.location || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        item.quantity === 0 ? "text-error" :
                        item.status === "low_stock" ? "text-warning" :
                        "text-success"
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(item.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {getStatusLabel(item.status)}
                        </div>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(item.last_updated).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        Ajuster
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
