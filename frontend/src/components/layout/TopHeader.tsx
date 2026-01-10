"use client";

import { useState, useEffect } from "react";
import { Bell, Search, MessageSquare, HelpCircle, Menu, X, ChevronRight, Book, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ClientSelector } from "./ClientSelector";
import { getCurrentUser, type User } from "@/lib/api";

interface TopHeaderProps {
    onMenuToggle?: () => void;
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    severity: string;
    is_read: boolean;
    created_at: string;
}

export default function TopHeader({ onMenuToggle }: TopHeaderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

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

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("seka_access_token");
                if (!token) return;
                
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications || []);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };
        fetchNotifications();
    }, []);

    return (
        <>
        <header className="fixed top-0 left-0 lg:left-[240px] right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-3 sm:px-4 shadow-sm">
            {/* Left side - Client Selector */}
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="h-5 w-5 text-gray-600" />
                </button>

                <ClientSelector />

                {/* Quick Search */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Recherche rapide (Cmd+K)"
                        className="pl-9 pr-4 py-2 w-48 lg:w-64 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500 focus:bg-white transition-colors"
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
                <button 
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                    title="Aide"
                >
                    <HelpCircle className="h-5 w-5 text-gray-500" />
                </button>

                {/* Messages */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" title="Messages">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                </button>

                {/* Notifications */}
                <button 
                    type="button"
                    onClick={() => setShowNotifications(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" 
                    title="Notifications"
                >
                    <Bell className="h-5 w-5 text-gray-500" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {/* User Avatar */}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
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

        {/* Help Panel */}
        {showHelp && (
            <div className="fixed inset-0 z-50" onClick={() => setShowHelp(false)}>
                <div className="absolute inset-0 bg-black/20" />
                <div 
                    className="absolute right-4 top-16 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Centre d&apos;aide</h3>
                        <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                    <div className="p-2">
                        <Link href="/docs">
                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Book className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Documentation</p>
                                    <p className="text-xs text-gray-500">Guides et tutoriels</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                        </Link>
                        <a href="mailto:support@sekagestion.com">
                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                        Support <ExternalLink className="h-3 w-3" />
                                    </p>
                                    <p className="text-xs text-gray-500">Contactez-nous</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        )}

        {/* Notifications Panel */}
        {showNotifications && (
            <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
                <div className="absolute inset-0 bg-black/20" />
                <div 
                    className="absolute right-4 top-16 w-96 max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
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
                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        className={`p-4 hover:bg-gray-50 cursor-pointer ${!notif.is_read ? "bg-blue-50/50" : ""}`}
                                    >
                                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Aucune notification</p>
                                <p className="text-sm text-gray-400 mt-1">Vous êtes à jour !</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </>
    );
}
