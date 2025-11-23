import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Plus, Phone, Mail, Calendar, MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function ActivitiesPage() {
  const activities = [
    {
      id: 1,
      type: "call",
      title: "Appel téléphonique avec Sophie Bernard",
      client: "StartUp InnoTech",
      date: "2025-11-23T14:30:00",
      duration: "25 min",
      status: "completed",
      notes: "Discussion sur les besoins en accompagnement fiscal. Client intéressé.",
      owner: "Jean Dupont",
    },
    {
      id: 2,
      type: "meeting",
      title: "Réunion de présentation",
      client: "Cabinet Avocat Legalis",
      date: "2025-11-25T10:00:00",
      duration: "1h",
      status: "scheduled",
      notes: "Présentation de nos services d'audit comptable.",
      owner: "Marie Martin",
    },
    {
      id: 3,
      type: "email",
      title: "Envoi proposition commerciale",
      client: "Entreprise ABC",
      date: "2025-11-22T16:45:00",
      duration: "-",
      status: "completed",
      notes: "Proposition envoyée pour conseil stratégique.",
      owner: "Jean Dupont",
    },
    {
      id: 4,
      type: "task",
      title: "Relance paiement facture",
      client: "SARL Transport DEF",
      date: "2025-11-24T09:00:00",
      duration: "-",
      status: "pending",
      notes: "Facture impayée depuis 15 jours.",
      owner: "Marie Martin",
    },
  ];

  const getActivityIcon = (type: string) => {
    const icons = {
      call: Phone,
      meeting: Calendar,
      email: Mail,
      task: CheckCircle,
    };
    return icons[type as keyof typeof icons] || MessageSquare;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      call: "bg-blue-100 text-blue-600",
      meeting: "bg-purple-100 text-purple-600",
      email: "bg-green-100 text-green-600",
      task: "bg-orange-100 text-orange-600",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      completed: "success",
      scheduled: "warning",
      pending: "default",
      cancelled: "error",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Terminé",
      scheduled: "Planifié",
      pending: "En attente",
      cancelled: "Annulé",
    };
    return labels[status] || status;
  };

  const upcomingActivities = activities.filter((a) => a.status === "scheduled" || a.status === "pending");
  const completedActivities = activities.filter((a) => a.status === "completed");

  return (
    <DashboardLayout title="Activités CRM">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-accents-5">Appels</p>
              <p className="text-xl font-bold text-foreground">12</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-600 p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-accents-5">Réunions</p>
              <p className="text-xl font-bold text-foreground">8</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-600 p-2">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-accents-5">Emails</p>
              <p className="text-xl font-bold text-foreground">24</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-600 p-2">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-accents-5">Tâches</p>
              <p className="text-xl font-bold text-foreground">15</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-end">
        <Button variant="primary" size="md">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle activité
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            À venir ({upcomingActivities.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées ({completedActivities.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Toutes ({activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            {upcomingActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <Card key={activity.id} hoverable>
                  <div className="flex gap-4">
                    <div className={`rounded-lg p-3 ${getActivityColor(activity.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{activity.title}</h3>
                          <p className="text-sm text-accents-5">{activity.client}</p>
                        </div>
                        <Badge variant={getStatusVariant(activity.status)}>
                          {getStatusLabel(activity.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-accents-6">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(activity.date).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {activity.duration !== "-" && (
                          <span>• Durée: {activity.duration}</span>
                        )}
                        <span>• {activity.owner}</span>
                      </div>
                      {activity.notes && (
                        <p className="mt-2 text-sm text-accents-6">{activity.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {completedActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <Card key={activity.id} hoverable>
                  <div className="flex gap-4">
                    <div className={`rounded-lg p-3 ${getActivityColor(activity.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{activity.title}</h3>
                          <p className="text-sm text-accents-5">{activity.client}</p>
                        </div>
                        <Badge variant={getStatusVariant(activity.status)}>
                          {getStatusLabel(activity.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-accents-6">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(activity.date).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {activity.duration !== "-" && (
                          <span>• Durée: {activity.duration}</span>
                        )}
                        <span>• {activity.owner}</span>
                      </div>
                      {activity.notes && (
                        <p className="mt-2 text-sm text-accents-6">{activity.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <Card key={activity.id} hoverable>
                  <div className="flex gap-4">
                    <div className={`rounded-lg p-3 ${getActivityColor(activity.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{activity.title}</h3>
                          <p className="text-sm text-accents-5">{activity.client}</p>
                        </div>
                        <Badge variant={getStatusVariant(activity.status)}>
                          {getStatusLabel(activity.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-accents-6">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(activity.date).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {activity.duration !== "-" && (
                          <span>• Durée: {activity.duration}</span>
                        )}
                        <span>• {activity.owner}</span>
                      </div>
                      {activity.notes && (
                        <p className="mt-2 text-sm text-accents-6">{activity.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
