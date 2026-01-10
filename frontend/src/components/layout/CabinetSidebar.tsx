"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import {
    PieChart,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Building
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { ClientSelector } from "./ClientSelector";

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    href: string;
}

const cabinetMenu: MenuItem[] = [
    { id: "dashboard", label: "Dashboard Cabinet", icon: PieChart, href: "/cabinet/dashboard" },
    { id: "clients", label: "Mes Clients", icon: Users, href: "/cabinet/clients" },
    { id: "settings", label: "Paramètres Cabinet", icon: Settings, href: "/cabinet/settings" },
];

interface CabinetSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function CabinetSidebar({ isOpen = true, onClose }: CabinetSidebarProps) {
    const { user, setAppMode } = useLayout();
    const router = useRouter();
    const pathname = router.pathname || "";

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
            <div className={`sidebar fixed left-0 top-0 h-full w-[240px] flex flex-col bg-[#1e293b] border-r border-[#334155] z-40 overflow-hidden transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                <div className="p-4 border-b border-[#334155] bg-[#0f172a]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <div>
                            <span className="text-white font-bold text-lg">CABINET</span>
                            <button onClick={() => setAppMode('ENTREPRISE')} className="text-indigo-400 text-[10px] hover:text-indigo-300 block -mt-1">
                                Switch to Enterprise &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <h3 className="px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Sélectionner un dossier</h3>
                    <ClientSelector />
                </div>

                <nav className="flex-1 overflow-y-auto py-3">
                    <div className="px-4 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Menu Cabinet
                    </div>
                    <div className="space-y-0.5 px-2">
                        {cabinetMenu.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive(item.href)
                                        ? "bg-[#334155] text-white font-medium shadow-sm"
                                        : "text-white/70 hover:bg-[#334155]/50 hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="p-3 border-t border-[#334155] bg-[#0f172a]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.full_name || "Utilisateur"}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-white/60 hover:text-white transition-colors p-1.5 hover:bg-[#334155] rounded-lg"
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
