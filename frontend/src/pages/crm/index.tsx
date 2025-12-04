/**
 * CRM Dashboard
 * Vue d'ensemble du module CRM avec statistiques et accès rapide
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import CrmDashboardTemplate from "@/components/crm/template/CrmDashboardTemplate";
import {
  getLeads,
  getOpportunities,
  getCRMActivities,
  type Lead,
  type Opportunity,
  type CRMActivity
} from "@/lib/api";

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

  return (
    <DashboardLayout title="CRM">
      <div className="p-4 md:p-6">
        {/* 
          Intégration du Template CRM (MUI)
          Les données réelles 'leads', 'opportunities', etc. pourront être passées 
          en props à CrmDashboardTemplate plus tard.
        */}
        <CrmDashboardTemplate />
      </div>
    </DashboardLayout>
  );
}
