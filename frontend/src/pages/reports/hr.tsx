import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Download, Users, Briefcase, TrendingUp } from "lucide-react";

export default function HRReportsPage() {
  const headcountData = [
    { department: "IT", count: 25, change: "+3" },
    { department: "Sales", count: 18, change: "+2" },
    { department: "Marketing", count: 12, change: "0" },
    { department: "Operations", count: 22, change: "+1" },
    { department: "Finance", count: 8, change: "0" },
  ];

  const attendanceData = [
    { month: "Juillet", present: 98, absent: 2, leaves: 5 },
    { month: "Août", present: 97, absent: 3, leaves: 6 },
    { month: "Septembre", present: 99, absent: 1, leaves: 4 },
    { month: "Octobre", present: 96, absent: 4, leaves: 8 },
    { month: "Novembre", present: 98, absent: 2, leaves: 5 },
  ];

  const stats = [
    { label: "Employés actifs", value: "85", icon: Users, color: "bg-blue-600" },
    { label: "Nouveaux (ce mois)", value: "6", icon: TrendingUp, color: "bg-green-600" },
    { label: "Taux de présence", value: "98%", icon: Briefcase, color: "bg-purple-600" },
    { label: "Masse salariale", value: "42.5M", icon: Download, color: "bg-orange-600" },
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
          <Select>
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
            {headcountData.map((dept) => (
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
                {attendanceData.map((row) => (
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
            <p className="text-3xl font-bold text-foreground">8.5%</p>
            <p className="text-sm text-success">-2.3% vs année précédente</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-accents-5">Taux de rétention</p>
            <p className="text-3xl font-bold text-foreground">91.5%</p>
            <p className="text-sm text-success">+2.3% vs année précédente</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-accents-5">Ancienneté moyenne</p>
            <p className="text-3xl font-bold text-foreground">3.2 ans</p>
            <p className="text-sm text-accents-6">Stable</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
