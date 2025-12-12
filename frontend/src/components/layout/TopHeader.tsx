"use client";

import { useState, useEffect } from "react";
import { Bell, Search, MessageSquare, HelpCircle, Menu } from "lucide-react";
import ClientSelector from "./ClientSelector";
import { getCurrentUser, type User, type Client } from "@/lib/api";

interface TopHeaderProps {
    onClientChange?: (client: Client | null) => void;
    onMenuToggle?: () => void;
}

export default function TopHeader({ onClientChange, onMenuToggle }: TopHeaderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState(3);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("seka_access_token");
                if (token) {
                    const userData = await getCurrentUser(token);
                    setUser(userData);
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            }
        };
        fetchUser();
    }, []);

    return (
        <header className="fixed top-0 left-[220px] right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 shadow-sm">
            {/* Left side - Client Selector */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="h-5 w-5 text-gray-600" />
                </button>

                <ClientSelector onChange={onClientChange} />

                {/* Quick Search */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Recherche rapide (Cmd+K)"
                        className="pl-9 pr-4 py-2 w-64 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                    />
                    <kbd className="absolute right-3 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded">
                        <span>Cmd</span>
                        <span>K</span>
                    </kbd>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                {/* Help */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Aide">
                    <HelpCircle className="h-5 w-5 text-gray-500" />
                </button>

                {/* Messages */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" title="Messages">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                </button>

                {/* Notifications */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" title="Notifications">
                    <Bell className="h-5 w-5 text-gray-500" />
                    {notifications > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {notifications}
                        </span>
                    )}
                </button>

                {/* User Avatar */}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                            {user?.full_name || "Utilisateur"}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
