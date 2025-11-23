import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getLedgerAccounts, LedgerAccount } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getLedgerAccounts(token);
      setAccounts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement du grand livre");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = filterType === "all"
    ? accounts
    : accounts.filter(a => a.account_type === filterType);

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "asset": "Actif",
      "liability": "Passif",
      "equity": "Capitaux propres",
      "revenue": "Produit",
      "expense": "Charge",
    };
    return labels[type] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "asset": "bg-blue-100 text-blue-700",
      "liability": "bg-red-100 text-red-700",
      "equity": "bg-purple-100 text-purple-700",
      "revenue": "bg-green-100 text-green-700",
      "expense": "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getBalanceIcon = (balance: number, type: string) => {
    if (balance > 0) {
      if (type === "asset" || type === "expense") {
        return <TrendingUp className="h-4 w-4 text-success" />;
      }
      return <TrendingDown className="h-4 w-4 text-error" />;
    } else if (balance < 0) {
      if (type === "liability" || type === "revenue") {
        return <TrendingDown className="h-4 w-4 text-error" />;
      }
      return <TrendingUp className="h-4 w-4 text-success" />;
    }
    return <Minus className="h-4 w-4 text-accents-5" />;
  };

  const stats = [
    { label: "Total comptes", value: accounts.length.toString(), color: "bg-blue-600" },
    { label: "Actifs", value: accounts.filter(a => a.account_type === "asset").length.toString(), color: "bg-green-600" },
    { label: "Passifs", value: accounts.filter(a => a.account_type === "liability").length.toString(), color: "bg-red-600" },
    { label: "Produits", value: accounts.filter(a => a.account_type === "revenue").length.toString(), color: "bg-purple-600" },
  ];

  return (
    <DashboardLayout title="Grand livre">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-accents-6">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <Input placeholder="Rechercher un compte..." className="flex-1" />
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Tous les types</option>
              <option value="asset">Actifs</option>
              <option value="liability">Passifs</option>
              <option value="equity">Capitaux propres</option>
              <option value="revenue">Produits</option>
              <option value="expense">Charges</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Accounts Table */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-accents-2">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Nom du compte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Devise</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Solde</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-accents-5">Tendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">
                      {account.account_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{account.account_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getAccountTypeColor(account.account_type)}`}>
                        {getAccountTypeLabel(account.account_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">{account.currency}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right">
                      <span className={account.balance >= 0 ? "text-success" : "text-error"}>
                        {account.balance.toLocaleString()} {account.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getBalanceIcon(account.balance, account.account_type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
