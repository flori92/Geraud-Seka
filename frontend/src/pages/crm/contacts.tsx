import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CreateContactModal } from "@/components/forms/CreateContactModal";
import { Plus, Search, Mail, Phone, Briefcase, User, Edit, Trash2 } from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  contact_type: string;
  is_primary: boolean;
  is_active: boolean;
  do_not_contact: boolean;
  email_opt_out: boolean;
  client_name?: string;
  lead_name?: string;
  assignee_name?: string;
  days_since_last_contact?: number;
  is_engaged: boolean;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactTypeFilter, setContactTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();

  useEffect(() => {
    fetchContacts();
  }, [statusFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const params = new URLSearchParams();
      
      if (statusFilter === "active") {
        params.append("is_active", "true");
      } else if (statusFilter === "inactive") {
        params.append("is_active", "false");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
        setError(null);
      } else {
        setError("Erreur lors du chargement des contacts");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des contacts");
    } finally {
      setLoading(false);
    }
  };

  const getContactTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      decision_maker: "Décideur",
      influencer: "Influenceur",
      technical: "Technique",
      financial: "Financier",
      user: "Utilisateur",
      other: "Autre",
    };
    return labels[type] || type;
  };

  const getContactTypeVariant = (type: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      decision_maker: "success",
      influencer: "warning",
      technical: "default",
      financial: "default",
      user: "default",
      other: "default",
    };
    return variants[type] || "default";
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${contactId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchContacts(); // Recharger la liste
      } else {
        setError("Erreur lors de la suppression du contact");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression du contact");
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.job_title && contact.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.client_name && contact.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = contactTypeFilter === "all" || contact.contact_type === contactTypeFilter;

    return matchesSearch && matchesType;
  });

  const stats = [
    {
      label: "Total contacts",
      value: contacts.length.toString(),
      icon: User,
    },
    {
      label: "Contacts principaux",
      value: contacts.filter((c) => c.is_primary).length.toString(),
      icon: Briefcase,
    },
    {
      label: "Contacts engagés",
      value: contacts.filter((c) => c.is_engaged).length.toString(),
      icon: Mail,
    },
    {
      label: "Décideurs",
      value: contacts.filter((c) => c.contact_type === "decision_maker").length.toString(),
      icon: User,
    },
  ];

  return (
    <DashboardLayout title="Contacts CRM">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-accents-5">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-accents-5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accents-5" />
              <Input
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={contactTypeFilter} onChange={(e) => setContactTypeFilter(e.target.value)}>
              <option value="all">Tous les types</option>
              <option value="decision_maker">Décideurs</option>
              <option value="influencer">Influenceurs</option>
              <option value="technical">Techniques</option>
              <option value="financial">Financiers</option>
              <option value="user">Utilisateurs</option>
              <option value="other">Autres</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </Select>
          </div>
          <Button 
            variant="primary" 
            size="md"
            onClick={() => {
              setSelectedContactId(undefined);
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contact
          </Button>
        </div>
      </Card>

      {/* Contacts List */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <User className="h-12 w-12 text-accents-4 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Aucun contact trouvé</p>
            <p className="text-sm text-accents-5">
              {searchTerm || contactTypeFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Commencez par créer votre premier contact"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-accents-2">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Poste</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Entreprise</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {contact.first_name[0]}
                            {contact.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground flex items-center gap-2">
                            {contact.full_name}
                            {contact.is_primary && (
                              <Badge variant="success">
                                Principal
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-accents-5">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-foreground">{contact.job_title || "-"}</p>
                        {contact.department && (
                          <p className="text-xs text-accents-5">{contact.department}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getContactTypeVariant(contact.contact_type)}>
                        {getContactTypeLabel(contact.contact_type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {contact.client_name || contact.lead_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-xs text-accents-6">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-1 text-xs text-accents-6">
                            <Phone className="h-3 w-3" />
                            {contact.mobile}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {contact.is_engaged && (
                          <Badge variant="success">
                            Engagé
                          </Badge>
                        )}
                        {contact.do_not_contact && (
                          <Badge variant="error">
                            Ne pas contacter
                          </Badge>
                        )}
                        {!contact.is_active && (
                          <Badge variant="default">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedContactId(contact.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de création/édition */}
      <CreateContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContactId(undefined);
        }}
        onSuccess={() => {
          fetchContacts();
        }}
        contactId={selectedContactId}
      />
    </DashboardLayout>
  );
}
