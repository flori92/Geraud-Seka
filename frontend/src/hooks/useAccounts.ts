/**
 * Hook pour acceder au referentiel SYSCOHADA
 *
 * Fonctionnalites:
 * - Recherche de comptes par numero ou libelle
 * - Navigation hierarchique du plan comptable
 * - Categories fournisseurs
 * - Auto-suggestion de compte pour fournisseurs
 */
import { useState, useCallback } from "react";
import { api } from "@/lib/api";

// =============================================================================
// TYPES
// =============================================================================

export interface SyscohadaAccount {
  id?: string;
  account_number: string;
  account_label: string;
  account_class: number;
  parent_account?: string;
  level?: number;
  is_detail: boolean;
  description?: string;
}

export interface SupplierCategory {
  id: string;
  code: string;
  label: string;
  default_charge_account: string;
  keywords: string[];
}

export interface AccountSuggestion {
  category: SupplierCategory | null;
  charge_account: string;
  confidence: number;
  source: string;
}

export interface HierarchyChild {
  number: string;
  label: string;
  is_detail: boolean;
}

export interface HierarchyAccount {
  label: string;
  is_detail: boolean;
  children: HierarchyChild[];
}

export interface HierarchyClass {
  label: string;
  accounts: Record<string, HierarchyAccount>;
}

export type AccountHierarchy = Record<number, HierarchyClass>;

// =============================================================================
// HOOK
// =============================================================================

export function useAccounts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Recherche de comptes par numero ou libelle
   */
  const searchAccounts = useCallback(
    async (query: string, limit: number = 20): Promise<SyscohadaAccount[]> => {
      if (!query || query.length < 1) return [];

      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/syscohada/accounts/search", {
          params: { q: query, limit },
        });
        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur de recherche";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Recupere l'arborescence complete pour navigation
   */
  const getHierarchy = useCallback(async (): Promise<AccountHierarchy> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/syscohada/accounts/hierarchy");
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Liste les categories fournisseurs
   */
  const getCategories = useCallback(async (): Promise<SupplierCategory[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/syscohada/categories");
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Suggere un compte et categorie pour un nom de fournisseur
   */
  const suggestAccount = useCallback(
    async (name: string): Promise<AccountSuggestion | null> => {
      if (!name || name.length < 2) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/syscohada/suggest", {
          params: { name },
        });
        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur de suggestion";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Liste tous les comptes d'une classe
   */
  const getAccountsByClass = useCallback(
    async (accountClass: number, detailOnly: boolean = true): Promise<SyscohadaAccount[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/syscohada/accounts", {
          params: { account_class: accountClass, detail_only: detailOnly },
        });
        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur de chargement";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    searchAccounts,
    getHierarchy,
    getCategories,
    suggestAccount,
    getAccountsByClass,
  };
}

export default useAccounts;
