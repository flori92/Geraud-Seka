import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { CreateAccountModal } from "@/components/forms/CreateAccountModal";
import { getLedgerAccounts, LedgerAccount } from "@/lib/api";
import { Plus, Search, Filter } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [searchQuery, filterType, accounts]);

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
      setFilteredAccounts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement du plan comptable");
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((acc) => acc.account_type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.account_code.toLowerCase().includes(query) ||
          acc.account_name.toLowerCase().includes(query)
      );
    }

    setFilteredAccounts(filtered);
  };

  const accountsByType = {
    asset: filteredAccounts.filter((a) => a.account_type === "asset"),
    liability: filteredAccounts.filter((a) => a.account_type === "liability"),
    equity: filteredAccounts.filter((a) => a.account_type === "equity"),
    revenue: filteredAccounts.filter((a) => a.account_type === "revenue"),
    expense: filteredAccounts.filter((a) => a.account_type === "expense"),
  };

  const stats = [
    { label: "Total comptes", value: accounts.length.toString(), color: "bg-primary-600" },
    { label: "Actifs", value: accountsByType.asset.length.toString(), color: "bg-green-600" },
    { label: "Passifs", value: accountsByType.liability.length.toString(), color: "bg-red-600" },
    { label: "Produits", value: accountsByType.revenue.length.toString(), color: "bg-purple-600" },
  ];

  const typeLabels: Record<string, string> = {
    asset: "Actif",
    liability: "Passif",
    equity: "Capitaux propres",
    revenue: "Produits",
    expense: "Charges",
  };

  const typeBadgeColors: Record<string, string> = {
    asset: "bg-green-100 text-green-800",
    liability: "bg-red-100 text-red-800",
    equity: "bg-blue-100 text-blue-800",
    revenue: "bg-purple-100 text-purple-800",
    expense: "bg-orange-100 text-orange-800",
  };

  return (
    <DashboardLayout title="Plan comptable">
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

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accents-5" />
              <Input
                placeholder="Rechercher par code ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les types</option>
              <option value="asset">Actifs</option>
              <option value="liability">Passifs</option>
              <option value="equity">Capitaux propres</option>
              <option value="revenue">Produits</option>
              <option value="expense">Charges</option>
            </select>
          </div>
          <Button 
            variant="primary" 
            size="md"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau compte
          </Button>
        </div>
      </Card>

      {/* Chart of Accounts */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-accents-5">Aucun compte trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-accents-2 bg-accents-1">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Nom du compte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-accents-5">Solde</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Devise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-foreground">
                        {account.account_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{account.account_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          typeBadgeColors[account.account_type]
                        }`}
                      >
                        {typeLabels[account.account_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      <span
                        className={
                          account.balance >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatAmount(Math.abs(account.balance))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">{account.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary by Type */}
      {!loading && filteredAccounts.length > 0 && filterType === "all" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(accountsByType).map(([type, accts]) => {
            const totalBalance = accts.reduce((sum, acc) => sum + acc.balance, 0);
            return (
              <Card key={type}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-accents-6">{typeLabels[type]}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatAmount(Math.abs(totalBalance))}
                    </p>
                    <p className="text-xs text-accents-5 mt-1">{accts.length} comptes</p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg ${typeBadgeColors[type]} flex items-center justify-center`}>
                    <span className="text-lg font-bold">{accts.length}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de création */}
      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchAccounts();
        }}
      />
    </DashboardLayout>
  );
}
