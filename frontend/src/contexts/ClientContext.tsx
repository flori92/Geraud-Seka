import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ClientContextType {
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedClientId = localStorage.getItem('seka_selected_client');
    if (savedClientId) {
      setSelectedClientId(savedClientId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedClientId) {
      localStorage.setItem('seka_selected_client', selectedClientId);
    } else {
      localStorage.removeItem('seka_selected_client');
    }
  }, [selectedClientId]);

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
