import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { CreditCard, Building2, Wallet, TrendingUp, CheckCircle, Lock } from "lucide-react";

export default function CompteProPage() {
  return (
    <DashboardLayout title="Compte Pro">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Compte Pro SEKA</h1>
          <p className="text-sm text-gray-500 mt-1">Compte bancaire professionnel intégré à votre comptabilité</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-full">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Solde disponible</p>
              <h2 className="text-3xl font-bold">2 847 500 FCFA</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-80 mb-1">IBAN</p>
              <p className="font-mono text-sm">FR76 XXXX XXXX XXXX XXXX</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">BIC</p>
              <p className="font-mono text-sm">SEKAFRPP</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Titulaire</p>
              <p className="text-sm">Votre Entreprise</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <CheckCircle className="h-8 w-8 text-emerald-600 mb-3" />
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
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                En savoir plus
              </button>
              <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Activer maintenant
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
