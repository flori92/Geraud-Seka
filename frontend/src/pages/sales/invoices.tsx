import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreateInvoiceModal } from "@/components/forms/CreateInvoiceModal";
import { getInvoices, Invoice } from "@/lib/api";
import { Plus, Download, Send, Eye, AlertCircle, FileText, Receipt } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getInvoices(token);
      // Ensure data is an array
      setInvoices(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des factures");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure we always work with an array
  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const stats = [
    {
      label: "Total factures",
      value: invoiceList.length.toString(),
      color: "bg-blue-600"
    },
    {
      label: "Impayées",
      value: invoiceList.filter(inv => inv?.status === "Impayée" || inv?.status === "unpaid").length.toString(),
      color: "bg-red-600"
    },
    {
      label: "En retard",
      value: invoiceList.filter(inv => inv?.overdue).length.toString(),
      color: "bg-orange-600"
    },
    {
      label: "CA ce mois",
      value: Math.round(invoiceList.reduce((sum, inv) => sum + (inv?.paid || 0), 0) / 1000) + "K",
      color: "bg-green-600"
    },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "Brouillon": "default",
      "Impayée": "warning",
      "Partiellement payée": "warning",
      "Payée": "success",
      "Annulée": "error",
    };
    return variants[status] || "default";
  };

  const overdueInvoices = invoiceList.filter(inv => inv?.overdue);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv?.amount || 0), 0);

  return (
    <DashboardLayout title="Factures">
      {/* Header cohérent */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos factures clients et suivez les paiements
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/sales/quotes">
            <Button variant="secondary" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Devis
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Alert for overdue invoices */}
      {overdueInvoices.length > 0 && (
        <Alert variant="warning" title="Factures en retard" className="mb-6">
          {overdueInvoices.length} facture(s) impayée(s) pour un montant total de{" "}
          {totalOverdue.toLocaleString()} FCFA. Action requise.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-accents-6">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-3">
            <Input
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="impayee">Impayée</option>
              <option value="partielle">Partiellement payée</option>
              <option value="payee">Payée</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Invoices List */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="border-b border-accents-2">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Numéro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Échéance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Payé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accents-2">
              {invoiceList.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`hover:bg-accents-1 transition-colors ${invoice.overdue ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{invoice.id}</span>
                      {invoice.overdue && (
                        <AlertCircle className="h-4 w-4 text-error" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{invoice.client_name || invoice.number}</td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(invoice.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(invoice.due_date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {invoice.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {invoice.paid.toLocaleString()} FCFA
                      </p>
                      {invoice.paid > 0 && invoice.paid < invoice.amount && (
                        <div className="h-1.5 w-20 rounded-full bg-accents-2">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{ width: `${(invoice.paid / invoice.amount) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                        <Eye className="h-4 w-4 text-accents-5" />
                      </button>
                      <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                        <Download className="h-4 w-4 text-accents-5" />
                      </button>
                      <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                        <Send className="h-4 w-4 text-accents-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInvoices}
      />
    </DashboardLayout>
  );
}
