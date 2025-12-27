/**
 * Hook React personnalisé pour la gestion des factures
 * Utilise l'API backend pour récupérer les données en temps réel
 */

import { useState, useEffect, useCallback } from "react";
import { InvoiceResponse, InvoiceStats, InvoiceListResponse, InvoiceStatus } from "@/lib/api/invoices.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/**
 * Hook pour récupérer la liste des factures avec pagination
 */
export function useInvoices(
  skip: number = 0,
  limit: number = 20,
  status?: InvoiceStatus,
  search?: string
) {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          skip: String(skip),
          limit: String(limit),
          ...(status && { status }),
          ...(search && { search }),
        });

        const response = await fetch(`${API_BASE}/invoices-public?${params}`);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data: InvoiceListResponse = await response.json();
        setInvoices(data.items);
        setTotal(data.total);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la récupération des factures:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [skip, limit, status, search]);

  return { invoices, total, loading, error };
}

/**
 * Hook pour récupérer les stats des factures
 */
export function useInvoiceStats() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/invoices-public/stats`);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data: InvoiceStats = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la récupération des stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

/**
 * Hook pour récupérer une facture spécifique
 */
export function useInvoice(invoiceId: string | null) {
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(!!invoiceId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/invoices-public/${invoiceId}`);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data: InvoiceResponse = await response.json();
        setInvoice(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors de la récupération de la facture:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  return { invoice, loading, error };
}
