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
import { Plus, FileText, Calendar, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastContainer";

export default function ContractsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    contract_type: "CDI",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    salary: 0,
    position: ""
  });

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
    { label: "Total contrats", value: contracts.length.toString(), color: "bg-primary-600" },
    { label: "Actifs", value: contracts.filter(c => c.status === "active").length.toString(), color: "bg-primary-600" },
    { label: "CDI", value: contracts.filter(c => c.contract_type === "CDI").length.toString(), color: "bg-primary-600" },
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
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
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

      {/* Modal Nouveau Contrat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Nouveau contrat</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type de contrat *</label>
                  <Select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Poste *</label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Développeur Senior"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date de début *</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date de fin</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Laisser vide pour CDI</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Salaire (FCFA) *</label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  disabled={!formData.position || formData.salary <= 0}
                  className="flex-1"
                  onClick={() => {
                    toast.info("Fonctionnalité en cours de développement - L'API sera bientôt connectée");
                    setShowModal(false);
                  }}
                >
                  Créer le contrat
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
