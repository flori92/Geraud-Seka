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
import { LayoutProvider } from "@/contexts/LayoutContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { initProductionSecurity } from "@/lib/security";

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

  const mainClass = showSidebar
    ? "lg:ml-[240px] transition-all duration-300 pt-14 px-3 sm:px-4"
    : "px-3 sm:px-4";

  return (
    <ToastProvider>
      <ClientProvider>
        <LayoutProvider>
          <div className={`${inter.variable} font-sans`}>
            <AppLayout>
              <Component {...pageProps} />
            </AppLayout>
          </div>
        </LayoutProvider>
      </ClientProvider>
    </ToastProvider>
  );
}
