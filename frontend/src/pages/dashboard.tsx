import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getDashboardStats, type DashboardStats } from "@/lib/api";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
          return;
        }
        const data = await getDashboardStats(token);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout title="Vue d'ensemble">
      <div className="grid gap-6 md:grid-cols-3">
        <Card hoverable>
          <h2 className="text-sm font-semibold text-foreground">Clients</h2>
          <p className="mt-1 text-xs text-accents-5">
            Dossiers actifs et suivi
          </p>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="h-12 animate-pulse rounded bg-accents-2"></div>
            ) : stats ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold tracking-tight">{stats.total_clients}</span>
                  <span className="text-xs text-success">Actifs</span>
                </div>
                <p className="text-xs text-accents-5">{stats.documents_pending} dossiers en attente</p>
              </>
            ) : (
              <p className="text-sm text-accents-5">-</p>
            )}
          </div>
        </Card>

        <Card hoverable>
          <h2 className="text-sm font-semibold text-foreground">Tâches</h2>
          <p className="mt-1 text-xs text-accents-5">
            Actions requises cette semaine
          </p>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="h-12 animate-pulse rounded bg-accents-2"></div>
            ) : stats ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold tracking-tight">{stats.tasks_due_this_week}</span>
                  <span className="text-xs text-accents-5">À faire</span>
                </div>
                <p className="text-xs text-error">{stats.tasks_overdue} en retard</p>
              </>
            ) : (
              <p className="text-sm text-accents-5">-</p>
            )}
          </div>
        </Card>

        <Card hoverable>
          <h2 className="text-sm font-semibold text-foreground">Documents</h2>
          <p className="mt-1 text-xs text-accents-5">
            Volume de traitement mensuel
          </p>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="h-12 animate-pulse rounded bg-accents-2"></div>
            ) : stats ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold tracking-tight">{stats.documents_processed_this_month}</span>
                  <span className="text-xs text-success">+12%</span>
                </div>
                <p className="text-xs text-accents-5">{stats.documents_pending} à traiter</p>
              </>
            ) : (
              <p className="text-sm text-accents-5">-</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-foreground">Activité récente</h3>
          <div className="mt-4 flex h-40 items-center justify-center rounded border border-dashed border-accents-2 bg-accents-1 text-sm text-accents-4">
            Graphique d'activité (Placeholder)
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-foreground">Prochaines étapes</h3>
          <ul className="mt-4 space-y-3 text-sm text-accents-6">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-lighter text-xs text-success-dark">✓</span>
              <span>Connecter l'API Dashboard</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accents-2 text-xs text-accents-6">2</span>
              <span>Finaliser la gestion des documents</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accents-2 text-xs text-accents-6">3</span>
              <span>Implémenter l'OCR Mindee</span>
            </li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
