import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Settings2,
  ChevronDown,
  Loader2
} from "lucide-react";
import { getDocuments, type Document } from "@/lib/api";

type InvoiceStatus = "aucune" | "autoliquid" | "extracom" | "validee" | "20%" | "10%" | "carb_80%";

interface DisplayInvoice {
  id: string;
  emission: string;
  tiers: string;
  numeroFacture: string;
  numeroCompte: string;
  tauxTVA: InvoiceStatus;
  ajout: string;
  statutDirigeant: string;
  source: string;
  codesAnalytiques: string;
  categories: string;
}

export default function FacturesFournisseurs() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<DisplayInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercice, setSelectedExercice] = useState("2024");
  const [searchQuery, setSearchQuery] = useState("");
  const [tvaFilter, setTvaFilter] = useState<InvoiceStatus | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "validee" | "import">("all");

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const documents = await getDocuments(token);
        // Transform documents to display format
        const displayInvoices: DisplayInvoice[] = documents.map((doc: Document) => ({
          id: doc.id,
          emission: doc.date ? new Date(doc.date).toLocaleDateString("fr-FR") : "-",
          tiers: doc.supplier_name || "",
          numeroFacture: doc.reference_number || doc.filename,
          numeroCompte: "6288", // Default account
          tauxTVA: determineTVARate(doc.amount_vat, doc.amount_ht),
          ajout: new Date(doc.created_at).toLocaleDateString("fr-FR"),
          statutDirigeant: doc.status === "validated" ? "Validée" : "Import comp...",
          source: "",
          codesAnalytiques: "",
          categories: ""
        }));
        setInvoices(displayInvoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [router]);

  // Helper to determine TVA rate from amounts
  const determineTVARate = (vat?: number, ht?: number): InvoiceStatus => {
    if (!vat || !ht || ht === 0) return "aucune";
    const rate = (vat / ht) * 100;
    if (rate >= 19 && rate <= 21) return "20%";
    if (rate >= 9 && rate <= 11) return "10%";
    return "aucune";
  };

  const getTVABadge = (tva: InvoiceStatus) => {
    const styles: Record<InvoiceStatus, string> = {
      "aucune": "bg-gray-100 text-gray-600",
      "autoliquid": "bg-purple-100 text-purple-700",
      "extracom": "bg-blue-100 text-blue-700",
      "validee": "bg-emerald-100 text-emerald-700",
      "20%": "bg-teal-100 text-teal-700",
      "10%": "bg-teal-100 text-teal-700",
      "carb_80%": "bg-orange-100 text-orange-700",
    };
    const labels: Record<InvoiceStatus, string> = {
      "aucune": "Aucune",
      "autoliquid": "Autoliquid...",
      "extracom": "Extracom...",
      "validee": "Validée",
      "20%": "20%",
      "10%": "10%",
      "carb_80%": "Carb 80%",
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[tva]}`}>{labels[tva]}</span>;
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    if (q) {
      const match =
        inv.tiers.toLowerCase().includes(q) ||
        inv.numeroFacture.toLowerCase().includes(q) ||
        inv.numeroCompte.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (tvaFilter !== "all" && inv.tauxTVA !== tvaFilter) return false;

    if (statusFilter === "validee" && inv.statutDirigeant !== "Validée") return false;
    if (statusFilter === "import" && inv.statutDirigeant === "Validée") return false;

    return true;
  });

  return (
    <>
      <Head><title>Factures fournisseurs - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Top Header */}
          <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Exercice à clôturer</span>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                Exercice {selectedExercice}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-teal-600 hover:text-teal-700">Clôturer l'exercice</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                Importer des factures
              </button>
            </div>
          </header>

          <div className="p-6">
            {/* Filters Row */}
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200 space-y-3">
                {/* Ligne recherche + filtres principaux */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <input
                      type="text"
                      placeholder="Rechercher une facture (tiers, n° de facture, compte)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <select
                    value={tvaFilter}
                    onChange={(e) => setTvaFilter(e.target.value as InvoiceStatus | "all")}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Toutes les TVA</option>
                    <option value="20%">20%</option>
                    <option value="10%">10%</option>
                    <option value="autoliquid">Autoliquidation</option>
                    <option value="extracom">Extracommunautaire</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | "validee" | "import")}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="validee">Validées</option>
                    <option value="import">À valider</option>
                  </select>
                </div>

                {/* Ligne de configuration des colonnes (statique) */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-600">N° compte</span>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Statut dirigeant
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Émission
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Fournisseurs
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    TVA
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Source
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Montant
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Codes analytiques
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Catégories
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Commenté
                  </button>
                  <button className="ml-auto flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <Settings2 className="w-4 h-4" />
                    Personnaliser
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="ml-2 text-gray-500">Chargement des factures...</span>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Aucune facture fournisseur trouvée</p>
                    <p className="text-sm text-gray-400 mt-1">Importez vos premières factures pour commencer</p>
                  </div>
                ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Émission</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° de facture</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° de compte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux TVA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajout</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut dirigeant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codes analytiques</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.emission}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.tiers || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{inv.numeroFacture}</td>
                        <td className="px-4 py-3 text-sm text-teal-600 font-medium">{inv.numeroCompte}</td>
                        <td className="px-4 py-3">{getTVABadge(inv.tauxTVA)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{inv.ajout}</td>
                        <td className="px-4 py-3">
                          {inv.statutDirigeant === "Validée" ? (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">Validée</span>
                          ) : (
                            <span className="text-sm text-gray-500">{inv.statutDirigeant}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{inv.source}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{inv.codesAnalytiques}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{inv.categories}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">25</button>
                  <button className="px-2 py-1 text-sm bg-teal-50 text-teal-700 rounded font-medium">50</button>
                  <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">100</button>
                  <span className="text-sm text-gray-500 ml-2">éléments par page</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">1-17 sur 17</span>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">&lt;</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded bg-teal-600 text-white font-medium">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">&gt;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
