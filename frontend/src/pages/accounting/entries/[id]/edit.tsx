import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";

type EntryStatus = "draft" | "validated" | "posted" | "cancelled";

type JournalType = "ACH" | "VTE" | "BQ" | "CA" | "OD";

interface Entry {
  id: string;
  entry_number: string;
  journal_type: JournalType;
  date: string;
  reference?: string;
  description: string;
  status: EntryStatus;
}

export default function AccountingEntryEditPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);

  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

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
      setDate(data.date ? String(data.date).slice(0, 10) : "");
      setReference(data.reference || "");
      setDescription(data.description || "");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id]);

  const handleSave = async () => {
    if (!entry) return;

    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${apiPrefix}/accounting-entries/entries/${entry.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          reference: reference || null,
          description,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        alert(detail || "Impossible d'enregistrer");
        return;
      }

      router.push(`/accounting/entries/${entry.id}`);
    } catch {
      alert("Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Modifier écriture - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Modifier l&apos;écriture</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(entry ? `/accounting/entries/${entry.id}` : "/accounting/entries")}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !entry || entry.status !== "draft" || !date || !description}
                className="flex items-center gap-2 px-3 py-2 bg-[#0d4a44] text-white rounded-lg text-sm hover:bg-[#0a3d38] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0d4a44]" />
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
          ) : !entry ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">Écriture introuvable.</div>
          ) : entry.status !== "draft" ? (
            <div className="bg-white border border-yellow-200 text-yellow-800 rounded-lg p-4">
              Seules les écritures en brouillon peuvent être modifiées.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44]"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
