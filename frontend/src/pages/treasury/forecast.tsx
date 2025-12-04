/**
 * Cash Flow Forecast Page
 * Displays ML-powered cash flow predictions with multiple scenarios
 */
import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatChartValue } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api';

interface ForecastData {
  forecast_date: string;
  predicted_balance: number;
  predicted_income: number;
  predicted_expenses: number;
  confidence_lower: number;
  confidence_upper: number;
  scenario: string;
  model_type: string;
}

export default function CashFlowForecast() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [forecasts, setForecasts] = useState<Record<string, ForecastData[]>>({});
  const [selectedScenario, setSelectedScenario] = useState<string>('realistic');
  const [showConfidence, setShowConfidence] = useState(true);
  const [risks, setRisks] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecasts();
    fetchRisks();
  }, []);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('seka_access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/v1/treasury/forecast/scenarios`, { headers });
      setForecasts(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Aucune prévision disponible. Générez-en une nouvelle.');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors du chargement des prévisions');
      }
      console.error('Error fetching forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRisks = async () => {
    try {
      const token = localStorage.getItem('seka_access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/v1/treasury/forecast/risks`, { headers });
      setRisks(response.data);
    } catch (err) {
      console.error('Error fetching risks:', err);
    }
  };

  const generateForecast = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('seka_access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE_URL}/api/v1/treasury/forecast/generate`, {
        forecast_horizon_days: 180,
        scenario: 'realistic',
        model_type: 'auto'
      }, { headers });
      
      // Wait a bit for generation to complete
      setTimeout(async () => {
        await fetchForecasts();
        await fetchRisks();
        setGenerating(false);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la génération des prévisions');
      setGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  };

  const prepareChartData = () => {
    const scenarioData = forecasts[selectedScenario] || [];
    return scenarioData.map(f => ({
      date: formatDate(f.forecast_date),
      balance: f.predicted_balance,
      lower: f.confidence_lower,
      upper: f.confidence_upper,
    }));
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'optimistic': return '#10b981';
      case 'realistic': return '#3b82f6';
      case 'pessimistic': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prévisions de Cash Flow</h1>
            <p className="text-gray-600 mt-2">Prévisions intelligentes basées sur l'IA</p>
          </div>
          <button
            onClick={generateForecast}
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Génération...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Générer Prévisions
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">{error}</p>
          </div>
        )}

        {/* Risks Alert */}
        {risks && risks.has_risks && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Risques Détectés
            </h3>
            <ul className="space-y-2">
              {risks.risks.map((risk: string, index: number) => (
                <li key={index} className="text-red-800">• {risk}</li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">Recommandations:</h4>
              <ul className="space-y-1">
                {risks.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-red-800">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Scenario Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Scénarios</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="rounded"
              />
              Afficher intervalles de confiance
            </label>
          </div>
          <div className="flex gap-4">
            {['optimistic', 'realistic', 'pessimistic'].map(scenario => (
              <button
                key={scenario}
                onClick={() => setSelectedScenario(scenario)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  selectedScenario === scenario
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getScenarioColor(scenario) }}
                  ></div>
                  <span className="font-medium capitalize">
                    {scenario === 'optimistic' ? 'Optimiste' :
                     scenario === 'realistic' ? 'Réaliste' :
                     'Pessimiste'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Évolution Prévue de la Trésorerie</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getScenarioColor(selectedScenario)} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={getScenarioColor(selectedScenario)} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${formatChartValue(value)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                {showConfidence && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill={getScenarioColor(selectedScenario)}
                      fillOpacity={0.1}
                      name="Limite haute"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill={getScenarioColor(selectedScenario)}
                      fillOpacity={0.1}
                      name="Limite basse"
                    />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={getScenarioColor(selectedScenario)}
                  strokeWidth={2}
                  fill="url(#colorBalance)"
                  name="Solde prévu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune prévision disponible</h3>
            <p className="text-gray-600 mb-4">Générez des prévisions pour visualiser l'évolution de votre trésorerie</p>
            <button
              onClick={generateForecast}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Générer Maintenant
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            À propos des prévisions
          </h3>
          <p className="text-blue-800 text-sm">
            Les prévisions sont générées par un modèle d'intelligence artificielle (Prophet) qui analyse votre historique
            de transactions et vos échéanciers de paiement. Les intervalles de confiance indiquent la marge d'incertitude
            des prédictions. Utilisez le scénario réaliste pour la planification standard, et les scénarios optimiste/pessimiste
            pour l'analyse de sensibilité.
          </p>
        </div>
      </div>
    </div>
  );
}
