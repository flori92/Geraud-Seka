import { useState } from "react";
import Head from "next/head";
import {
    Brain, TrendingUp, CheckCircle, Clock, AlertTriangle,
    FileText, BarChart3, Zap, RefreshCw, Eye, ThumbsUp, ThumbsDown
} from "lucide-react";

interface LearningItem {
    id: string;
    type: "classification" | "extraction" | "prediction";
    description: string;
    accuracy: number;
    samples: number;
    lastUpdated: string;
    status: "learning" | "stable" | "needs_review";
}

const mockLearning: LearningItem[] = [
    {
        id: "1",
        type: "classification",
        description: "Classification des factures fournisseurs",
        accuracy: 94.5,
        samples: 1247,
        lastUpdated: "Il y a 2 heures",
        status: "stable",
    },
    {
        id: "2",
        type: "extraction",
        description: "Extraction des montants et dates",
        accuracy: 97.2,
        samples: 3421,
        lastUpdated: "Il y a 30 min",
        status: "stable",
    },
    {
        id: "3",
        type: "classification",
        description: "Catégorisation des transactions bancaires",
        accuracy: 89.1,
        samples: 856,
        lastUpdated: "Il y a 1 jour",
        status: "learning",
    },
    {
        id: "4",
        type: "prediction",
        description: "Prédiction des comptes comptables",
        accuracy: 78.3,
        samples: 432,
        lastUpdated: "Il y a 3 jours",
        status: "needs_review",
    },
];

const statusConfig = {
    learning: { label: "En apprentissage", color: "bg-blue-100 text-blue-700", icon: RefreshCw },
    stable: { label: "Stable", color: "bg-green-100 text-green-700", icon: CheckCircle },
    needs_review: { label: "À réviser", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
};

export default function AILearningPage() {
    const [items] = useState<LearningItem[]>(mockLearning);

    const avgAccuracy = items.reduce((sum, i) => sum + i.accuracy, 0) / items.length;
    const totalSamples = items.reduce((sum, i) => sum + i.samples, 0);

    return (
        <>
            <Head>
                <title>Apprentissage IA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
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
                                <p className="text-3xl font-bold text-gray-900">{items.filter(i => i.status === "stable").length}</p>
                                <p className="text-sm text-gray-500">Modèles stables</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">+12%</p>
                                <p className="text-sm text-gray-500">Amélioration ce mois</p>
                            </div>
                        </div>

                        {/* Learning Items */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-900">Modèles en apprentissage</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {items.map((item) => {
                                    const StatusIcon = statusConfig[item.status].icon;
                                    return (
                                        <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-medium text-gray-900">{item.description}</h3>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[item.status].color}`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusConfig[item.status].label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                                        <span>Type: {item.type}</span>
                                                        <span>{item.samples.toLocaleString()} échantillons</span>
                                                        <span>Mis à jour {item.lastUpdated}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${item.accuracy >= 90 ? "bg-green-500" :
                                                                        item.accuracy >= 80 ? "bg-yellow-500" : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${item.accuracy}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-lg font-bold text-gray-900">{item.accuracy}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Valider">
                                                            <ThumbsUp className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Signaler erreur">
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
                    </div>
                </main>
            </div>
        </>
    );
}
