import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { getCashFlowPrediction, getAnomalies, CashFlowPrediction, Anomaly } from "../lib/api";
import { AlertTriangle, CheckCircle, Bot } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine
} from "recharts";
import { Badge } from "../components/ui/Badge";

export default function IntelligencePage() {
    const [prediction, setPrediction] = useState<CashFlowPrediction | null>(null);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [predData, anomData] = await Promise.all([
                    getCashFlowPrediction(30),
                    getAnomalies()
                ]);
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
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Intelligence Artificielle</h1>
                    <p className="text-gray-500">Analyses prédictives et détection d'anomalies</p>
                </div>

                {/* Section Trésorerie Prédictive */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Prévision de Trésorerie (30 jours)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={prediction?.projection}>
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Solde']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                                        />
                                        <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                                        <Area
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#2563eb"
                                            fillOpacity={1}
                                            fill="url(#colorBalance)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Santé Financière</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Tendance</span>
                                        <Badge variant={prediction?.trend === 'up' ? 'success' : prediction?.trend === 'down' ? 'error' : 'default'}>
                                            {prediction?.trend === 'up' ? '↗ En hausse' : prediction?.trend === 'down' ? '↘ En baisse' : '→ Stable'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Risque de rupture</span>
                                        <Badge variant={prediction?.risk_alert ? 'error' : 'success'}>
                                            {prediction?.risk_alert ? 'ÉLEVÉ' : 'FAIBLE'}
                                        </Badge>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-500">Solde min. prévu</p>
                                        <p className={`text-2xl font-bold ${prediction?.min_balance && prediction.min_balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                            {prediction?.min_balance.toLocaleString()} FCFA
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                            <CardContent className="pt-6">
                                <div className="flex items-start space-x-4">
                                    <div className="rounded-full bg-purple-100 p-2">
                                        <Bot className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-purple-900">Conseil IA</h3>
                                        <p className="mt-1 text-sm text-purple-700">
                                            {prediction?.trend === 'down'
                                                ? "Attention, votre trésorerie baisse. Pensez à relancer les clients en retard de paiement dès maintenant."
                                                : "Votre trésorerie est saine. C'est le bon moment pour investir dans du stock ou de l'équipement."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section Anomalies */}
                <div className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Détection d'Anomalies</h2>
                    <Card>
                        <CardContent className="p-0">
                            {anomalies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-green-100 p-3">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune anomalie détectée</h3>
                                    <p className="mt-2 text-gray-500">Toutes les écritures comptables semblent conformes.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {anomalies.map((anomaly, index) => (
                                        <div key={index} className="flex items-center justify-between p-6 hover:bg-gray-50">
                                            <div className="flex items-start space-x-4">
                                                <div className={`rounded-full p-2 ${anomaly.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                                    <AlertTriangle className={`h-5 w-5 ${anomaly.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{anomaly.description}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Détecté le {new Date(anomaly.date).toLocaleDateString()} • Montant : {anomaly.amount.toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={anomaly.severity === 'high' ? 'error' : 'warning'}>
                                                {anomaly.severity === 'high' ? 'CRITIQUE' : 'SUSPECT'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
