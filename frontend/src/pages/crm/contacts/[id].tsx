import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { 
  User, Mail, Phone, Building2, MapPin, Calendar, Clock,
  TrendingUp, FileText, Activity, MessageSquare, Edit, Trash2,
  ArrowLeft, ExternalLink, Plus, CheckCircle, Circle, AlertCircle
} from "lucide-react";
import { formatAmount } from "@/lib/formatters";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
  is_primary: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    company_name: string;
  };
  assignee?: {
    id: string;
    full_name: string;
  };
}

interface TimelineEvent {
  type: string;
  icon: string;
  title: string;
  description: string;
  date: string;
  activity_type?: string;
  is_completed?: boolean;
  metadata: Record<string, any>;
}

interface TimelineData {
  contact_id: string;
  contact_name: string;
  timeline: TimelineEvent[];
  total_events: number;
}

const getIconForType = (type: string, iconName: string) => {
  const iconMap: Record<string, any> = {
    "activity": Activity,
    "opportunity": TrendingUp,
    "quote": FileText,
    "created": User,
    "email": Mail,
    "call": Phone,
    "meeting": Calendar,
    "note": MessageSquare,
  };
  return iconMap[iconName] || iconMap[type] || Activity;
};

const getColorForType = (type: string) => {
  const colorMap: Record<string, string> = {
    "activity": "bg-blue-500",
    "opportunity": "bg-green-500",
    "quote": "bg-purple-500",
    "created": "bg-gray-500",
    "email": "bg-orange-500",
    "call": "bg-primary-500",
    "meeting": "bg-indigo-500",
  };
  return colorMap[type] || "bg-gray-500";
};

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchContactData();
    }
  }, [id]);

  const fetchContactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) throw new Error("Non authentifié");

      const headers = { Authorization: `Bearer ${token}` };
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch contact details
      const contactRes = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${id}`, { headers });
      if (!contactRes.ok) throw new Error("Erreur chargement contact");
      const contactData = await contactRes.json();
      setContact(contactData);

      // Fetch timeline
      const timelineRes = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${id}/timeline`, { headers });
      if (!timelineRes.ok) throw new Error("Erreur chargement timeline");
      const timelineData = await timelineRes.json();
      setTimeline(timelineData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return date.toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <DashboardLayout title="Chargement...">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contact) {
    return (
      <DashboardLayout title="Erreur">
        <Alert variant="error">{error || "Contact non trouvé"}</Alert>
        <Button onClick={() => router.push("/crm/contacts")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux contacts
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${contact.first_name} ${contact.last_name}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/crm/contacts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.is_primary && (
                <Badge variant="success">Contact principal</Badge>
              )}
            </div>
            <p className="text-sm text-accents-5">
              {contact.job_title} {contact.department && `• ${contact.department}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="danger" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Card */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{contact.first_name} {contact.last_name}</h2>
                <p className="text-sm text-accents-5">{contact.job_title}</p>
              </div>
            </div>

            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-accents-4" />
                  <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-accents-4" />
                  <a href={`tel:${contact.phone}`} className="text-sm text-primary hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.department && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-accents-4" />
                  <span className="text-sm">{contact.department}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Company/Lead Card */}
          {(contact.client || contact.lead) && (
            <Card className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Entreprise associée
              </h3>
              {contact.client && (
                <div 
                  className="p-3 bg-accents-1 rounded-lg cursor-pointer hover:bg-accents-2 transition-colors"
                  onClick={() => router.push(`/clients/${contact.client?.id}`)}
                >
                  <p className="font-medium">{contact.client.name}</p>
                  <p className="text-xs text-accents-5">Client</p>
                </div>
              )}
              {contact.lead && (
                <div 
                  className="p-3 bg-accents-1 rounded-lg cursor-pointer hover:bg-accents-2 transition-colors"
                  onClick={() => router.push(`/crm/leads`)}
                >
                  <p className="font-medium">{contact.lead.company_name}</p>
                  <p className="text-xs text-accents-5">Lead</p>
                </div>
              )}
            </Card>
          )}

          {/* Assignee Card */}
          {contact.assignee && (
            <Card className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsable
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{contact.assignee.full_name}</p>
                  <p className="text-xs text-accents-5">Commercial assigné</p>
                </div>
              </div>
            </Card>
          )}

          {/* Notes Card */}
          {contact.notes && (
            <Card className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes
              </h3>
              <p className="text-sm text-accents-6 whitespace-pre-wrap">{contact.notes}</p>
            </Card>
          )}

          {/* Metadata */}
          <Card className="p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Informations
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-accents-5">Créé le</span>
                <span>{formatDate(contact.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-accents-5">Modifié le</span>
                <span>{formatDate(contact.updated_at)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Historique des interactions
              </h2>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle activité
              </Button>
            </div>

            {timeline && timeline.timeline.length > 0 ? (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-accents-2" />

                {/* Timeline Events */}
                <div className="space-y-6">
                  {timeline.timeline.map((event, index) => {
                    const IconComponent = getIconForType(event.type, event.icon);
                    const colorClass = getColorForType(event.type);
                    
                    return (
                      <div key={index} className="relative flex gap-4 pl-10">
                        {/* Icon */}
                        <div className={`absolute left-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center z-10`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-accents-1 rounded-lg p-4 hover:bg-accents-2 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-foreground flex items-center gap-2">
                                {event.title}
                                {event.is_completed !== undefined && (
                                  event.is_completed ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-accents-4" />
                                  )
                                )}
                              </h4>
                              {event.activity_type && (
                                <Badge variant="default">
                                  {event.activity_type}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-accents-5">
                              {formatRelativeDate(event.date)}
                            </span>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-accents-6 mb-2">{event.description}</p>
                          )}

                          {/* Metadata for specific types */}
                          {event.type === "opportunity" && event.metadata.amount && (
                            <div className="flex items-center gap-4 text-xs text-accents-5 mt-2">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {formatAmount(event.metadata.amount)}
                              </span>
                              <Badge variant={event.metadata.status === "won" ? "success" : "default"}>
                                {event.metadata.stage}
                              </Badge>
                            </div>
                          )}

                          {event.type === "quote" && event.metadata.total_ttc && (
                            <div className="flex items-center gap-4 text-xs text-accents-5 mt-2">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {formatAmount(event.metadata.total_ttc)}
                              </span>
                              <Badge variant={event.metadata.status === "accepted" ? "success" : "default"}>
                                {event.metadata.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-accents-5">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune interaction enregistrée</p>
                <p className="text-sm mt-1">Les activités, opportunités et devis apparaîtront ici</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
