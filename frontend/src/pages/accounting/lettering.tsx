import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { getLetteringSummary, type LetteringItem } from "@/lib/api";

export default function LetteringPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<LetteringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const year = new Date().getFullYear();
        const data = await getLetteringSummary(token, year);
        setItems(data.items || []);
      } catch (e) {
        console.error("Error fetching lettering:", e);
        setError("Erreur lors du chargement du lettrage");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return i.tier.toLowerCase().includes(q) || i.reference.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout title="Lettrage">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Lettrage</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi et préparation du lettrage clients/fournisseurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/clients/balance" className="block">
          <Card className="p-5 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500">Accès rapide</div>
            <div className="font-medium text-gray-900">Balance âgée clients</div>
            <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              Ouvrir <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>
        <Link href="/suppliers/balance" className="block">
          <Card className="p-5 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500">Accès rapide</div>
            <div className="font-medium text-gray-900">Balance âgée fournisseurs</div>
            <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              Ouvrir <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>
        <Link href="/accounting/ledger" className="block">
          <Card className="p-5 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500">Accès rapide</div>
            <div className="font-medium text-gray-900">Grand livre</div>
            <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              Ouvrir <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un tiers ou une référence..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d4a44]"
            />
          </div>
          <Button variant="secondary" onClick={() => setSearch("")}>Réinitialiser</Button>
        </div>

        <div className="grid grid-cols-5 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Tiers</div>
          <div>Référence</div>
          <div className="text-right">Montant</div>
          <div>Statut</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0d4a44]" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Aucun élément</div>
          ) : (
            filtered.map((i) => (
              <div key={i.id} className="grid grid-cols-5 px-4 py-3 text-sm items-center">
                <div className="text-gray-900">{i.tier}</div>
                <div className="font-mono text-gray-700">{i.reference}</div>
                <div className="text-right text-gray-900">{i.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
                <div className="text-gray-700">{i.status}</div>
                <div className="text-right">
                  <Button variant="secondary" onClick={() => {}}>
                    Ouvrir
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
