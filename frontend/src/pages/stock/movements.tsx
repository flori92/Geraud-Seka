import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getStockMovements, StockMovement } from "@/lib/api";
import { Plus, ArrowDown, ArrowUp, RefreshCw, ArrowRight } from "lucide-react";

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getStockMovements(token);
      setMovements(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des mouvements");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total mouvements", value: movements.length.toString(), color: "bg-blue-600" },
    { label: "Entrées", value: movements.filter(m => m.movement_type === "in").length.toString(), color: "bg-green-600" },
    { label: "Sorties", value: movements.filter(m => m.movement_type === "out").length.toString(), color: "bg-red-600" },
    { label: "Ajustements", value: movements.filter(m => m.movement_type === "adjustment").length.toString(), color: "bg-orange-600" },
  ];

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "in": "Entrée",
      "out": "Sortie",
      "adjustment": "Ajustement",
      "transfer": "Transfert",
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "in": "bg-green-100 text-green-700",
      "out": "bg-red-100 text-red-700",
      "adjustment": "bg-orange-100 text-orange-700",
      "transfer": "bg-blue-100 text-blue-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getMovementIcon = (type: string) => {
    if (type === "in") return <ArrowDown className="h-3 w-3" />;
    if (type === "out") return <ArrowUp className="h-3 w-3" />;
    if (type === "adjustment") return <RefreshCw className="h-3 w-3" />;
    if (type === "transfer") return <ArrowRight className="h-3 w-3" />;
    return null;
  };

  return (
    <DashboardLayout title="Mouvements de stock">
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
            <Input placeholder="Rechercher un mouvement..." className="flex-1" />
            <Select>
              <option value="all">Tous les types</option>
              <option value="in">Entrées</option>
              <option value="out">Sorties</option>
              <option value="adjustment">Ajustements</option>
              <option value="transfer">Transferts</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau mouvement
          </Button>
        </div>
      </Card>

      {/* Movements Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Quantité</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Raison</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Créé par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(movement.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {movement.product_name || movement.product_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                        {getMovementIcon(movement.movement_type)}
                        {getMovementTypeLabel(movement.movement_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        movement.movement_type === "in" ? "text-success" :
                        movement.movement_type === "out" ? "text-error" :
                        "text-foreground"
                      }`}>
                        {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "-" : ""}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-accents-6">
                      {movement.reference || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {movement.reason || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {movement.created_by || "-"}
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
