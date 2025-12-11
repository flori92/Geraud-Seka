import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Upload, FileText, Receipt, Users, CreditCard, 
  ChevronRight, CheckCircle, Shield, Smartphone, Building2
} from "lucide-react";

export default function AchatsPage() {
  const [activeSubmenu, setActiveSubmenu] = useState("demandes-achat");

  const submenuItems = [
    { id: "importer", label: "Importer des factures", icon: Upload, href: "/achats/import" },
    { id: "factures-fournisseurs", label: "Factures fournisseurs", href: "/achats/factures" },
    { id: "notes-frais", label: "Notes de frais des équipes", href: "/achats/notes-frais" },
    { id: "vos-notes", label: "Vos notes de frais", href: "/achats/mes-notes", badge: "Nouv" },
    { id: "demandes-achat", label: "Demandes d'achat", href: "/achats/demandes", active: true },
    { id: "demandes-paiement", label: "Demandes de paiement", href: "/achats/paiements" },
    { id: "divider1", type: "divider" },
    { id: "fournisseurs", label: "Liste des fournisseurs", href: "/suppliers" },
    { id: "circuits", label: "Circuits d'approbation", href: "/achats/circuits" },
  ];

  const features = [
    {
      icon: Shield,
      title: "Fonds à une institution sécurisée à la Banque de France (ACPR).",
      description: ""
    },
    {
      icon: CreditCard,
      title: "Cartes et virements gratuits et illimités",
      description: "Bénéficiez de cartes Mastercard virtuelles ou physiques personnalisables et payez facilement par virements SEPA."
    },
    {
      icon: Receipt,
      title: "Paiement des factures d'achats",
      description: "Réglez jusqu'à 400 factures en un clic, la réconciliation et lettrage sont automatiques."
    },
    {
      icon: Smartphone,
      title: "Collecte simplifiée des justificatifs",
      description: "Finie la chasse aux justificatifs ! Recevez une notification mobile à chaque transaction réalisée avec la carte."
    }
  ];

  return (
    <>
      <Head>
        <title>Achats - SEKA</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        
        <main className="ml-[220px]">
          {/* Submenu Sidebar */}
          <div className="fixed left-[220px] top-0 w-[220px] h-full bg-white border-r border-gray-200 z-30">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Achats</h2>
              <button className="text-gray-400 hover:text-gray-600 absolute right-4 top-4">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-2">
              {submenuItems.map((item) => {
                if (item.type === "divider") {
                  return <div key={item.id} className="my-2 border-t border-gray-200" />;
                }
                return (
                  <Link key={item.id} href={item.href || "#"}>
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      item.active 
                        ? "bg-teal-50 text-teal-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="ml-[220px] p-8">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Plus pratique et transparent que votre banque,<br />
                découvrez le <span className="text-teal-600">Compte Pro</span> inclus dans votre abonnement !
              </h1>
              <p className="text-gray-600 mb-6">
                Optimisez votre gestion financière <span className="text-teal-600 font-medium">sans limites ni frais supplémentaires</span> ! 
                Émettez et recevez des paiements illimités.<br />
                Ouvert en 5 minutes, le Compte Pro vous permet de maîtriser vos dépenses professionnelles <span className="text-teal-600 font-medium">sans frais additionnels</span>.
              </p>
              <button className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
                J'en parle à mon client
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-4 gap-6 mb-12">
              {features.map((feature, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                  {feature.description && (
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Dashboard Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tableau de bord Compte Pro</p>
                  <p className="text-3xl font-bold text-gray-900">140 000,00 €</p>
                  <p className="text-sm text-gray-500">Solde disponible</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Activité sur les 30 derniers jours</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-emerald-600 font-medium">+ 23 145,00 €</span>
                      <span className="text-red-600 font-medium">- 18 000,00 €</span>
                      <span className="text-gray-900 font-medium">= 5 145,00 €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini transactions preview */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Transactions récentes</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">VIRT MAISON RICHOUX</p>
                        <p className="text-xs text-gray-500">12/10/2025</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">-800,00 €</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">VIRT ASTRATECH</p>
                        <p className="text-xs text-gray-500">10/10/2025</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">+5 820,00 €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
