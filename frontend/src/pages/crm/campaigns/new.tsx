import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { 
  ArrowLeft, Mail, Users, FileText, Send, Calendar, Save,
  ChevronRight, Check
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  preview_text: string;
}

interface Segment {
  id: string;
  name: string;
  member_count: number;
  entity_type: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    html_content: "",
    template_id: "",
    segment_id: "",
    target_entity_type: "lead",
    scheduled_at: ""
  });
  
  // Options
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchTemplates();
    fetchSegments();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/templates`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Erreur chargement templates:", error);
    }
  };

  const fetchSegments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/segments?entity_type=${formData.target_entity_type}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (error) {
      console.error("Erreur chargement segments:", error);
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      template_id: template.id,
      subject: template.subject
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError("Le nom de la campagne est requis");
      return;
    }
    if (!formData.subject && !formData.template_id) {
      setError("Un sujet ou un template est requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/crm/campaigns/${data.id}`);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || "Erreur lors de la création");
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Informations", icon: Mail },
    { number: 2, title: "Template", icon: FileText },
    { number: 3, title: "Audience", icon: Users },
    { number: 4, title: "Programmation", icon: Calendar },
  ];

  return (
    <DashboardLayout title="Nouvelle campagne">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouvelle campagne</h1>
            <p className="text-sm text-accents-5">Créez une campagne email en quelques étapes</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <button
                onClick={() => setStep(s.number)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  step === s.number
                    ? "bg-primary text-white"
                    : step > s.number
                    ? "bg-green-100 text-green-700"
                    : "bg-accents-2 text-accents-5"
                }`}
              >
                {step > s.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
                <span className="hidden md:inline">{s.title}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-accents-4 mx-2" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="error">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-sm underline">Fermer</button>
          </Alert>
        )}

        {/* Step 1: Informations */}
        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informations de la campagne</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom de la campagne *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Newsletter Décembre 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description interne de la campagne..."
                  className="w-full px-3 py-2 border rounded-lg resize-none h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sujet de l'email *
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Bonjour {{first_name}}, découvrez nos nouveautés !"
                />
                <p className="text-xs text-accents-5 mt-1">
                  Utilisez {"{{first_name}}"}, {"{{company}}"} pour personnaliser
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(2)}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Choisir un template</h2>
            
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-accents-4 mx-auto mb-4" />
                <p className="text-accents-5 mb-4">Aucun template disponible</p>
                <Button variant="secondary" onClick={() => router.push("/crm/campaigns/templates/new")}>
                  Créer un template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? "border-primary bg-primary/5"
                        : "border-accents-2 hover:border-accents-4"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-accents-5 mt-1">{template.subject}</p>
                        <span className="inline-block mt-2 text-xs bg-accents-2 px-2 py-1 rounded">
                          {template.category}
                        </span>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep(3)}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Audience */}
        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sélectionner l'audience</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type de destinataires</label>
                <div className="flex gap-4">
                  {["lead", "contact", "client"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFormData({ ...formData, target_entity_type: type, segment_id: "" });
                        fetchSegments();
                      }}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.target_entity_type === type
                          ? "border-primary bg-primary/5"
                          : "border-accents-2 hover:border-accents-4"
                      }`}
                    >
                      {type === "lead" ? "Leads" : type === "contact" ? "Contacts" : "Clients"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Segment (optionnel)</label>
                <p className="text-xs text-accents-5 mb-3">
                  Laissez vide pour cibler tous les {formData.target_entity_type}s
                </p>
                
                {segments.length === 0 ? (
                  <div className="p-4 bg-accents-1 rounded-lg text-center">
                    <p className="text-sm text-accents-5">Aucun segment disponible pour ce type</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div
                      onClick={() => setFormData({ ...formData, segment_id: "" })}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        !formData.segment_id
                          ? "border-primary bg-primary/5"
                          : "border-accents-2 hover:border-accents-4"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Tous les {formData.target_entity_type}s</span>
                        {!formData.segment_id && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                    {segments.map((segment) => (
                      <div
                        key={segment.id}
                        onClick={() => setFormData({ ...formData, segment_id: segment.id })}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.segment_id === segment.id
                            ? "border-primary bg-primary/5"
                            : "border-accents-2 hover:border-accents-4"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{segment.name}</span>
                            <span className="ml-2 text-sm text-accents-5">
                              ({segment.member_count} membres)
                            </span>
                          </div>
                          {formData.segment_id === segment.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep(4)}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Programmation */}
        {step === 4 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Programmation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quand envoyer la campagne ?
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accents-1">
                    <input
                      type="radio"
                      name="schedule"
                      checked={!formData.scheduled_at}
                      onChange={() => setFormData({ ...formData, scheduled_at: "" })}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">Envoyer maintenant</p>
                      <p className="text-sm text-accents-5">La campagne sera envoyée immédiatement après création</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accents-1">
                    <input
                      type="radio"
                      name="schedule"
                      checked={!!formData.scheduled_at}
                      onChange={() => setFormData({ ...formData, scheduled_at: new Date().toISOString().slice(0, 16) })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Programmer pour plus tard</p>
                      <p className="text-sm text-accents-5">Choisissez une date et heure d'envoi</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.scheduled_at && (
                <div>
                  <label className="block text-sm font-medium mb-1">Date et heure d'envoi</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              {/* Récapitulatif */}
              <div className="mt-6 p-4 bg-accents-1 rounded-lg">
                <h3 className="font-medium mb-3">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-accents-5">Nom:</span>
                    <span className="font-medium">{formData.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Sujet:</span>
                    <span className="font-medium truncate max-w-xs">{formData.subject || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Template:</span>
                    <span className="font-medium">{selectedTemplate?.name || "Aucun"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Audience:</span>
                    <span className="font-medium">
                      {segments.find(s => s.id === formData.segment_id)?.name || `Tous les ${formData.target_entity_type}s`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Envoi:</span>
                    <span className="font-medium">
                      {formData.scheduled_at 
                        ? new Date(formData.scheduled_at).toLocaleString("fr-FR")
                        : "Immédiat (brouillon)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleSubmit} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer brouillon
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Création..." : "Créer la campagne"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
