import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getBalanceSheet, BalanceSheet } from "@/lib/api";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export default function BalancePage() {
  const [balance, setBalance] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("");

  useEffect(() => {
    fetchBalance();
  }, [period]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        setLoading(false);
        return;
      }
      const data = await getBalanceSheet(token, period);
      if (data) {
        setBalance(data);
      } else {
        // Fournir des données par défaut si l'API ne retourne rien
        setBalance({
          assets: { current_assets: 0, fixed_assets: 0, total_assets: 0 },
          liabilities: { current_liabilities: 0, long_term_liabilities: 0, total_liabilities: 0 },
          equity: { share_capital: 0, retained_earnings: 0, total_equity: 0 },
          period: "Actuelle"
        });
      }
    } catch (err: any) {
      console.error("Error fetching balance:", err);
      setError(err.response?.data?.detail || "Erreur lors du chargement de la balance");
      // Fournir des données par défaut en cas d'erreur
      setBalance({
        assets: { current_assets: 0, fixed_assets: 0, total_assets: 0 },
        liabilities: { current_liabilities: 0, long_term_liabilities: 0, total_liabilities: 0 },
        equity: { share_capital: 0, retained_earnings: 0, total_equity: 0 },
        period: "Actuelle"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Balance comptable">
        <div className="space-y-6">
          <Card><Skeleton className="h-64" /></Card>
          <Card><Skeleton className="h-64" /></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!balance) {
    return (
      <DashboardLayout title="Balance comptable">
        <Alert variant="error">Aucune donnée disponible</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Balance comptable">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bilan comptable</h2>
          <p className="text-sm text-accents-5">Période: {balance.period || "Actuelle"}</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Période actuelle</option>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <h3 className="text-lg font-semibold text-foreground">Actifs</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded bg-accents-1">
                <span className="text-sm text-accents-6">Actifs courants</span>
                <span className="font-medium text-foreground">
                  {balance.assets.current_assets.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-accents-1">
                <span className="text-sm text-accents-6">Actifs immobilisés</span>
                <span className="font-medium text-foreground">
                  {balance.assets.fixed_assets.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-success/10 border border-success/20">
                <span className="text-sm font-semibold text-foreground">Total Actifs</span>
                <span className="text-lg font-bold text-success">
                  {balance.assets.total_assets.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Liabilities & Equity */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-error" />
              <h3 className="text-lg font-semibold text-foreground">Passifs & Capitaux propres</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-accents-5 mb-2">Passifs</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded bg-accents-1">
                    <span className="text-sm text-accents-6">Passifs courants</span>
                    <span className="font-medium text-foreground">
                      {balance.liabilities.current_liabilities.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-accents-1">
                    <span className="text-sm text-accents-6">Passifs long terme</span>
                    <span className="font-medium text-foreground">
                      {balance.liabilities.long_term_liabilities.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-accents-5 mb-2">Capitaux propres</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded bg-accents-1">
                    <span className="text-sm text-accents-6">Capital social</span>
                    <span className="font-medium text-foreground">
                      {balance.equity.share_capital.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-accents-1">
                    <span className="text-sm text-accents-6">Résultats reportés</span>
                    <span className="font-medium text-foreground">
                      {balance.equity.retained_earnings.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-error/10 border border-error/20">
                <span className="text-sm font-semibold text-foreground">Total Passifs + CP</span>
                <span className="text-lg font-bold text-error">
                  {(balance.liabilities.total_liabilities + balance.equity.total_equity).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Balance Check */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Équilibre du bilan</h3>
            <p className="text-sm text-accents-5">Actifs = Passifs + Capitaux propres</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-accents-5">Différence</p>
            <p className={`text-2xl font-bold ${
              balance.assets.total_assets === (balance.liabilities.total_liabilities + balance.equity.total_equity)
                ? "text-success"
                : "text-error"
            }`}>
              {(balance.assets.total_assets - (balance.liabilities.total_liabilities + balance.equity.total_equity)).toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
