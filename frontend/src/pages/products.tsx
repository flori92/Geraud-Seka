import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getProducts, createProduct, Product, ProductCreate } from "@/lib/api";
import { Plus, Search, Package, AlertTriangle, TrendingUp, DollarSign, X, Loader2 } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ProductCreate>({ name: "", sku: "", price: 0, stock_quantity: 0, min_stock_alert: 10 });

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { filterProducts(); }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getProducts(token);
      setProducts(data);
      setFilteredProducts(data);
      setError(null);
    } catch { setError("Erreur lors du chargement des produits"); } finally { setLoading(false); }
  };

  const filterProducts = () => {
    if (!searchQuery) { setFilteredProducts(products); return; }
    const query = searchQuery.toLowerCase();
    setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query)));
  };

  const handleCreateProduct = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;
      await createProduct(formData, token);
      setShowModal(false);
      setFormData({ name: "", sku: "", price: 0, stock_quantity: 0, min_stock_alert: 10 });
      fetchProducts();
    } catch { setError("Erreur lors de la création du produit"); }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_alert || 0)).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock_quantity, 0);
  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  const stats = [
    { label: "Total produits", value: totalProducts, icon: Package, color: "bg-[#1e3a5f]" },
    { label: "Stock faible", value: lowStockProducts, icon: AlertTriangle, color: "bg-orange-600" },
    { label: "Valeur totale", value: formatAmount(totalValue), icon: TrendingUp, color: "bg-green-600" },
    { label: "Prix moyen", value: formatAmount(avgPrice), icon: DollarSign, color: "bg-blue-600" },
  ];

  return (
    <>
      <Head><title>Produits - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Package className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Produits &amp; Services</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Catalogue et gestion des stocks</p>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Plus className="h-4 w-4" /> Nouveau produit
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="grid gap-4 md:grid-cols-4 mb-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" /></div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => {
                        const isLowStock = product.stock_quantity <= (product.min_stock_alert || 0);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-500">{product.sku || "-"}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">{formatAmount(product.price)} FCFA</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-medium ${isLowStock ? "text-orange-600" : "text-gray-900"}`}>{product.stock_quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatAmount(product.price * product.stock_quantity)} FCFA</td>
                            <td className="px-4 py-3 text-center">
                              {isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                                  <AlertTriangle className="h-3 w-3" />Stock faible
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">En stock</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-sm text-[#1e3a5f] hover:underline font-medium">Modifier</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nouveau produit</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: Ordinateur portable HP" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">SKU (Code produit)</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: HP-LAP-001" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Prix unitaire (FCFA) *</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Quantité en stock *</label>
                    <input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Seuil d&apos;alerte stock</label>
                  <input type="number" value={formData.min_stock_alert} onChange={(e) => setFormData({ ...formData, min_stock_alert: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="10" />
                  <p className="text-xs text-gray-500 mt-1">Vous serez alerté quand le stock atteint ce niveau</p></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleCreateProduct} disabled={!formData.name || formData.price <= 0}
                  className="flex-1 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d] disabled:opacity-50">Créer le produit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
