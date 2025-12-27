/**
 * Prévisions de trésorerie - SEKA
 * Cash flow prévisionnel
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  RefreshCw,
  Download,
  AlertTriangle,
} from "lucide-react";

interface ForecastPeriod {
  period: string;
  period_label: string;
  opening_balance: number;
  expected_receipts: number;
  expected_payments: number;
  net_flow: number;
  closing_balance: number;
  is_negative: boolean;
}

interface ForecastSummary {
  current_balance: number;
  total_expected_receipts: number;
  total_expected_payments: number;
  min_balance: number;
  min_balance_period: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http:

export default function TreasuryForecastsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<ForecastPeriod[]>([]);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [horizon, setHorizon] = useState<string>("3m");

  const fetchForecasts = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/treasury/forecasts?horizon=${horizon}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForecasts(data.forecasts || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [horizon]);

  const exportForecasts = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/treasury/forecasts/export?horizon=${horizon}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `previsions_tresorerie_${new Date().toISOString().split("T")[0]}.xlsx`;
        a.click();
      }
    } catch (err) { console.error(err); }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Prévisions trésorerie - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Prévisions de trésorerie</h1>
                <p className="text-sm text-gray-500 mt-1">Anticipez vos flux de trésorerie</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={horizon} onChange={(e) => setHorizon(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="1m">1 mois</option>
                  <option value="3m">3 mois</option>
                  <option value="6m">6 mois</option>
                  <option value="12m">12 mois</option>
                </select>
                <button onClick={fetchForecasts} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button onClick={exportForecasts} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" /> Exporter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Résumé */}
          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Solde actuel</p>
                <p className={`text-xl font-semibold ${summary.current_balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(summary.current_balance)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Encaissements prévus</p>
                <p className="text-xl font-semibold text-green-600">{formatCurrency(summary.total_expected_receipts)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Décaissements prévus</p>
                <p className="text-xl font-semibold text-red-600">{formatCurrency(summary.total_expected_payments)}</p>
              </div>
              <div className={`bg-white rounded-xl border p-4 ${summary.min_balance < 0 ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                <p className="text-xs text-gray-500">Solde minimum prévu</p>
                <p className={`text-xl font-semibold ${summary.min_balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                  {formatCurrency(summary.min_balance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{summary.min_balance_period}</p>
              </div>
            </div>
          )}

          {/* Alerte */}
          {summary && summary.min_balance < 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Alerte de trésorerie</p>
                  <p className="text-xs text-red-700 mt-1">
                    Votre solde de trésorerie deviendra négatif en {summary.min_balance_period}. 
                    Prévoyez un financement ou reportez certaines dépenses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde initial</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Encaissements</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Décaissements</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Flux net</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forecasts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Aucune prévision disponible</td></tr>
                ) : forecasts.map((period) => (
                  <tr key={period.period} className={`hover:bg-gray-50 ${period.is_negative ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{period.period_label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(period.opening_balance)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(period.expected_receipts)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        {formatCurrency(period.expected_payments)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      <span className={period.net_flow >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(period.net_flow)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      <span className={period.closing_balance >= 0 ? "text-gray-900" : "text-red-600"}>
                        {formatCurrency(period.closing_balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
