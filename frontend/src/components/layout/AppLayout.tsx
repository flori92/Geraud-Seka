"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useLayout } from "@/contexts/LayoutContext";
import { CabinetSidebar } from "./CabinetSidebar";
import { PennylaneSidebar } from "./PennylaneSidebar";
import TopHeader from "./TopHeader";
import { useClient } from "@/contexts/ClientContext";
import { Menu, X } from "lucide-react";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const router = useRouter();
    const { appMode, setAppMode } = useLayout();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { setSelectedClientId } = useClient();

    const noSidebarPages = ['/login', '/register', '/landing', '/pricing', '/about', '/blog', '/faq', '/privacy', '/terms'];
    const showSidebar = !noSidebarPages.includes(router.pathname);

    const mainClass = showSidebar
        ? "lg:ml-[240px] transition-all duration-300 pt-14 px-3 sm:px-4 min-h-screen bg-gray-50"
        : "px-3 sm:px-4 min-h-screen bg-gray-50";

    const handleClientChange = (client: any) => {
        setSelectedClientId(client?.id ?? null);
    };

    if (!showSidebar) {
        return <main className={mainClass}>{children}</main>;
    }

    return (
        <div className="font-sans min-h-screen bg-gray-50">
            {/* Sidebar Selection */}
            {appMode === 'CABINET' ? (
                <CabinetSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            ) : (
                <PennylaneSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            )}

            {/* Header */}
            <TopHeader onClientChange={handleClientChange} />

            {/* Mobile Toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-3 left-3 z-50 p-2 bg-[#0f172a] text-white rounded-lg lg:hidden shadow-lg"
                aria-label="Toggle menu"
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Main Content */}
            <main className={mainClass}>
                {/* Debug/Switch Mode (Temporary for Dev/Demo if needed, or put in Sidebar) */}
                {/* <div className="fixed bottom-4 right-4 z-50 bg-white p-2 border rounded shadow text-xs">
           Mode: {appMode} 
           <button onClick={() => setAppMode(appMode === 'CABINET' ? 'ENTREPRISE' : 'CABINET')} className="ml-2 underline text-blue-600">Switch</button>
        </div> */}
                {children}
            </main>
        </div>
    );
}
