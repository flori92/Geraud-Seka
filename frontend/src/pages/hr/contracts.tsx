import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getContracts, Contract } from "@/lib/api";
import { Plus, FileText, Calendar } from "lucide-react";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getContracts(token);
      setContracts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des contrats");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total contrats", value: contracts.length.toString(), color: "bg-blue-600" },
    { label: "Actifs", value: contracts.filter(c => c.status === "active").length.toString(), color: "bg-green-600" },
    { label: "CDI", value: contracts.filter(c => c.contract_type === "CDI").length.toString(), color: "bg-purple-600" },
    { label: "CDD", value: contracts.filter(c => c.contract_type === "CDD").length.toString(), color: "bg-orange-600" },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "active": "success",
      "expired": "error",
      "terminated": "error",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "active": "Actif",
      "expired": "Expiré",
      "terminated": "Résilié",
    };
    return labels[status] || status;
  };

  const getContractTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "CDI": "bg-green-100 text-green-700",
      "CDD": "bg-blue-100 text-blue-700",
      "Stage": "bg-purple-100 text-purple-700",
      "Freelance": "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardLayout title="Contrats">
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
              placeholder="Rechercher un contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les types</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Freelance">Freelance</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contrat
          </Button>
        </div>
      </Card>

      {/* Contracts Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Employé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Début</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Fin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Salaire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{contract.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{contract.employee_name || contract.employee_id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getContractTypeColor(contract.contract_type)}`}>
                        <FileText className="h-3 w-3" />
                        {contract.contract_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(contract.start_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString("fr-FR") : "Indéterminée"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {contract.salary.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(contract.status)}>
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                        {contract.document_url && (
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
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
