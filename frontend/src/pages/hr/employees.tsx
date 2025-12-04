import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getEmployees, Employee } from "@/lib/api";
import { Plus, Mail, Phone, User, X } from "lucide-react";
import { formatAmount } from "@/lib/formatters";
import { useToast } from "@/components/ui/ToastContainer";

export default function EmployeesPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getEmployees(token);
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des employés");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total employés", value: employees.length.toString(), color: "bg-blue-600" },
    { label: "Actifs", value: employees.filter(e => e.status === "active").length.toString(), color: "bg-green-600" },
    { label: "En congé", value: employees.filter(e => e.status === "on_leave").length.toString(), color: "bg-orange-600" },
    { label: "Masse salariale", value: Math.round(employees.reduce((sum, e) => sum + (e.salary || 0), 0) / 1000) + "K", color: "bg-purple-600" },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "active": "success",
      "inactive": "error",
      "on_leave": "warning",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "active": "Actif",
      "inactive": "Inactif",
      "on_leave": "En congé",
    };
    return labels[status] || status;
  };

  const filteredEmployees = employees.filter(emp =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Employés">
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
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="on_leave">En congé</option>
              <option value="inactive">Inactif</option>
            </Select>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel employé
          </Button>
        </div>
      </Card>

      {/* Employees Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} hoverable>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accents-2 p-3">
                      <User className="h-5 w-5 text-accents-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-sm text-accents-5">{employee.position}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(employee.status)}>
                    {getStatusLabel(employee.status)}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 border-t border-accents-2 pt-3">
                  <div className="flex items-center gap-2 text-sm text-accents-6">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-accents-6">
                      <Phone className="h-4 w-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex items-center justify-between border-t border-accents-2 pt-3 text-sm">
                  <div>
                    <p className="text-xs text-accents-5">Département</p>
                    <p className="font-medium text-foreground">{employee.department || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-accents-5">Embauché le</p>
                    <p className="font-medium text-foreground">
                      {new Date(employee.hire_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    Voir profil
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1">
                    Modifier
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredEmployees.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-accents-5">Aucun employé trouvé</p>
        </Card>
      )}

      {/* Modal Nouvel Employé */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Nouvel employé</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Prénom *</label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Ex: Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nom *</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Ex: Dupont"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean.dupont@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Poste *</label>
                    <Input
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Ex: Développeur"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Département</label>
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: IT"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date d'embauche *</label>
                    <Input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Salaire (FCFA)</label>
                    <Input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.position}
                  className="flex-1"
                  onClick={() => {
                    toast.info("Fonctionnalité en cours de développement - L'API sera bientôt connectée");
                    setShowModal(false);
                  }}
                >
                  Créer l'employé
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
