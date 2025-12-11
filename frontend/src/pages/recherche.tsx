import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Search, FileText, Users, Receipt, CreditCard, Zap } from "lucide-react";

export default function RecherchePage() {
  const [query, setQuery] = useState("");

  const recentSearches = [
    { text: "Facture FA-2024-001", icon: Receipt },
    { text: "Client Acme Corp", icon: Users },
    { text: "Écriture novembre 2024", icon: FileText },
  ];

  return (
    <DashboardLayout title="Recherche Rapide">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Recherche Rapide</h1>
          </div>
          <p className="text-gray-600">Trouvez rapidement n'importe quel document, client, fournisseur ou écriture</p>
        </div>

        <Card className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un document, client, facture, écriture..."
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              autoFocus
            />
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
                <button
                  key={shortcut.label}
                  onClick={() => setQuery(shortcut.search)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <shortcut.icon className="h-4 w-4" />
                  <span className="text-sm">{shortcut.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold">Recherches récentes</h3>
          </div>
          <div className="space-y-2">
            {recentSearches.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(item.text)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <item.icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{item.text}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
