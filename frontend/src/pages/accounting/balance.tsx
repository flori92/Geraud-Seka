import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Download, Loader2 } from "lucide-react";
import { getTrialBalance, type TrialBalanceItem, type TrialBalanceResponse } from "@/lib/api";

export default function GeneralBalance() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [totals, setTotals] = useState<TrialBalanceResponse["totals"] | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const data = await getTrialBalance(token, dateRange.start, dateRange.end);
      if (data) {
        setAccounts(data.accounts || []);
        setTotals(data.totals || null);
        setError(null);
      } else {
        setAccounts([]);
        setTotals(null);
      }
    } catch (err: any) {
      console.error("Error fetching balance:", err);
      setError("Erreur lors du chargement de la balance générale");
      setAccounts([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const getTotalDebit = () => {
    if (totals) return totals.total_debit;
    return accounts.reduce((sum, acc) => sum + (acc.debit || 0), 0);
  };

  const getTotalCredit = () => {
    if (totals) return totals.total_credit;
    return accounts.reduce((sum, acc) => sum + (acc.credit || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0d4a44]" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Balance générale - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Balance générale</h1>
              {totals && (
                <p className="text-sm text-gray-500 mt-1">
                  {totals.is_balanced
                    ? "La balance est équilibrée"
                    : "Attention : la balance n'est pas équilibrée"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 mr-2">
                <span>Période</span>
                <input
                  type="date"
                  value={dateRange.start || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value || undefined }))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0d4a44]"
                />
                <span className="text-gray-400">au</span>
                <input
                  type="date"
                  value={dateRange.end || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value || undefined }))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0d4a44]"
                />
                <button
                  onClick={fetchBalance}
                  className="ml-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Actualiser
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde débiteur</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde créditeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.account_number} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {account.account_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {account.account_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {account.debit?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {account.credit?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {account.solde_debit?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {account.solde_credit?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {getTotalDebit().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {getTotalCredit().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900" colSpan={2}>
                      {(getTotalDebit() - getTotalCredit()).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
