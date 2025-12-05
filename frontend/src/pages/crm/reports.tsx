import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Target, Calendar, 
  Filter, Download, ArrowUpRight, ArrowDownRight, AlertCircle 
} from "lucide-react";
import { formatAmount } from "@/lib/formatters";

// Types pour les réponses API
interface PerformanceReport {
  period: string;
  start_date: string;
  end_date: string;
  leads: {
    total: number;
    qualified: number;
    converted: number;
    conversion_rate: number;
  };
  opportunities: {
    total: number;
    won: number;
    lost: number;
    in_progress: number;
    win_rate: number;
    by_stage: Record<string, number>;
  };
  revenue: {
    total_pipeline: number;
    won_revenue: number;
    average_deal_size: number;
  };
}

interface PipelineReport {
  total_opportunities: number;
  total_pipeline_value: number;
  total_weighted_value: number;
  pipeline_by_stage: Record<string, {
    count: number;
    total_value: number;
    weighted_value: number;
    average_probability: number;
  }>;
  health_metrics: {
    stale_opportunities: number;
    high_value_deals: number;
    closing_soon: number;
  };
}

interface ForecastReport {
  forecast_period: string;
  historical_win_rate: number;
  average_monthly_revenue: number;
  current_pipeline_value: number;
  forecasts: Array<{
    month: string;
    opportunity_count: number;
    scenarios: {
      optimistic: number;
      realistic: number;
      conservative: number;
    };
    trend: number;
  }>;
  recommendations: (string | null)[];
}

interface FunnelReport {
  period: string;
  funnel: Array<{
    stage: string;
    count: number;
    conversion_rate: number;
    drop_off: number;
  }>;
  overall_conversion_rate: number;
  bottlenecks: Array<{
    stage: string;
    rate: number;
  }>;
}

export default function CRMReportsPage() {
  const [activeTab, setActiveTab] = useState("performance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");
  
  const [performanceData, setPerformanceData] = useState<PerformanceReport | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineReport | null>(null);
  const [forecastData, setForecastData] = useState<ForecastReport | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelReport | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchData();
  }, [activeTab, period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) throw new Error("Non authentifié");

      const headers = { Authorization: `Bearer ${token}` };
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (activeTab === "performance") {
        const res = await fetch(`${API_BASE_URL}/api/v1/crm/reports/performance?period=${period}`, { headers });
        if (!res.ok) throw new Error("Erreur chargement performance");
        setPerformanceData(await res.json());
      } 
      else if (activeTab === "pipeline") {
        const res = await fetch(`${API_BASE_URL}/api/v1/crm/reports/pipeline`, { headers });
        if (!res.ok) throw new Error("Erreur chargement pipeline");
        setPipelineData(await res.json());
      }
      else if (activeTab === "forecast") {
        const res = await fetch(`${API_BASE_URL}/api/v1/crm/reports/forecast?months=6`, { headers });
        if (!res.ok) throw new Error("Erreur chargement prévisions");
        setForecastData(await res.json());
      }
      else if (activeTab === "funnel") {
        const res = await fetch(`${API_BASE_URL}/api/v1/crm/reports/conversion-funnel?period=${period}`, { headers });
        if (!res.ok) throw new Error("Erreur chargement funnel");
        setFunnelData(await res.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPerformanceTab = () => {
    if (!performanceData) return null;
    
    const opportunityData = Object.entries(performanceData.opportunities.by_stage).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value
    }));

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-800">Revenu Gagné</h3>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatAmount(performanceData.revenue.won_revenue)}</p>
            <p className="text-xs text-blue-700 mt-1">Sur la période</p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-800">Taux de conversion</h3>
              <Target className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">{performanceData.leads.conversion_rate}%</p>
            <p className="text-xs text-green-700 mt-1">Lead à Client</p>
          </Card>
          <Card className="p-4 bg-purple-50 border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-800">Win Rate</h3>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">{performanceData.opportunities.win_rate}%</p>
            <p className="text-xs text-purple-700 mt-1">Opportunités gagnées</p>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-orange-800">Deal Moyen</h3>
              <Target className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-900">{formatAmount(performanceData.revenue.average_deal_size)}</p>
            <p className="text-xs text-orange-700 mt-1">Valeur moyenne</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Répartition des Opportunités</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opportunityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {opportunityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Performance Leads vs Opportunités</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Leads', total: performanceData.leads.total, converted: performanceData.leads.qualified },
                    { name: 'Opportunités', total: performanceData.opportunities.total, converted: performanceData.opportunities.won }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Total" />
                  <Bar dataKey="converted" fill="#82ca9d" name="Convertis/Gagnés" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderPipelineTab = () => {
    if (!pipelineData) return null;

    const stageData = Object.entries(pipelineData.pipeline_by_stage).map(([stage, data]) => ({
      stage: stage.replace('_', ' ').toUpperCase(),
      value: data.total_value,
      weighted: data.weighted_value,
      count: data.count
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-accents-5">Valeur Totale Pipeline</p>
            <p className="text-2xl font-bold">{formatAmount(pipelineData.total_pipeline_value)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-accents-5">Valeur Pondérée</p>
            <p className="text-2xl font-bold">{formatAmount(pipelineData.total_weighted_value)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-accents-5">Opportunités Actives</p>
            <p className="text-2xl font-bold">{pipelineData.total_opportunities}</p>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Analyse par Étape</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#ff7300" />
                <Tooltip formatter={(value: any) => formatAmount(value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="value" name="Valeur Totale" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="weighted" name="Valeur Pondérée" fill="#82ca9d" />
                <Line yAxisId="right" type="monotone" dataKey="count" name="Nombre d'opp." stroke="#ff7300" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${pipelineData.health_metrics.stale_opportunities > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className={`h-4 w-4 ${pipelineData.health_metrics.stale_opportunities > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <span className="font-medium">Opportunités stagnantes</span>
            </div>
            <p className="text-2xl font-bold">{pipelineData.health_metrics.stale_opportunities}</p>
          </div>
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Gros deals ({'>'}1M)</span>
            </div>
            <p className="text-2xl font-bold">{pipelineData.health_metrics.high_value_deals}</p>
          </div>
          <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Clôture ce mois</span>
            </div>
            <p className="text-2xl font-bold">{pipelineData.health_metrics.closing_soon}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderForecastTab = () => {
    if (!forecastData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Prévisions sur {forecastData.forecast_period}</h3>
          <div className="flex items-center gap-2 text-sm text-accents-5">
            <span>Win Rate Historique: </span>
            <span className="font-bold text-foreground">{forecastData.historical_win_rate}%</span>
          </div>
        </div>

        <Card className="p-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData.forecasts} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRealistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={(value: any) => formatAmount(value)} />
                <Legend />
                <Area type="monotone" dataKey="scenarios.optimistic" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOptimistic)" name="Optimiste" />
                <Area type="monotone" dataKey="scenarios.realistic" stroke="#8884d8" fillOpacity={1} fill="url(#colorRealistic)" name="Réaliste" />
                <Line type="monotone" dataKey="scenarios.conservative" stroke="#ff7300" name="Conservateur" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="trend" stroke="#999" name="Tendance historique" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {forecastData.recommendations.some(r => r !== null) && (
          <Card className="p-6 bg-accents-1">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommandations IA
            </h4>
            <ul className="space-y-2">
              {forecastData.recommendations.map((rec, i) => (
                rec && (
                  <li key={i} className="flex items-center gap-2 text-sm text-accents-6">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    {rec}
                  </li>
                )
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  };

  const renderFunnelTab = () => {
    if (!funnelData) return null;

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-6">Entonnoir de Conversion</h3>
          <div className="space-y-4 relative">
            {funnelData.funnel.map((step, index) => (
              <div key={index} className="relative">
                <div 
                  className="bg-primary/10 rounded-lg p-4 mx-auto border border-primary/20 transition-all hover:bg-primary/20"
                  style={{ 
                    width: `${100 - (index * 15)}%`,
                    minWidth: '300px' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{step.stage}</p>
                      <p className="text-2xl font-bold text-primary">{step.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-accents-6">Conversion</p>
                      <p className="text-lg font-bold text-success">{step.conversion_rate}%</p>
                    </div>
                  </div>
                </div>
                {index < funnelData.funnel.length - 1 && (
                  <div className="flex justify-center -my-2 z-10 relative">
                    <div className="bg-background border rounded-full p-1">
                      <ArrowDownRight className="h-4 w-4 text-accents-4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 text-error flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Points de blocage
            </h3>
            <div className="space-y-4">
              {funnelData.bottlenecks.map((bottle, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-accents-1 rounded">
                  <span className="font-medium">{bottle.stage}</span>
                  <span className={`px-2 py-1 rounded text-sm font-bold ${
                    bottle.rate < 30 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bottle.rate}% conv.
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-100 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Taux de Conversion Global</h3>
            <p className="text-5xl font-bold text-blue-600 mb-2">{funnelData.overall_conversion_rate}%</p>
            <p className="text-blue-700">Lead {'->'} Vente</p>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Rapports CRM">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapports CRM & Analytics</h1>
          <p className="text-sm text-accents-5">Analysez vos performances et prévoyez vos ventes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </Select>
          <Button variant="secondary" size="md">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      <Tabs defaultValue="performance" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
          <TabsTrigger value="funnel">Entonnoir</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <>
            <TabsContent value="performance">{renderPerformanceTab()}</TabsContent>
            <TabsContent value="pipeline">{renderPipelineTab()}</TabsContent>
            <TabsContent value="forecast">{renderForecastTab()}</TabsContent>
            <TabsContent value="funnel">{renderFunnelTab()}</TabsContent>
          </>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
