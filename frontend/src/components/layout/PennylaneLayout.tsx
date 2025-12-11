import Head from "next/head";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "./PennylaneSidebar";
import { ChatWidget } from "../Chatbot/ChatWidget";
import { HelpCircle, Bell, X, ChevronRight, Book, MessageCircle, Mail, ExternalLink, Search, Building2 } from "lucide-react";

interface PennylaneLayoutProps {
  title?: string;
  children: ReactNode;
  showHeader?: boolean;
  headerActions?: ReactNode;
}

export function PennylaneLayout({ title, children, showHeader = false, headerActions }: PennylaneLayoutProps) {
  const pageTitle = title ? `${title} – SEKA` : "SEKA";
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentDossier, setCurrentDossier] = useState("Dossier Test");

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="flex min-h-screen bg-gray-50">
        {/* Pennylane Sidebar */}
        <PennylaneSidebar />

        {/* Main Content */}
        <main className="flex-1 ml-[220px]">
          {/* Top Header Bar - Style Pennylane */}
          <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* Dossier Selector */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-xs font-medium text-gray-500">AS</span>
                <span className="text-sm font-medium text-gray-700">IACCOUNTING...</span>
              </div>
              
              {/* Current Dossier */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">{currentDossier}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                  Premium Internalisé
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  GM
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Chatbot Widget */}
        <ChatWidget />
      </div>
    </>
  );
}
