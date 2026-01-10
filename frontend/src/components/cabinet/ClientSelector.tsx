import { useState, useEffect } from "react";
import { ChevronDown, Building2, ArrowLeft } from "lucide-react";

interface Client {
  id: string;
  name: string;
  slug: string;
}

interface ClientSelectorProps {
  onClientChange: (clientId: string | null) => void;
  currentClientId: string | null;
}

export default function ClientSelector({ onClientChange, currentClientId }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Erreur chargement clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentClient = clients.find(c => c.id === currentClientId);

  if (loading) {
    return (
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
      </div>
    );
  }

  return (
    <div className="relative bg-white border-b border-gray-200">
      <div className="px-4 py-2 flex items-center justify-between">
        {currentClientId ? (
          <>
            <button
              onClick={() => onClientChange(null)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Mes clients
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Client:</span>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 font-medium"
              >
                <Building2 className="h-4 w-4" />
                {currentClient?.name || "Sélectionner"}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-gray-900">Mode Cabinet - Mes Clients</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-4 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Sélectionner un client
              </div>
              {clients.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  Aucun client disponible
                </div>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      onClientChange(client.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left ${
                      currentClientId === client.id ? "bg-primary-50 text-primary-700" : ""
                    }`}
                  >
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{client.name}</div>
                      <div className="text-xs text-gray-500 truncate">{client.slug}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
