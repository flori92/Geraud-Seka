import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { CreateActivityModal } from "@/components/forms/CreateActivityModal";
import { getCRMActivities, CRMActivity } from "@/lib/api";
import { Plus, Phone, Mail, Calendar, MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getCRMActivities(token);
      setActivities(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des activités");
    } finally {
      setLoading(false);
    }
  };


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
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

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
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
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
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-32" />
                </Card>
              ))}
            </div>
          ) : (
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
                          <p className="text-sm text-accents-5">{activity.client_name || "-"}</p>
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
                        {activity.duration && activity.duration !== "-" && (
                          <span>• Durée: {activity.duration}</span>
                        )}
                        <span>• {activity.owner_name || "-"}</span>
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
          )}
        </TabsContent>

        <TabsContent value="completed">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-32" />
                </Card>
              ))}
            </div>
          ) : (
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
                          <p className="text-sm text-accents-5">{activity.client_name || "-"}</p>
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
                        {activity.duration && activity.duration !== "-" && (
                          <span>• Durée: {activity.duration}</span>
                        )}
                        <span>• {activity.owner_name || "-"}</span>
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
          )}
        </TabsContent>

        <TabsContent value="all">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-32" />
                </Card>
              ))}
            </div>
          ) : (
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
                          <p className="text-sm text-accents-5">{activity.client_name || "-"}</p>
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
                        {activity.duration && activity.duration !== "-" && (
                          <span>• Durée: {activity.duration}</span>
                        )}
                        <span>• {activity.owner_name || "-"}</span>
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
          )}
        </TabsContent>
      </Tabs>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchActivities}
      />
    </DashboardLayout>
  );
}
