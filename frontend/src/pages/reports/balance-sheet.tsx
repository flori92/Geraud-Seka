import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Download,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  Settings,
  ChevronDown,
  FileText,
} from "lucide-react";

// Types
interface BalanceSheetLine {
  code: string;
  label: string;
  amount_n: number;
  amount_n1: number;
  variance_amount: number;
  variance_percent: number;
  level: number; // 1 = total, 2 = category, 3 = detail
  is_total?: boolean;
}

interface BalanceSheetData {
  period_n: string;
  period_n1: string;
  actif: BalanceSheetLine[];
  passif: BalanceSheetLine[];
  total_actif_n: number;
  total_passif_n: number;
  total_actif_n1: number;
  total_passif_n1: number;
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['actif', 'passif']));

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

  const fetchBalanceSheetData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiPrefix}/reports/balance-sheet?year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setBalanceSheet(data);
      }
    } catch (error) {
      console.error("Error fetching balance sheet:", error);
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, router, selectedYear]);

  useEffect(() => {
    fetchBalanceSheetData();
  }, [fetchBalanceSheetData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay: 'always'
    }).format(percent / 100);
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) < 5) return 'text-gray-600';
    return variance > 0 ? 'text-green-600' : 'text-red-600';
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const exportToPDF = () => {
    console.log('Exporting balance sheet to PDF...');
  };

  const exportToExcel = () => {
    console.log('Exporting balance sheet to Excel...');
  };

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const renderBalanceSheetSection = (lines: BalanceSheetLine[] | undefined, title: string, sectionKey: string) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg mb-2"
        >
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
        </button>

        {isExpanded && (
          <div className="space-y-0">
            {(lines ?? []).map((line, index) => (
              <div
                key={`${line.code}-${index}`}
                className={`flex items-center justify-between px-6 py-3 hover:bg-gray-50 ${
                  line.is_total ? 'bg-gray-50 font-bold border-t-2 border-gray-300' : ''
                }`}
                style={{ paddingLeft: `${line.level * 1.5 + 1.5}rem` }}
              >
                <div className="flex-1">
                  <span className={`text-sm ${line.is_total ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                    {line.code && <span className="text-gray-500 mr-2">{line.code}</span>}
                    {line.label}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-32 text-right">
                    <span className={`text-sm ${line.is_total ? 'font-bold' : ''}`}>
                      {formatCurrency(line.amount_n)}
                    </span>
                  </div>
                  <div className="w-32 text-right">
                    <span className={`text-sm text-gray-600 ${line.is_total ? 'font-bold' : ''}`}>
                      {formatCurrency(line.amount_n1)}
                    </span>
                  </div>
                  <div className="w-32 text-right">
                    <span className={`text-sm ${getVarianceColor(line.variance_percent)} ${line.is_total ? 'font-bold' : ''}`}>
                      {formatPercent(line.variance_percent)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Bilan comptable - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Bilan comptable</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Visualisez votre bilan actif et passif
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-[#0d4a44] text-white rounded-lg hover:bg-[#0a3d38] flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </button>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Exercice:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year.value} value={year.value}>{year.label}</option>
                    ))}
                  </select>
                </div>
                {balanceSheet && (
                  <div className="text-sm text-gray-600">
                    Comparaison: <span className="font-medium">{balanceSheet.period_n}</span> vs{' '}
                    <span className="font-medium">{balanceSheet.period_n1}</span>
                  </div>
                )}
              </div>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Paramètres d&apos;affichage
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0d4a44] border-r-transparent"></div>
              <p className="text-sm text-gray-600 mt-3">Chargement du bilan...</p>
            </div>
          ) : !balanceSheet ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucune donnée de bilan disponible</p>
            </div>
          ) : (
            <div className="px-6 py-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600">Total ACTIF</h3>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(balanceSheet.total_actif_n)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">N-1</p>
                      <p className="text-sm font-semibold text-gray-600">{formatCurrency(balanceSheet.total_actif_n1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {balanceSheet.total_actif_n > balanceSheet.total_actif_n1 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={getVarianceColor(
                      ((balanceSheet.total_actif_n - balanceSheet.total_actif_n1) / balanceSheet.total_actif_n1) * 100
                    )}>
                      {formatPercent(((balanceSheet.total_actif_n - balanceSheet.total_actif_n1) / balanceSheet.total_actif_n1) * 100)}
                    </span>
                    <span className="text-gray-500">vs année précédente</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600">Total PASSIF</h3>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(balanceSheet.total_passif_n)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">N-1</p>
                      <p className="text-sm font-semibold text-gray-600">{formatCurrency(balanceSheet.total_passif_n1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {balanceSheet.total_passif_n > balanceSheet.total_passif_n1 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={getVarianceColor(
                      ((balanceSheet.total_passif_n - balanceSheet.total_passif_n1) / balanceSheet.total_passif_n1) * 100
                    )}>
                      {formatPercent(((balanceSheet.total_passif_n - balanceSheet.total_passif_n1) / balanceSheet.total_passif_n1) * 100)}
                    </span>
                    <span className="text-gray-500">vs année précédente</span>
                  </div>
                </div>
              </div>

              {/* Balance Sheet Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-gray-600 uppercase">Libellé</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="w-32 text-right">
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {balanceSheet.period_n}
                        </span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {balanceSheet.period_n1}
                        </span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Variation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIF Section */}
                <div className="py-4">
                  {renderBalanceSheetSection(balanceSheet.actif, 'ACTIF', 'actif')}
                </div>

                {/* PASSIF Section */}
                <div className="py-4 border-t-4 border-gray-300">
                  {renderBalanceSheetSection(balanceSheet.passif, 'PASSIF', 'passif')}
                </div>

                {/* Totals Footer */}
                <div className="px-6 py-4 border-t-4 border-gray-900 bg-gray-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-sm font-bold">TOTAL GÉNÉRAL</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="w-32 text-right">
                        <span className="text-sm font-bold">{formatCurrency(balanceSheet.total_actif_n)}</span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-sm font-bold">{formatCurrency(balanceSheet.total_actif_n1)}</span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-sm font-bold">
                          {formatPercent(((balanceSheet.total_actif_n - balanceSheet.total_actif_n1) / balanceSheet.total_actif_n1) * 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Équilibre du bilan</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Le total de l&apos;actif est {balanceSheet.total_actif_n === balanceSheet.total_passif_n ? 'égal' : 'différent'} au total du passif.
                      {balanceSheet.total_actif_n === balanceSheet.total_passif_n ? ' Votre bilan est équilibré.' : ' Veuillez vérifier vos écritures.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
