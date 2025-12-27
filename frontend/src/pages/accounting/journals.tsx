import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Download } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/layout/Container";
import { FilterBar, type FilterConfig } from "@/components/accounting-ui/FilterBar";
import { DataTable, type Column } from "@/components/accounting-ui/DataTable";
import { EmptyState } from "@/components/accounting-ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastContainer";
import { getAccountingEntries, type AccountingEntryListItem } from "@/lib/api";

type JournalType = "ACH" | "VTE" | "BQ" | "CA" | "OD";

const journalLabels: Record<JournalType, string> = {
  ACH: "Journal des achats",
  VTE: "Journal des ventes",
  BQ: "Journal de banque",
  CA: "Journal de caisse",
  OD: "Opérations diverses",
};

type JournalRow = {
  id: string;
  date: string;
  piece: string;
  journal: string;
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  status: string;
};

function normalizeEntry(e: AccountingEntryListItem): JournalRow {
  const amount = typeof e.amount === "number" ? e.amount : 0;
  const debit = typeof e.debit === "number" ? e.debit : amount;
  const credit = typeof e.credit === "number" ? e.credit : 0;

  return {
    id: e.id,
    date: e.date,
    piece: e.entry_number || e.reference || "-",
    journal: e.journal_type || "-",
    compte: e.account_code || "-",
    libelle: e.description || "-",
    debit,
    credit,
    status: e.status || "-",
  };
}

export default function JournalsPage() {
  const router = useRouter();
  const { error: showErrorToast } = useToast();

  const journalTypeFromQuery = router.query.type as JournalType | undefined;
  const validJournalTypes: JournalType[] = ["ACH", "VTE", "BQ", "CA", "OD"];
  const initialJournal: JournalType =
    router.isReady && journalTypeFromQuery && validJournalTypes.includes(journalTypeFromQuery)
      ? journalTypeFromQuery
      : "ACH";

  const [selectedJournal, setSelectedJournal] = useState<JournalType>(initialJournal);
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<Record<string, any>>({
    status: "",
    date: "",
    search: "",
  });

  useEffect(() => {
    if (router.isReady && journalTypeFromQuery && validJournalTypes.includes(journalTypeFromQuery)) {
      setSelectedJournal(journalTypeFromQuery);
    }
  }, [journalTypeFromQuery, router.isReady]);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const data = await getAccountingEntries(token, {
        journal_type: selectedJournal,
        status: filters.status || undefined,
        start_date: filters.date || undefined,
        end_date: filters.date || undefined,
        search: filters.search || undefined,
        skip: 0,
        limit: 200,
      });
      setRows(data.map(normalizeEntry));
    } catch (e: any) {
      const msg = "Impossible de charger les écritures comptables";
      showErrorToast(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchData();
  }, [router.isReady, selectedJournal, filters.status, filters.date, filters.search]);

  const filterConfig: FilterConfig[] = [
    {
      id: "status",
      label: "Statut",
      type: "select",
      placeholder: "Tous les statuts",
      options: [
        { value: "", label: "Tous les statuts" },
        { value: "draft", label: "Brouillon" },
        { value: "pending", label: "En attente" },
        { value: "validated", label: "Validé" },
      ],
    },
    {
      id: "date",
      label: "Date",
      type: "date",
      placeholder: "Date",
    },
    {
      id: "search",
      label: "Recherche",
      type: "search",
      placeholder: "Rechercher...",
    },
  ];

  const columns: Column<JournalRow>[] = useMemo(
    () => [
      {
        id: "date",
        header: "Date",
        accessor: (row) => new Date(row.date).toLocaleDateString("fr-FR"),
        sortable: true,
      },
      {
        id: "piece",
        header: "Pièce",
        accessor: (row) => <span className="font-mono text-primary-700">{row.piece}</span>,
        sortable: true,
      },
      {
        id: "journal",
        header: "Journal",
        accessor: (row) => <Badge variant="neutral">{row.journal}</Badge>,
      },
      {
        id: "compte",
        header: "Compte",
        accessor: (row) => <span className="font-mono">{row.compte}</span>,
        sortable: true,
      },
      {
        id: "libelle",
        header: "Libellé",
        accessor: "libelle",
      },
      {
        id: "debit",
        header: "Débit",
        accessor: (row) => (row.debit > 0 ? `${row.debit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA` : "-"),
        className: "text-right font-mono",
      },
      {
        id: "credit",
        header: "Crédit",
        accessor: (row) => (row.credit > 0 ? `${row.credit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA` : "-"),
        className: "text-right font-mono",
      },
      {
        id: "status",
        header: "Statut",
        accessor: (row) => <Badge variant="neutral">{row.status}</Badge>,
      },
    ],
    []
  );

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const downloadExport = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("journal_types", selectedJournal);
      if (filters.status) params.append("statuses", filters.status);
      if (filters.date) {
        params.append("date_from", filters.date);
        params.append("date_to", filters.date);
      }
      if (filters.search) params.append("description", filters.search);

      const response = await fetch(`/api/v1/accounting-entries/entries/export/csv?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const detailText = await response.text().catch(() => "");
        showErrorToast(detailText || "Impossible d'exporter les écritures");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_journal_${selectedJournal}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showErrorToast("Impossible d'exporter les écritures");
    } finally {
      setExporting(false);
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;
    const { key, direction } = sortConfig;
    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return direction === "asc" ? -1 : 1;
      if (bv == null) return direction === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return direction === "asc" ? av - bv : bv - av;
      return direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <>
      <Head>
        <title>Journaux - SEKA</title>
      </Head>

      <DashboardLayout title="Journaux comptables">
        <PageHeader
          title="Journaux comptables"
          description="Consultez et gérez les écritures par journal"
          action={
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              onClick={downloadExport}
              disabled={exporting}
            >
              <Download className="w-4 h-4" />
              {exporting ? "Export..." : "Exporter"}
            </button>
          }
        />

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center border-b border-neutral-200 px-4">
            {(Object.keys(journalLabels) as JournalType[]).map((journal) => (
              <button
                key={journal}
                onClick={() => {
                  setSelectedJournal(journal);
                  router.push(`/accounting/journals?type=${journal}`, undefined, { shallow: true });
                }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedJournal === journal
                    ? "border-primary-500 text-primary-700"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {journalLabels[journal]}
              </button>
            ))}
          </div>

          <div className="px-4">
            <FilterBar
              filters={filterConfig}
              values={filters}
              onChange={(id, value) => setFilters((prev) => ({ ...prev, [id]: value }))}
              onReset={() => setFilters({ status: "", date: "", search: "" })}
            />
          </div>

          <div className="p-4">
            <DataTable
              columns={columns}
              data={sortedRows}
              getRowId={(r) => r.id}
              isLoading={loading}
              sortConfig={sortConfig}
              onSort={handleSort}
              emptyState={
                <EmptyState
                  title="Aucune écriture"
                  description="Aucune écriture n'est disponible pour ce journal."
                />
              }
            />
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
