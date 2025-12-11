import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Search, Plus, Download, Check, Edit2, Trash2, Eye, CheckCircle, Loader2
} from "lucide-react";

type EntryStatus = "draft" | "validated" | "posted" | "cancelled";
type JournalType = "ACH" | "VTE" | "BQ" | "CA" | "OD";

interface EntryLine {
  id: string;
  account_id: string;
  label: string;
  debit: number;
  credit: number;
  reconciled: boolean;
}

interface Entry {
  id: string;
  entry_number: string;
  journal_type: JournalType;
  date: string;
  reference?: string;
  description: string;
  status: EntryStatus;
  lines: EntryLine[];
  validated_at?: string;
  posted_at?: string;
}

const journalLabels: Record<JournalType, string> = {
  ACH: "Achats",
  VTE: "Ventes",
  BQ: "Banque",
  CA: "Caisse",
  OD: "Opérations diverses"
};

const statusLabels: Record<EntryStatus, string> = {
  draft: "Brouillon",
  validated: "Validé",
  posted: "Comptabilisé",
  cancelled: "Annulé"
};

const statusColors: Record<EntryStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  validated: "bg-blue-100 text-blue-700",
  posted: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700"
};

export default function AccountingEntries() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [journalFilter, setJournalFilter] = useState<JournalType | "all">("all");

  useEffect(() => {
    fetchEntries();
  }, [statusFilter, journalFilter]);

  const fetchEntries = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/`;
      const params = new URLSearchParams();
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (journalFilter !== "all") params.append("journal_type", journalFilter);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  const validateEntry = async (entryId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/${entryId}/validate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ entry_id: entryId })
        }
      );

      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error("Error validating entry:", error);
    }
  };

  const postEntry = async (entryId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/${entryId}/post`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error("Error posting entry:", error);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette écriture ?")) return;

    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-entries/entries/${entryId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.entry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalDebit = (lines: EntryLine[]) => 
    lines.reduce((sum, line) => sum + line.debit, 0);

  const getTotalCredit = (lines: EntryLine[]) => 
    lines.reduce((sum, line) => sum + line.credit, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0d4a44]" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Écritures comptables - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Écritures comptables</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exporter
              </button>
              <button 
                onClick={() => router.push("/accounting/entries/new")}
                className="flex items-center gap-2 px-4 py-2 bg-[#0d4a44] text-white rounded-lg text-sm font-medium hover:bg-[#0a3d38]"
              >
                <Plus className="w-4 h-4" />
                Nouvelle écriture
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une écriture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as EntryStatus | "all")}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="validated">Validé</option>
                  <option value="posted">Comptabilisé</option>
                </select>

                <select
                  value={journalFilter}
                  onChange={(e) => setJournalFilter(e.target.value as JournalType | "all")}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                >
                  <option value="all">Tous les journaux</option>
                  <option value="ACH">Achats</option>
                  <option value="VTE">Ventes</option>
                  <option value="BQ">Banque</option>
                  <option value="CA">Caisse</option>
                  <option value="OD">Opérations diverses</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Écriture</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Journal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        Aucune écriture trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.entry_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {journalLabels[entry.journal_type]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {getTotalDebit(entry.lines).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {getTotalCredit(entry.lines).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
                            {statusLabels[entry.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/accounting/entries/${entry.id}`)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {entry.status === "draft" && (
                              <>
                                <button
                                  onClick={() => validateEntry(entry.id)}
                                  className="text-blue-400 hover:text-blue-600"
                                  title="Valider"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/accounting/entries/${entry.id}/edit`)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteEntry(entry.id)}
                                  className="text-red-400 hover:text-red-600"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {entry.status === "validated" && (
                              <button
                                onClick={() => postEntry(entry.id)}
                                className="text-green-400 hover:text-green-600"
                                title="Comptabiliser"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
