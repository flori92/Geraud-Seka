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
  ChevronRight,
  Building2,
  Calculator,
  Files,
  Wallet,
  Users,
  Search,
  HelpCircle,
  Sparkles,
  FolderOpen,
  BookOpen,
  Scale,
  FileCheck,
  Import,
  Download,
  Landmark,
  ArrowLeftRight,
  ClipboardList,
  FileSpreadsheet,
  PiggyBank,
  Banknote,
  UserCheck,
  MessageSquare,
  Bell,
  Eye
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
  icon: any;
  href?: string;
  submenu?: SubMenuItem[];
  badge?: string;
  badgeVariant?: "new" | "beta" | "count" | "included";
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

// Menu GESTION (Mode Dirigeant)
const managementMenu: MenuSection[] = [
  {
    items: [
      { id: "accueil", label: "Accueil", icon: LayoutDashboard, href: "/dashboard" },
      { id: "transactions", label: "Transactions", icon: ArrowLeftRight, href: "/transactions" },
      { id: "compte-pro", label: "Compte Pro", icon: CreditCard, href: "/compte-pro", badge: "INCLUS", badgeVariant: "included" },
      { id: "achats", label: "Achats", icon: ShoppingCart, href: "/achats" },
      { id: "ventes", label: "Ventes", icon: Receipt, href: "/ventes" },
      { id: "analytique", label: "Analytique", icon: BarChart3, href: "/analytique" },
      { id: "rapports", label: "Rapports comptables", icon: FileSpreadsheet, href: "/rapports" },
      { id: "documents", label: "Documents partagés", icon: FolderOpen, href: "/documents" },
    ]
  },
  {
    items: [
      { id: "point-vue", label: "Point de vue client", icon: Eye, href: "/point-vue-client" },
      { id: "comptassistant", label: "ComptAssistant", icon: Sparkles, href: "/assistant" },
      { id: "recherche", label: "Recherche rapide", icon: Search, href: "/recherche" },
      { id: "parametres", label: "Paramètres", icon: Settings, href: "/settings" },
      { id: "abonnement", label: "Gestion d'abonnement", icon: PiggyBank, href: "/billing" },
      { id: "aide", label: "Aide et support", icon: HelpCircle, href: "/aide" },
    ]
  }
];

// Menu COMPTABILITÉ (Mode Expert-Comptable)
const accountingMenu: MenuSection[] = [
  {
    items: [
      {
        id: "saisie",
        label: "Saisie",
        icon: FileText,
        submenu: [
          { label: "Saisie avec OCR", href: "/accounting/entries/from-ocr", badge: "IA", badgeVariant: "new" },
          { label: "Écritures comptables", href: "/accounting/entries" },
          { label: "Nouvelle saisie", href: "/accounting/entries/new" },
          { label: "Factures fournisseurs", href: "/achats/factures" },
          { label: "Factures clients", href: "/ventes/factures" },
          { label: "Transactions", href: "/transactions" },
          { label: "Rapprochement bancaire", href: "/accounting/reconciliation" },
          { label: "Journaux", href: "/accounting/journals" },
        ]
      },
      {
        id: "revision",
        label: "Révision",
        icon: Calculator,
        submenu: [
          { label: "Balance générale", href: "/accounting/balance" },
          { label: "Grand livre", href: "/accounting/ledger" },
          { label: "Balance fournisseurs", href: "/suppliers/balance" },
          { label: "Balance clients", href: "/clients/balance" },
        ]
      },
      {
        id: "fiscalite",
        label: "Fiscalité",
        icon: Building2,
        submenu: [
          { label: "Déclarations TVA", href: "/tax/vat" },
          { label: "Liasse fiscale", href: "/tax/returns" },
        ]
      },
      {
        id: "etats-synthese",
        label: "États de synthèse",
        icon: Scale,
        submenu: [
          { label: "Bilan", href: "/reports/balance-sheet" },
          { label: "Compte de résultat", href: "/reports/income-statement" },
        ]
      },
      {
        id: "dossier-client",
        label: "Dossier du client",
        icon: FolderOpen,
        submenu: [
          { label: "Documents", href: "/documents" },
          { label: "Plan comptable", href: "/accounting/chart-of-accounts" },
          { label: "Règles comptables", href: "/settings/accounting-rules", badge: "IA", badgeVariant: "new" },
          { label: "Centre de règles", href: "/settings/rules" },
          { label: "Paramètres", href: "/settings" },
        ]
      },
    ]
  },
  {
    items: [
      { id: "point-vue", label: "Point de vue client", icon: Eye, href: "/point-vue-client" },
      { id: "comptassistant", label: "ComptAssistant", icon: Sparkles, href: "/assistant" },
      { id: "recherche", label: "Recherche rapide", icon: Search, href: "/recherche" },
      { id: "parametres", label: "Paramètres", icon: Settings, href: "/settings" },
      { id: "abonnement", label: "Gestion d'abonnement", icon: PiggyBank, href: "/billing" },
      { id: "aide", label: "Aide et support", icon: HelpCircle, href: "/aide" },
    ]
  }
];

const badgeStyles = {
  new: "bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-medium",
  beta: "bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium",
  count: "bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center",
  included: "bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium",
};

export function PennylaneSidebar() {
  const [viewMode, setViewMode] = useState<"management" | "accounting">(
    typeof window !== "undefined" && (localStorage.getItem("seka_view_mode") as any) || "accounting"
  );
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = router.pathname || "";

  const currentMenu = viewMode === "management" ? managementMenu : accountingMenu;

  // Auto-détection du mode selon la route (priorise les routes comptables)
  useEffect(() => {
    const accountingRoutes = [
      "/accounting",
      "/comptabilite",
      "/tax",
      "/reports/balance-sheet",
      "/reports/income-statement",
      "/reports",
    ];
    const isAccountingRoute = accountingRoutes.some((r) => pathname.startsWith(r) || pathname.includes("/accounting"));
    if (isAccountingRoute) {
      if (viewMode !== "accounting") {
        setViewMode("accounting");
        if (typeof window !== "undefined") localStorage.setItem("seka_view_mode", "accounting");
      }
    } else {
      if (viewMode !== "management") {
        setViewMode("management");
        if (typeof window !== "undefined") localStorage.setItem("seka_view_mode", "management");
      }
    }
  }, [pathname, viewMode]);

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

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleSubmenuClick = (href: string, parentMenuId: string) => {
    // Garder le menu parent ouvert
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
    <div className="sidebar fixed left-0 top-0 h-full w-[220px] flex flex-col bg-emerald-900 border-r border-emerald-800 z-40 overflow-hidden">
      {/* Header avec toggle Comptabilité/Gestion */}
      <div className="p-3 border-b border-emerald-800">
        <div className="flex bg-emerald-800 rounded-lg p-1 mb-3">
          <button
            onClick={() => {
              setViewMode("accounting");
              // Ne pas ouvrir automatiquement "saisie" ici
              if (typeof window !== "undefined") localStorage.setItem("seka_view_mode", "accounting");
            }}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded transition-all ${
              viewMode === "accounting"
                ? "bg-white text-emerald-900 shadow-sm"
                : "text-emerald-100 hover:text-white"
            }`}
          >
            Comptabilité
          </button>
          <button
            onClick={() => {
              setViewMode("management");
              setOpenMenus([]);
              if (typeof window !== "undefined") localStorage.setItem("seka_view_mode", "management");
            }}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded transition-all ${
              viewMode === "management"
                ? "bg-white text-emerald-900 shadow-sm"
                : "text-emerald-100 hover:text-white"
            }`}
          >
            Gestion
          </button>
        </div>
        
        {/* Logo SEKA */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#2c3e50] font-bold text-sm">S</span>
          </div>
          <span className="text-white font-semibold text-lg">SEKA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-[#0a3d38] scrollbar-track-transparent">
        {currentMenu.map((section, sectionIdx) => (
          <div key={sectionIdx} className={sectionIdx > 0 ? "mt-4 pt-4 border-t border-emerald-800" : ""}>
            {section.title && (
              <div className="px-4 py-2 text-xs font-medium text-emerald-100/70 uppercase tracking-wider">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-left ${
                          openMenus.includes(item.id)
                            ? "bg-emerald-700 text-white"
                            : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" strokeWidth={1.5} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            openMenus.includes(item.id) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {/* Submenu */}
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          openMenus.includes(item.id) ? "max-h-[500px]" : "max-h-0"
                        }`}
                      >
                        <div className="py-1 space-y-0.5">
                          {item.submenu.map((subItem, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSubmenuClick(subItem.href, item.id)}
                              className={`w-full flex items-center justify-between pl-10 pr-3 py-1.5 text-sm transition-colors text-left ${
                                isActive(subItem.href)
                                  ? "text-white bg-emerald-700 rounded-md mx-2"
                                  : "text-emerald-100 hover:text-white"
                              }`}
                            >
                              <span>{subItem.label}</span>
                              {subItem.badge && (
                                <span className={badgeStyles.new}>{subItem.badge}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center justify-between px-3 py-2 rounded-md transition-all ${
                        isActive(item.href || "")
                          ? "bg-emerald-700 text-white"
                          : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" strokeWidth={1.5} />
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
      <div className="p-3 border-t border-emerald-800 bg-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.full_name || "Utilisateur"}
            </p>
            <p className="text-xs text-emerald-100/70 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-emerald-100/70 hover:text-white transition-colors p-1"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
