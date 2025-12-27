/**
 * Tableaux de bord KPI - SEKA
 * Indicateurs clés de performance
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Percent,
} from "lucide-react";

interface KPI {
  id: string;
  name: string;
  value: number;
  formatted_value: string;
  unit: string;
  trend: "up" | "down" | "stable";
  trend_value: number;
  category: string;
  period: string;
  target: number | null;
  achievement: number | null;
}

interface KPICategory {
  name: string;
  kpis: KPI[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function KPIDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<KPICategory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");

  const fetchKPIs = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/kpi?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [selectedPeriod]);

  const exportKPIs = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/kpi/export?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kpi_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.pdf`;
        a.click();
      }
    } catch (err) { console.error(err); }
  };

  const getKPIIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "chiffre d'affaires": return DollarSign;
      case "clients": return Users;
      case "factures": return FileText;
      case "rentabilité": return Percent;
      default: return BarChart3;
    }
  };

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === "up") {
      return <span className="inline-flex items-center gap-1 text-green-600 text-sm"><TrendingUp className="h-4 w-4" />+{value.toFixed(1)}%</span>;
    } else if (trend === "down") {
      return <span className="inline-flex items-center gap-1 text-red-600 text-sm"><TrendingDown className="h-4 w-4" />{value.toFixed(1)}%</span>;
    }
    return <span className="text-gray-500 text-sm">—</span>;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Tableaux de bord KPI - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tableaux de bord KPI</h1>
                <p className="text-sm text-gray-500 mt-1">Suivez vos indicateurs clés de performance</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="day">Aujourd&apos;hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="quarter">Ce trimestre</option>
                  <option value="year">Cette année</option>
                </select>
                <button onClick={fetchKPIs} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button onClick={exportKPIs} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" /> Exporter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {categories.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun KPI disponible</p>
              <p className="text-sm text-gray-400 mt-1">Les indicateurs seront calculés à partir de vos données</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
                const Icon = getKPIIcon(category.name);
                return (
                  <div key={category.name}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-5 w-5 text-primary-600" />
                      <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {category.kpis.map((kpi) => (
                        <div key={kpi.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-500">{kpi.name}</p>
                            {getTrendIcon(kpi.trend, kpi.trend_value)}
                          </div>
                          <p className="text-2xl font-semibold text-gray-900 mt-2">{kpi.formatted_value}</p>
                          {kpi.target !== null && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Objectif</span>
                                <span>{kpi.achievement?.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${(kpi.achievement || 0) >= 100 ? "bg-green-500" : (kpi.achievement || 0) >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${Math.min(kpi.achievement || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {kpi.period}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
