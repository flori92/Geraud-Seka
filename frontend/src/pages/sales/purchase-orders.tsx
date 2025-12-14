import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getPurchaseOrders, PurchaseOrder } from "@/lib/api";
import { Plus, Eye, Download } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getPurchaseOrders(token);
      // Ensure data is an array
      setPurchaseOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des bons de commande");
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure we always work with an array
  const orderList = Array.isArray(purchaseOrders) ? purchaseOrders : [];

  const stats = [
    { label: "Total BC", value: orderList.length.toString(), color: "bg-primary-600" },
    { label: "En attente", value: orderList.filter(p => p?.status === "pending").length.toString(), color: "bg-orange-600" },
    { label: "Approuvés", value: orderList.filter(p => p?.status === "approved").length.toString(), color: "bg-primary-600" },
    { label: "Montant total", value: Math.round(orderList.reduce((sum, p) => sum + (p?.amount || 0), 0) / 1000) + "K", color: "bg-primary-600" },
  ];

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "error" => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "draft": "default",
      "pending": "warning",
      "approved": "success",
      "received": "success",
      "cancelled": "error",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "draft": "Brouillon",
      "pending": "En attente",
      "approved": "Approuvé",
      "received": "Reçu",
      "cancelled": "Annulé",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout title="Bons de commande">
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

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <Input
              placeholder="Rechercher un bon de commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="recu">Reçu</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau BC
          </Button>
        </div>
      </Card>

      {/* Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Numéro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Fournisseur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date commande</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date livraison</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {orderList.map((order) => (
                  <tr key={order.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{order.number}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{order.supplier_name || order.supplier_id}</td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(order.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(order.delivery_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {order.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(order.status)}>{getStatusLabel(order.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                          <Eye className="h-4 w-4 text-accents-5" />
                        </button>
                        <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                          <Download className="h-4 w-4 text-accents-5" />
                        </button>
                      </div>
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
