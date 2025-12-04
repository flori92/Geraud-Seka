/**
 * CRM Dashboard
 * Vue d'ensemble du module CRM avec statistiques et accès rapide
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import CrmDashboardTemplate from "@/components/crm/template/CrmDashboardTemplate";
import {
  getLeads,
  getOpportunities,
  getCRMActivities,
  type Lead,
  type Opportunity,
  type CRMActivity
} from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { 
  DollarSign, 
  Plus, 
  Users, 
  Target,
  TrendingUp
} from "lucide-react";

export default function CRMDashboardPage() {
  // Logique de récupération des données (conservée pour connexion future au template)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const [leadsData, oppsData, activitiesData] = await Promise.allSettled([
        getLeads(token),
        getOpportunities(token),
        getCRMActivities(token)
      ]);

      if (leadsData.status === "fulfilled") {
        setLeads(Array.isArray(leadsData.value) ? leadsData.value : []);
      }
      if (oppsData.status === "fulfilled") {
        setOpportunities(Array.isArray(oppsData.value) ? oppsData.value : []);
      }
      if (activitiesData.status === "fulfilled") {
        setActivities(Array.isArray(activitiesData.value) ? activitiesData.value : []);
      }

      setError(null);
    } catch (err: any) {
      setError("Erreur lors du chargement des données CRM");
      console.error(err);
      setLeads([]);
      setOpportunities([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const templateStats = useMemo(() => {
    const leadList = Array.isArray(leads) ? leads : [];
    const oppList = Array.isArray(opportunities) ? opportunities : [];
    const activityList = Array.isArray(activities) ? activities : [];

    // Stats Globales
    const totalLeads = leadList.length;
    const wonOpportunities = oppList.filter(o => o?.stage === "won" || o?.stage === "gagné").length;
    const openOpportunities = oppList.filter(o => o?.stage !== "won" && o?.stage !== "lost" && o?.stage !== "gagné" && o?.stage !== "perdu").length;
    const totalRevenue = oppList
      .filter(o => o?.stage === "won" || o?.stage === "gagné")
      .reduce((sum, opp) => sum + (Number(opp?.value) || 0), 0);

    // Activités Hebdomadaires (Derniers 7 jours)
    const weeklyActivities = [0, 0, 0, 0, 0, 0, 0]; // Dimanche -> Samedi
    activityList.forEach(activity => {
      if (!activity.date) return;
      const date = new Date(activity.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        weeklyActivities[date.getDay()]++;
      }
    });

    // Top Opportunités
    const topOpportunities = oppList
      .filter(o => o?.stage !== "lost" && o?.stage !== "perdu")
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .slice(0, 3)
      .map(opp => ({
        id: opp.id,
        title: opp.title || "Opportunité sans nom",
        subtitle: opp.client_name || "Client inconnu",
        amount: formatCurrency(Number(opp.value) || 0),
        progress: opp.probability || 50,
        color: (opp.probability || 0) > 70 ? 'success' : (opp.probability || 0) > 40 ? 'primary' : 'warning',
        icon: DollarSign // Ou autre icône selon le type
      }));

    return {
      stats: {
        totalLeads,
        wonOpportunities,
        openOpportunities,
        totalRevenue
      },
      weeklyActivities,
      topOpportunities
    };
  }, [leads, opportunities, activities]);

  return (
    <DashboardLayout title="CRM">
      {/* Header cohérent avec les autres modules */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos leads, opportunités et activités commerciales
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/crm/leads">
            <Button variant="secondary" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </Button>
          </Link>
          <Link href="/crm/opportunities">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle opportunité
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* KPIs rapides au-dessus du template */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2.5 rounded-xl">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Leads</p>
              <p className="text-xl font-bold text-gray-900">{templateStats.stats.totalLeads}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-violet-500 p-2.5 rounded-xl">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Opportunités Ouvertes</p>
              <p className="text-xl font-bold text-gray-900">{templateStats.stats.openOpportunities}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Deals Gagnés</p>
              <p className="text-xl font-bold text-gray-900">{templateStats.stats.wonOpportunities}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-xl">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenus Générés</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(templateStats.stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Template CRM avec données réelles */}
      <CrmDashboardTemplate 
        stats={templateStats.stats}
        weeklyActivities={templateStats.weeklyActivities}
        topOpportunities={templateStats.topOpportunities as any}
      />
    </DashboardLayout>
  );
}
