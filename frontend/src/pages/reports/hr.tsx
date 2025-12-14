import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getHRReport, HRReport } from "@/lib/api";
import { Download, Users, Briefcase, TrendingUp } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function HRReportsPage() {
  const [report, setReport] = useState<HRReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getHRReport(token, period);
      setReport(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement du rapport");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Rapports RH">
        <Card><Skeleton className="h-96" /></Card>
      </DashboardLayout>
    );
  }

  if (!report || error) {
    return (
      <DashboardLayout title="Rapports RH">
        <Alert variant="error">{error || "Aucune donnée disponible"}</Alert>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "Employés actifs", value: report.total_employees.toString(), icon: Users, color: "bg-primary-600" },
    { label: "Nouveaux (ce mois)", value: report.new_hires.toString(), icon: TrendingUp, color: "bg-primary-600" },
    { label: "Taux de présence", value: `${report.attendance_rate}%`, icon: Briefcase, color: "bg-primary-600" },
    { label: "Masse salariale", value: formatAmount(report.total_payroll), icon: Download, color: "bg-orange-600" },
  ];

  return (
    <DashboardLayout title="Rapports RH">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyse RH</h2>
          <p className="text-sm text-accents-5">Performance et indicateurs des ressources humaines</p>
        </div>
        <div className="flex gap-3">
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-accents-5">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Headcount by Department */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Effectif par département</h3>
          <div className="space-y-3">
            {report.headcount_by_department.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between p-3 rounded bg-accents-1">
                <span className="font-medium text-foreground">{dept.department}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{dept.count}</span>
                  <span className={`text-sm font-medium ${dept.change.startsWith("+") ? "text-success" : "text-accents-6"}`}>
                    {dept.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Évolution de la présence (5 mois)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-accents-2">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-accents-5">Mois</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-accents-5">Présent</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-accents-5">Absent</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-accents-5">Congés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {report.attendance_trend.map((row) => (
                  <tr key={row.month}>
                    <td className="px-3 py-2 text-sm font-medium text-foreground">{row.month}</td>
                    <td className="px-3 py-2 text-sm text-right text-success">{row.present}%</td>
                    <td className="px-3 py-2 text-sm text-right text-error">{row.absent}%</td>
                    <td className="px-3 py-2 text-sm text-right text-accents-6">{row.leaves}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Turnover & Retention */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-accents-5">Taux de rotation</p>
            <p className="text-3xl font-bold text-foreground">{report.turnover_rate}%</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-accents-5">Taux de rétention</p>
            <p className="text-3xl font-bold text-foreground">{report.retention_rate}%</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-accents-5">Ancienneté moyenne</p>
            <p className="text-3xl font-bold text-foreground">{report.average_tenure} ans</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
