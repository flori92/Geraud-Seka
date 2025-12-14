/**
 * Stock Dashboard
 * Vue d'ensemble du module Gestion des Stocks
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import {
  getInventory,
  getStockMovements,
  getProducts,
  type InventoryItem,
  type StockMovement,
  type Product
} from "@/lib/api";
import { formatAmount } from "@/lib/formatters";
import {
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  AlertTriangle,
  Box,
  Truck,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Archive,
  ShoppingCart
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  loading?: boolean;
  alert?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, href, loading, alert }: StatCardProps) {
  const router = useRouter();
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  return (
    <div 
      onClick={() => href && router.push(href)}
      className={`bg-white rounded-xl border ${alert ? "border-red-200 bg-red-50/50" : "border-gray-100"} p-6 shadow-sm transition-all duration-200 ${
        href ? "cursor-pointer hover:shadow-md hover:border-gray-200" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex rounded-xl ${color} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {alert && (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 mt-4">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && (
        <p className={`text-sm mt-1 ${alert ? "text-red-600 font-medium" : "text-gray-500"}`}>{subtitle}</p>
      )}
    </div>
  );
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all cursor-pointer">
        <div className={`rounded-lg ${color} p-2.5`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="font-medium text-gray-900">{label}</span>
        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
      </div>
    </Link>
  );
}

export default function StockDashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const [inventoryData, movementsData, productsData] = await Promise.allSettled([
        getInventory(token),
        getStockMovements(token),
        getProducts(token)
      ]);

      if (inventoryData.status === "fulfilled") setInventory(inventoryData.value);
      if (movementsData.status === "fulfilled") setMovements(movementsData.value);
      if (productsData.status === "fulfilled") setProducts(productsData.value);

      setError(null);
    } catch (err: any) {
      setError("Erreur lors du chargement des données de stock");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des statistiques
  const stats = useMemo(() => {
    const totalProducts = products?.length || 0;
    const totalQuantity = products?.reduce((sum, p) => sum + (p?.stock_quantity || 0), 0) || 0;
    const totalValue = products?.reduce((sum, p) => sum + ((p?.stock_quantity || 0) * (p?.price || 0)), 0) || 0;
    
    const lowStockProducts = products?.filter(p => {
      const minAlert = p?.min_stock_alert || 5;
      return (p?.stock_quantity || 0) <= minAlert;
    }) || [];
    
    const outOfStockProducts = products?.filter(p => (p?.stock_quantity || 0) === 0) || [];
    
    const inMovements = movements?.filter(m => m?.movement_type === "in")?.length || 0;
    const outMovements = movements?.filter(m => m?.movement_type === "out")?.length || 0;
    const recentMovements = movements?.slice(0, 10) || [];

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      outOfStockProducts,
      inMovements,
      outMovements,
      recentMovements
    };
  }, [products, movements]);

  // Mouvements récents
  const recentMovements = useMemo(() => {
    return movements
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      ?.slice(0, 5) || [];
  }, [movements]);

  return (
    <DashboardLayout title="Gestion des Stocks">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Stocks
          </h1>
          <p className="text-gray-500 mt-1">
            Inventaire, mouvements et alertes de stock
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/stock/movements">
            <Button variant="secondary" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Mouvements
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Alertes de stock */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <div className="mb-6 space-y-3">
          {stats.outOfStockCount > 0 && (
            <Alert variant="error" title="Rupture de stock">
              {stats.outOfStockCount} produit(s) en rupture de stock nécessite(nt) un réapprovisionnement urgent.
            </Alert>
          )}
          {stats.lowStockCount > 0 && stats.outOfStockCount === 0 && (
            <Alert variant="warning" title="Stock faible">
              {stats.lowStockCount} produit(s) avec un niveau de stock bas.
            </Alert>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Produits"
          value={stats.totalProducts}
          subtitle={`${formatAmount(stats.totalQuantity)} unités`}
          icon={Package}
          color="bg-blue-500"
          href="/products"
          loading={loading}
        />
        <StatCard
          title="Valeur du Stock"
          value={formatAmount(stats.totalValue) + " FCFA"}
          subtitle="Valeur totale"
          icon={BarChart3}
          color="bg-blue-500"
          href="/stock/inventory"
          loading={loading}
        />
        <StatCard
          title="Stock Faible"
          value={stats.lowStockCount}
          subtitle={stats.lowStockCount > 0 ? "À réapprovisionner" : "Niveaux OK"}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? "bg-orange-500" : "bg-gray-400"}
          href="/stock/inventory"
          loading={loading}
          alert={stats.lowStockCount > 0}
        />
        <StatCard
          title="Mouvements"
          value={stats.inMovements + stats.outMovements}
          subtitle={`${stats.inMovements} entrées, ${stats.outMovements} sorties`}
          icon={Truck}
          color="bg-primary-500"
          href="/stock/movements"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aperçu du stock */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Aperçu du Stock</h3>
              <Link href="/stock/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir l'inventaire <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                {/* Indicateurs visuels */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Box className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.totalProducts - stats.lowStockCount - stats.outOfStockCount}
                    </p>
                    <p className="text-sm text-blue-700 font-medium">Stock OK</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-orange-600">{stats.lowStockCount}</p>
                    <p className="text-sm text-orange-700 font-medium">Stock Faible</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <Archive className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-600">{stats.outOfStockCount}</p>
                    <p className="text-sm text-red-700 font-medium">Rupture</p>
                  </div>
                </div>

                {/* Produits en alerte */}
                {stats.lowStockProducts.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Produits à surveiller</h4>
                    <div className="space-y-3">
                      {stats.lowStockProducts.slice(0, 5).map((product, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            product.stock_quantity === 0 ? "bg-red-100" : "bg-orange-100"
                          }`}>
                            <Package className={`h-5 w-5 ${
                              product.stock_quantity === 0 ? "text-red-500" : "text-orange-500"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku || "N/A"}</p>
                          </div>
                          <Badge variant={product.stock_quantity === 0 ? "error" : "warning"}>
                            {product.stock_quantity} unités
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
          <QuickAction icon={Plus} label="Nouveau produit" href="/products" color="bg-blue-500" />
          <QuickAction icon={TrendingUp} label="Entrée de stock" href="/stock/movements" color="bg-blue-500" />
          <QuickAction icon={TrendingDown} label="Sortie de stock" href="/stock/movements" color="bg-red-400" />
          <QuickAction icon={Box} label="Inventaire" href="/stock/inventory" color="bg-primary-500" />
          <QuickAction icon={ShoppingCart} label="Bons de commande" href="/achats/bons-commande" color="bg-orange-500" />
        </div>
      </div>

      {/* Mouvements récents */}
      <div className="mt-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Mouvements récents</h3>
            <Link href="/stock/movements" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMovements.length > 0 ? (
              <div className="space-y-3">
                {recentMovements.map((movement, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      movement.movement_type === "in" ? "bg-blue-100" : "bg-red-100"
                    }`}>
                      {movement.movement_type === "in" ? (
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {movement.product_name || "Produit"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.reference || "Sans référence"} • {new Date(movement.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant={movement.movement_type === "in" ? "success" : "error"}>
                      {movement.movement_type === "in" ? "+" : "-"}{movement.quantity}
                    </Badge>
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
    </DashboardLayout>
  );
}
