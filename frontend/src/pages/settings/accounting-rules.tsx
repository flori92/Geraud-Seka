import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Zap, CheckCircle } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  description: string;
  priority: number;
  is_active: boolean;
  auto_apply: boolean;
  conditions: any[];
  actions: any[];
}

export default function AccountingRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-rules/rules`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleActive = async (ruleId: string, currentStatus: boolean) => {
    const token = localStorage.getItem("seka_access_token");
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-rules/rules/${ruleId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...rule,
            is_active: !currentStatus
          })
        }
      );
      fetchRules();
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette règle ?")) return;

    const token = localStorage.getItem("seka_access_token");
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting-rules/rules/${ruleId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  return (
    <>
      <Head><title>Règles Comptables - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Centre de Règles Comptables</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Automatisez l&apos;imputation comptable de vos factures
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle règle
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Comment ça marche ?</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Les règles analysent automatiquement vos documents (nom fournisseur, montant, mots-clés)
                    et suggèrent l&apos;imputation comptable appropriée. Plus la règle est précise, plus la confiance est élevée.
                  </p>
                </div>
              </div>
            </div>

            {/* Rules List */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Chargement...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Zap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune règle définie</h3>
                <p className="text-gray-600 mb-6">
                  Créez votre première règle pour automatiser vos saisies comptables
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Créer une règle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {rules
                  .sort((a, b) => b.priority - a.priority)
                  .map((rule) => (
                    <div
                      key={rule.id}
                      className={`bg-white rounded-xl border p-6 transition-all ${rule.is_active
                        ? 'border-gray-200 hover:shadow-md'
                        : 'border-gray-200 opacity-60'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{rule.name}</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                              Priorité: {rule.priority}
                            </span>
                            {rule.auto_apply && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Auto
                              </span>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 font-medium">Conditions:</span>
                              <div className="mt-1 space-y-1">
                                {rule.conditions.map((cond, idx) => (
                                  <div key={idx} className="text-gray-700">
                                    • {cond.type} {cond.operator} &quot;{cond.value}&quot;
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">Actions:</span>
                              <div className="mt-1 space-y-1">
                                {rule.actions.map((action, idx) => (
                                  <div key={idx} className="text-gray-700">
                                    • {action.type}
                                    {action.debit_account && ` (D: ${action.debit_account})`}
                                    {action.credit_account && ` (C: ${action.credit_account})`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title={rule.is_active ? "Désactiver" : "Activer"}
                          >
                            {rule.is_active ? (
                              <ToggleRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Create Modal Placeholder */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Créer une nouvelle règle</h2>
                  <p className="text-gray-600 mb-6">
                    Cette fonctionnalité sera disponible prochainement. Utilisez l&apos;API pour créer des règles.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
