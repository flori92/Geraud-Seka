/**
 * Immobilisations et Amortissements - SEKA
 * Gestion des actifs immobilisés avec plan d'amortissement
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Plus,
  Search,
  Loader2,
  Calendar,
  TrendingDown,
  Eye,
  Trash2,
  Calculator,
  Download,
} from "lucide-react";

interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_value: number;
  depreciation_method: "linear" | "degressive";
  useful_life_years: number;
  residual_value: number;
  cumulated_depreciation: number;
  net_book_value: number;
  status: "active" | "fully_depreciated" | "disposed";
}

interface AssetCategory {
  id: string;
  name: string;
  account_asset: string;
  account_depreciation: string;
  account_expense: string;
  default_useful_life: number;
  default_method: "linear" | "degressive";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AssetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [calculatingDepreciation, setCalculatingDepreciation] = useState(false);

  const fetchAssets = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [assetsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/accounting/assets`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/accounting/assets/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data.assets || []);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const calculateDepreciation = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setCalculatingDepreciation(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/assets/calculate-depreciation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAssets();
      }
    } catch (err) {
      console.error("Erreur calcul:", err);
    } finally {
      setCalculatingDepreciation(false);
    }
  };

  const deleteAsset = async (assetId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette immobilisation ?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/assets/${assetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAssets();
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const exportAssets = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/assets/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `immobilisations_${new Date().toISOString().split("T")[0]}.xlsx`;
        a.click();
      }
    } catch (err) {
      console.error("Erreur export:", err);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || asset.category === filterCategory;
    const matchesStatus = filterStatus === "all" || asset.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Actif</span>;
      case "fully_depreciated":
        return <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">Amorti</span>;
      case "disposed":
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Sorti</span>;
      default:
        return null;
    }
  };

  const totals = {
    acquisition: filteredAssets.reduce((sum, a) => sum + a.acquisition_value, 0),
    depreciation: filteredAssets.reduce((sum, a) => sum + a.cumulated_depreciation, 0),
    netValue: filteredAssets.reduce((sum, a) => sum + a.net_book_value, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Immobilisations - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Immobilisations</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos actifs immobilisés et leurs amortissements
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportAssets}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Exporter
                </button>
                <button
                  onClick={calculateDepreciation}
                  disabled={calculatingDepreciation}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  {calculatingDepreciation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  Calculer dotations
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle immobilisation
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Valeur d&apos;acquisition</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(totals.acquisition)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Amortissements cumulés</p>
              <p className="text-xl font-semibold text-red-600">{formatCurrency(totals.depreciation)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Valeur nette comptable</p>
              <p className="text-xl font-semibold text-primary-600">{formatCurrency(totals.netValue)}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous statuts</option>
                <option value="active">Actifs</option>
                <option value="fully_depreciated">Amortis</option>
                <option value="disposed">Sortis</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acquisition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amort. cumulé</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">VNC</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      Aucune immobilisation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{asset.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{asset.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{asset.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(asset.acquisition_date).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(asset.acquisition_value)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {formatCurrency(asset.cumulated_depreciation)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-primary-600">
                        {formatCurrency(asset.net_book_value)}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(asset.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/accounting/assets/${asset.id}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title="Voir le détail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/accounting/assets/${asset.id}/depreciation`)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                            title="Plan d'amortissement"
                          >
                            <TrendingDown className="h-4 w-4" />
                          </button>
                          {asset.status === "active" && (
                            <button
                              onClick={() => deleteAsset(asset.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">{filteredAssets.length} immobilisation(s)</span>
            </div>
          </div>
          </div>
        </main>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <CreateAssetModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAssets}
          categories={categories}
        />
      )}
    </>
  );
}

function CreateAssetModal({
  onClose,
  onCreated,
  categories,
}: {
  onClose: () => void;
  onCreated: () => void;
  categories: AssetCategory[];
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    category_id: "",
    acquisition_date: "",
    acquisition_value: 0,
    depreciation_method: "linear" as "linear" | "degressive",
    useful_life_years: 5,
    residual_value: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onClose();
        onCreated();
      }
    } catch (err) {
      console.error("Erreur création:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle immobilisation</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="IMM-001"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Désignation</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Véhicule de service"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;acquisition</label>
              <input
                type="date"
                value={form.acquisition_date}
                onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur d&apos;acquisition</label>
              <input
                type="number"
                value={form.acquisition_value}
                onChange={(e) => setForm({ ...form, acquisition_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode d&apos;amortissement</label>
              <select
                value={form.depreciation_method}
                onChange={(e) => setForm({ ...form, depreciation_method: e.target.value as "linear" | "degressive" })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="linear">Linéaire</option>
                <option value="degressive">Dégressif</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée (années)</label>
              <input
                type="number"
                value={form.useful_life_years}
                onChange={(e) => setForm({ ...form, useful_life_years: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur résiduelle</label>
            <input
              type="number"
              value={form.residual_value}
              onChange={(e) => setForm({ ...form, residual_value: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !form.code || !form.name || !form.acquisition_date}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
