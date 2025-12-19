/**
 * Dashboard Simple SEKA
 * Interface épurée et minimaliste
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  getDashboardStats,
  getClients,
  getInvoices,
  type DashboardStats,
  type Client,
  type Invoice,
} from "@/lib/api";
import {
  Users,
  FileText,
  Wallet,
  Receipt,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardSimple() {
  const router = useRouter();
  const [, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const [statsData, clientsData, invoicesData] = await Promise.allSettled([
          getDashboardStats(token),
          getClients(token),
          getInvoices(token),
        ]);

        if (statsData.status === "fulfilled") setStats(statsData.value);
        if (clientsData.status === "fulfilled") setClients(clientsData.value);
        if (invoicesData.status === "fulfilled") setInvoices(invoicesData.value);
      } catch (err) {
        console.error("Erreur chargement données", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv?.paid || 0), 0) || 0;
  const pendingInvoices = invoices?.filter(inv => inv?.status === "Impayée" || inv?.status === "unpaid")?.length || 0;
  const clientCount = clients?.length || 0;

  if (loading) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tableau de bord">
      {/* En-tête simple */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Aperçu de votre activité</p>
      </div>

      {/* KPIs - 4 cartes simples */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Chiffre d'affaires"
          value={formatCurrency(totalRevenue)}
          icon={Wallet}
          trend={12.5}
        />
        <StatCard
          label="Clients"
          value={clientCount}
          icon={Users}
          trend={8}
        />
        <StatCard
          label="Factures"
          value={invoices.length}
          icon={FileText}
        />
        <StatCard
          label="Impayées"
          value={pendingInvoices}
          icon={Receipt}
          alert={pendingInvoices > 0}
        />
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/ventes/factures-clients" label="Nouvelle facture" />
          <QuickLink href="/achats/factures" label="Saisir un achat" />
          <QuickLink href="/clients" label="Ajouter un client" />
          <QuickLink href="/comptabilite/balance" label="Balance générale" />
        </div>
      </div>

      {/* Modules principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleLink
          href="/ventes"
          title="Ventes"
          description="Devis, factures clients"
          icon={FileText}
        />
        <ModuleLink
          href="/achats"
          title="Achats"
          description="Factures fournisseurs"
          icon={Receipt}
        />
        <ModuleLink
          href="/comptabilite"
          title="Comptabilité"
          description="Balance, journal, bilan"
          icon={Wallet}
        />
        <ModuleLink
          href="/tresorerie"
          title="Trésorerie"
          description="Comptes et prévisions"
          icon={TrendingUp}
        />
        <ModuleLink
          href="/clients"
          title="Clients"
          description="Gestion des clients"
          icon={Users}
        />
        <ModuleLink
          href="/reports"
          title="Rapports"
          description="Analyses et exports"
          icon={FileText}
        />
      </div>
    </DashboardLayout>
  );
}

// Composants simples

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  alert 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: number;
  alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon className={`h-4 w-4 ${alert ? "text-red-500" : "text-gray-400"}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-semibold ${alert ? "text-red-600" : "text-gray-900"}`}>
          {value}
        </span>
        {trend !== undefined && (
          <span className={`text-xs flex items-center ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
        {alert && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </Link>
  );
}

function ModuleLink({ 
  href, 
  title, 
  description, 
  icon: Icon 
}: { 
  href: string; 
  title: string; 
  description: string; 
  icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
