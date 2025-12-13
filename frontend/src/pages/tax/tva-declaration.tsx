import { useState, useEffect } from "react";
import Head from "next/head";
import {
    Receipt, Calculator, FileText, Download, CheckCircle, AlertCircle,
    Loader2, Calendar, TrendingUp, TrendingDown, Eye, Send, Clock,
    ChevronDown, ChevronRight, HelpCircle, Printer, RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface TVADeclaration {
    id: string;
    period: string;
    due_date: string;
    status: "draft" | "submitted" | "validated" | "paid";
    tva_collectee: number;
    tva_deductible: number;
    tva_due: number;
    credit_report?: number;
}

interface TVALine {
    code: string;
    label: string;
    base: number;
    tva: number;
    rate: string;
}

export default function TVADeclarationPage() {
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState("2024-12");
    const [expandedSections, setExpandedSections] = useState<string[]>(["collectee", "deductible"]);

    const [declaration, setDeclaration] = useState<TVADeclaration | null>(null);
    const [history, setHistory] = useState<TVADeclaration[]>([]);

    const [collecteeLines, setCollecteeLines] = useState<TVALine[]>([]);
    const [deductibleLines, setDeductibleLines] = useState<TVALine[]>([]);

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Mock data
            setDeclaration({
                id: "1",
                period: selectedPeriod,
                due_date: "2025-01-15",
                status: "draft",
                tva_collectee: 2850000,
                tva_deductible: 1420000,
                tva_due: 1430000,
                credit_report: 0
            });

            setCollecteeLines([
                { code: "CA3-01", label: "Ventes de marchandises (18%)", base: 12500000, tva: 2250000, rate: "18%" },
                { code: "CA3-02", label: "Prestations de services (18%)", base: 3000000, tva: 540000, rate: "18%" },
                { code: "CA3-03", label: "Ventes exonérées", base: 500000, tva: 0, rate: "0%" },
                { code: "CA3-04", label: "Autres opérations (10%)", base: 600000, tva: 60000, rate: "10%" },
            ]);

            setDeductibleLines([
                { code: "DD-01", label: "Achats de marchandises", base: 5500000, tva: 990000, rate: "18%" },
                { code: "DD-02", label: "Services extérieurs", base: 1200000, tva: 216000, rate: "18%" },
                { code: "DD-03", label: "Investissements (immob.)", base: 800000, tva: 144000, rate: "18%" },
                { code: "DD-04", label: "Autres charges déductibles", base: 388889, tva: 70000, rate: "18%" },
            ]);

            setHistory([
                { id: "h1", period: "2024-11", due_date: "2024-12-15", status: "paid", tva_collectee: 2650000, tva_deductible: 1180000, tva_due: 1470000 },
                { id: "h2", period: "2024-10", due_date: "2024-11-15", status: "paid", tva_collectee: 2420000, tva_deductible: 1050000, tva_due: 1370000 },
                { id: "h3", period: "2024-09", due_date: "2024-10-15", status: "paid", tva_collectee: 2780000, tva_deductible: 1320000, tva_due: 1460000 },
            ]);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        setCalculating(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCalculating(false);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon" },
            submitted: { bg: "bg-blue-100", text: "text-blue-700", label: "Soumise" },
            validated: { bg: "bg-green-100", text: "text-green-700", label: "Validée" },
            paid: { bg: "bg-blue-100", text: "text-blue-700", label: "Payée" }
        };
        const cfg = configs[status] || configs.draft;
        return <span className={`px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} rounded-full`}>{cfg.label}</span>;
    };

    const formatPeriod = (period: string) => {
        const [year, month] = period.split("-");
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    const totalCollectee = collecteeLines.reduce((sum, l) => sum + l.tva, 0);
    const totalDeductible = deductibleLines.reduce((sum, l) => sum + l.tva, 0);
    const tvaDue = totalCollectee - totalDeductible;

    return (
        <>
            <Head>
                <title>Déclaration TVA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <Receipt className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Déclaration TVA</h1>
                                    <p className="text-sm text-gray-500">Calcul automatique basé sur vos écritures</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="2024-12">Décembre 2024</option>
                                    <option value="2024-11">Novembre 2024</option>
                                    <option value="2024-10">Octobre 2024</option>
                                    <option value="2024-09">Septembre 2024</option>
                                </select>
                                <button
                                    onClick={handleRecalculate}
                                    disabled={calculating}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-4 w-4 ${calculating ? "animate-spin" : ""}`} />
                                    Recalculer
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                                <span className="text-sm font-medium text-gray-500">TVA Collectée</span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollectee)}</p>
                                        </div>
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingDown className="h-5 w-5 text-orange-500" />
                                                <span className="text-sm font-medium text-gray-500">TVA Déductible</span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDeductible)}</p>
                                        </div>
                                        <div className={`rounded-xl border p-5 ${tvaDue >= 0 ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calculator className={`h-5 w-5 ${tvaDue >= 0 ? "text-blue-600" : "text-green-600"}`} />
                                                <span className={`text-sm font-medium ${tvaDue >= 0 ? "text-blue-700" : "text-green-700"}`}>
                                                    {tvaDue >= 0 ? "TVA à payer" : "Crédit TVA"}
                                                </span>
                                            </div>
                                            <p className={`text-2xl font-bold ${tvaDue >= 0 ? "text-blue-700" : "text-green-700"}`}>
                                                {formatCurrency(Math.abs(tvaDue))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* TVA Collectée */}
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <button
                                            onClick={() => toggleSection("collectee")}
                                            className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                                <h2 className="font-semibold text-gray-900">TVA Collectée (sur les ventes)</h2>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-blue-600">{formatCurrency(totalCollectee)}</span>
                                                {expandedSections.includes("collectee") ? (
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </button>
                                        {expandedSections.includes("collectee") && (
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Libellé</th>
                                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Base HT</th>
                                                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Taux</th>
                                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">TVA</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {collecteeLines.map((line) => (
                                                        <tr key={line.code} className="hover:bg-gray-50">
                                                            <td className="px-6 py-3 text-sm font-mono text-gray-600">{line.code}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-900">{line.label}</td>
                                                            <td className="px-6 py-3 text-sm text-right text-gray-600">{formatCurrency(line.base)}</td>
                                                            <td className="px-6 py-3 text-sm text-center">
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                    {line.rate}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(line.tva)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* TVA Déductible */}
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <button
                                            onClick={() => toggleSection("deductible")}
                                            className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <TrendingDown className="h-5 w-5 text-orange-500" />
                                                <h2 className="font-semibold text-gray-900">TVA Déductible (sur les achats)</h2>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-orange-600">{formatCurrency(totalDeductible)}</span>
                                                {expandedSections.includes("deductible") ? (
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </button>
                                        {expandedSections.includes("deductible") && (
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Libellé</th>
                                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Base HT</th>
                                                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Taux</th>
                                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">TVA</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {deductibleLines.map((line) => (
                                                        <tr key={line.code} className="hover:bg-gray-50">
                                                            <td className="px-6 py-3 text-sm font-mono text-gray-600">{line.code}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-900">{line.label}</td>
                                                            <td className="px-6 py-3 text-sm text-right text-gray-600">{formatCurrency(line.base)}</td>
                                                            <td className="px-6 py-3 text-sm text-center">
                                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                                    {line.rate}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(line.tva)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <Eye className="h-4 w-4" />
                                                Prévisualiser
                                            </button>
                                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <Printer className="h-4 w-4" />
                                                Imprimer
                                            </button>
                                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <Download className="h-4 w-4" />
                                                Exporter PDF
                                            </button>
                                        </div>
                                        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0d4a44] text-white rounded-lg hover:bg-[#0a3d38]">
                                            <Send className="h-4 w-4" />
                                            Soumettre la déclaration
                                        </button>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Current Declaration Info */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="font-semibold text-gray-900 mb-4">Déclaration en cours</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Période</span>
                                                <span className="text-sm font-medium text-gray-900">{formatPeriod(selectedPeriod)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Date limite</span>
                                                <span className="text-sm font-medium text-gray-900">{declaration?.due_date ? new Date(declaration.due_date).toLocaleDateString() : "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Statut</span>
                                                {declaration && getStatusBadge(declaration.status)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* History */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                            Déclarations précédentes
                                        </h3>
                                        <div className="space-y-3">
                                            {history.map((decl) => (
                                                <div key={decl.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-gray-900 text-sm">{formatPeriod(decl.period)}</span>
                                                        {getStatusBadge(decl.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        TVA payée: <span className="font-medium text-gray-900">{formatCurrency(decl.tva_due)}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Help */}
                                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <HelpCircle className="h-5 w-5 text-blue-600" />
                                            <h3 className="font-semibold text-blue-900">Besoin d&apos;aide ?</h3>
                                        </div>
                                        <p className="text-sm text-blue-800 mb-3">
                                            Les montants sont calculés automatiquement à partir de vos écritures comptables validées.
                                        </p>
                                        <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                            Voir la documentation
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
