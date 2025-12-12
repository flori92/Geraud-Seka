import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Search, Download, Loader2 } from "lucide-react";

type JournalType = "ACH" | "VTE" | "BQ" | "CA" | "OD";

interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
}

const journalLabels: Record<JournalType, string> = {
  ACH: "Journal des achats",
  VTE: "Journal des ventes",
  BQ: "Journal de banque",
  CA: "Journal de caisse",
  OD: "Opérations diverses"
};

export default function Journals() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<JournalType>("ACH");

  useEffect(() => {
    fetchJournalEntries();
  }, [selectedJournal]);

  const fetchJournalEntries = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/?journal_type=${selectedJournal}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Journaux - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Journaux comptables</h1>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center border-b border-gray-200 px-4">
              {(Object.keys(journalLabels) as JournalType[]).map((journal) => (
                <button
                  key={journal}
                  onClick={() => setSelectedJournal(journal)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedJournal === journal
                      ? "border-teal-600 text-[#0d4a44]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {journalLabels[journal]}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0d4a44]" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Écriture</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                          Aucune écriture dans ce journal
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {entry.entry_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(entry.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {entry.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {entry.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
