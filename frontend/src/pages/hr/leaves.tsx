import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getLeaves, Leave } from "@/lib/api";
import { Plus, Calendar } from "lucide-react";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getLeaves(token);
      setLeaves(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des congés");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total demandes", value: leaves.length.toString(), color: "bg-blue-600" },
    { label: "En attente", value: leaves.filter(l => l.status === "pending").length.toString(), color: "bg-orange-600" },
    { label: "Approuvées", value: leaves.filter(l => l.status === "approved").length.toString(), color: "bg-green-600" },
    { label: "Jours total", value: leaves.filter(l => l.status === "approved").reduce((sum, l) => sum + l.days_count, 0).toString(), color: "bg-purple-600" },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "pending": "warning",
      "approved": "success",
      "rejected": "error",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "pending": "En attente",
      "approved": "Approuvé",
      "rejected": "Refusé",
    };
    return labels[status] || status;
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "vacation": "Congé payé",
      "sick": "Maladie",
      "personal": "Personnel",
      "maternity": "Maternité",
      "unpaid": "Sans solde",
    };
    return labels[type] || type;
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "vacation": "bg-blue-100 text-blue-700",
      "sick": "bg-red-100 text-red-700",
      "personal": "bg-purple-100 text-purple-700",
      "maternity": "bg-pink-100 text-pink-700",
      "unpaid": "bg-gray-100 text-gray-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardLayout title="Congés">
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
            <Input placeholder="Rechercher..." className="flex-1" />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Refusé</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Button>
        </div>
      </Card>

      {/* Leaves Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Employé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Début</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Fin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Durée</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Raison</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {leave.employee_name || leave.employee_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getLeaveTypeColor(leave.leave_type)}`}>
                        <Calendar className="h-3 w-3" />
                        {getLeaveTypeLabel(leave.leave_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(leave.start_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(leave.end_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {leave.days_count} jour{leave.days_count > 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {leave.reason || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(leave.status)}>
                        {getStatusLabel(leave.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            Approuver
                          </Button>
                          <Button variant="ghost" size="sm">
                            Refuser
                          </Button>
                        </div>
                      )}
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
