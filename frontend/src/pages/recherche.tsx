import { useState } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Search, FileText, Users, Receipt, CreditCard, Zap } from "lucide-react";

export default function RecherchePage() {
  const [query, setQuery] = useState("");

  const recentSearches = [
    { text: "Facture FA-2024-001", icon: Receipt },
    { text: "Client Acme Corp", icon: Users },
    { text: "Écriture novembre 2024", icon: FileText },
  ];

  return (
    <>
      <Head><title>Recherche - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><Search className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Recherche Rapide</h1>
                <p className="text-sm text-gray-600 mt-0.5">Trouvez rapidement n&apos;importe quel document, client ou écriture</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un document, client, facture, écriture..."
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  autoFocus />
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Raccourcis :</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Factures", icon: Receipt, search: "facture" },
                    { label: "Clients", icon: Users, search: "client" },
                    { label: "Écritures", icon: FileText, search: "écriture" },
                    { label: "Paiements", icon: CreditCard, search: "paiement" },
                  ].map((shortcut) => (
                    <button key={shortcut.label} onClick={() => setQuery(shortcut.search)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-[#1e3a5f] hover:bg-blue-50 transition-colors">
                      <shortcut.icon className="h-4 w-4" />
                      <span className="text-sm">{shortcut.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Recherches récentes</h3>
              </div>
              <div className="space-y-2">
                {recentSearches.map((item, idx) => (
                  <button key={idx} onClick={() => setQuery(item.text)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <item.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
