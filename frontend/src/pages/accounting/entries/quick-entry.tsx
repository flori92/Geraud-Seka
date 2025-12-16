import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Plus, Trash2, Save, X, Sparkles, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Account {
    id: string;
    account_code: string;
    account_name: string;
    account_type: string;
}

interface EntryLine {
    account_id: string;
    label: string;
    debit: string;
    credit: string;
}

interface SavedEntry {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    amount: number;
}

export default function QuickAccountingEntry() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [journalType, setJournalType] = useState("OD");
    const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
    const [reference, setReference] = useState("");
    const [description, setDescription] = useState("");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;

    // État pour les lignes de l'écriture en cours
    const [lines, setLines] = useState<EntryLine[]>([
        { account_id: "", label: "", debit: "0", credit: "0" },
        { account_id: "", label: "", debit: "0", credit: "0" }
    ]);

    // Historique de la session
    const [recentEntries, setRecentEntries] = useState<SavedEntry[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAccounts = useCallback(async () => {
        const token = localStorage.getItem("seka_access_token");
        try {
            if (!apiBaseUrl) {
                console.error("[API] NEXT_PUBLIC_API_BASE_URL manquant");
                return;
            }
            const response = await fetch(
                `${apiBaseUrl}/api/v1/accounting/ledger/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    }, [apiBaseUrl]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const addLine = () => {
        setLines([...lines, { account_id: "", label: description || "", debit: "0", credit: "0" }]);
    };

    const removeLine = (index: number) => {
        if (lines.length > 2) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const updateLine = (index: number, field: keyof EntryLine, value: string) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
    };

    const getTotalDebit = () =>
        lines.reduce((sum, line) => sum + parseFloat(line.debit || "0"), 0);

    const getTotalCredit = () =>
        lines.reduce((sum, line) => sum + parseFloat(line.credit || "0"), 0);

    const isBalanced = () =>
        Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;

    const handleSubmit = async (continueEntry: boolean = false) => {
        if (!isBalanced()) {
            alert("L'écriture n'est pas équilibrée");
            return;
        }
        if (getTotalDebit() === 0) {
            alert("Le montant doit être supérieur à 0");
            return;
        }

        if (lines.some((line) => !line.account_id)) {
            alert("Veuillez sélectionner un compte pour chaque ligne");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem("seka_access_token");
        try {
            if (!apiBaseUrl) {
                console.error("[API] NEXT_PUBLIC_API_BASE_URL manquant");
                return;
            }
            const response = await fetch(
                `${apiBaseUrl}/api/v1/accounting-entries/entries/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        journal_type: journalType,
                        date: dateStr,
                        reference,
                        description,
                        lines: lines.map(line => ({
                            account_id: line.account_id,
                            label: line.label || description,
                            debit: parseFloat(line.debit || "0"),
                            credit: parseFloat(line.credit || "0")
                        }))
                    })
                }
            );

            if (response.ok) {
                const savedEntry = await response.json();

                // Ajouter à l'historique local
                setRecentEntries([
                    {
                        id: savedEntry.id,
                        entry_number: savedEntry.entry_number,
                        date: savedEntry.date,
                        description: savedEntry.description,
                        amount: getTotalDebit()
                    },
                    ...recentEntries
                ]);

                if (continueEntry) {
                    // Reset form but keep journal and date
                    setReference("");
                    setDescription("");
                    setLines([
                        { account_id: "", label: "", debit: "0", credit: "0" },
                        { account_id: "", label: "", debit: "0", credit: "0" }
                    ]);
                    // Focus logic could satisfy "Quick Entry" by focusing first field
                } else {
                    router.push("/accounting/entries");
                }
            } else {
                const error = await response.json();
                alert(error.detail || "Erreur lors de la création");
            }
        } catch (error) {
            console.error("Error creating entry:", error);
            alert("Erreur lors de la création");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAccounts = accounts;

    return (
        <>
            <Head><title>Saisie Rapide - SEKA</title></Head>
            <div className="min-h-screen bg-gray-50 flex">
                <PennylaneSidebar />
                <main className="flex-1 ml-[220px] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Saisie Comptable Rapide</h1>
                            <p className="text-gray-500 text-sm">Enchaînez les écritures sans rechargement.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/accounting/dashboard")}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white"
                            >
                                <X className="w-4 h-4" />
                                Fermer
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Colonne de saisie (2/3) */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
                                            Journal
                                        </label>
                                        <select
                                            value={journalType}
                                            onChange={(e) => setJournalType(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44] bg-gray-50"
                                        >
                                            <option value="ACH">Achats</option>
                                            <option value="VTE">Ventes</option>
                                            <option value="BQ">Banque</option>
                                            <option value="CA">Caisse</option>
                                            <option value="OD">Opérations diverses</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
                                            Date Comptable
                                        </label>
                                        <input
                                            type="date"
                                            value={dateStr}
                                            onChange={(e) => setDateStr(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44] bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
                                            Référence Pièce
                                        </label>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="Ex: FAC-2024-001"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
                                        Libellé global
                                    </label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Description de l'opération"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                                    />
                                </div>

                                <div className="mb-4">
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[35%]">Compte</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé ligne</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[15%]">Débit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[15%]">Crédit</th>
                                                    <th className="px-2 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {lines.map((line, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2">
                                                            <select
                                                                value={line.account_id}
                                                                onChange={(e) => updateLine(index, "account_id", e.target.value)}
                                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                                                            >
                                                                <option value="">-- Choisir --</option>
                                                                {filteredAccounts.map((account) => (
                                                                    <option key={account.id} value={account.id}>
                                                                        {account.account_code} - {account.account_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={line.label}
                                                                onChange={(e) => updateLine(index, "label", e.target.value)}
                                                                placeholder={description}
                                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="number"
                                                                value={line.debit}
                                                                onChange={(e) => updateLine(index, "debit", e.target.value)}
                                                                // onFocus={(e) => e.target.select()}
                                                                className={`w-full px-2 py-1.5 text-sm text-right border rounded focus:outline-none focus:ring-2 focus:ring-[#0d4a44] ${parseFloat(line.debit) > 0 ? 'border-gray-300 font-medium' : 'border-gray-200 text-gray-400'}`}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="number"
                                                                value={line.credit}
                                                                onChange={(e) => updateLine(index, "credit", e.target.value)}
                                                                // onFocus={(e) => e.target.select()}
                                                                className={`w-full px-2 py-1.5 text-sm text-right border rounded focus:outline-none focus:ring-2 focus:ring-[#0d4a44] ${parseFloat(line.credit) > 0 ? 'border-gray-300 font-medium' : 'border-gray-200 text-gray-400'}`}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            {lines.length > 2 && (
                                                                <button
                                                                    onClick={() => removeLine(index)}
                                                                    tabIndex={-1}
                                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2">
                                                        <button
                                                            onClick={addLine}
                                                            className="text-xs font-medium text-[#0d4a44] hover:text-[#0a3d38] flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" /> Ajouter une ligne
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-sm font-bold text-gray-900 border-t-2 border-gray-300">
                                                        {getTotalDebit().toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-sm font-bold text-gray-900 border-t-2 border-gray-300">
                                                        {getTotalCredit().toFixed(2)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {!isBalanced() ? (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between text-red-700 text-sm">
                                            <span className="font-medium">Écriture déséquilibrée</span>
                                            <span className="font-mono font-bold">Écart: {Math.abs(getTotalDebit() - getTotalCredit()).toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between text-green-700 text-sm">
                                            <span className="font-medium">Écriture équilibrée</span>
                                            <span className="font-mono font-bold">Total: {getTotalDebit().toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={!isBalanced() || isSubmitting || getTotalDebit() === 0}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Enregistrer et fermer
                                    </button>
                                    <button
                                        onClick={() => handleSubmit(true)}
                                        disabled={!isBalanced() || isSubmitting || getTotalDebit() === 0}
                                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#0d4a44] hover:bg-[#0a3d38] rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        Enregistrer et suivant
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Colonne latérale : Historique (1/3) */}
                        <div className="xl:col-span-1">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 h-full shadow-sm flex flex-col">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    Dernières saisies
                                </h3>

                                {recentEntries.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-4 border-2 border-dashed border-gray-100 rounded-lg">
                                        <p className="text-sm">Aucune écriture saisie dans cette session.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                                        {recentEntries.map((entry) => (
                                            <div key={entry.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group relative cursor-pointer">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-[#0d4a44] bg-[#e6f2f1] px-2 py-0.5 rounded">
                                                        {entry.entry_number}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{format(new Date(entry.date), 'dd/MM/yyyy')}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">{entry.description || "Sans description"}</p>
                                                <p className="text-sm font-mono text-gray-600 text-right">{entry.amount.toFixed(2)} <span className="text-xs">FCFA</span></p>

                                                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                                                    <button
                                                        onClick={() => router.push(`/accounting/entries/${entry.id}`)}
                                                        className="text-xs bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-50 text-gray-700"
                                                    >
                                                        Voir <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
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
