/**
 * Avoirs clients - SEKA
 * Gestion des avoirs et remboursements
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Plus,
  Search,
  Loader2,
  Download,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";

interface CreditNote {
  id: string;
  number: string;
  invoice_id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  date: string;
  amount: number;
  reason: string;
  status: "draft" | "validated" | "refunded";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CreditNotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const fetchCreditNotes = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sales/credit-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCreditNotes(data.credit_notes || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCreditNotes(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validated": return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Validé</span>;
      case "refunded": return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Remboursé</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"><Clock className="w-3 h-3" /> Brouillon</span>;
    }
  };

  const filtered = creditNotes.filter(cn => cn.number.toLowerCase().includes(searchQuery.toLowerCase()) || cn.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Avoirs - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Avoirs clients</h1>
                <p className="text-sm text-gray-500 mt-1">Gérez les avoirs et remboursements clients</p>
              </div>
              <button onClick={() => router.push("/sales/credit-notes/new")} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                <Plus className="h-4 w-4" /> Nouvel avoir
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Avoir</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facture liée</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucun avoir</td></tr>
                ) : filtered.map((cn) => (
                  <tr key={cn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cn.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cn.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cn.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(cn.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">-{formatCurrency(cn.amount)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(cn.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => router.push(`/sales/credit-notes/${cn.id}`)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Eye className="h-4 w-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Download className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
