import { useState } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Search, Filter, Calendar, Plus, Download, Upload, Settings2, X,
  ChevronDown, MoreHorizontal, AlertTriangle, CheckCircle2, FileText
} from "lucide-react";

type InvoiceStatus = "aucune" | "autoliquid" | "extracom" | "validee" | "20%" | "10%" | "carb_80%";

interface Invoice {
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

const mockInvoices: Invoice[] = [
  { id: "1", emission: "25/12/2024", tiers: "", numeroFacture: "I4B-59215-20...", numeroCompte: "6288", tauxTVA: "aucune", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "" },
  { id: "2", emission: "22/12/2024", tiers: "Guigui BTP", numeroFacture: "N°12", numeroCompte: "811", tauxTVA: "autoliquid", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "" },
  { id: "3", emission: "20/12/2024", tiers: "AMAZON EU S...", numeroFacture: "FRIYOZNAEUI", numeroCompte: "2183", tauxTVA: "20%", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "" },
  { id: "4", emission: "16/12/2024", tiers: "Miro", numeroFacture: "B2F64386-00...", numeroCompte: "6135", tauxTVA: "extracom", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "" },
  { id: "5", emission: "15/12/2024", tiers: "SFR", numeroFacture: "B322-002908...", numeroCompte: "6262", tauxTVA: "20%", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "BOR902", categories: "Telephone" },
  { id: "6", emission: "13/12/2024", tiers: "CARREFOUR D...", numeroFacture: "WEB-001076-...", numeroCompte: "6063", tauxTVA: "20%", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "" },
  { id: "7", emission: "10/12/2024", tiers: "CARREFOUR DRIVE", numeroFacture: "F-2022-3", numeroCompte: "6135", tauxTVA: "20%", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "Alimenta..." },
  { id: "8", emission: "10/12/2024", tiers: "Tech et Cie", numeroFacture: "F-2022-3", numeroCompte: "6135", tauxTVA: "20%", ajout: "14/01/2025", statutDirigeant: "Validée", source: "", codesAnalytiques: "", categories: "" },
  { id: "9", emission: "10/12/2024", tiers: "Pennylane Cabi...", numeroFacture: "F-2024-91", numeroCompte: "6226", tauxTVA: "20%", ajout: "20/05/2025", statutDirigeant: "fx", source: "Import c...", codesAnalytiques: "", categories: "" },
  { id: "10", emission: "08/12/2024", tiers: "Carburant", numeroFacture: "10100029137", numeroCompte: "6082", tauxTVA: "carb_80%", ajout: "14/01/2025", statutDirigeant: "Import comp...", source: "", codesAnalytiques: "", categories: "" },
];

export default function FacturesFournisseurs() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercice, setSelectedExercice] = useState("2024");

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

  return (
    <>
      <Head><title>Factures fournisseurs - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Top Header */}
          <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">al à clôturer</span>
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
              <div className="p-4 border-b border-gray-200">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv) => (
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
