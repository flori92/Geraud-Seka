import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";

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
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-64 border-r border-slate-200 bg-white px-4 py-6 md:block">
          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SEKA
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">Cabinet demo</p>
          </div>

          <nav className="mt-8 space-y-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center rounded-md bg-slate-900 px-3 py-2 font-medium text-white"
            >
              Tableau de bord
            </Link>
            <button className="mt-6 text-xs font-medium text-slate-500 hover:text-slate-700">
              Déconnexion (placeholder)
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Tableau de bord</h1>
              <p className="text-xs text-slate-500">Vue d'ensemble fictive du cabinet.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="hidden sm:inline">Utilisateur connecté (demo)</span>
            </div>
          </header>

          <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </>
  );
}
