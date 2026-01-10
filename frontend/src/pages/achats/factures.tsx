import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Settings2,
  ChevronDown,
  Loader2,
  AlertCircle,
  Upload
} from "lucide-react";
import { deleteDocument, getDocuments, type Document } from "@/lib/api";

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
  status: string;
  type?: string;
}

export default function FacturesFournisseurs() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<DisplayInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercice] = useState("2024");
  const [searchQuery, setSearchQuery] = useState("");
  const [tvaFilter, setTvaFilter] = useState<InvoiceStatus | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "validee" | "import">("all");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

        const purchaseInvoices = documents.filter((doc: Document) =>
          doc.status === 'VALIDATED' && doc.type === 'INVOICE_PURCHASE'
        );

        const pending = documents.filter((doc: Document) =>
          doc.status === 'UPLOADED' || doc.status === 'OCR_PROCESSING' || doc.status === 'OCR_COMPLETED'
        );
        setPendingCount(pending.length);

        const displayInvoices: DisplayInvoice[] = purchaseInvoices.map((doc: Document) => {
          const ocr = (doc.ocr_data ?? {}) as Record<string, unknown>;
          const ocrStr = (key: string) => (typeof ocr[key] === "string" ? (ocr[key] as string) : "");
          const ocrNum = (key: string) => {
            const v = ocr[key];
            if (typeof v === "number") return v;
            if (typeof v === "string") {
              const normalized = v.replace(/\s/g, "").replace(",", ".");
              const n = parseFloat(normalized);
              return Number.isFinite(n) ? n : undefined;
            }
            return undefined;
          };

          const date = doc.date || ocrStr("date");
          const supplierName = doc.supplier_name || ocrStr("supplier_name");
          const referenceNumber = doc.reference_number || ocrStr("reference_number") || doc.filename;
          const amountHT = doc.amount_ht ?? ocrNum("amount_ht");
          const amountVAT = doc.amount_vat ?? ocrNum("amount_vat");

          return {
            id: doc.id,
            emission: date ? new Date(date).toLocaleDateString("fr-FR") : "-",
            tiers: supplierName || "",
            numeroFacture: referenceNumber,
            numeroCompte: "6288",
            tauxTVA: determineTVARate(amountVAT, amountHT),
            ajout: new Date(doc.created_at).toLocaleDateString("fr-FR"),
            statutDirigeant: "Validée",
            source: "",
            codesAnalytiques: "",
            categories: "",
            status: doc.status,
            type: doc.type,
          };
        });
        setInvoices(displayInvoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [router]);

  const handleToggleSelectAll = (checked: boolean, ids: string[]) => {
    if (checked) {
      setSelectedInvoices(ids);
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleToggleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedInvoices((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (selectedInvoices.length === 0) return;

    const confirmed = window.confirm(`Supprimer ${selectedInvoices.length} document(s) ?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await Promise.all(selectedInvoices.map((id) => deleteDocument(id, token)));
      setInvoices((prev) => prev.filter((inv) => !selectedInvoices.includes(inv.id)));
      setSelectedInvoices([]);
    } catch (error) {
      console.error("Error deleting documents:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

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
      "validee": "bg-blue-100 text-blue-700",
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
        <div>

          <header className="sticky top-0 z-40 min-h-[56px] bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-lg font-semibold text-gray-900">Factures d&apos;achat</h1>
              <span className="text-xs text-gray-500">(validées)</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {pendingCount > 0 && (
                <button
                  onClick={() => router.push('/documents/en-attente')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-100"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{pendingCount} en attente</span>
                </button>
              )}
              <button
                onClick={() => router.push('/documents/upload')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#1e3a5f] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#172e4d]"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importer des factures</span>
                <span className="sm:hidden">Importer</span>
              </button>
            </div>
          </header>

          <div className="p-4 sm:p-6">

            <div className="bg-white rounded-xl border border-gray-200 mb-6">
              {selectedInvoices.length > 0 && (
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-sm text-blue-900">
                    {selectedInvoices.length} document(s) sélectionné(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoices([])}
                      className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900"
                      disabled={isDeleting}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                </div>
              )}
              <div className="p-3 sm:p-4 border-b border-gray-200 space-y-3">

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0 sm:min-w-[220px]">
                    <input
                      type="text"
                      placeholder="Rechercher une facture..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={tvaFilter}
                      onChange={(e) => setTvaFilter(e.target.value as InvoiceStatus | "all")}
                      className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">TVA</option>
                      <option value="20%">20%</option>
                      <option value="10%">10%</option>
                      <option value="autoliquid">Autoliq.</option>
                      <option value="extracom">Extracom.</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "all" | "validee" | "import")}
                      className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">Statut</option>
                      <option value="validee">Validées</option>
                      <option value="import">À valider</option>
                    </select>
                  </div>
                </div>

                {/* Ligne de configuration des colonnes (statique) - masquée sur mobile */}
                <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap overflow-x-auto pb-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-xs sm:text-sm text-gray-600">N° compte</span>
                  </div>
                  <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                    Statut
                  </button>
                  <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                    Émission
                  </button>
                  <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                    Fournisseurs
                  </button>
                  <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                    TVA
                  </button>
                  <button className="ml-auto flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900">
                    <Settings2 className="w-4 h-4" />
                    <span className="hidden md:inline">Personnaliser</span>
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
                        <th className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                            onChange={(e) => handleToggleSelectAll(e.target.checked, filteredInvoices.map((i) => i.id))}
                          />
                        </th>
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
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/documents/${inv.id}/validate`)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedInvoices.includes(inv.id)}
                              onChange={(e) => handleToggleSelectOne(inv.id, e.target.checked)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{inv.emission}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{inv.tiers || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{inv.numeroFacture}</td>
                          <td className="px-4 py-3 text-sm text-teal-600 font-medium">{inv.numeroCompte}</td>
                          <td className="px-4 py-3">{getTVABadge(inv.tauxTVA)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{inv.ajout}</td>
                          <td className="px-4 py-3">
                            {inv.statutDirigeant === "Validée" ? (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Validée</span>
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
                  <button className="px-2 py-1 text-sm bg-[#1e3a5f]/10 text-[#1e3a5f] rounded font-medium">50</button>
                  <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">100</button>
                  <span className="text-sm text-gray-500 ml-2">éléments par page</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">1-17 sur 17</span>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">&lt;</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded bg-[#1e3a5f] text-white font-medium">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400">&gt;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
