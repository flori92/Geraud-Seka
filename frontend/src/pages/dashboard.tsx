/**
 * Dashboard Simple SEKA - Style Pennylane
 * Interface épurée et minimaliste
 */
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  getDocuments,
  getPendingDocuments,
  getValidatedDocuments,
  type Document,
} from "@/lib/api";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Download,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function DashboardSimple() {
  const router = useRouter();
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
  const [validatedDocs, setValidatedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const [allData, pendingData, validatedData] = await Promise.allSettled([
        getDocuments(token),
        getPendingDocuments(token),
        getValidatedDocuments(token),
      ]);
      if (allData.status === "fulfilled") setAllDocs(allData.value);
      if (pendingData.status === "fulfilled") setPendingDocs(pendingData.value);
      if (validatedData.status === "fulfilled") setValidatedDocs(validatedData.value);
    } catch (err) {
      console.error("Erreur chargement données", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <title>Tableau de bord - SEKA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex">
        <PennylaneSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-0 transition-all duration-300">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Menu hamburger pour mobile */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tableau de bord</h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Automatisation des écritures comptables</p>
                </div>
              </div>
              <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* KPIs - Workflow SEKA V1 */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total documents" value={allDocs.length} icon={FileText} />
              <StatCard label="En attente" value={pendingDocs.length} icon={Clock} alert={pendingDocs.length > 0} />
              <StatCard label="Validées" value={validatedDocs.length} icon={CheckCircle} success />
              <StatCard label="Ce mois" value={allDocs.filter(d => new Date(d.created_at || '').getMonth() === new Date().getMonth()).length} icon={Upload} />
            </div>

            {/* Actions rapides - SEKA V1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/documents/upload" label="Importer des factures" />
                <QuickLink href="/documents/en-attente" label="Valider les écritures" />
                <QuickLink href="/exports" label="Exporter vers Perfecto" />
                <QuickLink href="/suppliers" label="Règles fournisseurs" />
              </div>
            </div>

            {/* Modules principaux - SEKA V1 */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleLink href="/documents/upload" title="Upload Factures" description="Importer PDF/images" icon={FileText} />
              <ModuleLink href="/documents/en-attente" title="En attente" description="Factures à valider" icon={Clock} />
              <ModuleLink href="/documents/validees" title="Validées" description="Écritures générées" icon={CheckCircle} />
              <ModuleLink href="/suppliers" title="Fournisseurs" description="Règles auto-imputation" icon={Users} />
              <ModuleLink href="/exports" title="Exports" description="Perfecto, SAARI, Sage" icon={Download} />
              <ModuleLink href="/settings" title="Paramètres" description="Configuration" icon={FileText} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}


function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  alert,
  success
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  alert?: boolean;
  success?: boolean;
}) {
  const iconColor = alert ? "text-orange-500" : success ? "text-green-500" : "text-gray-400";
  const valueColor = alert ? "text-orange-600" : success ? "text-green-600" : "text-gray-900";
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-gray-500">{label}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-lg sm:text-2xl font-semibold ${valueColor}`}>
          {value}
        </span>
        {alert && <AlertCircle className="h-4 w-4 text-orange-500" />}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
        <span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
        <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-gray-400" />
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
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-50 rounded-lg">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
