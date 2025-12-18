import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Download,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Settings,
  ChevronDown,
  FileText,
  PieChart
} from "lucide-react";

// Types
interface IncomeStatementLine {
  code: string;
  label: string;
  amount_n: number;
  amount_n1: number;
  variance_amount: number;
  variance_percent: number;
  level: number;
  is_total?: boolean;
  is_subtotal?: boolean;
}

interface IncomeStatementData {
  period_n: string;
  period_n1: string;
  produits: IncomeStatementLine[];
  charges: IncomeStatementLine[];
  total_produits_n: number;
  total_charges_n: number;
  total_produits_n1: number;
  total_charges_n1: number;
  resultat_n: number;
  resultat_n1: number;
}

type PeriodType = 'month' | 'quarter' | 'year';

export default function IncomeStatementPage() {
  const router = useRouter();
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [periodType, setPeriodType] = useState<PeriodType>('year');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['produits', 'charges']));

  useEffect(() => {
    fetchIncomeStatementData();
  }, [selectedYear, periodType, selectedPeriod]);

  const fetchIncomeStatementData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', selectedYear);
      params.append('period_type', periodType);
      if (selectedPeriod) params.append('period', selectedPeriod);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/income-statement?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setIncomeStatement(data);
      } else {
        setIncomeStatement(null);
      }
    } catch (error) {
      console.error("Error fetching income statement:", error);
      setIncomeStatement(null);
    } finally {
      setLoading(false);
    }
  };

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
    console.log('Exporting income statement to PDF...');
  };

  const exportToExcel = () => {
    console.log('Exporting income statement to Excel...');
  };

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const getPeriodOptions = () => {
    if (periodType === 'month') {
      return [
        { value: '01', label: 'Janvier' },
        { value: '02', label: 'Février' },
        { value: '03', label: 'Mars' },
        { value: '04', label: 'Avril' },
        { value: '05', label: 'Mai' },
        { value: '06', label: 'Juin' },
        { value: '07', label: 'Juillet' },
        { value: '08', label: 'Août' },
        { value: '09', label: 'Septembre' },
        { value: '10', label: 'Octobre' },
        { value: '11', label: 'Novembre' },
        { value: '12', label: 'Décembre' }
      ];
    } else if (periodType === 'quarter') {
      return [
        { value: 'Q1', label: 'T1 (Janv-Mars)' },
        { value: 'Q2', label: 'T2 (Avr-Juin)' },
        { value: 'Q3', label: 'T3 (Juil-Sept)' },
        { value: 'Q4', label: 'T4 (Oct-Déc)' }
      ];
    }
    return [];
  };

  const renderIncomeStatementSection = (lines: IncomeStatementLine[], title: string, sectionKey: string, isPositive: boolean) => {
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
            {lines.map((line, index) => (
              <div
                key={`${line.code}-${index}`}
                className={`flex items-center justify-between px-6 py-3 hover:bg-gray-50 ${
                  line.is_total
                    ? 'bg-gray-900 text-white font-bold'
                    : line.is_subtotal
                    ? 'bg-gray-100 font-semibold border-t border-gray-300'
                    : ''
                }`}
                style={{ paddingLeft: line.is_total || line.is_subtotal ? '1.5rem' : `${line.level * 1.5 + 1.5}rem` }}
              >
                <div className="flex-1">
                  <span className={`text-sm ${line.is_total ? 'font-bold' : line.is_subtotal ? 'font-semibold' : 'text-gray-700'}`}>
                    {line.code && <span className={`${line.is_total ? 'text-gray-300' : 'text-gray-500'} mr-2`}>{line.code}</span>}
                    {line.label}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-32 text-right">
                    <span className={`text-sm ${line.is_total || line.is_subtotal ? 'font-bold' : ''} ${!line.is_total && !isPositive ? 'text-red-600' : ''}`}>
                      {formatCurrency(line.amount_n)}
                    </span>
                  </div>
                  <div className="w-32 text-right">
                    <span className={`text-sm ${line.is_total ? '' : 'text-gray-600'} ${line.is_total || line.is_subtotal ? 'font-bold' : ''}`}>
                      {formatCurrency(line.amount_n1)}
                    </span>
                  </div>
                  <div className="w-32 text-right">
                    <span className={`text-sm ${line.is_total ? '' : getVarianceColor(line.variance_percent)} ${line.is_total || line.is_subtotal ? 'font-bold' : ''}`}>
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
        <title>Compte de résultat - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Compte de résultat</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Analysez vos produits et charges
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
                  <span className="text-sm font-medium text-gray-700">Année:</span>
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

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Période:</span>
                  <select
                    value={periodType}
                    onChange={(e) => {
                      setPeriodType(e.target.value as PeriodType);
                      setSelectedPeriod('');
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent"
                  >
                    <option value="month">Mensuelle</option>
                    <option value="quarter">Trimestrielle</option>
                    <option value="year">Annuelle</option>
                  </select>
                </div>

                {periodType !== 'year' && (
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent"
                  >
                    <option value="">Toute l'année</option>
                    {getPeriodOptions().map(period => (
                      <option key={period.value} value={period.value}>{period.label}</option>
                    ))}
                  </select>
                )}

                {incomeStatement && (
                  <div className="text-sm text-gray-600 ml-4">
                    Comparaison: <span className="font-medium">{incomeStatement.period_n}</span> vs{' '}
                    <span className="font-medium">{incomeStatement.period_n1}</span>
                  </div>
                )}
              </div>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0d4a44] border-r-transparent"></div>
              <p className="text-sm text-gray-600 mt-3">Chargement du compte de résultat...</p>
            </div>
          ) : !incomeStatement ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucune donnée de compte de résultat disponible</p>
            </div>
          ) : (
            <div className="px-6 py-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600">Total PRODUITS</h3>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(incomeStatement.total_produits_n)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">N-1</p>
                      <p className="text-sm font-semibold text-gray-600">{formatCurrency(incomeStatement.total_produits_n1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {incomeStatement.total_produits_n > incomeStatement.total_produits_n1 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={getVarianceColor(
                      incomeStatement.total_produits_n1 > 0
                        ? ((incomeStatement.total_produits_n - incomeStatement.total_produits_n1) / incomeStatement.total_produits_n1) * 100
                        : 0
                    )}>
                      {incomeStatement.total_produits_n1 > 0
                        ? formatPercent(((incomeStatement.total_produits_n - incomeStatement.total_produits_n1) / incomeStatement.total_produits_n1) * 100)
                        : 'N/A'}
                    </span>
                    <span className="text-gray-500">vs N-1</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600">Total CHARGES</h3>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(incomeStatement.total_charges_n)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">N-1</p>
                      <p className="text-sm font-semibold text-gray-600">{formatCurrency(incomeStatement.total_charges_n1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {incomeStatement.total_charges_n > incomeStatement.total_charges_n1 ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    <span className={getVarianceColor(
                      incomeStatement.total_charges_n1 > 0
                        ? ((incomeStatement.total_charges_n - incomeStatement.total_charges_n1) / incomeStatement.total_charges_n1) * 100
                        : 0
                    )}>
                      {incomeStatement.total_charges_n1 > 0
                        ? formatPercent(((incomeStatement.total_charges_n - incomeStatement.total_charges_n1) / incomeStatement.total_charges_n1) * 100)
                        : 'N/A'}
                    </span>
                    <span className="text-gray-500">vs N-1</span>
                  </div>
                </div>

                <div className={`rounded-lg border-2 p-6 ${incomeStatement.resultat_n >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${incomeStatement.resultat_n >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">RÉSULTAT NET</h3>
                        <p className={`text-2xl font-bold ${incomeStatement.resultat_n >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(incomeStatement.resultat_n)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">N-1</p>
                      <p className={`text-sm font-semibold ${incomeStatement.resultat_n1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(incomeStatement.resultat_n1)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {incomeStatement.resultat_n >= 0 ? (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        BÉNÉFICE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                        PERTE
                      </span>
                    )}
                    {incomeStatement.total_produits_n > 0 && (
                      <span className="text-xs text-gray-600">
                        Marge: {formatPercent((incomeStatement.resultat_n / incomeStatement.total_produits_n) * 100)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Income Statement Table */}
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
                          {incomeStatement.period_n}
                        </span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {incomeStatement.period_n1}
                        </span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Variation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRODUITS Section */}
                <div className="py-4">
                  {renderIncomeStatementSection(incomeStatement.produits ?? [], 'PRODUITS', 'produits', true)}
                </div>

                {/* CHARGES Section */}
                <div className="py-4 border-t-4 border-gray-300">
                  {renderIncomeStatementSection(incomeStatement.charges ?? [], 'CHARGES', 'charges', false)}
                </div>

                {/* Result Footer */}
                <div className={`px-6 py-5 border-t-4 ${incomeStatement.resultat_n >= 0 ? 'border-green-600 bg-green-600' : 'border-red-600 bg-red-600'} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-sm font-bold uppercase">RÉSULTAT NET DE L'EXERCICE</span>
                      <p className="text-xs mt-1 opacity-90">
                        {incomeStatement.resultat_n >= 0 ? 'Bénéfice' : 'Perte'} (Produits - Charges)
                      </p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="w-32 text-right">
                        <span className="text-lg font-bold">{formatCurrency(incomeStatement.resultat_n)}</span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-sm font-bold">{formatCurrency(incomeStatement.resultat_n1)}</span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-sm font-bold">
                          {incomeStatement.resultat_n1 !== 0
                            ? formatPercent(((incomeStatement.resultat_n - incomeStatement.resultat_n1) / Math.abs(incomeStatement.resultat_n1)) * 100)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <PieChart className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Analyse de rentabilité</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {incomeStatement.total_produits_n > 0 ? (
                        <>
                          Votre marge nette est de{' '}
                          <span className="font-semibold">
                            {formatPercent((incomeStatement.resultat_n / incomeStatement.total_produits_n) * 100)}
                          </span>
                          . {incomeStatement.resultat_n >= 0
                            ? "Votre entreprise est rentable sur cette période."
                            : "Votre entreprise est en déficit sur cette période. Analysez vos charges pour identifier des opportunités d'optimisation."}
                        </>
                      ) : (
                        "Aucun produit enregistré sur cette période."
                      )}
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
