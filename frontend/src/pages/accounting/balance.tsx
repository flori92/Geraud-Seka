import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Download, Loader2 } from "lucide-react";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
}

export default function GeneralBalance() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting/ledger/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalDebit = () => 
    accounts.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);

  const getTotalCredit = () => 
    accounts.reduce((sum, acc) => sum + (acc.balance < 0 ? Math.abs(acc.balance) : 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
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
            <h1 className="text-2xl font-semibold text-gray-900">Balance générale</h1>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {account.account_code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {account.account_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {account.balance > 0 
                          ? account.balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {account.balance < 0 
                          ? Math.abs(account.balance).toLocaleString("fr-FR", { minimumFractionDigits: 2 })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {account.balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
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
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
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
