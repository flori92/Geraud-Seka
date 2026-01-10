"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getCurrentUser, type User } from "@/lib/api";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Wallet,
  Users,
  HelpCircle,
  Download,
  Zap,
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

const sekaV1Menu: MenuSection[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      {
        id: "factures",
        label: "Factures",
        icon: FileText,
        submenu: [
          { label: "Importer (OCR)", href: "/documents/upload", badge: "IA", badgeVariant: "new" },
          { label: "En attente", href: "/documents/en-attente" },
          { label: "Achats", href: "/achats/factures" },
          { label: "Ventes", href: "/ventes/factures" },
        ]
      },
      {
        id: "tiers",
        label: "Tiers",
        icon: Users,
        submenu: [
          { label: "Fournisseurs", href: "/suppliers" },
          { label: "Clients", href: "/clients" },
          { label: "Plan comptable", href: "/accounting/chart-of-accounts" },
        ]
      },
      {
        id: "regles",
        label: "Règles",
        icon: Zap,
        submenu: [
          { label: "Règles fournisseurs", href: "/settings/accounting-rules", badge: "IA", badgeVariant: "new" },
          { label: "Journaux", href: "/accounting/journals" },
        ]
      },
      {
        id: "banque",
        label: "Banque",
        icon: Wallet,
        submenu: [
          { label: "Rapprochement", href: "/accounting/bank-reconciliation", badge: "PDF", badgeVariant: "new" },
          { label: "Relevés importés", href: "/accounting/import-statements" },
        ]
      },
      {
        id: "exports",
        label: "Exports",
        icon: Download,
        submenu: [
          { label: "Exporter", href: "/exports" },
          { label: "Historique", href: "/exports?tab=history" },
        ]
      },
    ]
  },
  {
    title: "Configuration",
    items: [
      {
        id: "parametres",
        label: "Paramètres",
        icon: Settings,
        submenu: [
          { label: "Entreprise", href: "/settings" },
          { label: "Utilisateurs", href: "/settings/team" },
          { label: "TVA", href: "/settings/invoices" },
        ]
      },
      { id: "aide", label: "Aide", icon: HelpCircle, href: "/aide" },
    ]
  }
];

const badgeStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium",
  beta: "bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium",
  count:
    "bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center",
  included: "bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium",
};

interface PennylaneSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PennylaneSidebar({ isOpen = true, onClose }: PennylaneSidebarProps) {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
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

  useEffect(() => {
    const allMenuItems = sekaV1Menu.flatMap((section: MenuSection) => section.items);
    setOpenMenus((prev) => {
      let next = prev;
      for (const item of allMenuItems) {
        if (!item.submenu) continue;

        const isChildActive = item.submenu.some(
          (sub: SubMenuItem) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );

        if (isChildActive && !next.includes(item.id)) {
          next = [...next, item.id];
        }
      }
      return next;
    });
  }, [pathname]);

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
    <>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <div className={`sidebar fixed left-0 top-0 h-full w-[240px] flex flex-col bg-[#0f172a] border-r border-[#1e293b] z-40 overflow-hidden transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[#0f172a] font-bold text-xl">S</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">SEKA</span>
              <p className="text-white/60 text-[10px] -mt-0.5">Automatisation Comptable</p>
            </div>
          </div>
        </div>


        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-[#1e293b] scrollbar-track-transparent">
          {sekaV1Menu.map((section: MenuSection, sectionIdx: number) => (
            <div key={sectionIdx} className={sectionIdx > 0 ? "mt-4 pt-4 border-t border-[#1e293b]" : ""}>
              {section.title && (
                <div className="px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item: MenuItem) => (
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

                        <div
                          className={`overflow-hidden transition-all duration-200 ease-in-out ${openMenus.includes(item.id) ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                            }`}
                        >
                          <div className="py-1 ml-3 border-l border-[#1e293b]/50 space-y-0.5">
                            {item.submenu.map((subItem: SubMenuItem, idx: number) => (
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
    </>
  );
}
