import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getProducts, createProduct, Product, ProductCreate } from "@/lib/api";
import { Plus, Search, Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ProductCreate>({
    name: "",
    sku: "",
    price: 0,
    stock_quantity: 0,
    min_stock_alert: 10,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getProducts(token);
      setProducts(data);
      setFilteredProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const handleCreateProduct = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      await createProduct(formData, token);
      setShowModal(false);
      setFormData({
        name: "",
        sku: "",
        price: 0,
        stock_quantity: 0,
        min_stock_alert: 10,
      });
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création du produit");
    }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= (p.min_stock_alert || 0)
  ).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock_quantity, 0);
  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  const stats = [
    { label: "Total produits", value: totalProducts.toString(), icon: Package, color: "bg-primary-600" },
    { label: "Stock faible", value: lowStockProducts.toString(), icon: AlertTriangle, color: "bg-orange-600" },
    { label: "Valeur totale", value: formatAmount(totalValue), icon: TrendingUp, color: "bg-green-600" },
    { label: "Prix moyen", value: formatAmount(avgPrice), icon: DollarSign, color: "bg-purple-600" },
  ];

  return (
    <DashboardLayout title="Produits & Services">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
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

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accents-5" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-accents-5 mb-4" />
            <p className="text-accents-5">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-accents-2 bg-accents-1">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Nom</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Prix unitaire</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Quantité en stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Valeur totale</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock_quantity <= (product.min_stock_alert || 0);
                  const productValue = product.price * product.stock_quantity;

                  return (
                    <tr key={product.id} className="hover:bg-accents-1 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-accents-6">{product.sku || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-foreground">{formatAmount(product.price)} FCFA</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${isLowStock ? "text-orange-600" : "text-foreground"}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-foreground">{formatAmount(productValue)} FCFA</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3" />
                            Stock faible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            En stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" size="sm">
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Nouveau produit</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom du produit *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Ordinateur portable HP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    SKU (Code produit)
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: HP-LAP-001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Prix unitaire (FCFA) *
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Quantité en stock *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Seuil d'alerte stock
                  </label>
                  <Input
                    type="number"
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: Number(e.target.value) })}
                    placeholder="10"
                  />
                  <p className="text-xs text-accents-6 mt-1">
                    Vous serez alerté quand le stock atteint ce niveau
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateProduct}
                  disabled={!formData.name || formData.price <= 0}
                  className="flex-1"
                >
                  Créer le produit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
