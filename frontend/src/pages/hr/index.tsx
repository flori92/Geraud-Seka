/**
 * HR Dashboard - Style Pennylane
 * Vue d'ensemble du module Ressources Humaines
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
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
import { formatCurrency } from "@/lib/formatters";
import {
  Users,
  UserPlus,
  FileText,
  Calendar,
  DollarSign,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Award,
  Loader2,
  RefreshCw
} from "lucide-react";

export default function HRDashboardPage() {
  const router = useRouter();
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
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const [empData, contractsData, payslipsData, leavesData] = await Promise.allSettled([
        getEmployees(token),
        getContracts(token),
        getPayslips(token),
        getLeaves(token)
      ]);

      if (empData.status === "fulfilled") setEmployees(Array.isArray(empData.value) ? empData.value : []);
      if (contractsData.status === "fulfilled") setContracts(Array.isArray(contractsData.value) ? contractsData.value : []);
      if (payslipsData.status === "fulfilled") setPayslips(Array.isArray(payslipsData.value) ? payslipsData.value : []);
      if (leavesData.status === "fulfilled") setLeaves(Array.isArray(leavesData.value) ? leavesData.value : []);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des données RH");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const empList = Array.isArray(employees) ? employees : [];
    const contractList = Array.isArray(contracts) ? contracts : [];
    const payslipList = Array.isArray(payslips) ? payslips : [];
    const leaveList = Array.isArray(leaves) ? leaves : [];

    return {
      totalEmployees: empList.length,
      activeEmployees: empList.filter(e => e?.status === "active").length,
      onLeave: empList.filter(e => e?.status === "on_leave").length,
      activeContracts: contractList.filter(c => c?.status === "active").length,
      expiringContracts: contractList.filter(c => {
        if (!c?.end_date) return false;
        const endDate = new Date(c.end_date);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return endDate <= thirtyDaysFromNow && c.status === "active";
      }).length,
      totalPayroll: payslipList.reduce((sum, p) => sum + (p?.gross_salary || 0), 0),
      pendingLeaves: leaveList.filter(l => l?.status === "pending").length,
    };
  }, [employees, contracts, payslips, leaves]);

  const recentEmployees = useMemo(() => {
    const empList = Array.isArray(employees) ? employees : [];
    return empList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  }, [employees]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Ressources Humaines - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ressources Humaines</h1>
                <p className="text-sm text-gray-600 mt-0.5">Gérez vos employés, contrats, paie et congés</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <Link href="/hr/employees" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  <Users className="h-4 w-4" />
                  Employés
                </Link>
                <Link href="/hr/employees" className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" />
                  Nouvel employé
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {/* Alertes */}
            {(stats.expiringContracts > 0 || stats.pendingLeaves > 0) && (
              <div className="space-y-3">
                {stats.expiringContracts > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <p className="text-sm text-orange-800"><strong>Contrats expirant bientôt:</strong> {stats.expiringContracts} contrat(s) expire(nt) dans les 30 prochains jours.</p>
                  </div>
                )}
                {stats.pendingLeaves > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800"><strong>Demandes de congés:</strong> {stats.pendingLeaves} demande(s) en attente d&apos;approbation.</p>
                  </div>
                )}
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/hr/employees" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Employés</span>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeEmployees} actifs</p>
              </Link>

              <Link href="/hr/contracts" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Contrats Actifs</span>
                  <FileText className="h-4 w-4 text-[#1e3a5f]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.expiringContracts > 0 ? `${stats.expiringContracts} expirent bientôt` : "Tous à jour"}</p>
              </Link>

              <Link href="/hr/payslips" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Masse Salariale</span>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPayroll)}</p>
                <p className="text-xs text-gray-500 mt-1">Ce mois</p>
              </Link>

              <Link href="/hr/leaves" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Congés en attente</span>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
                <p className="text-xs text-gray-500 mt-1">À approuver</p>
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Répartition par statut */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Répartition des Effectifs</h3>
                  <Link href="/hr/employees" className="text-sm text-[#1e3a5f] hover:underline font-medium flex items-center">
                    Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
                    <p className="text-sm text-green-700">Actifs</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">{stats.onLeave}</p>
                    <p className="text-sm text-orange-700">En congé</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-600">{stats.totalEmployees - stats.activeEmployees - stats.onLeave}</p>
                    <p className="text-sm text-gray-700">Inactifs</p>
                  </div>
                </div>

                {/* Employés récents */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Derniers employés</h4>
                  {recentEmployees.length > 0 ? (
                    <div className="space-y-3">
                      {recentEmployees.slice(0, 3).map((emp, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-blue-400 flex items-center justify-center text-white text-sm font-medium">
                            {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-gray-500">{emp.position}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {emp.status === "active" ? "Actif" : emp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun employé récent</p>
                  )}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Actions rapides</h3>
                {[
                  { icon: UserPlus, label: "Nouvel employé", href: "/hr/employees", color: "bg-blue-500" },
                  { icon: FileText, label: "Nouveau contrat", href: "/hr/contracts", color: "bg-[#1e3a5f]" },
                  { icon: DollarSign, label: "Générer paie", href: "/hr/payslips", color: "bg-green-500" },
                  { icon: Calendar, label: "Gérer congés", href: "/hr/leaves", color: "bg-orange-500" },
                  { icon: Award, label: "Rapport RH", href: "/reports/hr", color: "bg-pink-500" },
                ].map((action, idx) => (
                  <Link key={idx} href={action.href} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all">
                    <div className={`rounded-lg ${action.color} p-2.5`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{action.label}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
