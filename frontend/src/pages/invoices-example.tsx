/**
 * Page de gestion des Factures - Utilisant l'API Backend
 * Démontre l'intégration avec les endpoints /api/v1/invoices-public
 * 
 * En production, utiliser les endpoints sécurisés /api/v1/sales-invoices avec authentification
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Trash2, Eye, Edit, Plus, Filter, Download } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Container, Grid, PageHeader, Flex } from "@/components/layout/Container";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useInvoices, useInvoiceStats } from "@/lib/hooks/useInvoices";
import { InvoiceResponse } from "@/lib/api/invoices.types";

// ========== TYPES ==========

type InvoiceStatus = "draft" | "pending" | "paid" | "overdue";

// ========== COMPONENTS ==========

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
}

function StatCard({ title, value, change, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-neutral-600 mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {change && (
            <span
              className={`text-xs font-medium ${
                trend === "up" ? "text-status-success" : "text-status-danger"
              }`}
            >
              {trend === "up" ? "↑" : "↓"} {change}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InvoiceRowProps {
  invoice: InvoiceResponse;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function InvoiceRow({ invoice, onView, onEdit, onDelete }: InvoiceRowProps) {
  const statusVariantMap: Record<
    InvoiceStatus,
    "success" | "warning" | "danger" | "neutral"
  > = {
    paid: "success",
    pending: "warning",
    draft: "neutral",
    overdue: "danger",
  };

  const statusLabelMap: Record<InvoiceStatus, string> = {
    paid: "Payée",
    pending: "En attente",
    draft: "Brouillon",
    overdue: "En retard",
  };

  return (
    <TableRow>
      <TableCell className="font-medium text-primary-600">{invoice.reference_number}</TableCell>
      <TableCell>{invoice.client_id}</TableCell>
      <TableCell align="right" monospace>
        {formatCurrency(invoice.total_ttc)}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariantMap[invoice.status as InvoiceStatus]}>
          {statusLabelMap[invoice.status as InvoiceStatus]}
        </Badge>
      </TableCell>
      <TableCell muted>{formatDate(invoice.invoice_date)}</TableCell>
      <TableCell muted>{formatDate(invoice.due_date)}</TableCell>
      <TableCell align="right">
        <Flex gap="sm" justify="end">
          <button
            onClick={() => onView(invoice.id)}
            className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Voir"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(invoice.id)}
            className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Éditer"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(invoice.id)}
            className="p-2 text-neutral-500 hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Flex>
      </TableCell>
    </TableRow>
  );
}

// ========== MAIN PAGE ==========

export default function InvoicesPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");

  // Récupérer les données de l'API
  const { invoices, total, loading, error } = useInvoices(
    0,
    20,
    filterStatus === "all" ? undefined : (filterStatus as InvoiceStatus)
  );
  const { stats: statsData, loading: statsLoading } = useInvoiceStats();

  // Handlers
  const handleView = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/invoices/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    // TODO: Implémenter la suppression
    console.log("Delete:", id);
  };

  return (
    <Container size="lg" className="py-8">
      {/* Page Header */}
      <PageHeader
        title="Factures"
        description="Gérez et suivez vos factures de vente"
        action={
          <Flex gap="md">
            <Button variant="secondary" icon={<Download />} size="md">
              Exporter
            </Button>
            <Button variant="primary" icon={<Plus />} size="md">
              Nouvelle facture
            </Button>
          </Flex>
        }
      />

      {/* Statistics Cards */}
      <Grid columns={4} gap="md" className="mb-8">
        <StatCard
          title="Total des factures"
          value={formatCurrency(statsData?.total_amount ?? 0)}
          change="12%"
          trend="up"
        />
        <StatCard
          title="Factures payées"
          value={formatCurrency(statsData?.paid_amount ?? 0)}
          change="5%"
          trend="up"
        />
        <StatCard
          title="En attente"
          value={formatCurrency(statsData?.pending_amount ?? 0)}
          change="3%"
          trend="down"
        />
        <StatCard
          title="En retard"
          value={formatCurrency(statsData?.overdue_amount ?? 0)}
          change="2"
          trend="down"
        />
      </Grid>

      {/* Filters and Table */}
      <Card variant="elevated">
        {/* Filters */}
        <CardHeader>
          <CardTitle className="text-lg">Factures</CardTitle>
          <Flex gap="md" className="mt-4" wrap>
            {(
              [
                { label: "Toutes", value: "all" },
                { label: "Brouillon", value: "draft" },
                { label: "En attente", value: "pending" },
                { label: "Payées", value: "paid" },
                { label: "En retard", value: "overdue" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === filter.value
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </Flex>
        </CardHeader>

        {/* Table */}
        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-12 text-neutral-600">
              <p className="mb-2">Chargement des factures...</p>
            </div>
          ) : invoices.length === 0 ? (
            <TableEmpty message="Aucune facture trouvée" />
          ) : (
            <Table striped compact>
              <TableHead>
                <TableRow>
                  <TableHeader sortable>Numéro</TableHeader>
                  <TableHeader sortable>Client</TableHeader>
                  <TableHeader align="right" sortable>
                    Montant
                  </TableHeader>
                  <TableHeader sortable>Statut</TableHeader>
                  <TableHeader sortable>Date</TableHeader>
                  <TableHeader sortable>Échéance</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
