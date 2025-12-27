"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getCurrentUser, type User } from "@/lib/api";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Calculator,
  Wallet,
  Users,
  Search,
  HelpCircle,
  Sparkles,
  FolderOpen,
  BookOpen,
  Scale,
  Download,
  ArrowLeftRight,
  Eye,
  Package,
  Zap,
  Lock,
  type LucideIcon
} from "lucide-react";

interface SubMenuItem {
  label: string;
  href: string;
  badge?: string;
  badgeVariant?: "new" | "beta" | "count";
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  submenu?: SubMenuItem[];
  badge?: string;
  badgeVariant?: "new" | "beta" | "count" | "included";
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const managementMenu: MenuSection[] = [
  {
    items: [
      { id: "accueil", label: "Accueil", icon: LayoutDashboard, href: "/dashboard" },
      { id: "contacts", label: "Contacts", icon: Users, href: "/contacts" },
      {
        id: "transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
        submenu: [
          { label: "Toutes les transactions", href: "/transactions" },
          { label: "Rapprochement bancaire", href: "/accounting/bank-reconciliation", badge: "IA", badgeVariant: "new" },
          { label: "Import relevés", href: "/accounting/import-statements" },
          { label: "Règles de catégorisation", href: "/settings/transaction-rules", badge: "IA", badgeVariant: "new" },
        ]
      },
      { id: "compte-pro", label: "Compte Pro", icon: CreditCard, href: "/compte-pro", badge: "INCLUS", badgeVariant: "included" },
      {
        id: "tresorerie",
        label: "Trésorerie",
        icon: Wallet,
        submenu: [
          { label: "Vue d'ensemble", href: "/treasury" },
          { label: "Comptes bancaires", href: "/treasury/accounts" },
          { label: "Mobile Money", href: "/treasury/mobile-money", badge: "NOUVEAU", badgeVariant: "new" },
          { label: "Prévisions", href: "/treasury/forecast", badge: "IA", badgeVariant: "new" },
          { label: "Mouvements", href: "/treasury/transactions" },
        ]
      },
      {
        id: "achats",
        label: "Achats",
        icon: ShoppingCart,
        submenu: [
          { label: "Factures fournisseurs", href: "/achats/factures" },
          { label: "Bons de commande", href: "/achats/bons-commande" },
          { label: "Notes de frais", href: "/achats/notes-frais" },
          { label: "Fournisseurs", href: "/suppliers" },
        ]
      },
      {
        id: "ventes",
        label: "Ventes",
        icon: Receipt,
        submenu: [
          { label: "Factures clients", href: "/ventes/factures-clients" },
          { label: "Devis", href: "/ventes/nouveau-devis" },
          { label: "Bons de livraison", href: "/ventes/bons-livraison" },
          { label: "Avoirs", href: "/ventes/avoirs" },
        ]
      },
      {
        id: "stock",
        label: "Stock",
        icon: Package,
        submenu: [
          { label: "Produits", href: "/products" },
          { label: "Inventaire", href: "/stock/inventory" },
          { label: "Mouvements de stock", href: "/stock/movements" },
          { label: "Alertes stock", href: "/coming-soon?feature=Alertes Stock" },
        ]
      },
      {
        id: "analytique",
        label: "Analytique",
        icon: BarChart3,
        submenu: [
          { label: "Tableau de bord", href: "/analytique" },
          { label: "Rapports", href: "/rapports" },
          { label: "Indicateurs clés", href: "/coming-soon?feature=KPIs" },
          { label: "Intelligence IA", href: "/intelligence", badge: "IA", badgeVariant: "new" },
        ]
      },
      { id: "documents", label: "Documents", icon: FolderOpen, href: "/documents" },
    ]
  },
  {
    title: "Outils",
    items: [
      { id: "comptassistant", label: "ComptAssistant", icon: Sparkles, href: "/assistant", badge: "IA", badgeVariant: "new" },
      { id: "recherche", label: "Recherche rapide", icon: Search, href: "/recherche" },
      { id: "exports", label: "Exports", icon: Download, href: "/exports" },
      {
        id: "integrations",
        label: "Intégrations",
        icon: Zap,
        submenu: [
          { label: "Applications connectées", href: "/settings/integrations" },
          { label: "API & Webhooks", href: "/coming-soon?feature=API" },
          { label: "Import de données", href: "/settings/import" },
        ]
      },
      {
        id: "parametres",
        label: "Paramètres",
        icon: Settings,
        submenu: [
          { label: "Informations entreprise", href: "/settings" },
          { label: "Gestion de l'équipe", href: "/settings/team" },
          { label: "Abonnement", href: "/billing" },
          { label: "Plan comptable", href: "/accounting/chart-of-accounts" },
          { label: "Familles analytiques", href: "/settings/analytics" },
          { label: "Centre de règles", href: "/settings/rules" },
          { label: "Comptes bancaires", href: "/treasury/accounts" },
          { label: "Intégrations", href: "/settings/integrations" },
          { label: "Imports", href: "/settings/import" },
          { label: "Exports", href: "/exports" },
        ]
      },
      { id: "aide", label: "Aide et support", icon: HelpCircle, href: "/aide" },
    ]
  }
];

const accountingMenu: MenuSection[] = [
  {
    items: [
      { id: "dashboard-compta", label: "Tableau de bord", icon: Calculator, href: "/accounting/dashboard" },
      {
        id: "saisie",
        label: "Saisie",
        icon: FileText,
        submenu: [
          { label: "Saisie avec OCR", href: "/accounting/entries/from-ocr", badge: "IA", badgeVariant: "new" },
          { label: "Écritures comptables", href: "/accounting/entries" },
          { label: "Nouvelle saisie", href: "/accounting/entries/new" },
          { label: "Saisie rapide", href: "/accounting/entries/quick-entry", badge: "NEW", badgeVariant: "new" },
          { label: "Factures fournisseurs", href: "/achats/factures" },
          { label: "Factures clients", href: "/ventes/factures" },
          { label: "Transactions bancaires", href: "/transactions" },
          { label: "Rapprochement bancaire", href: "/accounting/bank-reconciliation", badge: "IA", badgeVariant: "new" },
          { label: "Comptes bancaires", href: "/treasury/accounts" },
          { label: "Mobile Money", href: "/treasury/mobile-money", badge: "NOUVEAU", badgeVariant: "new" },
          { label: "Import relevés", href: "/accounting/import-statements" },
        ]
      },
      {
        id: "journaux",
        label: "Journaux",
        icon: BookOpen,
        submenu: [
          { label: "Journal des achats", href: "/accounting/journals?type=ACH" },
          { label: "Journal des ventes", href: "/accounting/journals?type=VTE" },
          { label: "Journal de banque", href: "/accounting/journals?type=BQ" },
          { label: "Journal de caisse", href: "/accounting/journals?type=CA" },
          { label: "Journal des OD", href: "/accounting/journals?type=OD" },
          { label: "Tous les journaux", href: "/accounting/journals" },
        ]
      },
      {
        id: "revision",
        label: "Révision",
        icon: Calculator,
        submenu: [
          { label: "Balance générale", href: "/accounting/balance" },
          { label: "Grand livre", href: "/accounting/ledger" },
          { label: "Balance âgée fournisseurs", href: "/suppliers/balance" },
          { label: "Balance âgée clients", href: "/clients/balance" },
          { label: "Lettrage", href: "/accounting/lettering" },
          { label: "Contrôles de cohérence", href: "/accounting/consistency-checks" },
        ]
      },
      {
        id: "fiscalite",
        label: "Fiscalité",
        icon: Building2,
        submenu: [
          { label: "Déclaration TVA", href: "/tax/tva-declaration", badge: "AUTO", badgeVariant: "new" },
          { label: "Liasse fiscale", href: "/tax/liasse-fiscale" },
          { label: "IS / IR", href: "/tax/is-ir" },
          { label: "Taxes diverses", href: "/tax/other-taxes" },
          { label: "Export FEC", href: "/accounting/export-fec" },
        ]
      },
      {
        id: "etats-synthese",
        label: "États de synthèse",
        icon: Scale,
        submenu: [
          { label: "Bilan", href: "/reports/balance-sheet" },
          { label: "Compte de résultat", href: "/reports/income-statement" },
          { label: "SIG", href: "/reports/sig" },
          { label: "Tableau de financement", href: "/reports/cash-flow" },
          { label: "Annexes", href: "/reports/annexes" },
        ]
      },
      {
        id: "cloture",
        label: "Clôture",
        icon: Lock,
        submenu: [
          { label: "Écritures de clôture", href: "/accounting/closing-entries" },
          { label: "Inventaire", href: "/accounting/inventory" },
          { label: "Provisions", href: "/accounting/provisions" },
          { label: "Amortissements", href: "/accounting/depreciations" },
          { label: "Validation période", href: "/accounting/period-validation" },
        ]
      },
    ]
  },
  {
    title: "Outils",
    items: [
      { id: "comptassistant", label: "ComptAssistant", icon: Sparkles, href: "/assistant", badge: "IA", badgeVariant: "new" },
      { id: "recherche", label: "Recherche", icon: Search, href: "/recherche" },
      {
        id: "regles",
        label: "Règles & IA",
        icon: Zap,
        submenu: [
          { label: "Règles comptables", href: "/settings/accounting-rules", badge: "IA", badgeVariant: "new" },
          { label: "Règles de catégorisation", href: "/settings/transaction-rules" },
          { label: "Centre de règles", href: "/settings/rules" },
          { label: "Apprentissage IA", href: "/settings/ai-learning" },
        ]
      },
      { id: "exports", label: "Exports FEC", icon: Download, href: "/exports" },
      { id: "point-vue", label: "Vue client", icon: Eye, href: "/point-vue-client" },
      {
        id: "parametres",
        label: "Paramètres",
        icon: Settings,
        submenu: [
          { label: "Informations entreprise", href: "/settings" },
          { label: "Gestion de l'équipe", href: "/settings/team" },
          { label: "Abonnement", href: "/billing" },
          { label: "Plan comptable", href: "/accounting/chart-of-accounts" },
          { label: "Familles analytiques", href: "/settings/analytics" },
          { label: "Centre de règles", href: "/settings/rules" },
          { label: "Comptes bancaires", href: "/treasury/accounts" },
          { label: "Intégrations", href: "/settings/integrations" },
          { label: "Imports", href: "/settings/import" },
          { label: "Exports", href: "/exports" },
        ]
      },
      { id: "aide", label: "Aide", icon: HelpCircle, href: "/aide" },
    ]
  },
];

const badgeStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium",
  beta: "bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium",
  count:
    "bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center",
  included: "bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium",
};

export function PennylaneSidebar() {
  const [viewMode, setViewMode] = useState<"management" | "accounting">("management");
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = router.pathname || "";

  const currentMenu = viewMode === "management" ? managementMenu : accountingMenu;

  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const savedMode = localStorage.getItem("seka_view_mode") as "management" | "accounting" | null;
      if (savedMode) {
        setViewMode(savedMode);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("seka_access_token");
        if (token) {
          const userData = await getCurrentUser(token);
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const allMenuItems = currentMenu.flatMap(section => section.items);
    setOpenMenus((prev) => {
      let next = prev;
      for (const item of allMenuItems) {
        if (!item.submenu) continue;

        const isChildActive = item.submenu.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );

        if (isChildActive && !next.includes(item.id)) {
          next = [...next, item.id];
        }
      }
      return next;
    });
  }, [pathname, currentMenu]);

  const handleModeChange = (mode: "management" | "accounting") => {
    setViewMode(mode);
    setOpenMenus([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("seka_view_mode", mode);
    }
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleSubmenuClick = (href: string, parentMenuId: string) => {
    if (!openMenus.includes(parentMenuId)) {
      setOpenMenus(prev => [...prev, parentMenuId]);
    }
    router.push(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("seka_access_token");
    localStorage.removeItem("seka_refresh_token");
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="sidebar fixed left-0 top-0 h-full w-[240px] flex flex-col bg-[#0f172a] border-r border-[#1e293b] z-40 overflow-hidden">
      {/* Header avec toggle Comptabilité/Gestion */}
      <div className="p-3 border-b border-[#1e293b]">
        {/* Toggle Switch */}
        <div className="flex bg-[#1e293b] rounded-lg p-1 mb-3">
          <button
            onClick={() => handleModeChange("accounting")}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all ${viewMode === "accounting"
              ? "bg-white text-[#0f172a] shadow-sm"
              : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
          >
            Comptabilité
          </button>
          <button
            onClick={() => handleModeChange("management")}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all ${viewMode === "management"
              ? "bg-white text-[#0f172a] shadow-sm"
              : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
          >
            Gestion
          </button>
        </div>

        {/* Logo SEKA */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-[#0f172a] font-bold text-lg">S</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">SEKA</span>
            <p className="text-white/60 text-[10px] -mt-0.5">Gestion Comptable</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-[#1e293b] scrollbar-track-transparent">
        {currentMenu.map((section, sectionIdx) => (
          <div key={sectionIdx} className={sectionIdx > 0 ? "mt-4 pt-4 border-t border-[#1e293b]" : ""}>
            {section.title && (
              <div className="px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <div key={item.id}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${openMenus.includes(item.id)
                          ? "bg-[#1e293b] text-white"
                          : "text-white/80 hover:bg-[#1e293b]/50 hover:text-white"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${openMenus.includes(item.id) ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {/* Submenu with smooth animation */}
                      <div
                        className={`overflow-hidden transition-all duration-200 ease-in-out ${openMenus.includes(item.id) ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="py-1 ml-3 border-l border-[#1e293b]/50 space-y-0.5">
                          {item.submenu.map((subItem, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSubmenuClick(subItem.href, item.id)}
                              className={`w-full flex items-center justify-between pl-6 pr-3 py-2 text-sm transition-colors text-left rounded-r-lg ${isActive(subItem.href)
                                ? "text-white bg-[#1e293b] font-medium"
                                : "text-white/70 hover:text-white hover:bg-[#1e293b]/30"
                                }`}
                            >
                              <span>{subItem.label}</span>
                              {subItem.badge && (
                                <span className={badgeStyles[subItem.badgeVariant || "new"]}>{subItem.badge}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isActive(item.href || "")
                        ? "bg-[#1e293b] text-white font-medium"
                        : "text-white/80 hover:bg-[#1e293b]/50 hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={badgeStyles[item.badgeVariant || "new"]}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1e293b] bg-[#1e293b]/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.full_name || "Utilisateur"}
            </p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors p-1.5 hover:bg-[#1e293b] rounded-lg"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
