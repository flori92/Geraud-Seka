import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getCashFlowPrediction, getAnomalies, CashFlowPrediction, Anomaly } from "@/lib/api";
import { AlertTriangle, CheckCircle, Bot, Zap, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function IntelligencePage() {
  const [prediction, setPrediction] = useState<CashFlowPrediction | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predData, anomData] = await Promise.all([getCashFlowPrediction(30), getAnomalies()]);
        setPrediction(predData);
        setAnomalies(anomData);
      } catch (error) {
        console.error("Failed to fetch intelligence data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Head><title>Intelligence - SEKA</title></Head>
        <div className="min-h-screen bg-gray-50">
          <PennylaneSidebar />
          <main className="ml-[220px] flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Intelligence - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><Zap className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Intelligence Artificielle</h1>
                <p className="text-sm text-gray-600 mt-0.5">Analyses prédictives et détection d&apos;anomalies</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prévision de Trésorerie (30 jours)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prediction?.projection}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} tickLine={false} axisLine={false} fontSize={12} stroke="#6b7280" />
                      <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} tickLine={false} axisLine={false} fontSize={12} stroke="#6b7280" />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} FCFA`, "Solde"]} labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR")} contentStyle={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px" }} />
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="balance" stroke="#1e3a5f" fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Santé Financière</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Tendance</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${prediction?.trend === "up" ? "bg-green-100 text-green-700" : prediction?.trend === "down" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                        {prediction?.trend === "up" ? "↗ En hausse" : prediction?.trend === "down" ? "↘ En baisse" : "→ Stable"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Risque de rupture</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${prediction?.risk_alert ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {prediction?.risk_alert ? "ÉLEVÉ" : "FAIBLE"}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Solde min. prévu</p>
                      <p className={`text-2xl font-bold ${prediction?.min_balance && prediction.min_balance < 0 ? "text-red-600" : "text-gray-900"}`}>
                        {prediction?.min_balance?.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-blue-100 p-2"><Bot className="h-5 w-5 text-[#1e3a5f]" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Conseil IA</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {prediction?.trend === "down"
                          ? "Attention, votre trésorerie baisse. Pensez à relancer les clients en retard de paiement."
                          : "Votre trésorerie est saine. Bon moment pour investir dans du stock ou de l&apos;équipement."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Détection d&apos;Anomalies</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                {anomalies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-green-100 p-3"><CheckCircle className="h-8 w-8 text-green-600" /></div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune anomalie détectée</h3>
                    <p className="mt-2 text-gray-500">Toutes les écritures comptables semblent conformes.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {anomalies.map((anomaly, index) => (
                      <div key={index} className="flex items-center justify-between p-6 hover:bg-gray-50">
                        <div className="flex items-start space-x-4">
                          <div className={`rounded-full p-2 ${anomaly.severity === "high" ? "bg-red-100" : "bg-yellow-100"}`}>
                            <AlertTriangle className={`h-5 w-5 ${anomaly.severity === "high" ? "text-red-600" : "text-yellow-600"}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{anomaly.description}</p>
                            <p className="text-sm text-gray-500">Détecté le {new Date(anomaly.date).toLocaleDateString()} • Montant : {anomaly.amount?.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${anomaly.severity === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {anomaly.severity === "high" ? "CRITIQUE" : "SUSPECT"}
                        </span>
                      </div>
                    ))}
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
