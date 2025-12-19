/**
 * Gestion des exercices comptables - SEKA
 * Multi-exercices avec clôture et report à nouveau
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface FiscalYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closing" | "closed";
  is_current: boolean;
  entries_count: number;
  balance: number;
  created_at: string;
}

interface ClosingStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "error";
  order: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function FiscalYearPage() {
  const router = useRouter();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [closingSteps, setClosingSteps] = useState<ClosingStep[]>([]);
  const [closingInProgress, setClosingInProgress] = useState(false);

  // Form state
  const [newYear, setNewYear] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  const fetchFiscalYears = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/fiscal-years`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFiscalYears(data.fiscal_years || []);
      } else {
        setError("Erreur lors du chargement des exercices");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les exercices comptables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateYear = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !newYear.name || !newYear.start_date || !newYear.end_date) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/fiscal-years`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newYear),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewYear({ name: "", start_date: "", end_date: "" });
        fetchFiscalYears();
      }
    } catch (err) {
      console.error("Erreur création:", err);
    }
  };

  const startClosingProcess = async (year: FiscalYear) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setSelectedYear(year);
    setShowCloseModal(true);
    setClosingInProgress(true);

    // Récupérer les étapes de clôture
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/fiscal-years/${year.id}/closing-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setClosingSteps(data.steps || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setClosingInProgress(false);
    }
  };

  const executeClosingStep = async (stepId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !selectedYear) return;

    setClosingSteps(steps =>
      steps.map(s => (s.id === stepId ? { ...s, status: "in_progress" } : s))
    );

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/accounting/fiscal-years/${selectedYear.id}/closing-steps/${stepId}/execute`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setClosingSteps(steps =>
          steps.map(s => (s.id === stepId ? { ...s, status: "completed" } : s))
        );
      } else {
        setClosingSteps(steps =>
          steps.map(s => (s.id === stepId ? { ...s, status: "error" } : s))
        );
      }
    } catch {
        setClosingSteps(steps =>
          steps.map(s => (s.id === stepId ? { ...s, status: "error" } : s))
        );
      }
  };

  const finalizeClosing = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !selectedYear) return;

    try {
      await fetch(`${API_BASE_URL}/api/v1/accounting/fiscal-years/${selectedYear.id}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowCloseModal(false);
      fetchFiscalYears();
    } catch (err) {
      console.error("Erreur clôture:", err);
    }
  };

  const getStatusBadge = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" /> Exercice en cours
        </span>
      );
    }
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <Unlock className="w-3 h-3" /> Ouvert
          </span>
        );
      case "closing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" /> Clôture en cours
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            <Lock className="w-3 h-3" /> Clôturé
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
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
        <title>Exercices comptables - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Exercices comptables</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos exercices comptables et les procédures de clôture
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Nouvel exercice
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Liste des exercices */}
          <div className="space-y-4">
            {fiscalYears.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucun exercice comptable</p>
                <p className="text-sm text-gray-400 mt-1">Créez votre premier exercice pour commencer</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  Créer un exercice
                </button>
              </div>
            ) : (
              fiscalYears.map((year) => (
                <div
                  key={year.id}
                  className={`bg-white rounded-xl border ${
                    year.is_current ? "border-primary-200 ring-1 ring-primary-100" : "border-gray-200"
                  } p-5`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${year.is_current ? "bg-primary-50" : "bg-gray-100"}`}>
                        <Calendar className={`h-6 w-6 ${year.is_current ? "text-primary-600" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold text-gray-900">{year.name}</h3>
                          {getStatusBadge(year.status, year.is_current)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Du {new Date(year.start_date).toLocaleDateString("fr-FR")} au{" "}
                          {new Date(year.end_date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Écritures</p>
                        <p className="text-lg font-semibold text-gray-900">{year.entries_count}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Résultat</p>
                        <p className={`text-lg font-semibold ${year.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(year.balance)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {year.status === "open" && !year.is_current && (
                          <button
                            onClick={() => startClosingProcess(year)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100"
                          >
                            <Lock className="h-4 w-4" />
                            Clôturer
                          </button>
                        )}
                        <Link href={`/accounting/fiscal-year/${year.id}`}>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Procédure de clôture</p>
                <p className="text-xs text-blue-700 mt-1">
                  La clôture d&apos;un exercice génère automatiquement les écritures de report à nouveau
                  et verrouille les modifications sur l&apos;exercice clôturé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvel exercice comptable</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;exercice</label>
                <input
                  type="text"
                  value={newYear.name}
                  onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                  placeholder="Ex: Exercice 2025"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={newYear.start_date}
                    onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={newYear.end_date}
                    onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateYear}
                disabled={!newYear.name || !newYear.start_date || !newYear.end_date}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clôture */}
      {showCloseModal && selectedYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Clôture de l&apos;exercice</h2>
            <p className="text-sm text-gray-500 mb-6">{selectedYear.name}</p>

            {closingInProgress ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {closingSteps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {step.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : step.status === "in_progress" ? (
                          <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                        ) : step.status === "error" ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{step.name}</p>
                          <p className="text-xs text-gray-500">{step.description}</p>
                        </div>
                      </div>
                      {step.status === "pending" && (
                        <button
                          onClick={() => executeClosingStep(step.id)}
                          className="px-3 py-1 text-xs text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                        >
                          Exécuter
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={finalizeClosing}
                    disabled={closingSteps.some((s) => s.status !== "completed")}
                    className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4 inline mr-2" />
                    Finaliser la clôture
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
