"use client";

import React, { useState, createContext, useContext } from "react";

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    defaultValue: string;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({ defaultValue, children, className = "" }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
    return (
        <div className={`inline-flex h-10 items-center justify-start rounded-md bg-accents-1 p-1 ${className}`}>
            {children}
        </div>
    );
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsTrigger({ value, children, className = "" }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            onClick={() => setActiveTab(value)}
            className={`
                inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5
                text-sm font-medium ring-offset-white transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accents-4 focus-visible:ring-offset-2
                disabled:pointer-events-none disabled:opacity-50
                ${isActive
                    ? "bg-white text-foreground shadow-sm"
                    : "text-accents-5 hover:text-foreground hover:bg-white/50"
                }
                ${className}
            `}
        >
            {children}
        </button>
    );
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    const { activeTab } = context;

    if (activeTab !== value) return null;

    return (
        <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accents-4 focus-visible:ring-offset-2 ${className}`}>
            {children}
        </div>
    );
}
