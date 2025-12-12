"use client";

import { ReactNode } from "react";
import { PennylaneSidebar } from "./PennylaneSidebar";

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showSidebar && <PennylaneSidebar />}
      
      {/* Main content area with proper spacing */}
      <div 
        className={`transition-all duration-300 ${
          showSidebar ? "ml-[220px]" : "ml-0"
        }`}
      >
        {/* Top padding to account for any fixed headers */}
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}