/**
 * Stock Dashboard - Style Pennylane
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getStockMovements, getProducts, type StockMovement, type Product } from "@/lib/api";
import { formatAmount } from "@/lib/formatters";
import {
  Package, TrendingUp, TrendingDown, ArrowRight, Plus, AlertTriangle,
  Box, Truck, BarChart3, ChevronRight, RefreshCw, Archive, ShoppingCart
} from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, color, href, loading, alert }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType;
  color: string; href?: string; loading?: boolean; alert?: boolean;
}) {
  const router = useRouter();
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-12 w-12 rounded-lg bg-gray-200 mb-4" />
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
    );
  }
  return (
    <div onClick={() => href && router.push(href)}
      className={`bg-white rounded-lg border ${alert ? "border-red-200 bg-red-50/50" : "border-gray-200"} p-6 transition-all ${href ? "cursor-pointer hover:shadow-md" : ""}`}>
      <div className="flex items-start justify-between">
        <div className={`inline-flex rounded-lg ${color} p-3`}><Icon className="h-6 w-6 text-white" /></div>
        {alert && <AlertTriangle className="h-5 w-5 text-red-500" />}
      </div>
      <p className="text-sm font-medium text-gray-500 mt-4">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className={`text-sm mt-1 ${alert ? "text-red-600 font-medium" : "text-gray-500"}`}>{subtitle}</p>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href, color }: { icon: React.ElementType; label: string; href: string; color: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all">
      <div className={`rounded-lg ${color} p-2.5`}><Icon className="h-5 w-5 text-white" /></div>
      <span className="font-medium text-gray-900">{label}</span>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
    </Link>
  );
}

export default function StockDashboardPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;
      const [movementsData, productsData] = await Promise.allSettled([getStockMovements(token), getProducts(token)]);
      if (movementsData.status === "fulfilled") setMovements(movementsData.value);
      if (productsData.status === "fulfilled") setProducts(productsData.value);
      setError(null);
    } catch { setError("Erreur lors du chargement des données"); } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const totalProducts = products?.length || 0;
    const totalQuantity = products?.reduce((sum, p) => sum + (p?.stock_quantity || 0), 0) || 0;
    const totalValue = products?.reduce((sum, p) => sum + ((p?.stock_quantity || 0) * (p?.price || 0)), 0) || 0;
    const lowStockProducts = products?.filter(p => (p?.stock_quantity || 0) <= (p?.min_stock_alert || 5)) || [];
    const outOfStockCount = products?.filter(p => (p?.stock_quantity || 0) === 0)?.length || 0;
    const inMovements = movements?.filter(m => m?.movement_type === "in")?.length || 0;
    const outMovements = movements?.filter(m => m?.movement_type === "out")?.length || 0;
    return { totalProducts, totalQuantity, totalValue, lowStockCount: lowStockProducts.length, outOfStockCount, lowStockProducts, inMovements, outMovements };
  }, [products, movements]);

  const recentMovements = useMemo(() => movements?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.slice(0, 5) || [], [movements]);

  return (
    <>
      <Head><title>Gestion des Stocks - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Package className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Gestion des Stocks</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Inventaire, mouvements et alertes</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/stock/movements" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4" /> Mouvements
                </Link>
                <Link href="/products" className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" /> Nouveau produit
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
              <div className="mb-6 space-y-3">
                {stats.outOfStockCount > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div><p className="font-medium text-red-800">Rupture de stock</p>
                      <p className="text-sm text-red-600">{stats.outOfStockCount} produit(s) nécessite(nt) un réapprovisionnement urgent.</p></div>
                  </div>
                )}
                {stats.lowStockCount > 0 && stats.outOfStockCount === 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div><p className="font-medium text-orange-800">Stock faible</p>
                      <p className="text-sm text-orange-600">{stats.lowStockCount} produit(s) avec un niveau de stock bas.</p></div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Total Produits" value={stats.totalProducts} subtitle={`${formatAmount(stats.totalQuantity)} unités`} icon={Package} color="bg-blue-500" href="/products" loading={loading} />
              <StatCard title="Valeur du Stock" value={formatAmount(stats.totalValue) + " FCFA"} subtitle="Valeur totale" icon={BarChart3} color="bg-[#1e3a5f]" href="/stock/inventory" loading={loading} />
              <StatCard title="Stock Faible" value={stats.lowStockCount} subtitle={stats.lowStockCount > 0 ? "À réapprovisionner" : "Niveaux OK"} icon={AlertTriangle} color={stats.lowStockCount > 0 ? "bg-orange-500" : "bg-gray-400"} href="/stock/inventory" loading={loading} alert={stats.lowStockCount > 0} />
              <StatCard title="Mouvements" value={stats.inMovements + stats.outMovements} subtitle={`${stats.inMovements} entrées, ${stats.outMovements} sorties`} icon={Truck} color="bg-[#1e3a5f]" href="/stock/movements" loading={loading} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Aperçu du Stock</h3>
                  <Link href="/stock/inventory" className="text-sm text-[#1e3a5f] hover:underline font-medium flex items-center">
                    Voir l&apos;inventaire <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                {loading ? (
                  <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Box className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-blue-600">{stats.totalProducts - stats.lowStockCount - stats.outOfStockCount}</p>
                        <p className="text-sm text-blue-700 font-medium">Stock OK</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-orange-600">{stats.lowStockCount}</p>
                        <p className="text-sm text-orange-700 font-medium">Stock Faible</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <Archive className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-red-600">{stats.outOfStockCount}</p>
                        <p className="text-sm text-red-700 font-medium">Rupture</p>
                      </div>
                    </div>
                    {stats.lowStockProducts.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Produits à surveiller</h4>
                        <div className="space-y-3">
                          {stats.lowStockProducts.slice(0, 5).map((product, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${product.stock_quantity === 0 ? "bg-red-100" : "bg-orange-100"}`}>
                                <Package className={`h-5 w-5 ${product.stock_quantity === 0 ? "text-red-500" : "text-orange-500"}`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">SKU: {product.sku || "N/A"}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.stock_quantity === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                                {product.stock_quantity} unités
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
                <QuickAction icon={Plus} label="Nouveau produit" href="/products" color="bg-blue-500" />
                <QuickAction icon={TrendingUp} label="Entrée de stock" href="/stock/movements" color="bg-green-500" />
                <QuickAction icon={TrendingDown} label="Sortie de stock" href="/stock/movements" color="bg-red-400" />
                <QuickAction icon={Box} label="Inventaire" href="/stock/inventory" color="bg-[#1e3a5f]" />
                <QuickAction icon={ShoppingCart} label="Bons de commande" href="/achats/bons-commande" color="bg-orange-500" />
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mouvements récents</h3>
                <Link href="/stock/movements" className="text-sm text-[#1e3a5f] hover:underline font-medium flex items-center">
                  Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="h-10 w-10 rounded-lg bg-gray-200" />
                        <div className="flex-1"><div className="h-4 w-48 bg-gray-200 rounded mb-2" /><div className="h-3 w-32 bg-gray-200 rounded" /></div>
                      </div>
                    ))}
                  </div>
                ) : recentMovements.length > 0 ? (
                  <div className="space-y-3">
                    {recentMovements.map((movement, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${movement.movement_type === "in" ? "bg-green-100" : "bg-red-100"}`}>
                          {movement.movement_type === "in" ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{movement.product_name || "Produit"}</p>
                          <p className="text-xs text-gray-500">{movement.reference || "Sans référence"} • {new Date(movement.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${movement.movement_type === "in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {movement.movement_type === "in" ? "+" : "-"}{movement.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium">Aucun mouvement récent</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
