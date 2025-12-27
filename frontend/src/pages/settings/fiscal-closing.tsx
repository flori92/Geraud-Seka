/**
 * Paramétrage des clôtures - SEKA
 * Configuration des règles et procédures de clôture d'exercice
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Settings,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Lock,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";

interface ClosingConfig {
  id: string;
  auto_depreciation: boolean;
  auto_provisions: boolean;
  auto_accruals: boolean;
  auto_balance_carry_forward: boolean;
  require_bank_reconciliation: boolean;
  require_inventory_validation: boolean;
  require_manager_approval: boolean;
  closing_checklist: ClosingChecklistItem[];
  balance_accounts: BalanceAccount[];
  result_account: string;
  retained_earnings_account: string;
  notification_emails: string[];
}

interface ClosingChecklistItem {
  id: string;
  label: string;
  required: boolean;
  order: number;
}

interface BalanceAccount {
  account_number: string;
  account_name: string;
  action: "carry_forward" | "reset_to_zero" | "transfer_to_result";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http:

const defaultChecklist: ClosingChecklistItem[] = [
  { id: "1", label: "Rapprochement bancaire effectué", required: true, order: 1 },
  { id: "2", label: "Inventaire physique validé", required: true, order: 2 },
  { id: "3", label: "Amortissements calculés", required: true, order: 3 },
  { id: "4", label: "Provisions constituées", required: false, order: 4 },
  { id: "5", label: "Charges à payer comptabilisées", required: false, order: 5 },
  { id: "6", label: "Produits à recevoir comptabilisés", required: false, order: 6 },
  { id: "7", label: "Lettrage des comptes tiers effectué", required: true, order: 7 },
  { id: "8", label: "Balance générale vérifiée", required: true, order: 8 },
];

export default function FiscalClosingSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ClosingConfig>({
    id: "",
    auto_depreciation: true,
    auto_provisions: false,
    auto_accruals: false,
    auto_balance_carry_forward: true,
    require_bank_reconciliation: true,
    require_inventory_validation: true,
    require_manager_approval: false,
    closing_checklist: defaultChecklist,
    balance_accounts: [],
    result_account: "12",
    retained_earnings_account: "11",
    notification_emails: [],
  });
  const [newEmail, setNewEmail] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchConfig = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settings/fiscal-closing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({ ...config, ...data.config });
        }
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveConfig = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settings/fiscal-closing`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSuccessMessage("Configuration enregistrée avec succès");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    if (newEmail && !config.notification_emails.includes(newEmail)) {
      setConfig({ ...config, notification_emails: [...config.notification_emails, newEmail] });
      setNewEmail("");
    }
  };

  const removeEmail = (email: string) => {
    setConfig({ ...config, notification_emails: config.notification_emails.filter(e => e !== email) });
  };

  const addChecklistItem = () => {
    if (newChecklistItem) {
      const newItem: ClosingChecklistItem = {
        id: Date.now().toString(),
        label: newChecklistItem,
        required: false,
        order: config.closing_checklist.length + 1,
      };
      setConfig({ ...config, closing_checklist: [...config.closing_checklist, newItem] });
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (id: string) => {
    setConfig({ ...config, closing_checklist: config.closing_checklist.filter(item => item.id !== id) });
  };

  const toggleChecklistRequired = (id: string) => {
    setConfig({
      ...config,
      closing_checklist: config.closing_checklist.map(item =>
        item.id === id ? { ...item, required: !item.required } : item
      ),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paramétrage des clôtures - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Paramétrage des clôtures</h1>
                <p className="text-sm text-gray-600 mt-0.5">Configurez les règles et procédures de clôture d&apos;exercice</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchConfig}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">{successMessage}</span>
            </div>
          )}

          <div className="px-6 py-6 space-y-6">
            {/* Automatisations */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#1e3a5f]" />
                  Automatisations
                </h2>
                <p className="text-sm text-gray-500 mt-1">Opérations automatiques lors de la clôture</p>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Calcul automatique des amortissements</p>
                    <p className="text-xs text-gray-500">Génère les dotations aux amortissements pour toutes les immobilisations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.auto_depreciation}
                    onChange={(e) => setConfig({ ...config, auto_depreciation: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Calcul automatique des provisions</p>
                    <p className="text-xs text-gray-500">Génère les écritures de provisions selon les règles définies</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.auto_provisions}
                    onChange={(e) => setConfig({ ...config, auto_provisions: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Charges et produits constatés d&apos;avance</p>
                    <p className="text-xs text-gray-500">Génère automatiquement les écritures de régularisation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.auto_accruals}
                    onChange={(e) => setConfig({ ...config, auto_accruals: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Report à nouveau automatique</p>
                    <p className="text-xs text-gray-500">Génère automatiquement les écritures de report à nouveau</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.auto_balance_carry_forward}
                    onChange={(e) => setConfig({ ...config, auto_balance_carry_forward: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>
              </div>
            </div>

            {/* Prérequis */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#1e3a5f]" />
                  Prérequis de clôture
                </h2>
                <p className="text-sm text-gray-500 mt-1">Conditions obligatoires avant de pouvoir clôturer</p>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rapprochement bancaire obligatoire</p>
                    <p className="text-xs text-gray-500">Tous les comptes bancaires doivent être rapprochés</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.require_bank_reconciliation}
                    onChange={(e) => setConfig({ ...config, require_bank_reconciliation: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Validation inventaire obligatoire</p>
                    <p className="text-xs text-gray-500">L&apos;inventaire physique doit être validé avant clôture</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.require_inventory_validation}
                    onChange={(e) => setConfig({ ...config, require_inventory_validation: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approbation du responsable</p>
                    <p className="text-xs text-gray-500">Validation par un responsable requise pour clôturer</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.require_manager_approval}
                    onChange={(e) => setConfig({ ...config, require_manager_approval: e.target.checked })}
                    className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]"
                  />
                </label>
              </div>
            </div>

            {/* Comptes de clôture */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1e3a5f]" />
                  Comptes de clôture
                </h2>
                <p className="text-sm text-gray-500 mt-1">Comptes utilisés pour les écritures de clôture</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compte de résultat</label>
                    <input
                      type="text"
                      value={config.result_account}
                      onChange={(e) => setConfig({ ...config, result_account: e.target.value })}
                      placeholder="Ex: 12"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Compte 12 - Résultat de l&apos;exercice</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compte report à nouveau</label>
                    <input
                      type="text"
                      value={config.retained_earnings_account}
                      onChange={(e) => setConfig({ ...config, retained_earnings_account: e.target.value })}
                      placeholder="Ex: 11"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Compte 11 - Report à nouveau</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist de clôture */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#1e3a5f]" />
                  Checklist de clôture
                </h2>
                <p className="text-sm text-gray-500 mt-1">Étapes à valider avant la clôture</p>
              </div>
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  {config.closing_checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-900">{item.label}</span>
                        {item.required && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Obligatoire</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleChecklistRequired(item.id)}
                          className={`px-2 py-1 text-xs rounded ${item.required ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {item.required ? "Obligatoire" : "Optionnel"}
                        </button>
                        <button
                          onClick={() => removeChecklistItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Ajouter une étape..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  />
                  <button
                    onClick={addChecklistItem}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#1e3a5f]" />
                  Notifications
                </h2>
                <p className="text-sm text-gray-500 mt-1">Personnes à notifier lors des clôtures</p>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {config.notification_emails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {email}
                      <button onClick={() => removeEmail(email)} className="hover:text-blue-900">×</button>
                    </span>
                  ))}
                  {config.notification_emails.length === 0 && (
                    <span className="text-sm text-gray-500">Aucun email configuré</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ajouter un email..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    onKeyDown={(e) => e.key === "Enter" && addEmail()}
                  />
                  <button
                    onClick={addEmail}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
