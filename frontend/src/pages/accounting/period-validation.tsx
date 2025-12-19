import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Lock, Loader2, Unlock } from "lucide-react";
import { getAccountingPeriods, type PeriodItem } from "@/lib/api";

export default function PeriodValidationPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
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
        const data = await getAccountingPeriods(token);
        setPeriods(data.periods || []);
      } catch (e) {
        console.error("Error fetching periods:", e);
        setError("Erreur lors du chargement des périodes");
        setPeriods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <DashboardLayout title="Validation période">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Validation période</h1>
        <p className="text-sm text-gray-500 mt-1">Clôturer / réouvrir une période comptable</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Période</div>
          <div>Statut</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e3a5f]" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-700">{error}</div>
          ) : periods.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Aucune période configurée</div>
          ) : (
            periods.map((p) => (
              <div key={p.id} className="grid grid-cols-3 px-4 py-3 text-sm items-center">
                <div className="text-gray-900">{p.label}</div>
                <div className="text-gray-700">{p.is_closed ? "Clôturée" : "Ouverte"}</div>
                <div className="text-right">
                  <Button variant="secondary" disabled className="inline-flex items-center gap-2">
                    {p.is_closed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {p.is_closed ? "Réouvrir" : "Clôturer"}
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
