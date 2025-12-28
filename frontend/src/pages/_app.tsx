import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import "@/styles/globals.css";
import "@/styles/sidebar-fixes.css";
import { ToastProvider } from "@/components/ui/ToastContainer";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import TopHeader from "@/components/layout/TopHeader";
import { ClientProvider, useClient } from "@/contexts/ClientContext";
import { useRouter } from "next/router";
import type { Client } from "@/lib/api";
import { initProductionSecurity } from "@/lib/security";
import { Menu, X } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const noSidebarPages = ['/login', '/register', '/landing', '/pricing', '/about', '/blog', '/faq', '/privacy', '/terms'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showSidebar = !noSidebarPages.includes(router.pathname);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initProductionSecurity();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  function HeaderWithClientSync() {
    const { setSelectedClientId } = useClient();
    const handleClientChange = (client: Client | null) => {
      setSelectedClientId(client?.id ?? null);
    };

    return <TopHeader onClientChange={handleClientChange} />;
  }

  return (
    <ToastProvider>
      <ClientProvider>
        <div className={`${inter.variable} font-sans min-h-screen bg-gray-50`}>
          {showSidebar && (
            <PennylaneSidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
          )}
          {showSidebar && isMounted && <HeaderWithClientSync />}
          
          {/* Bouton hamburger mobile */}
          {showSidebar && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="fixed top-3 left-3 z-50 p-2 bg-[#0f172a] text-white rounded-lg lg:hidden shadow-lg"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          
          <main className={showSidebar ? "lg:ml-[240px] ml-0 transition-all duration-300 pt-14" : ""}>
            <Component {...pageProps} />
          </main>
        </div>
      </ClientProvider>
    </ToastProvider>
  );
}
