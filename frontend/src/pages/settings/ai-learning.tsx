import { useState, useEffect } from "react";
import Head from "next/head";
import {
    Brain, TrendingUp, CheckCircle, Clock, AlertTriangle,
    FileText, Zap, RefreshCw, Eye, ThumbsUp, ThumbsDown, Loader2
} from "lucide-react";
import { getAILearningStats, submitAIFeedback, type AILearningStats, type AILearningModel } from "@/lib/api";

const statusConfig = {
    learning: { label: "En apprentissage", color: "bg-blue-100 text-blue-700", icon: RefreshCw },
    stable: { label: "Stable", color: "bg-green-100 text-green-700", icon: CheckCircle },
    needs_review: { label: "À réviser", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
};

export default function AILearningPage() {
    const [stats, setStats] = useState<AILearningStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                const data = await getAILearningStats(token);
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch AI learning stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (modelId: string, isCorrect: boolean) => {
        setSubmittingFeedback(modelId);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                await submitAIFeedback(token, modelId, isCorrect);
                await fetchStats();
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            alert("Erreur lors de l'envoi du feedback");
        } finally {
            setSubmittingFeedback(null);
        }
    };

    const avgAccuracy = stats?.average_accuracy || 0;
    const totalSamples = stats?.total_samples || 0;
    const stableModels = stats?.stable_models || 0;
    const improvementRate = stats?.improvement_rate || 0;
    const models = stats?.models || [];

    return (
        <>
            <Head>
                <title>Apprentissage IA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                                    <Brain className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Apprentissage IA</h1>
                                    <p className="text-sm text-gray-500">
                                        Suivez et améliorez les modèles d&apos;intelligence artificielle
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={fetchStats}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                Actualiser
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <Brain className="h-6 w-6 opacity-80" />
                                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Global</span>
                                        </div>
                                        <p className="text-3xl font-bold">{avgAccuracy.toFixed(1)}%</p>
                                        <p className="text-sm opacity-80">Précision moyenne</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <FileText className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900">{totalSamples.toLocaleString()}</p>
                                        <p className="text-sm text-gray-500">Échantillons traités</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <Zap className="h-6 w-6 text-green-600" />
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900">{stableModels}</p>
                                        <p className="text-sm text-gray-500">Modèles stables</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <TrendingUp className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {improvementRate > 0 ? "+" : ""}{improvementRate}%
                                        </p>
                                        <p className="text-sm text-gray-500">Amélioration ce mois</p>
                                    </div>
                                </div>

                                {/* Learning Items */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="font-semibold text-gray-900">Modèles en apprentissage</h2>
                                    </div>
                                    {models.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun modèle actif</h3>
                                            <p className="text-gray-500">
                                                Les modèles IA s&apos;amélioreront au fur et à mesure de votre utilisation
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {models.map((model) => {
                                                const StatusIcon = statusConfig[model.status]?.icon || Clock;
                                                return (
                                                    <div key={model.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <h3 className="font-medium text-gray-900">{model.description}</h3>
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[model.status]?.color || "bg-gray-100 text-gray-700"}`}>
                                                                        <StatusIcon className="h-3 w-3" />
                                                                        {statusConfig[model.status]?.label || model.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                                                    <span>Type: {model.type}</span>
                                                                    <span>{model.samples_count?.toLocaleString() || 0} échantillons</span>
                                                                    <span>Mis à jour {model.last_updated || "récemment"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${model.accuracy >= 90 ? "bg-green-500" :
                                                                                    model.accuracy >= 80 ? "bg-yellow-500" : "bg-red-500"
                                                                                }`}
                                                                            style={{ width: `${model.accuracy}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-lg font-bold text-gray-900">{model.accuracy}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleFeedback(model.id, true)}
                                                                        disabled={submittingFeedback === model.id}
                                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                                        title="Valider"
                                                                    >
                                                                        {submittingFeedback === model.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <ThumbsUp className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleFeedback(model.id, false)}
                                                                        disabled={submittingFeedback === model.id}
                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                                        title="Signaler erreur"
                                                                    >
                                                                        <ThumbsDown className="h-4 w-4" />
                                                                    </button>
                                                                    <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Voir détails">
                                                                        <Eye className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Tips */}
                                <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Zap className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Améliorez la précision</h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Plus vous validez les suggestions de l&apos;IA, plus elle devient précise.
                                                Utilisez les boutons de feedback pour signaler les erreurs et les bonnes classifications.
                                            </p>
                                            <button className="text-sm text-purple-600 font-medium hover:text-purple-700">
                                                En savoir plus sur l&apos;apprentissage
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
