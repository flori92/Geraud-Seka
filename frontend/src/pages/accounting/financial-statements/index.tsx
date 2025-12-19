/**
 * États financiers SYSCOHADA - SEKA
 * Bilan, Compte de résultat, Annexes
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FileText,
  Download,
  Loader2,
  ChevronRight,
  BarChart3,
  PieChart,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface FinancialStatement {
  id: string;
  type: "bilan" | "resultat" | "flux" | "annexe" | "tafire";
  name: string;
  description: string;
  fiscal_year_id: string;
  fiscal_year_name: string;
  status: "draft" | "generated" | "validated";
  generated_at: string | null;
  file_url: string | null;
}

interface FiscalYear {
  id: string;
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const statementTypes = [
  {
    type: "bilan",
    name: "Bilan",
    description: "État de la situation patrimoniale (Actif / Passif)",
    icon: PieChart,
    color: "blue",
  },
  {
    type: "resultat",
    name: "Compte de résultat",
    description: "Synthèse des charges et produits de l'exercice",
    icon: TrendingUp,
    color: "green",
  },
  {
    type: "flux",
    name: "Tableau des flux de trésorerie",
    description: "Mouvements de trésorerie de l'exercice",
    icon: BarChart3,
    color: "purple",
  },
  {
    type: "tafire",
    name: "TAFIRE",
    description: "Tableau financier des ressources et emplois",
    icon: FileText,
    color: "orange",
  },
  {
    type: "annexe",
    name: "Annexes SYSCOHADA",
    description: "Notes explicatives aux états financiers",
    icon: FileText,
    color: "gray",
  },
];

export default function FinancialStatementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      // Récupérer les exercices
      const yearsRes = await fetch(`${API_BASE_URL}/api/v1/accounting/fiscal-years`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        setFiscalYears(yearsData.fiscal_years || []);
        if (yearsData.fiscal_years?.length > 0 && !selectedYear) {
          const current = yearsData.fiscal_years.find((y: FiscalYear & { is_current?: boolean }) => y.is_current) || yearsData.fiscal_years[0];
          setSelectedYear(current.id);
        }
      }

      // Récupérer les états financiers
      if (selectedYear) {
        const statementsRes = await fetch(
          `${API_BASE_URL}/api/v1/accounting/financial-statements?fiscal_year_id=${selectedYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (statementsRes.ok) {
          const statementsData = await statementsRes.json();
          setStatements(statementsData.statements || []);
        }
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const generateStatement = async (type: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !selectedYear) return;

    setGenerating(type);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/financial-statements/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          fiscal_year_id: selectedYear,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Erreur génération:", err);
    } finally {
      setGenerating(null);
    }
  };

  const downloadStatement = async (statement: FinancialStatement) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !statement.file_url) return;

    try {
      const res = await fetch(`${API_BASE_URL}${statement.file_url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${statement.name}_${statement.fiscal_year_name}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error("Erreur téléchargement:", err);
    }
  };

  const getStatementForType = (type: string) => {
    return statements.find((s) => s.type === type);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated":
        return <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Généré</span>;
      case "validated":
        return <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Validé</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Brouillon</span>;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
      green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100" },
      purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100" },
      orange: { bg: "bg-orange-50", text: "text-orange-600", iconBg: "bg-orange-100" },
      gray: { bg: "bg-gray-50", text: "text-gray-600", iconBg: "bg-gray-100" },
    };
    return colors[color] || colors.gray;
  };

  if (loading && fiscalYears.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>États financiers - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">États financiers SYSCOHADA</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Générez vos états financiers conformes aux normes SYSCOHADA révisé
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {fiscalYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchData}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Grille des états */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statementTypes.map((st) => {
              const statement = getStatementForType(st.type);
              const colors = getColorClasses(st.color);
              const Icon = st.icon;

              return (
                <div
                  key={st.type}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">{st.name}</h3>
                        {statement && getStatusBadge(statement.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{st.description}</p>

                      {statement?.generated_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Généré le {new Date(statement.generated_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        {statement?.status === "generated" || statement?.status === "validated" ? (
                          <>
                            <button
                              onClick={() => downloadStatement(statement)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger
                            </button>
                            <button
                              onClick={() => generateStatement(st.type)}
                              disabled={generating === st.type}
                              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                            >
                              <RefreshCw className={`h-4 w-4 ${generating === st.type ? "animate-spin" : ""}`} />
                              Régénérer
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => generateStatement(st.type)}
                            disabled={generating === st.type || !selectedYear}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                          >
                            {generating === st.type ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            Générer
                          </button>
                        )}
                        <Link href={`/accounting/financial-statements/${st.type}`}>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info SYSCOHADA */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium">Conformité SYSCOHADA révisé</p>
            <p className="text-xs text-blue-700 mt-1">
              Les états financiers générés sont conformes au Système Comptable OHADA révisé (2017) 
              applicable dans les 17 pays membres de l&apos;OHADA.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
