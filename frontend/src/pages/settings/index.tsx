/**
 * Page Paramètres SEKA - Style Pennylane
 * Configuration centralisée avec règles pour chaque élément
 */
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  FileText,
  Receipt,
  Zap,
  Settings,
  ChevronRight,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Database,
  Download,
  Upload,
  BookOpen,
  Calculator,
  Banknote,
  Tag,
} from "lucide-react";

type SettingsCategory = "general" | "comptabilite" | "facturation" | "connexions" | "equipe";

interface SettingsItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  hasRules?: boolean;
  badge?: string;
}

const settingsCategories: Record<SettingsCategory, { label: string; items: SettingsItem[] }> = {
  general: {
    label: "Général",
    items: [
      { id: "company", label: "Informations entreprise", description: "Nom, adresse, SIRET, logo", icon: Building2, href: "/settings/company" },
      { id: "notifications", label: "Notifications", description: "Alertes email et push", icon: Bell, href: "/settings/notifications", hasRules: true },
      { id: "appearance", label: "Apparence", description: "Thème et personnalisation", icon: Palette, href: "/settings/appearance" },
      { id: "language", label: "Langue et région", description: "Devise, format de date", icon: Globe, href: "/settings/language" },
      { id: "security", label: "Sécurité", description: "Mot de passe, 2FA", icon: Lock, href: "/settings/security" },
    ],
  },
  comptabilite: {
    label: "Comptabilité",
    items: [
      { id: "chart-of-accounts", label: "Plan comptable", description: "Structure des comptes", icon: BookOpen, href: "/accounting/chart-of-accounts", hasRules: true },
      { id: "journals", label: "Journaux", description: "Achats, ventes, banque, OD", icon: FileText, href: "/accounting/journals", hasRules: true },
      { id: "vat-rates", label: "Taux de TVA", description: "Paramétrage des taux", icon: Calculator, href: "/settings/vat-rates", hasRules: true },
      { id: "analytics", label: "Familles analytiques", description: "Centres de coûts", icon: Tag, href: "/settings/analytics", hasRules: true },
      { id: "accounting-rules", label: "Règles comptables", description: "Automatisation des écritures", icon: Zap, href: "/settings/accounting-rules", hasRules: true, badge: "IA" },
    ],
  },
  facturation: {
    label: "Facturation",
    items: [
      { id: "invoice-settings", label: "Paramètres factures", description: "Numérotation, mentions", icon: Receipt, href: "/settings/invoices", hasRules: true },
      { id: "payment-terms", label: "Conditions de paiement", description: "Délais, escomptes", icon: Banknote, href: "/settings/payment-terms", hasRules: true },
      { id: "products", label: "Produits et services", description: "Catalogue, prix", icon: Tag, href: "/settings/rules?tab=produits", hasRules: true },
      { id: "clients-rules", label: "Règles clients", description: "Comptes par défaut", icon: Users, href: "/settings/rules?tab=clients", hasRules: true },
      { id: "suppliers-rules", label: "Règles fournisseurs", description: "Comptes et TVA par défaut", icon: Building2, href: "/settings/rules?tab=fournisseurs", hasRules: true },
    ],
  },
  connexions: {
    label: "Connexions",
    items: [
      { id: "bank-connections", label: "Comptes bancaires", description: "Synchronisation automatique", icon: CreditCard, href: "/treasury/accounts", hasRules: true },
      { id: "integrations", label: "Applications", description: "Services connectés", icon: Zap, href: "/settings/integrations" },
      { id: "import", label: "Import de données", description: "FEC, CSV, Excel", icon: Upload, href: "/settings/import" },
      { id: "export", label: "Export de données", description: "FEC, rapports", icon: Download, href: "/exports" },
      { id: "api", label: "API & Webhooks", description: "Intégration technique", icon: Database, href: "/settings/api", badge: "Pro" },
    ],
  },
  equipe: {
    label: "Équipe",
    items: [
      { id: "team", label: "Membres", description: "Utilisateurs et rôles", icon: Users, href: "/settings/team" },
      { id: "roles", label: "Rôles et permissions", description: "Droits d'accès", icon: Shield, href: "/settings/roles", hasRules: true },
      { id: "billing", label: "Abonnement", description: "Plan et facturation", icon: CreditCard, href: "/billing" },
    ],
  },
};

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");

  const categories: { id: SettingsCategory; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "Général", icon: Settings },
    { id: "comptabilite", label: "Comptabilité", icon: Calculator },
    { id: "facturation", label: "Facturation", icon: Receipt },
    { id: "connexions", label: "Connexions", icon: Zap },
    { id: "equipe", label: "Équipe", icon: Users },
  ];

  return (
    <>
      <Head>
        <title>Paramètres - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Paramètres</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Configurez votre espace SEKA</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Sidebar catégories */}
            <div className="w-full lg:w-48 shrink-0">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 -mx-1 px-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeCategory === cat.id
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
                  <h2 className="text-sm sm:text-base font-medium text-gray-900">
                    {settingsCategories[activeCategory].label}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {settingsCategories[activeCategory].items.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
                            <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-medium text-gray-900">{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded">
                                  {item.badge}
                                </span>
                              )}
                              {item.hasRules && (
                                <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded">
                                  Règles
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Accès rapide aux règles */}
              <div className="mt-4 sm:mt-6 bg-primary-50 rounded-lg p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-primary-900">Centre de règles</h3>
                    <p className="text-xs text-primary-700 mt-1">
                      Définissez des règles automatiques pour les transactions, fournisseurs, clients et produits.
                    </p>
                    <Link href="/settings/rules">
                      <button className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                        Ouvrir le centre de règles
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
