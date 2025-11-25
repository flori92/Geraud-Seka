import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getDashboardStats, type DashboardStats } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { formatAmount } from "@/lib/formatters";
import {
  Users,
  CheckSquare,
  FileText,
  Wallet,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; type: "up" | "down" | "neutral" };
  icon: React.ElementType;
  iconColor: string;
  loading?: boolean;
  href?: string;
}

function StatCard({ title, value, subtitle, trend, icon: Icon, iconColor, loading, href }: StatCardProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </Card>
    );
  }

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Card hoverable={!!href} onClick={handleClick} className={href ? "cursor-pointer" : ""}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-accents-5">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
            {trend && (
              <Badge variant={trend.type === "up" ? "success" : trend.type === "down" ? "error" : "default"}>
                {trend.value}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-accents-5">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-lg ${iconColor} p-2.5`}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

function QuickAction({ label, description, icon: Icon, href }: QuickActionProps) {
  return (
    <a
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-accents-2 bg-white p-4 transition-all hover:border-accents-4 hover:shadow-sm"
    >
      <div className="rounded-md bg-accents-1 p-2 transition-colors group-hover:bg-foreground">
        <Icon className="h-4 w-4 text-accents-5 transition-colors group-hover:text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground group-hover:text-foreground">{label}</h4>
        <p className="mt-0.5 text-xs text-accents-5">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-accents-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
          router.push("/login");
          return;
        }
        const data = await getDashboardStats(token);
        setStats(data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard stats", err);
        // Si erreur 401, rediriger vers login
        if (err.response?.status === 401) {
          localStorage.removeItem("seka_access_token");
          router.push("/login");
          return;
        }
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  return (
    <DashboardLayout title="Vue d'ensemble">
      {error && (
        <Alert variant="error" title="Erreur" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Métriques principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clients actifs"
          value={stats?.total_clients || 0}
          subtitle={`${stats?.documents_pending || 0} dossiers en attente`}
          icon={Users}
          iconColor="bg-blue-600"
          loading={loading}
          href="/clients"
        />
        <StatCard
          title="Tâches"
          value={stats?.tasks_due_this_week || 0}
          subtitle={`${stats?.tasks_overdue || 0} en retard`}
          icon={CheckSquare}
          iconColor="bg-green-600"
          loading={loading}
          href="/crm/activities"
        />
        <StatCard
          title="Documents"
          value={stats?.documents_processed_this_month || 0}
          subtitle="Traités ce mois"
          icon={FileText}
          iconColor="bg-purple-600"
          loading={loading}
          href="/documents"
        />
        <StatCard
          title="Trésorerie"
          value={stats?.total_revenue ? formatAmount(stats.total_revenue) : "0"}
          subtitle="Solde actuel (FCFA)"
          icon={Wallet}
          iconColor="bg-orange-600"
          loading={loading}
          href="/treasury"
        />
      </div>

      {/* Alertes et notifications */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Alertes importantes</h2>
          <div className="space-y-3">
            {stats.alerts.map((alert: any, idx: number) => (
              <Alert key={idx} variant={alert.type} title={alert.title}>
                {alert.message}
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Actions rapides et activité récente */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Activité récente</h3>
              <a href="/activities" className="text-xs text-accents-5 hover:text-foreground">
                Voir tout
              </a>
            </div>
            <div className="space-y-4">
              {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                stats.recent_activities.map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 border-b border-accents-2 pb-3 last:border-0 last:pb-0">
                    <div className="rounded-full bg-accents-1 p-2">
                      <Clock className="h-3 w-3 text-accents-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-accents-5">{activity.client}</p>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <p className="text-sm font-medium text-foreground">{activity.amount}</p>
                      )}
                      <p className="text-xs text-accents-5">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-accents-3" />
                  <p className="text-sm text-accents-5">Aucune activité récente</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h3 className="mb-4 font-semibold text-foreground">Actions rapides</h3>
          <div className="space-y-3">
            <QuickAction
              label="Nouvelle facture"
              description="Créer une facture client"
              icon={FileText}
              href="/sales/invoices/new"
            />
            <QuickAction
              label="Ajouter un client"
              description="Enregistrer un nouveau client"
              icon={Users}
              href="/clients/new"
            />
            <QuickAction
              label="Trésorerie"
              description="Voir les flux de trésorerie"
              icon={TrendingUp}
              href="/treasury"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
