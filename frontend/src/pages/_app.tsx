import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import "@/styles/globals.css";
import "@/styles/sidebar-fixes.css";
import { ToastProvider } from "@/components/ui/ToastContainer";
import { ClientProvider } from "@/contexts/ClientContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { initProductionSecurity } from "@/lib/security";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    initProductionSecurity();
  }, []);

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
