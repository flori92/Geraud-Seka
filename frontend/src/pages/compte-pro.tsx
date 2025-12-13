import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { CreditCard, Building2, Wallet, TrendingUp, CheckCircle, Lock, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useRouter } from "next/router";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/v1/treasury/accounts/main`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setAccount(data);
        } else {
          // Données par défaut si pas de compte configuré
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
        setError("Erreur lors du chargement du compte");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Compte Pro">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Compte Pro">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Compte Pro SEKA</h1>
          <p className="text-sm text-gray-500 mt-1">Compte bancaire professionnel intégré à votre comptabilité</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-teal-600 rounded-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-full">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Solde disponible</p>
              <h2 className="text-3xl font-bold">
                {account ? formatCurrency(account.balance, account.currency) : "0 FCFA"}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-80 mb-1">IBAN</p>
              <p className="font-mono text-sm">{account?.iban || "Non configuré"}</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">BIC</p>
              <p className="font-mono text-sm">{account?.bic || "Non configuré"}</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Titulaire</p>
              <p className="text-sm">{account?.account_holder || "Non configuré"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <CheckCircle className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">IBAN français</h3>
            <p className="text-sm text-gray-600">Recevez et effectuez des virements SEPA instantanés</p>
          </Card>

          <Card className="p-6">
            <CreditCard className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">Cartes de paiement</h3>
            <p className="text-sm text-gray-600">Cartes virtuelles et physiques pour vos équipes</p>
          </Card>

          <Card className="p-6">
            <Lock className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-2">100% sécurisé</h3>
            <p className="text-sm text-gray-600">Fonds protégés, authentification forte</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="text-center py-8">
            <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Activez votre Compte Pro</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Simplifiez votre gestion avec un compte bancaire synchronisé automatiquement avec votre comptabilité.</p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => router.push("/treasury/accounts")}
              >
                En savoir plus
              </button>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => router.push("/treasury/accounts")}
              >
                Activer maintenant
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
