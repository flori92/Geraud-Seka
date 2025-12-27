/**
 * Déclarations fiscales - SEKA
 * TVA, IS, DSF et autres déclarations
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Plus,
} from "lucide-react";

interface TaxDeclaration {
  id: string;
  type: "tva" | "is" | "dsf" | "patente" | "autres";
  period: string;
  period_label: string;
  due_date: string;
  status: "draft" | "calculated" | "submitted" | "validated" | "late";
  amount_due: number;
  amount_paid: number;
  submitted_at: string | null;
}

interface TaxSummary {
  tva_collectee: number;
  tva_deductible: number;
  tva_due: number;
  base_imposable_is: number;
  is_estime: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http:

const declarationTypes = [
  { type: "tva", name: "TVA", description: "Taxe sur la Valeur Ajoutée" },
  { type: "is", name: "IS", description: "Impôt sur les Sociétés" },
  { type: "dsf", name: "DSF", description: "Déclaration Statistique et Fiscale" },
  { type: "patente", name: "Patente", description: "Contribution des patentes" },
];

export default function TaxDeclarationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [calculating, setCalculating] = useState<string | null>(null);

  const fetchDeclarations = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/tax/declarations`);
      url.searchParams.set("year", selectedYear);
      if (selectedType !== "all") url.searchParams.set("type", selectedType);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDeclarations(data.declarations || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeclarations();
  }, [selectedYear, selectedType]);

  const calculateDeclaration = async (declarationId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setCalculating(declarationId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tax/declarations/${declarationId}/calculate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchDeclarations();
      }
    } catch (err) {
      console.error("Erreur calcul:", err);
    } finally {
      setCalculating(null);
    }
  };

  const submitDeclaration = async (declarationId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tax/declarations/${declarationId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchDeclarations();
      }
    } catch (err) {
      console.error("Erreur soumission:", err);
    }
  };

  const downloadDeclaration = async (declaration: TaxDeclaration) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tax/declarations/${declaration.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `declaration_${declaration.type}_${declaration.period}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error("Erreur téléchargement:", err);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== "submitted" && status !== "validated";
    
    if (isOverdue || status === "late") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
          <AlertTriangle className="w-3 h-3" /> En retard
        </span>
      );
    }

    switch (status) {
      case "validated":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" /> Validée
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            <Send className="w-3 h-3" /> Soumise
          </span>
        );
      case "calculated":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" /> Calculée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" /> Brouillon
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (loading && declarations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Déclarations fiscales - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Déclarations fiscales</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos déclarations TVA, IS, DSF et autres obligations fiscales
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle déclaration
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Résumé TVA */}
          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">TVA Collectée</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(summary.tva_collectee)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">TVA Déductible</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(summary.tva_deductible)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">TVA à payer</p>
                <p className={`text-xl font-semibold ${summary.tva_due >= 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(Math.abs(summary.tva_due))}
                  {summary.tva_due < 0 && <span className="text-xs ml-1">(crédit)</span>}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">IS estimé</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(summary.is_estime)}</p>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="flex items-center gap-4 mb-6">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-3 py-2 text-sm rounded-lg ${
                  selectedType === "all" ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Toutes
              </button>
              {declarationTypes.map((dt) => (
                <button
                  key={dt.type}
                  onClick={() => setSelectedType(dt.type)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    selectedType === dt.type ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  {dt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des déclarations */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant dû</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payé</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {declarations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Aucune déclaration pour cette période
                    </td>
                  </tr>
                ) : (
                  declarations.map((decl) => (
                    <tr key={decl.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {declarationTypes.find((d) => d.type === decl.type)?.name || decl.type.toUpperCase()}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{decl.period_label}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(decl.due_date).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(decl.status, decl.due_date)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(decl.amount_due)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {decl.amount_paid > 0 ? formatCurrency(decl.amount_paid) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {decl.status === "draft" && (
                            <button
                              onClick={() => calculateDeclaration(decl.id)}
                              disabled={calculating === decl.id}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                              title="Calculer"
                            >
                              {calculating === decl.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {decl.status === "calculated" && (
                            <button
                              onClick={() => submitDeclaration(decl.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Soumettre"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/tax/declarations/${decl.id}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(decl.status === "calculated" || decl.status === "submitted" || decl.status === "validated") && (
                            <button
                              onClick={() => downloadDeclaration(decl)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                              title="Télécharger"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Obligations déclaratives</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Assurez-vous de respecter les échéances de déclaration pour éviter les pénalités de retard.
                  Les déclarations de TVA sont généralement dues le 15 du mois suivant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <CreateDeclarationModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchDeclarations}
          declarationTypes={declarationTypes}
        />
      )}
    </>
  );
}

function CreateDeclarationModal({
  onClose,
  onCreated,
  declarationTypes,
}: {
  onClose: () => void;
  onCreated: () => void;
  declarationTypes: { type: string; name: string; description: string }[];
}) {
  const [form, setForm] = useState({
    type: "tva",
    period_start: "",
    period_end: "",
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tax/declarations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onClose();
        onCreated();
      }
    } catch (err) {
      console.error("Erreur création:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle déclaration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {declarationTypes.map((dt) => (
                <option key={dt.type} value={dt.type}>{dt.name} - {dt.description}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début période</label>
              <input
                type="date"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin période</label>
              <input
                type="date"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !form.period_start || !form.period_end}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
