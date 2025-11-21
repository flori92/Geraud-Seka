import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Package,
  Activity,
  FileDown,
  BrainCircuit
} from "lucide-react";

interface DashboardLayoutProps {
  title?: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pageTitle = title ? `${title} – SEKA` : "SEKA – Tableau de bord";

  const isActive = (path: string) => router.pathname === path;


  const menuItems = [
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Produits & Services", href: "/products", icon: Package },
    { name: "Activités", href: "/activities", icon: Activity },
    { name: "Exports Comptables", href: "/exports", icon: FileDown },
    { name: "Intelligence", href: "/intelligence", icon: BrainCircuit }, // New
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="flex min-h-screen bg-accents-1 font-sans text-foreground">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-accents-2 bg-background px-6 py-8 md:flex">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-foreground"></div>
            <span className="text-lg font-bold tracking-tight">SEKA</span>
          </div>

          <div className="mt-8 flex flex-col gap-1">
            <p className="mb-2 px-2 text-xs font-medium uppercase text-accents-4">
              Menu
            </p>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive(item.href)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.href) ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-3 rounded-lg border border-accents-2 p-3">
              <div className="h-8 w-8 rounded-full bg-accents-2"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Cabinet Demo</span>
                <span className="text-xs text-accents-4">Admin</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:pl-64">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-accents-2 bg-background/80 px-8 backdrop-blur-md">
            <h1 className="text-lg font-semibold">{title || "Tableau de bord"}</h1>
            <div className="flex items-center gap-4">
              <button className="text-sm text-accents-5 hover:text-foreground">
                Aide
              </button>
              <button className="text-sm text-accents-5 hover:text-foreground">
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
