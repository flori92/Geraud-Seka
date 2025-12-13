import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastContainer";

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
  const { error: showErrorToast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lire le type de journal depuis les query params de l'URL
  const journalTypeFromQuery = router.query.type as JournalType | undefined;
  const validJournalTypes: JournalType[] = ["ACH", "VTE", "BQ", "CA", "OD"];
  const initialJournal = router.isReady && journalTypeFromQuery && validJournalTypes.includes(journalTypeFromQuery) 
    ? journalTypeFromQuery 
    : "ACH";
  const [selectedJournal, setSelectedJournal] = useState<JournalType>(initialJournal);

  // Mettre à jour selectedJournal quand l'URL change
  useEffect(() => {
    if (router.isReady && journalTypeFromQuery && validJournalTypes.includes(journalTypeFromQuery)) {
      setSelectedJournal(journalTypeFromQuery);
    }
  }, [journalTypeFromQuery, router.isReady]);

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
    setError(null);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/?journal_type=${selectedJournal}`;
    try {
      const response = await fetch(
        apiUrl,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setEntries(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        let errorMessage = "Impossible de charger les écritures comptables";
        if (response.status === 404) {
          errorMessage = "L'endpoint API n'est pas disponible. Veuillez contacter le support.";
        } else if (response.status === 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
        } else if (response.status === 422) {
          errorMessage = "Les données envoyées sont invalides.";
        }
        setError(errorMessage);
        setEntries([]);
        // Ne pas afficher de toast pour les erreurs 404/500 silencieuses
        if (response.status !== 404 && response.status !== 500) {
          showErrorToast(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = "Erreur de connexion. Vérifiez votre connexion internet.";
      setError(errorMessage);
      setEntries([]);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Journaux - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Journaux comptables</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0d4a44] text-white rounded-lg text-sm font-medium hover:bg-[#0a3d38] transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center border-b border-gray-200 px-4">
              {(Object.keys(journalLabels) as JournalType[]).map((journal) => (
                <button
                  key={journal}
                  onClick={() => {
                    setSelectedJournal(journal);
                    router.push(`/accounting/journals?type=${journal}`, undefined, { shallow: true });
                  }}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedJournal === journal
                      ? "border-[#0d4a44] text-[#0d4a44]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {journalLabels[journal]}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              {error && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">{error}</p>
                  </div>
                </div>
              )}
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
                          {error ? "Erreur lors du chargement des données" : "Aucune écriture dans ce journal"}
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
