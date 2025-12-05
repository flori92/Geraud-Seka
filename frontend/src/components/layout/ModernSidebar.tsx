"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getCurrentUser, type User } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Activity,
  FileDown,
  BrainCircuit,
  Wallet,
  ShoppingCart,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  Pin,
  LogOut,
  ChevronDown,
  Building2,
  CreditCard,
  UserCog,
  CalendarCheck,
} from "lucide-react";

interface SubMenuItem {
  label: string;
  href: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error";
}

interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
  submenu?: SubMenuItem[];
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error";
}

// Organisation des menus selon les modules backend SEKA
const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "accounting",
    label: "Comptabilité",
    icon: Receipt,
    submenu: [
      { label: "Journal", href: "/accounting/journal" },
      { label: "Balance", href: "/accounting/balance" },
      { label: "Grand livre", href: "/accounting/ledger" },
      { label: "Plan comptable", href: "/accounting/chart" },
    ],
  },
  {
    id: "treasury",
    label: "Trésorerie",
    icon: Wallet,
    submenu: [
      { label: "Dashboard", href: "/treasury" },
      { label: "Comptes bancaires", href: "/treasury/accounts" },
      { label: "Transactions", href: "/treasury/transactions" },
      { label: "Prévisions", href: "/treasury/forecast" },
    ],
  },
  {
    id: "clients",
    label: "Clients & CRM",
    icon: Users,
    submenu: [
      { label: "Liste clients", href: "/clients" },
      { label: "Contacts", href: "/crm/contacts" },
      { label: "Opportunités", href: "/crm/opportunities" },
      { label: "Leads", href: "/crm/leads" },
      { label: "Activités CRM", href: "/crm/activities" },
      { label: "Campagnes", href: "/crm/campaigns", badge: "NEW", badgeVariant: "success" },
      { label: "Automatisations", href: "/crm/automations" },
      { label: "Analytics CRM", href: "/crm/analytics" },
      { label: "Import/Export", href: "/crm/import-export" },
    ],
  },
  {
    id: "sales",
    label: "Ventes",
    icon: ShoppingCart,
    submenu: [
      { label: "Devis", href: "/sales/quotes" },
      { label: "Factures", href: "/sales/invoices" },
      { label: "Bons de commande", href: "/sales/purchase-orders" },
      { label: "Bons de livraison", href: "/sales/delivery-notes" },
    ],
  },
  {
    id: "hr",
    label: "Ressources Humaines",
    icon: UserCog,
    submenu: [
      { label: "Employés", href: "/hr/employees" },
      { label: "Contrats", href: "/hr/contracts" },
      { label: "Bulletins de paie", href: "/hr/payslips" },
      { label: "Congés", href: "/hr/leaves" },
    ],
  },
  {
    id: "stock",
    label: "Stock & Produits",
    icon: Package,
    submenu: [
      { label: "Produits & Services", href: "/products" },
      { label: "Gestion stock", href: "/stock" },
      { label: "Fournisseurs", href: "/suppliers" },
    ],
  },
  {
    id: "documents",
    label: "Documents & GED",
    icon: FileText,
    submenu: [
      { label: "Mes documents", href: "/documents" },
      { label: "GED", href: "/ged", badge: "NEW", badgeVariant: "success" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence AI",
    icon: BrainCircuit,
    href: "/intelligence",
    badge: "LIVE",
    badgeVariant: "success",
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: BarChart3,
    submenu: [
      { label: "Dashboard", href: "/reports" },
      { label: "Rapport comptable", href: "/reports/accounting" },
      { label: "Rapport ventes", href: "/reports/sales" },
      { label: "Rapport RH", href: "/reports/hr" },
      { label: "Exports comptables", href: "/exports" },
    ],
  },
  {
    id: "activities",
    label: "Activités",
    icon: Activity,
    href: "/activities",
  },
  {
    id: "billing",
    label: "Abonnement",
    icon: CreditCard,
    href: "/billing",
  },
];

const badgeColors = {
  default: "bg-accents-3 text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  error: "bg-error text-white",
};

export function ModernSidebar() {
  const [isLocked, setIsLocked] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["accounting", "treasury"]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = router.pathname || "";

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

  const handleLogout = () => {
    localStorage.removeItem("seka_access_token");
    localStorage.removeItem("seka_refresh_token");
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div
      className={`sidebar fixed left-0 top-0 h-full bg-foreground text-background flex flex-col z-50 overflow-y-auto transition-all duration-300 ease-in-out border-r border-accents-8 ${
        isLocked ? "locked w-72" : "w-[72px] hover:w-72"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-accents-8 sticky top-0 bg-foreground z-10 flex items-center justify-between min-h-[80px]">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 sidebar-logo-compact">
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">S</span>
            </div>
          </div>
          <div className="sidebar-content">
            <div className="text-lg font-bold">SEKA Gestion</div>
            <div className="text-xs text-accents-4">ERP Professionnel</div>
          </div>
        </div>
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`sidebar-content p-1.5 rounded hover:bg-accents-8 transition-all ${
            isLocked ? "text-success" : "text-accents-4"
          }`}
          title={isLocked ? "Déverrouiller" : "Verrouiller"}
        >
          <Pin className={`w-4 h-4 transition-transform ${isLocked ? "rotate-45" : ""}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.submenu ? (
              <>
                <div
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-accents-8 rounded-lg transition-all group"
                  onClick={() => toggleMenu(item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <item.icon className="w-5 h-5 flex-shrink-0 text-accents-3" strokeWidth={1.5} />
                    <span className="sidebar-content text-sm font-medium truncate">
                      {item.label}
                    </span>
                  </div>
                  <ChevronDown
                    className={`sidebar-content w-4 h-4 text-accents-4 transition-transform flex-shrink-0 ${
                      openMenus.includes(item.id) ? "rotate-180" : ""
                    }`}
                    strokeWidth={1.5}
                  />
                </div>
                <div
                  className={`submenu overflow-hidden transition-all duration-300 ${
                    openMenus.includes(item.id) ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="pl-5 pr-3 py-1 space-y-1">
                    {item.submenu.map((subItem, idx) => (
                      <Link
                        key={idx}
                        href={subItem.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive(subItem.href)
                            ? "bg-background text-foreground font-medium"
                            : "text-accents-3 hover:bg-accents-8 hover:text-background"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isActive(subItem.href) ? "bg-foreground" : "bg-accents-6"
                        }`} />
                        <span className="sidebar-content text-sm truncate">{subItem.label}</span>
                        {subItem.badge && (
                          <span
                            className={`sidebar-content text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                              badgeColors[subItem.badgeVariant || "default"]
                            }`}
                          >
                            {subItem.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Link
                href={item.href || "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.href || "")
                    ? "bg-background text-foreground font-medium"
                    : "text-accents-3 hover:bg-accents-8 hover:text-background"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <span className="sidebar-content text-sm font-medium truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`sidebar-content text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      badgeColors[item.badgeVariant || "default"]
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Settings & User Footer */}
      <div className="p-3 border-t border-accents-8 sticky bottom-0 bg-foreground space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-accents-3 hover:bg-accents-8 hover:text-background"
        >
          <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
          <span className="sidebar-content text-sm font-medium">Paramètres</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="sidebar-content flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.full_name || user?.email || "Utilisateur"}</div>
            <div className="text-xs text-accents-4">{user?.role || "User"}</div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-content w-8 h-8 rounded-lg hover:bg-accents-8 flex items-center justify-center transition-all flex-shrink-0"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4 text-accents-4 hover:text-background transition-all" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 72px;
        }
        .sidebar.locked {
          width: 288px;
        }
        .sidebar:hover {
          width: 288px;
        }

        .sidebar-content {
          opacity: 0;
          transition: opacity 0.3s ease;
          white-space: nowrap;
        }

        .sidebar-logo-compact {
          transition: opacity 0.3s ease;
        }

        .sidebar:hover .sidebar-logo-compact,
        .sidebar.locked .sidebar-logo-compact {
          opacity: 0;
          display: none;
        }

        .sidebar:hover .sidebar-content,
        .sidebar.locked .sidebar-content {
          opacity: 1;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
