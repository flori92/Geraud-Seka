"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Client, getClients, getCurrentUser, User } from "@/lib/api";

type AppMode = 'ENTREPRISE' | 'CABINET';

interface LayoutContextType {
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    currentTenant: Client | null;
    setCurrentTenant: (client: Client | null) => void;
    availableTenants: Client[];
    refreshTenants: () => Promise<void>;
    user: User | null;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const SIDEBAR_COLLAPSED_KEY = "seka_sidebar_collapsed";

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [appMode, setAppMode] = useState<AppMode>('ENTREPRISE');
    const [currentTenant, setCurrentTenant] = useState<Client | null>(null);
    const [availableTenants, setAvailableTenants] = useState<Client[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

    // Charger l'état du sidebar depuis localStorage
    useEffect(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        if (saved === "true") {
            setSidebarCollapsedState(true);
        }
    }, []);

    const setSidebarCollapsed = (collapsed: boolean) => {
        setSidebarCollapsedState(collapsed);
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    };

    const refreshTenants = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            console.log("[LayoutContext] No token, skipping tenant refresh");
            return;
        }
        try {
            console.log("[LayoutContext] Fetching clients...");
            const clients = await getClients(token);
            console.log("[LayoutContext] Clients loaded:", clients?.length || 0, clients);
            
            // Debug: vérifier si "seka demo" est dans la liste
            const sekaDemo = clients?.find(c => c.name?.toLowerCase().includes('seka demo') || c.slug?.toLowerCase().includes('seka-demo'));
            console.log("[LayoutContext] 'seka demo' client found:", sekaDemo);
            
            setAvailableTenants(clients || []);
        } catch (error) {
            console.error("[LayoutContext] Failed to fetch clients", error);
            setAvailableTenants([]);
        }
    };

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem("seka_access_token");
            if (!token) return;

            try {
                const userData = await getCurrentUser(token);
                setUser(userData);
                await refreshTenants();
            } catch (error) {
                console.error("Init failed", error);
            }
        };
        init();
    }, []);

    // Sync mode with URL or other logic if needed in future

    return (
        <LayoutContext.Provider value={{
            appMode,
            setAppMode,
            currentTenant,
            setCurrentTenant,
            availableTenants,
            refreshTenants,
            user,
            sidebarCollapsed,
            setSidebarCollapsed
        }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error("useLayout must be used within a LayoutProvider");
    }
    return context;
}
