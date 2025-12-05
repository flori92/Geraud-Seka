import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { 
  ArrowLeft, Save, Zap, Plus, Trash2, ChevronRight, Check,
  Mail, Users, UserPlus, Target, Bell, Clock, GitBranch, Settings
} from "lucide-react";

interface TriggerType {
  value: string;
  label: string;
  category: string;
}

interface ActionType {
  value: string;
  label: string;
  category: string;
  config_schema: Record<string, string>;
}

interface Action {
  id: string;
  action_type: string;
  config: Record<string, any>;
  order: number;
}

export default function NewAutomationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [triggerTypes, setTriggerTypes] = useState<TriggerType[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "",
    trigger_config: {} as Record<string, any>,
    conditions: [] as any[]
  });
  
  const [actions, setActions] = useState<Action[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchTriggerTypes();
    fetchActionTypes();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchTriggerTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/triggers/types`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTriggerTypes(data.triggers || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchActionTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/actions/types`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setActionTypes(data.actions || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const addAction = (actionType: string) => {
    const newAction: Action = {
      id: `temp-${Date.now()}`,
      action_type: actionType,
      config: {},
      order: actions.length
    };
    setActions([...actions, newAction]);
  };

  const updateActionConfig = (index: number, key: string, value: any) => {
    const updated = [...actions];
    updated[index].config[key] = value;
    setActions(updated);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError("Le nom est requis");
      return;
    }
    if (!formData.trigger_type) {
      setError("Sélectionnez un déclencheur");
      return;
    }
    if (actions.length === 0) {
      setError("Ajoutez au moins une action");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        actions: actions.map((a, i) => ({
          action_type: a.action_type,
          config: a.config,
          order: i
        }))
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/automations`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/crm/automations/${data.id}`);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "lead": return <Users className="h-4 w-4" />;
      case "contact": return <UserPlus className="h-4 w-4" />;
      case "opportunity": return <Target className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "time": return <Clock className="h-4 w-4" />;
      case "notification": return <Bell className="h-4 w-4" />;
      case "crm": return <Users className="h-4 w-4" />;
      case "flow": return <GitBranch className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    return actionTypes.find(a => a.value === actionType)?.label || actionType;
  };

  const groupedTriggers = triggerTypes.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, TriggerType[]>);

  const groupedActions = actionTypes.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<string, ActionType[]>);

  const categoryLabels: Record<string, string> = {
    lead: "Leads",
    contact: "Contacts",
    opportunity: "Opportunités",
    email: "Emails",
    time: "Temporel",
    crm: "CRM",
    notification: "Notifications",
    flow: "Flux"
  };

  const steps = [
    { number: 1, title: "Informations" },
    { number: 2, title: "Déclencheur" },
    { number: 3, title: "Actions" },
  ];

  return (
    <DashboardLayout title="Nouvelle automatisation">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouvelle automatisation</h1>
            <p className="text-sm text-accents-5">Créez un workflow automatisé</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4">
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
                {step > s.number ? <Check className="h-4 w-4" /> : <span>{s.number}</span>}
                <span>{s.title}</span>
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
            <h2 className="text-lg font-semibold mb-4">Informations de base</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de l'automatisation *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Bienvenue nouveau lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce que fait cette automatisation..."
                  className="w-full px-3 py-2 border rounded-lg resize-none h-24"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(2)} disabled={!formData.name}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Déclencheur */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Choisir le déclencheur</h2>
            <p className="text-sm text-accents-5 mb-4">
              Quand cette automatisation doit-elle se déclencher ?
            </p>
            
            <div className="space-y-6">
              {Object.entries(groupedTriggers).map(([category, triggers]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-accents-5 mb-2 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {triggers.map((trigger) => (
                      <button
                        key={trigger.value}
                        onClick={() => setFormData({ ...formData, trigger_type: trigger.value })}
                        className={`p-3 text-left border-2 rounded-lg transition-all ${
                          formData.trigger_type === trigger.value
                            ? "border-primary bg-primary/5"
                            : "border-accents-2 hover:border-accents-4"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{trigger.label}</span>
                          {formData.trigger_type === trigger.value && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep(3)} disabled={!formData.trigger_type}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Actions */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Configurer les actions</h2>
              <p className="text-sm text-accents-5 mb-4">
                Que doit faire cette automatisation ?
              </p>

              {/* Actions ajoutées */}
              {actions.length > 0 && (
                <div className="space-y-3 mb-6">
                  {actions.map((action, index) => {
                    const actionDef = actionTypes.find(a => a.value === action.action_type);
                    return (
                      <div key={action.id} className="p-4 border rounded-lg bg-accents-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-medium">{getActionLabel(action.action_type)}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeAction(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        {/* Configuration de l'action */}
                        {actionDef?.config_schema && (
                          <div className="space-y-2 ml-8">
                            {Object.entries(actionDef.config_schema).map(([key, type]) => (
                              <div key={key}>
                                <label className="block text-xs font-medium mb-1 capitalize">
                                  {key.replace(/_/g, " ")}
                                </label>
                                {type === "number" ? (
                                  <Input
                                    type="number"
                                    value={action.config[key] || ""}
                                    onChange={(e) => updateActionConfig(index, key, parseInt(e.target.value))}
                                    placeholder={`Entrez ${key}`}
                                    className="text-sm"
                                  />
                                ) : (
                                  <Input
                                    value={action.config[key] || ""}
                                    onChange={(e) => updateActionConfig(index, key, e.target.value)}
                                    placeholder={`Entrez ${key}`}
                                    className="text-sm"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ajouter une action */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Ajouter une action</h3>
                <div className="space-y-4">
                  {Object.entries(groupedActions).map(([category, categoryActions]) => (
                    <div key={category}>
                      <p className="text-xs text-accents-5 mb-2 flex items-center gap-1">
                        {getCategoryIcon(category)}
                        {categoryLabels[category] || category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categoryActions.map((action) => (
                          <button
                            key={action.value}
                            onClick={() => addAction(action.value)}
                            className="px-3 py-1.5 text-sm bg-accents-2 hover:bg-accents-3 rounded-lg transition-colors"
                          >
                            <Plus className="h-3 w-3 inline mr-1" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Récapitulatif */}
            <Card className="p-4 bg-accents-1">
              <h3 className="font-medium mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-accents-5">Déclencheur:</span>
                  <span className="font-medium">
                    {triggerTypes.find(t => t.value === formData.trigger_type)?.label || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-accents-5">Actions:</span>
                  <span className="font-medium">{actions.length} action(s)</span>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={loading || actions.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Création..." : "Créer l'automatisation"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

