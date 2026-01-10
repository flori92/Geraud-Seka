import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface Condition {
  type: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  debit_account?: string;
  credit_account?: string;
  vat_rate?: number;
  label_template?: string;
  analytic_code?: string;
}

interface CreateRuleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CONDITION_TYPES = [
  { value: "supplier_name", label: "Nom du fournisseur" },
  { value: "customer_name", label: "Nom du client" },
  { value: "amount_range", label: "Montant" },
  { value: "reference_pattern", label: "Numéro de facture" },
  { value: "description_contains", label: "Description contient" },
  { value: "document_type", label: "Type de document" },
];

const OPERATORS = [
  { value: "equals", label: "Est égal à" },
  { value: "contains", label: "Contient" },
  { value: "starts_with", label: "Commence par" },
  { value: "ends_with", label: "Se termine par" },
  { value: "greater_than", label: "Supérieur à" },
  { value: "less_than", label: "Inférieur à" },
  { value: "between", label: "Entre" },
  { value: "matches_regex", label: "Expression régulière" },
];

const ACTION_TYPES = [
  { value: "assign_account", label: "Assigner des comptes" },
  { value: "set_vat_rate", label: "Définir le taux de TVA" },
  { value: "suggest_label", label: "Suggérer un libellé" },
  { value: "assign_analytic_code", label: "Assigner un code analytique" },
];

export default function CreateRuleModal({ onClose, onSuccess }: CreateRuleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [autoApply, setAutoApply] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);
  const [conditions, setConditions] = useState<Condition[]>([
    { type: "supplier_name", operator: "contains", value: "" },
  ]);
  const [actions, setActions] = useState<Action[]>([
    { type: "assign_account", debit_account: "", credit_account: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addCondition = () => {
    setConditions([...conditions, { type: "supplier_name", operator: "contains", value: "" }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const addAction = () => {
    setActions([...actions, { type: "assign_account", debit_account: "", credit_account: "" }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: string | number) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom de la règle est requis");
      return;
    }

    if (conditions.some(c => !c.value.trim())) {
      setError("Toutes les conditions doivent avoir une valeur");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("seka_access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-rules/rules`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            priority,
            conditions,
            actions,
            auto_apply: autoApply,
            confidence_threshold: confidenceThreshold,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la règle");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Créer une nouvelle règle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la règle *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Factures SBEE"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Description de la règle"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">Plus élevé = exécuté en premier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seuil de confiance
                </label>
                <input
                  type="number"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="1"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">0.0 à 1.0</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoApply"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoApply" className="text-sm font-medium text-gray-700">
                Appliquer automatiquement (sans validation manuelle)
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Conditions</h3>
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Ajouter une condition
              </button>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <select
                      value={condition.type}
                      onChange={(e) => updateCondition(index, "type", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {CONDITION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, "operator", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, "value", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Valeur"
                      required
                    />
                  </div>

                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              <button
                type="button"
                onClick={addAction}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Ajouter une action
              </button>
            </div>

            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, "type", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {ACTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    {actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>

                  {action.type === "assign_account" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Compte débit
                        </label>
                        <input
                          type="text"
                          value={action.debit_account || ""}
                          onChange={(e) => updateAction(index, "debit_account", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: 601000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Compte crédit
                        </label>
                        <input
                          type="text"
                          value={action.credit_account || ""}
                          onChange={(e) => updateAction(index, "credit_account", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: 401000"
                        />
                      </div>
                    </div>
                  )}

                  {action.type === "set_vat_rate" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Taux de TVA (%)
                      </label>
                      <input
                        type="number"
                        value={action.vat_rate || ""}
                        onChange={(e) => updateAction(index, "vat_rate", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="18"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  )}

                  {action.type === "suggest_label" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Modèle de libellé
                      </label>
                      <input
                        type="text"
                        value={action.label_template || ""}
                        onChange={(e) => updateAction(index, "label_template", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ex: Facture {supplier_name}"
                      />
                    </div>
                  )}

                  {action.type === "assign_analytic_code" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Code analytique
                      </label>
                      <input
                        type="text"
                        value={action.analytic_code || ""}
                        onChange={(e) => updateAction(index, "analytic_code", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ex: DEPT-01"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Création..." : "Créer la règle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
