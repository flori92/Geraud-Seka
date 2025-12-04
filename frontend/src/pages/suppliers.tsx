import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Search, Building2, Phone, Mail, MapPin, ShoppingBag, TrendingUp, User, Trash2, Edit, ArrowLeft } from "lucide-react";
import { formatAmount } from "@/lib/formatters";
import { getSuppliers, createSupplier, deleteSupplier, type Supplier, type SupplierCreate } from "@/lib/api";

export default function SuppliersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<SupplierCreate>({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    country: "Bénin",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const data = await getSuppliers(token);
      setSuppliers(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching suppliers:", err);
      setError("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalSpent = suppliers.reduce((sum, s) => sum + s.total_spent, 0);
  const totalOrders = suppliers.reduce((sum, s) => sum + s.total_orders, 0);

  const stats = [
    { label: "Total fournisseurs", value: totalSuppliers.toString(), icon: Building2, color: "bg-blue-600" },
    { label: "Fournisseurs actifs", value: activeSuppliers.toString(), icon: TrendingUp, color: "bg-green-600" },
    { label: "Total commandes", value: totalOrders.toString(), icon: ShoppingBag, color: "bg-purple-600" },
    { label: "Total dépensé", value: formatAmount(totalSpent), icon: TrendingUp, color: "bg-orange-600" },
  ];

  const handleCreateSupplier = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      await createSupplier(token, formData);
      setShowModal(false);
      setFormData({
        name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        country: "Bénin",
      });
      await fetchSuppliers();
    } catch (err: any) {
      console.error("Error creating supplier:", err);
      setError(err.response?.data?.detail || "Erreur lors de la création du fournisseur");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;
    
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;
      await deleteSupplier(token, supplierId);
      await fetchSuppliers();
    } catch (err: any) {
      console.error("Error deleting supplier:", err);
      setError(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <DashboardLayout title="Fournisseurs">
      {/* Header cohérent */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos fournisseurs et leurs commandes
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/sales/purchase-orders">
            <Button variant="secondary" size="sm">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Commandes
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau fournisseur
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-accents-6">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-1 gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accents-5" />
            <Input
              placeholder="Rechercher un fournisseur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{supplier.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {supplier.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {supplier.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-accents-6">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{supplier.contact_name}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-accents-6">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-accents-6">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-accents-6">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-accents-2">
                <div>
                  <p className="text-xs text-accents-5 mb-1">Commandes</p>
                  <p className="text-lg font-semibold text-foreground">{supplier.total_orders}</p>
                </div>
                <div>
                  <p className="text-xs text-accents-5 mb-1">Total dépensé</p>
                  <p className="text-lg font-semibold text-foreground">{formatAmount(supplier.total_spent)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" className="flex-1">
                  Voir détails
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteSupplier(supplier.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* No results */}
      {!loading && filteredSuppliers.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-accents-5 mb-4" />
            <p className="text-accents-5">Aucun fournisseur trouvé</p>
          </div>
        </Card>
      )}

      {/* Create Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Nouveau fournisseur</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom du fournisseur *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Tech Solutions SARL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom du contact
                  </label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@exemple.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Téléphone
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Adresse
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Cotonou, Bénin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pays
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>Bénin</option>
                    <option>Togo</option>
                    <option>Côte d'Ivoire</option>
                    <option>Sénégal</option>
                    <option>Niger</option>
                    <option>Burkina Faso</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={creating} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateSupplier}
                  disabled={!formData.name || creating}
                  className="flex-1"
                >
                  {creating ? "Création..." : "Créer le fournisseur"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
