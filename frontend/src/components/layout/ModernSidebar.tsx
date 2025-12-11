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
  Wallet,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  Pin,
  LogOut,
  ChevronDown,
  Building2,
  CreditCard,
  UserCog,
  CalendarCheck,
  Briefcase,
  ArrowLeftRight,
  Calculator,
  Files
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
  icon: any;
  href?: string;
  submenu?: SubMenuItem[];
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error";
}

// Menu "GESTION" (Dirigeant) - Images 2, 3, 4, 5
const menuItemsManagement: MenuItem[] = [
  {
    id: "home",
    label: "Accueil",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight, // Icone plus proche de 'Transactions'
    href: "/treasury/transactions",
  },
  {
    id: "pro_account",
    label: "Compte Pro",
    icon: Wallet,
    href: "/treasury/account",
    badge: "INCLUS",
    badgeVariant: "success"
  },
  {
    id: "purchases",
    label: "Achats",
    icon: ShoppingCart,
    href: "/sales/purchase-orders",
  },
  {
    id: "sales",
    label: "Ventes",
    icon: FileText,
    href: "/sales/invoices",
  },
  {
    id: "analytics",
    label: "Analytique",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    id: "reports",
    label: "Rapports comptables",
    icon: Files,
    href: "/reports/accounting",
  },
  {
    id: "documents",
    label: "Documents partagés",
    icon: Package,
    href: "/documents",
  }
];

// Menu "COMPTABILITÉ" (Expert) - Image 1
const menuItemsAccounting: MenuItem[] = [
  {
    id: "saisie",
    label: "Saisie",
    icon: FileText, // Icone crayon/edit serait mieux, mais FileText standard
    submenu: [
      { label: "Factures fournisseurs", href: "/sales/purchase-orders" },
      { label: "Factures clients", href: "/sales/invoices" },
      { label: "Saisie en masse", href: "/sales/bulk-entry" },
      { label: "Reprise de TVA", href: "/accounting/vat-recovery" },
    ],
  },
  {
    id: "revision",
    label: "Révision",
    icon: Calculator,
    submenu: [
      { label: "Balance générale", href: "/accounting/trial-balance" },
      { label: "Grand livre", href: "/accounting/ledger" },
      { label: "Dossiers de travail", href: "/accounting/workpapers" },
    ],
  },
  {
    id: "tax",
    label: "Fiscalité",
    icon: Building2,
    submenu: [
      { label: "Déclarations TVA", href: "/accounting/vat" },
      { label: "Liasse fiscale", href: "/accounting/tax-bundle" },
    ],
  },
  {
    id: "synthesis",
    label: "États de synthèse",
    icon: BarChart3,
    submenu: [
      { label: "Bilan", href: "/accounting/balance-sheet" },
      { label: "Compte de résultat", href: "/accounting/income-statement" },
    ],
  },
  {
    id: "client_file",
    label: "Dossier du client",
    icon: Briefcase,
    submenu: [
      { label: "GED", href: "/ged" },
      { label: "Plan comptable", href: "/accounting/chart" },
    ],
  },
];

const badgeColors = {
  default: "bg-teal-700 text-white", // Adjusted for dark theme
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  error: "bg-red-500 text-white",
};

export function ModernSidebar() {
  const [isLocked, setIsLocked] = useState(true); // Default to locked (open) like screenshots
  const [viewMode, setViewMode] = useState<"management" | "accounting">("management");
  const [openMenus, setOpenMenus] = useState<string[]>(["saisie"]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = router.pathname || "";

  // Dynamic menu based on mode
  const currentMenuItems = viewMode === "management" ? menuItemsManagement : menuItemsAccounting;

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
      className={`sidebar fixed left-0 top-0 h-full flex flex-col z-50 overflow-y-auto transition-all duration-300 ease-in-out border-r border-teal-800 ${isLocked ? "w-64" : "w-[72px] hover:w-64"
        }`}
      style={{ backgroundColor: "#0f514b" }} // Seka/Pennylane Dark Green
    >
      {/* Header & Toggle */}
      <div className="p-3 sticky top-0 z-10 bg-[#0f514b]">
        {/* Toggle Switch */}
        <div className={`flex bg-teal-900/50 rounded-lg p-1 mb-4 ${!isLocked && "hidden group-hover:flex"}`}>
          <button
            onClick={() => setViewMode("accounting")}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all ${viewMode === "accounting"
              ? "bg-white text-teal-900 shadow-sm"
              : "text-teal-100 hover:text-white"
              }`}
          >
            Comptabilité
          </button>
          <button
            onClick={() => setViewMode("management")}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all ${viewMode === "management"
              ? "bg-white text-teal-900 shadow-sm"
              : "text-teal-100 hover:text-white"
              }`}
          >
            Gestion
          </button>
        </div>

        <div className="flex items-center justify-between pb-2">
          {/* Logo text hidden when collapsed */}
          <div className={`text-white font-bold text-lg tracking-tight ${!isLocked && "hidden"}`}>
            Seka
          </div>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className="text-teal-300 hover:text-white p-1 rounded hover:bg-teal-800 transition-colors"
          >
            <Pin className={`w-4 h-4 transition-transform ${isLocked ? "rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {currentMenuItems.map((item) => (
          <div key={item.id}>
            {item.submenu ? (
              <>
                <div
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-md transition-all group ${openMenus.includes(item.id) ? "bg-teal-800/50 text-white" : "text-teal-100 hover:bg-teal-800 hover:text-white"
                    }`}
                  onClick={() => toggleMenu(item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                    <span className={`text-sm font-medium truncate ${!isLocked ? "hidden group-hover:block" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                  {isLocked && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${openMenus.includes(item.id) ? "rotate-180" : ""}`}
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                {/* Submenu */}
                {isLocked && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openMenus.includes(item.id) ? "max-h-96" : "max-h-0"
                      }`}
                  >
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      {item.submenu.map((subItem, idx) => (
                        <Link
                          key={idx}
                          href={subItem.href}
                          className={`block py-1.5 text-sm transition-colors cursor-pointer hover:text-white ${isActive(subItem.href) ? "text-white font-medium" : "text-teal-200"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{subItem.label}</span>
                            {subItem.badge && (
                              <span className={`text-[10px] px-1.5 rounded ml-2 ${badgeColors[subItem.badgeVariant || "default"]}`}>
                                {subItem.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href || "#"}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${isActive(item.href || "")
                  ? "bg-[#186a63] text-white font-medium"
                  : "text-teal-100 hover:bg-teal-800 hover:text-white"
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <span className={`text-sm font-medium truncate ${!isLocked ? "hidden group-hover:block" : ""}`}>
                  {item.label}
                </span>
                {item.badge && isLocked && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeColors[item.badgeVariant || "default"]}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-teal-800 bg-[#0d4540]">
        <div className={`flex items-center gap-3 ${!isLocked && "justify-center"}`}>
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-700">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          {isLocked && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || "Utilisateur"}</p>
              <p className="text-xs text-teal-300 truncate">{user?.email}</p>
            </div>
          )}
          {isLocked && (
            <button
              onClick={handleLogout}
              className="text-teal-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

