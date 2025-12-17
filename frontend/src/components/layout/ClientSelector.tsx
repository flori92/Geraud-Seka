"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Building2, Check, Plus, Search } from "lucide-react";
import { getClients, type Client } from "@/lib/api";

interface ClientSelectorProps {
    onChange?: (client: Client | null) => void;
}

export default function ClientSelector({ onChange }: ClientSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem("seka_access_token");
                if (token) {
                    const data = await getClients(token);
                    setClients(data);

                    // Restore previously selected client from localStorage
                    const savedClientId = localStorage.getItem("seka_selected_client");
                    if (savedClientId) {
                        const saved = data.find((c) => c.id === savedClientId);
                        if (saved) {
                            setSelectedClient(saved);
                            onChange?.(saved);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch clients:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectClient = (client: Client | null) => {
        setSelectedClient(client);
        if (client) {
            localStorage.setItem("seka_selected_client", client.id);
        } else {
            localStorage.removeItem("seka_selected_client");
        }
        onChange?.(client);
        setIsOpen(false);
        setSearch("");
    };

    const filteredClients = search
        ? clients.filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.slug?.toLowerCase().includes(search.toLowerCase())
        )
        : clients;

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm min-w-[200px]"
            >
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                    {loading ? "Chargement..." : selectedClient?.name || "Tous les clients"}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher un client..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* All clients option */}
                    <div className="max-h-64 overflow-y-auto">
                        <button
                            onClick={() => handleSelectClient(null)}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!selectedClient ? "bg-blue-50" : ""
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-gray-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    Tous les clients
                                </span>
                            </div>
                            {!selectedClient && <Check className="h-4 w-4 text-blue-600" />}
                        </button>

                        {/* Client list */}
                        {filteredClients.map((client) => (
                            <button
                                key={client.id}
                                onClick={() => handleSelectClient(client)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedClient?.id === client.id ? "bg-blue-50" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-700">
                                            {client.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{client.name}</p>
                                        {client.sector && (
                                            <p className="text-xs text-gray-500">{client.sector}</p>
                                        )}
                                    </div>
                                </div>
                                {selectedClient?.id === client.id && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                )}
                            </button>
                        ))}

                        {filteredClients.length === 0 && (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                Aucun client trouvé
                            </div>
                        )}
                    </div>

                    {/* Add new client */}
                    <div className="border-t border-gray-100 p-2">
                        <a
                            href="/clients"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter un client
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
