import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getPayslips, Payslip } from "@/lib/api";
import { Plus, Download, FileText } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getPayslips(token);
      setPayslips(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des bulletins");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total bulletins", value: payslips.length.toString(), color: "bg-blue-600" },
    { label: "Payés", value: payslips.filter(p => p.status === "paid").length.toString(), color: "bg-green-600" },
    { label: "En attente", value: payslips.filter(p => p.status === "pending").length.toString(), color: "bg-orange-600" },
    { label: "Coût total", value: Math.round(payslips.reduce((sum, p) => sum + p.net_salary, 0) / 1000) + "K", color: "bg-purple-600" },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "draft": "default",
      "paid": "success",
      "pending": "warning",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "draft": "Brouillon",
      "paid": "Payé",
      "pending": "En attente",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout title="Bulletins de paie">
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
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="paid">Payé</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau bulletin
          </Button>
        </div>
      </Card>

      {/* Payslips Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Période</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Salaire brut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Déductions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Bonus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Salaire net</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {payslip.employee_name || payslip.employee_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(payslip.period_start).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {payslip.gross_salary.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm text-error">
                      -{payslip.deductions.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm text-success">
                      +{payslip.bonuses.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">
                      {payslip.net_salary.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(payslip.status)}>
                        {getStatusLabel(payslip.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
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
