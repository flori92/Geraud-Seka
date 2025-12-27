import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { ArrowLeft, Check, CheckCircle, Edit2, Trash2, Loader2 } from "lucide-react";

type EntryStatus = "draft" | "validated" | "posted" | "cancelled";

type JournalType = "ACH" | "VTE" | "BQ" | "CA" | "OD";

interface EntryLine {
  id: string;
  label: string;
  debit: number;
  credit: number;
  reconciled?: boolean;
  account_code?: string;
  account_name?: string;
  account?: {
    id: string;
    account_code: string;
    account_name: string;
  } | null;
}

interface Entry {
  id: string;
  entry_number: string;
  journal_type: JournalType;
  date: string;
  reference?: string;
  description: string;
  status: EntryStatus;
  document_id?: string;
  lines: EntryLine[];
  validated_at?: string;
  posted_at?: string;
}

const statusLabels: Record<EntryStatus, string> = {
  draft: "Brouillon",
  validated: "Validé",
  posted: "Comptabilisé",
  cancelled: "Annulé",
};

const statusColors: Record<EntryStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  validated: "bg-blue-100 text-blue-700",
  posted: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AccountingEntryDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [acting, setActing] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

  const fetchEntry = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!id) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiPrefix}/accounting-entries/entries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        setError(detail || "Impossible de charger l'écriture");
        setEntry(null);
        return;
      }

      const data = (await response.json()) as Entry;
      setEntry(data);
      setError(null);
    } catch {
      setError("Impossible de charger l'écriture");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchEntry();
  }, [router.isReady, id]);

  const totals = useMemo(() => {
    const lines = entry?.lines ?? [];
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit, credit };
  }, [entry?.lines]);

  const doValidate = async () => {
    if (!entry) return;
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setActing(true);
    try {
      const response = await fetch(`${apiPrefix}/accounting-entries/entries/${entry.id}/validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry_id: entry.id }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        alert(detail || "Impossible de valider l'écriture");
        return;
      }

      await fetchEntry();
    } finally {
      setActing(false);
    }
  };

  const doPost = async () => {
    if (!entry) return;
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setActing(true);
    try {
      const response = await fetch(`${apiPrefix}/accounting-entries/entries/${entry.id}/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        alert(detail || "Impossible de comptabiliser l'écriture");
        return;
      }

      await fetchEntry();
    } finally {
      setActing(false);
    }
  };

  const doDelete = async () => {
    if (!entry) return;
    if (!confirm("Supprimer cette écriture ?")) return;

    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setActing(true);
    try {
      const response = await fetch(`${apiPrefix}/accounting-entries/entries/${entry.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        alert(detail || "Impossible de supprimer l'écriture");
        return;
      }

      router.push("/accounting/entries");
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Détail écriture - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/accounting/entries")}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Détail de l&apos;écriture</h1>
            </div>

            {entry && (
              <div className="flex items-center gap-2">
                {entry.status === "draft" && (
                  <>
                    <Link
                      href={`/accounting/entries/${entry.id}/edit`}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </Link>
                    <button
                      onClick={doValidate}
                      disabled={acting}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Valider
                    </button>
                    <button
                      onClick={doDelete}
                      disabled={acting}
                      className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </>
                )}

                {entry.status === "validated" && (
                  <button
                    onClick={doPost}
                    disabled={acting}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Comptabiliser
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
          ) : !entry ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">Écriture introuvable.</div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-500">N° écriture</div>
                    <div className="font-mono text-lg text-gray-900">{entry.entry_number}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="text-gray-900">{new Date(entry.date).toLocaleDateString("fr-FR")}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Statut</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
                      {statusLabels[entry.status]}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Totaux</div>
                    <div className="font-mono text-sm text-gray-900">
                      Débit {totals.debit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} / Crédit {totals.credit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500">Description</div>
                  <div className="text-gray-900">{entry.description || "-"}</div>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-gray-500">Référence</div>
                  <div className="text-gray-900">{entry.reference || "-"}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Lignes</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {entry.lines.map((line) => {
                        const code = line.account?.account_code || line.account_code || "";
                        const name = line.account?.account_name || line.account_name || "";
                        return (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm">
                              <span className="font-mono text-gray-900">{code || "-"}</span>
                              {name ? <span className="text-gray-500">{` - ${name}`}</span> : null}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900">{line.label}</td>
                            <td className="px-6 py-3 text-sm text-right font-mono text-gray-900">
                              {line.debit ? line.debit.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-mono text-gray-900">
                              {line.credit ? line.credit.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
