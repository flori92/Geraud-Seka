import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { ModernSidebar } from "./layout/ModernSidebar";
import { ChatWidget } from "./Chatbot/ChatWidget";
import { HelpCircle, Bell, X, ChevronRight, Book, MessageCircle, Mail, ExternalLink } from "lucide-react";

interface DashboardLayoutProps {
  title?: string;
  children: ReactNode;
}

// Composant Panel d'Aide
function HelpPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const helpLinks = [
    { icon: Book, label: "Documentation", href: "/docs", description: "Guides et tutoriels" },
    { icon: MessageCircle, label: "FAQ", href: "/faq", description: "Questions fréquentes" },
    { icon: Mail, label: "Support", href: "mailto:support@sekagestion.com", description: "Contactez-nous", external: true },
  ];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div 
        className="absolute right-4 top-16 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Centre d'aide</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="p-2">
          {helpLinks.map((item, idx) => (
            <Link key={idx} href={item.href} target={item.external ? "_blank" : undefined}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <item.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    {item.label}
                    {item.external && <ExternalLink className="h-3 w-3" />}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Besoin d'aide personnalisée ?{" "}
            <a href="mailto:support@sekagestion.com" className="text-blue-600 hover:underline">
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant Panel de Notifications
function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const notifications = [
    { id: 1, type: "info", title: "Bienvenue sur SEKA", message: "Découvrez les nouvelles fonctionnalités", time: "Maintenant", read: false },
    { id: 2, type: "warning", title: "Facture en attente", message: "3 factures nécessitent votre attention", time: "Il y a 2h", read: false },
    { id: 3, type: "success", title: "Paiement reçu", message: "Paiement de 150,000 FCFA confirmé", time: "Hier", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div 
        className="absolute right-4 top-16 w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                {unreadCount} nouvelles
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? "bg-blue-50/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notif.type === "warning" ? "bg-orange-500" :
                      notif.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune notification</p>
              <p className="text-sm text-gray-400 mt-1">Vous êtes à jour !</p>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-50 border-t border-gray-100">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            Marquer tout comme lu
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const pageTitle = title ? `${title} – SEKA` : "SEKA – Tableau de bord";
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Aide</span>
              </button>
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-6xl p-8">
            {children}
          </div>
        </main>

        {/* Panels */}
        <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        {/* Chatbot Widget - Available on all dashboard pages */}
        <ChatWidget />
      </div>
    </>
  );
}
