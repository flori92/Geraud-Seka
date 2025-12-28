import Head from "next/head";
import { useState } from "react";
import type { ReactNode } from "react";

import { ChatWidget } from "../Chatbot/ChatWidget";
import { Bell, ChevronRight } from "lucide-react";

interface PennylaneLayoutProps {
  title?: string;
  children: ReactNode;
  showHeader?: boolean;
  headerActions?: ReactNode;
}

export function PennylaneLayout({ title, children }: PennylaneLayoutProps) {
  const pageTitle = title ? `${title} – SEKA` : "SEKA";
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentDossier] = useState("Dossier Test");

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="flex min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="flex-1">
          {/* Top Header Bar - Style Pennylane */}
          <header className="sticky top-0 z-40 h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Dossier Selector - Responsive */}
              <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-xs font-medium text-gray-500">AS</span>
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">IACCOUNTING...</span>
              </div>
              
              {/* Current Dossier - Responsive */}
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-sm text-gray-900 truncate">{currentDossier}</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Premium Internalisé
                </span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 rotate-90 flex-shrink-0" />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications - Responsive */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Avatar - Responsive */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                  GM
                </div>
              </div>
            </div>
          </header>

          {/* Page Content - Responsive */}
          <div className="p-3 sm:p-6">
            {children}
          </div>
        </main>

        {/* Chatbot Widget */}
        <ChatWidget />
      </div>
    </>
  );
}
