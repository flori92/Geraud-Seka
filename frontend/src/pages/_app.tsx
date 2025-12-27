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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const noSidebarPages = ['/login', '/register', '/landing', '/pricing', '/about', '/blog', '/faq', '/privacy', '/terms'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showSidebar = !noSidebarPages.includes(router.pathname);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initProductionSecurity();
  }, []);

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
          {showSidebar && <PennylaneSidebar />}
          {showSidebar && isMounted && <HeaderWithClientSync />}
          <main className={showSidebar ? "ml-[220px] transition-all duration-300 pt-14" : ""}>
            <Component {...pageProps} />
          </main>
        </div>
      </ClientProvider>
    </ToastProvider>
  );
}
