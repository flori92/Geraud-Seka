import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  FileText, Plus, Search, Edit, Trash2, Eye, Copy, Mail
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  preview_text: string;
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  available_variables: string[];
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  marketing: "Marketing",
  transactional: "Transactionnel",
  newsletter: "Newsletter",
  notification: "Notification",
  welcome: "Bienvenue",
  followup: "Relance"
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const url = categoryFilter 
        ? `${API_BASE_URL}/api/v1/campaigns/templates?category=${categoryFilter}`
        : `${API_BASE_URL}/api/v1/campaigns/templates`;
      
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Supprimer ce template ?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/templates/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const duplicateTemplate = async (template: Template) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/templates`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: `${template.name} (copie)`,
          description: template.description,
          category: template.category,
          subject: template.subject,
          html_content: "<p>Contenu à personnaliser</p>",
          preview_text: template.preview_text
        })
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <DashboardLayout title="Templates Email">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Templates Email</h1>
            <p className="text-sm text-accents-5">
              Gérez vos modèles d'emails réutilisables
            </p>
          </div>
          <Button onClick={() => router.push("/crm/campaigns/templates/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau template
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accents-5" />
              <Input
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-accents-4 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun template</h3>
            <p className="text-accents-5 mb-4">
              Créez votre premier template email
            </p>
            <Button onClick={() => router.push("/crm/campaigns/templates/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un template
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <Badge>{categoryLabels[template.category] || template.category}</Badge>
                  </div>
                  {template.is_system && (
                    <Badge variant="default">Système</Badge>
                  )}
                </div>
                
                <h3 className="font-medium mb-1 truncate">{template.name}</h3>
                <p className="text-sm text-accents-5 truncate mb-3">{template.subject}</p>
                
                {template.available_variables && template.available_variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.available_variables.slice(0, 3).map((v) => (
                      <span key={v} className="text-xs bg-accents-2 px-2 py-0.5 rounded">
                        {`{{${v}}}`}
                      </span>
                    ))}
                    {template.available_variables.length > 3 && (
                      <span className="text-xs text-accents-5">
                        +{template.available_variables.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-accents-5">
                    Utilisé {template.usage_count} fois
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/crm/campaigns/templates/${template.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.is_system && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/crm/campaigns/templates/${template.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
