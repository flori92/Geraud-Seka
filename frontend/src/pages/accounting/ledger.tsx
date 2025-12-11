import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Search, Download, Loader2 } from "lucide-react";

interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
}

export default function GeneralLedger() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting/journal/`,
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

  const filteredEntries = entries.filter(
    (entry) =>
      entry.entry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Grand livre - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Grand livre</h1>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Écriture</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte débit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte crédit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        Aucune écriture trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {entry.entry_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.debit_account}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.credit_account}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {entry.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
