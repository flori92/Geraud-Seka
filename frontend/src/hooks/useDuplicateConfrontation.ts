import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Duplicate {
  id: string;
  detection_reason: string;
  new_document: {
    id: string;
    filename: string;
    supplier_name: string;
    reference_number: string;
    document_date: string | null;
    amount_ttc: number | null;
    file_path: string;
  };
  existing_document: {
    id: string;
    filename: string;
    supplier_name: string;
    reference_number: string;
    document_date: string | null;
    amount_ttc: number | null;
    status: string;
    file_path: string;
    created_at: string | null;
  };
  comparison: {
    fields: Array<{
      field: string;
      label: string;
      new_value: string | null;
      existing_value: string | null;
      identical: boolean;
    }>;
    all_identical: boolean;
  };
}

interface PendingDuplicate {
  id: string;
  detection_reason: string;
  new_document: {
    id: string;
    filename: string;
    supplier_name: string;
    reference_number: string;
    amount_ttc: number | null;
    };
  created_at: string | null;
}

export function useDuplicateConfrontation() {
  const [pendingDuplicates, setPendingDuplicates] = useState<PendingDuplicate[]>([]);
  const [currentDuplicate, setCurrentDuplicate] = useState<Duplicate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les doublons en attente
  const loadPendingDuplicates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/duplicates/pending');
      setPendingDuplicates(response.data);
    } catch (err: any) {
      console.error('Erreur chargement doublons en attente:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des doublons');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les détails d'un doublon pour confrontation
  const loadDuplicateForConfrontation = async (duplicateId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/duplicates/${duplicateId}/confrontation`);
      setCurrentDuplicate(response.data);
    } catch (err: any) {
      console.error('Erreur chargement confrontation doublon:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement du doublon');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Résoudre un doublon
  const resolveDuplicate = async (duplicateId: string, resolution: string, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post(`/duplicates/${duplicateId}/resolve`, {
        resolution,
        resolution_reason: reason
      });

      // Recharger la liste des doublons en attente
      await loadPendingDuplicates();
      
      // Fermer la modal
      setCurrentDuplicate(null);
      
      return true;
    } catch (err: any) {
      console.error('Erreur résolution doublon:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la résolution du doublon');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Effacer l'erreur
  const clearError = () => setError(null);

  // Effacer le doublon courant
  const clearCurrentDuplicate = () => setCurrentDuplicate(null);

  // Auto-chargement au montage
  useEffect(() => {
    loadPendingDuplicates();
  }, []);

  return {
    pendingDuplicates,
    currentDuplicate,
    isLoading,
    error,
    loadPendingDuplicates,
    loadDuplicateForConfrontation,
    resolveDuplicate,
    clearError,
    clearCurrentDuplicate
  };
}
