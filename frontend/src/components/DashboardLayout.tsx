import Head from "next/head";
import type { ReactNode } from "react";
import { ModernSidebar } from "./layout/ModernSidebar";

interface DashboardLayoutProps {
  title?: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const pageTitle = title ? `${title} – SEKA` : "SEKA – Tableau de bord";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="flex min-h-screen bg-accents-1 font-sans text-foreground">
        {/* Modern Sidebar */}
        <ModernSidebar />

        {/* Main Content */}
        <main className="flex-1 pl-[72px] transition-all duration-300">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-accents-2 bg-background/80 px-8 backdrop-blur-md">
            <h1 className="text-2xl font-bold tracking-tight">{title || "Tableau de bord"}</h1>
            <div className="flex items-center gap-4">
              <button className="text-sm text-accents-5 hover:text-foreground transition-colors">
                Aide
              </button>
              <button className="text-sm text-accents-5 hover:text-foreground transition-colors">
                Notifications
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-6xl p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
