import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Plus, Search, Filter, Download, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types mock
interface ExpenseReport {
    id: string;
    employee: string;
    date: string;
    description: string;
    amount: number;
    status: "draft" | "submitted" | "approved" | "paid" | "rejected";
    category: string;
}

const MOCK_EXPENSES: ExpenseReport[] = [
    {
        id: "EXP-001",
        employee: "Jean Dupont",
        date: "2024-03-10",
        description: "Déjeuner client - Société Alpha",
        amount: 85.50,
        status: "approved",
        category: "Repas"
    },
    {
        id: "EXP-002",
        employee: "Marie Martin",
        date: "2024-03-12",
        description: "Taxi Aéroport",
        amount: 45.00,
        status: "paid",
        category: "Transport"
    },
    {
        id: "EXP-003",
        employee: "Jean Dupont",
        date: "2024-03-15",
        description: "Hôtel Paris - Conférence Tech",
        amount: 320.00,
        status: "draft",
        category: "Hébergement"
    }
];

export default function ExpenseReports() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<ExpenseReport[]>(MOCK_EXPENSES);
    const [search, setSearch] = useState("");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Brouillon</span>;
            case "submitted": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Soumis</span>;
            case "approved": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validé</span>;
            case "paid": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
            case "rejected": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejeté</span>;
            default: return null;
        }
    };

    return (
        <>
            <Head><title>Notes de Frais - SEKA</title></Head>
            <div className="min-h-screen bg-gray-50 flex">
                <PennylaneSidebar />
                <main className="flex-1 ml-[220px] p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notes de frais</h1>
                            <p className="text-gray-500 mt-1">Gérez les dépenses de vos collaborateurs.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Exporter
                            </button>
                            <button className="px-4 py-2 bg-[#0d4a44] text-white rounded-lg text-sm font-medium hover:bg-[#0a3d38] flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Nouvelle note de frais
                            </button>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher (employé, description...)"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                <Filter className="w-4 h-4" />
                                Filtres
                            </button>
                        </div>
                        <div className="flex items-center gap-4 px-4 border-l border-gray-200">
                            <div className="text-center">
                                <span className="block text-xs text-gray-500 uppercase font-semibold">À valider</span>
                                <span className="block text-lg font-bold text-[#0d4a44]">0,00 €</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs text-gray-500 uppercase font-semibold">À rembourser</span>
                                <span className="block text-lg font-bold text-orange-600">45,00 €</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {expenses.filter(e =>
                                    e.description.toLowerCase().includes(search.toLowerCase()) ||
                                    e.employee.toLowerCase().includes(search.toLowerCase())
                                ).map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {format(new Date(expense.date), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#e6f2f1] text-[#0d4a44] flex items-center justify-center text-xs font-bold">
                                                {expense.employee.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{expense.employee}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="px-2 py-1 rounded bg-gray-100 text-xs">{expense.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                            {expense.amount.toFixed(2)} €
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(expense.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button className="text-[#0d4a44] hover:text-[#0a3d38] font-medium text-xs border border-[#0d4a44] px-3 py-1 rounded-lg">
                                                Détails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {expenses.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Aucune note de frais.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
