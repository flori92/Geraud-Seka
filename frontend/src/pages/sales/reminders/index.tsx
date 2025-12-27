/**
 * Relances automatiques - SEKA
 * Gestion des relances clients impayés
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Mail,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Settings,
  Eye,
  Pause,
  Play,
} from "lucide-react";

interface Reminder {
  id: string;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  reminder_level: number;
  last_reminder_date: string | null;
  next_reminder_date: string | null;
  status: "pending" | "sent" | "paused" | "paid";
}

interface ReminderSettings {
  enabled: boolean;
  first_reminder_days: number;
  second_reminder_days: number;
  third_reminder_days: number;
  email_template_1: string;
  email_template_2: string;
  email_template_3: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RemindersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const fetchReminders = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [remindersRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/sales/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/sales/reminders/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (remindersRes.ok) {
        const data = await remindersRes.json();
        setReminders(data.reminders || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || null);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const sendReminder = async (reminderId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setSending(reminderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sales/reminders/${reminderId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchReminders();
      }
    } catch (err) {
      console.error("Erreur envoi:", err);
    } finally {
      setSending(null);
    }
  };

  const togglePause = async (reminderId: string, paused: boolean) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sales/reminders/${reminderId}/${paused ? "resume" : "pause"}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchReminders();
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const sendAllPending = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sales/reminders/send-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchReminders();
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const filteredReminders = reminders.filter((r) => {
    const matchesSearch =
      r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" /> Payé
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            <Mail className="w-3 h-3" /> Envoyée
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            <Pause className="w-3 h-3" /> Suspendu
          </span>
        );
      default:
        if (daysOverdue > 30) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
              <AlertTriangle className="w-3 h-3" /> Critique
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
    }
  };

  const stats = {
    total: reminders.length,
    pending: reminders.filter((r) => r.status === "pending").length,
    totalAmount: reminders.filter((r) => r.status !== "paid").reduce((sum, r) => sum + r.amount_due, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Relances clients - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Relances clients</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez les relances automatiques pour vos factures impayées
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </button>
                <button
                  onClick={sendAllPending}
                  disabled={stats.pending === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Envoyer toutes ({stats.pending})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Factures en retard</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Relances à envoyer</p>
              <p className="text-xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Montant total impayé</p>
              <p className="text-xl font-semibold text-red-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher client ou facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous statuts</option>
                <option value="pending">En attente</option>
                <option value="sent">Envoyées</option>
                <option value="paused">Suspendues</option>
                <option value="paid">Payées</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facture</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Retard</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Niveau</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReminders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Aucune relance en cours
                    </td>
                  </tr>
                ) : (
                  filteredReminders.map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{reminder.client_name}</p>
                        <p className="text-xs text-gray-500">{reminder.client_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{reminder.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(reminder.amount_due)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${reminder.days_overdue > 30 ? "text-red-600" : "text-yellow-600"}`}>
                          {reminder.days_overdue} jours
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {reminder.reminder_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(reminder.status, reminder.days_overdue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {reminder.status === "pending" && (
                            <button
                              onClick={() => sendReminder(reminder.id)}
                              disabled={sending === reminder.id}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                              title="Envoyer"
                            >
                              {sending === reminder.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => togglePause(reminder.id, reminder.status === "paused")}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title={reminder.status === "paused" ? "Reprendre" : "Suspendre"}
                          >
                            {reminder.status === "paused" ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => router.push(`/sales/invoices/${reminder.invoice_id}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title="Voir facture"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Paramètres */}
      {showSettingsModal && settings && (
        <ReminderSettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSaved={fetchReminders}
        />
      )}
    </>
  );
}

function ReminderSettingsModal({
  settings,
  onClose,
  onSaved,
}: {
  settings: ReminderSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sales/reminders/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onClose();
        onSaved();
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres des relances</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">Activer les relances automatiques</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1ère relance</label>
              <input
                type="number"
                value={form.first_reminder_days}
                onChange={(e) => setForm({ ...form, first_reminder_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-xs text-gray-500">jours</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2ème relance</label>
              <input
                type="number"
                value={form.second_reminder_days}
                onChange={(e) => setForm({ ...form, second_reminder_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-xs text-gray-500">jours</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3ème relance</label>
              <input
                type="number"
                value={form.third_reminder_days}
                onChange={(e) => setForm({ ...form, third_reminder_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-xs text-gray-500">jours</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
