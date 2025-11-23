import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Plus, Download, Send, Eye, AlertCircle } from "lucide-react";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const invoices = [
    {
      id: "FACT-2025-001",
      client: "SARL TechnoSoft",
      date: "2025-11-20",
      dueDate: "2025-12-20",
      amount: 125000,
      paid: 0,
      status: "Impayée",
      overdue: false,
    },
    {
      id: "FACT-2025-002",
      client: "Cabinet Avocat Legalis",
      date: "2025-11-15",
      dueDate: "2025-12-15",
      amount: 85000,
      paid: 85000,
      status: "Payée",
      overdue: false,
    },
    {
      id: "FACT-2025-003",
      client: "Entreprise ABC",
      date: "2025-11-10",
      dueDate: "2025-12-10",
      amount: 200000,
      paid: 100000,
      status: "Partiellement payée",
      overdue: false,
    },
    {
      id: "FACT-2025-004",
      client: "Restaurant Le Palais",
      date: "2025-10-15",
      dueDate: "2025-11-15",
      amount: 45000,
      paid: 0,
      status: "Impayée",
      overdue: true,
    },
  ];

  const stats = [
    { label: "Total factures", value: "24", color: "bg-blue-600" },
    { label: "Impayées", value: "8", color: "bg-red-600" },
    { label: "En retard", value: "3", color: "bg-orange-600" },
    { label: "CA ce mois", value: "320K", color: "bg-green-600" },
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

  const overdueInvoices = invoices.filter(inv => inv.overdue);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <DashboardLayout title="Factures">
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

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
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
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      </Card>

      {/* Invoices List */}
      <Card>
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
              {invoices.map((invoice) => (
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
                  <td className="px-4 py-3 text-sm text-foreground">{invoice.client}</td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(invoice.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
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
      </Card>
    </DashboardLayout>
  );
}
