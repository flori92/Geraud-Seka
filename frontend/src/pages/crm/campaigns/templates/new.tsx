import { useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { 
  ArrowLeft, Save, Eye, Code, Type, Image, Link2, 
  Bold, Italic, List, AlignLeft, AlignCenter
} from "lucide-react";

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "marketing",
    subject: "",
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px 0; }
    .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bonjour {{first_name}} !</h1>
    </div>
    <div class="content">
      <p>Votre contenu ici...</p>
      <p><a href="#" class="button">En savoir plus</a></p>
    </div>
    <div class="footer">
      <p>© 2024 Votre entreprise</p>
      <p><a href="{{unsubscribe_link}}">Se désinscrire</a></p>
    </div>
  </div>
</body>
</html>`,
    preview_text: ""
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError("Le nom du template est requis");
      return;
    }
    if (!formData.subject) {
      setError("Le sujet est requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/templates`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push("/crm/campaigns/templates");
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

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("html-editor") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.html_content;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData({ ...formData, html_content: newText });
    }
  };

  const variables = [
    { name: "first_name", label: "Prénom" },
    { name: "last_name", label: "Nom" },
    { name: "full_name", label: "Nom complet" },
    { name: "email", label: "Email" },
    { name: "company", label: "Entreprise" },
    { name: "job_title", label: "Poste" },
    { name: "phone", label: "Téléphone" },
    { name: "city", label: "Ville" },
    { name: "unsubscribe_link", label: "Lien désinscription" }
  ];

  const categories = [
    { value: "marketing", label: "Marketing" },
    { value: "transactional", label: "Transactionnel" },
    { value: "newsletter", label: "Newsletter" },
    { value: "notification", label: "Notification" },
    { value: "welcome", label: "Bienvenue" },
    { value: "followup", label: "Relance" }
  ];

  return (
    <DashboardLayout title="Nouveau template">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nouveau template</h1>
              <p className="text-sm text-accents-5">Créez un modèle d'email réutilisable</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <Code className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {previewMode ? "Éditer" : "Aperçu"}
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-sm underline">Fermer</button>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Informations</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Newsletter mensuelle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description interne..."
                    className="w-full px-3 py-2 border rounded-lg resize-none h-20"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Variables disponibles</h3>
              <p className="text-xs text-accents-5 mb-3">
                Cliquez pour insérer dans l'éditeur
              </p>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => insertVariable(v.name)}
                    className="text-xs bg-accents-2 hover:bg-accents-3 px-2 py-1 rounded transition-colors"
                    title={v.label}
                  >
                    {`{{${v.name}}}`}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Sujet de l'email *</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ex: Bonjour {{first_name}}, découvrez nos nouveautés !"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Texte de prévisualisation</label>
                  <Input
                    value={formData.preview_text}
                    onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
                    placeholder="Texte affiché dans la boîte de réception..."
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {previewMode ? "Aperçu" : "Contenu HTML"}
                </h3>
              </div>

              {previewMode ? (
                <div className="border rounded-lg bg-white p-4 min-h-[500px]">
                  <div 
                    dangerouslySetInnerHTML={{ __html: formData.html_content }}
                  />
                </div>
              ) : (
                <textarea
                  id="html-editor"
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  className="w-full h-[500px] px-3 py-2 border rounded-lg font-mono text-sm resize-none"
                  placeholder="Contenu HTML de l'email..."
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
