import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { CreditCard, Building2, Wallet, CheckCircle, Lock, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface BankAccount {
  balance: number;
  iban: string;
  bic: string;
  account_holder: string;
  currency: string;
}

export default function CompteProPage() {
  const router = useRouter();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http:
        const response = await fetch(`${API_BASE_URL}/api/v1/treasury/accounts/main`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setAccount(data);
        } else {
          setAccount({
            balance: 0,
            iban: "FR76 **** **** **** ****",
            bic: "SEKAFRPP",
            account_holder: "Votre Entreprise",
            currency: "XOF"
          });
        }
      } catch (err) {
        console.error("Error fetching account:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  if (loading) {
    return (
      <>
        <Head><title>Compte Pro - SEKA</title></Head>
        <div className="min-h-screen bg-gray-50">
          <PennylaneSidebar />
          <main className="ml-[220px] flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Compte Pro - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><Building2 className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Compte Pro SEKA</h1>
                <p className="text-sm text-gray-600 mt-0.5">Compte bancaire professionnel intégré à votre comptabilité</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] rounded-xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-full"><Building2 className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm opacity-80">Solde disponible</p>
                  <h2 className="text-3xl font-bold">{account ? formatCurrency(account.balance, account.currency) : "0 FCFA"}</h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div><p className="text-sm opacity-80 mb-1">IBAN</p><p className="font-mono text-sm">{account?.iban || "Non configuré"}</p></div>
                <div><p className="text-sm opacity-80 mb-1">BIC</p><p className="font-mono text-sm">{account?.bic || "Non configuré"}</p></div>
                <div><p className="text-sm opacity-80 mb-1">Titulaire</p><p className="text-sm">{account?.account_holder || "Non configuré"}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <CheckCircle className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">IBAN français</h3>
                <p className="text-sm text-gray-600">Recevez et effectuez des virements SEPA instantanés</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <CreditCard className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Cartes de paiement</h3>
                <p className="text-sm text-gray-600">Cartes virtuelles et physiques pour vos équipes</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Lock className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">100% sécurisé</h3>
                <p className="text-sm text-gray-600">Fonds protégés, authentification forte</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-8">
                <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activez votre Compte Pro</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Simplifiez votre gestion avec un compte bancaire synchronisé automatiquement avec votre comptabilité.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => router.push("/treasury/accounts")} className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                    En savoir plus
                  </button>
                  <button onClick={() => router.push("/treasury/accounts")} className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]">
                    Activer maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
