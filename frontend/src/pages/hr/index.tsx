/**
 * HR Dashboard
 * Vue d'ensemble du module Ressources Humaines
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import {
  getEmployees,
  getContracts,
  getPayslips,
  getLeaves,
  type Employee,
  type Contract,
  type Payslip,
  type Leave
} from "@/lib/api";
import { formatCurrency, formatAmount } from "@/lib/formatters";
import {
  Users,
  UserPlus,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Building2,
  Award
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, href, loading }: StatCardProps) {
  const router = useRouter();
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  return (
    <div 
      onClick={() => href && router.push(href)}
      className={`bg-white rounded-xl border border-gray-100 p-6 shadow-sm transition-all duration-200 ${
        href ? "cursor-pointer hover:shadow-md hover:border-gray-200" : ""
      }`}
    >
      <div className={`inline-flex rounded-xl ${color} p-3 mb-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all cursor-pointer">
        <div className={`rounded-lg ${color} p-2.5`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="font-medium text-gray-900">{label}</span>
        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
      </div>
    </Link>
  );
}

export default function HRDashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const [empData, contractsData, payslipsData, leavesData] = await Promise.allSettled([
        getEmployees(token),
        getContracts(token),
        getPayslips(token),
        getLeaves(token)
      ]);

      if (empData.status === "fulfilled") setEmployees(empData.value);
      if (contractsData.status === "fulfilled") setContracts(contractsData.value);
      if (payslipsData.status === "fulfilled") setPayslips(payslipsData.value);
      if (leavesData.status === "fulfilled") setLeaves(leavesData.value);

      setError(null);
    } catch (err: any) {
      setError("Erreur lors du chargement des données RH");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des statistiques
  const stats = useMemo(() => {
    const totalEmployees = employees?.length || 0;
    const activeEmployees = employees?.filter(e => e?.status === "active")?.length || 0;
    const onLeave = employees?.filter(e => e?.status === "on_leave")?.length || 0;
    
    const activeContracts = contracts?.filter(c => c?.status === "active")?.length || 0;
    const expiringContracts = contracts?.filter(c => {
      if (!c?.end_date) return false;
      const endDate = new Date(c.end_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate <= thirtyDaysFromNow && c.status === "active";
    })?.length || 0;
    
    const totalPayroll = payslips?.reduce((sum, p) => sum + (p?.gross_salary || 0), 0) || 0;
    const pendingPayslips = payslips?.filter(p => p?.status === "pending")?.length || 0;
    
    const pendingLeaves = leaves?.filter(l => l?.status === "pending")?.length || 0;
    const approvedLeaves = leaves?.filter(l => l?.status === "approved")?.length || 0;

    return {
      totalEmployees,
      activeEmployees,
      onLeave,
      activeContracts,
      expiringContracts,
      totalPayroll,
      pendingPayslips,
      pendingLeaves,
      approvedLeaves
    };
  }, [employees, contracts, payslips, leaves]);

  // Employés récents
  const recentEmployees = useMemo(() => {
    return employees
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      ?.slice(0, 5) || [];
  }, [employees]);

  return (
    <DashboardLayout title="Ressources Humaines">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ressources Humaines
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez vos employés, contrats, paie et congés
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/hr/employees">
            <Button variant="secondary" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Employés
            </Button>
          </Link>
          <Link href="/hr/employees">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel employé
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Alertes */}
      {(stats.expiringContracts > 0 || stats.pendingLeaves > 0) && (
        <div className="mb-6 space-y-3">
          {stats.expiringContracts > 0 && (
            <Alert variant="warning" title="Contrats expirant bientôt">
              {stats.expiringContracts} contrat(s) expire(nt) dans les 30 prochains jours.
            </Alert>
          )}
          {stats.pendingLeaves > 0 && (
            <Alert variant="info" title="Demandes de congés">
              {stats.pendingLeaves} demande(s) de congés en attente d'approbation.
            </Alert>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Employés"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} actifs`}
          icon={Users}
          color="bg-blue-500"
          href="/hr/employees"
          loading={loading}
        />
        <StatCard
          title="Contrats Actifs"
          value={stats.activeContracts}
          subtitle={stats.expiringContracts > 0 ? `${stats.expiringContracts} expirent bientôt` : "Tous à jour"}
          icon={FileText}
          color="bg-violet-500"
          href="/hr/contracts"
          loading={loading}
        />
        <StatCard
          title="Masse Salariale"
          value={formatCurrency(stats.totalPayroll)}
          subtitle="Ce mois"
          icon={DollarSign}
          color="bg-emerald-500"
          href="/hr/payslips"
          loading={loading}
        />
        <StatCard
          title="Congés"
          value={stats.pendingLeaves}
          subtitle="En attente d'approbation"
          icon={Calendar}
          color="bg-orange-500"
          href="/hr/leaves"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Répartition par statut */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Répartition des Effectifs</h3>
              <Link href="/hr/employees" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-emerald-600">{stats.activeEmployees}</p>
                  <p className="text-sm text-emerald-700 font-medium">Actifs</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-orange-600">{stats.onLeave}</p>
                  <p className="text-sm text-orange-700 font-medium">En congé</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-600">
                    {stats.totalEmployees - stats.activeEmployees - stats.onLeave}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">Inactifs</p>
                </div>
              </div>
            )}

            {/* Employés récents */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Derniers employés</h4>
              {recentEmployees.length > 0 ? (
                <div className="space-y-3">
                  {recentEmployees.slice(0, 3).map((emp, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-semibold">
                        {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{emp.position}</p>
                      </div>
                      <Badge variant={emp.status === "active" ? "success" : "default"}>
                        {emp.status === "active" ? "Actif" : emp.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucun employé récent</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
          <QuickAction icon={UserPlus} label="Nouvel employé" href="/hr/employees" color="bg-blue-500" />
          <QuickAction icon={FileText} label="Nouveau contrat" href="/hr/contracts" color="bg-violet-500" />
          <QuickAction icon={DollarSign} label="Générer paie" href="/hr/payslips" color="bg-emerald-500" />
          <QuickAction icon={Calendar} label="Gérer congés" href="/hr/leaves" color="bg-orange-500" />
          <QuickAction icon={Award} label="Rapport RH" href="/reports/hr" color="bg-pink-500" />
        </div>
      </div>
    </DashboardLayout>
  );
}
