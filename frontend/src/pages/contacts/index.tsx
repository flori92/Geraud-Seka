import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Users, RefreshCw, Search, Plus, Trash2, Loader2 } from "lucide-react";
import {
  createCRMContact,
  deleteCRMContact,
  getCRMContacts,
  type CRMContact,
  type CRMContactCreate,
} from "@/lib/api";

export default function ContactsPage() {
  const [items, setItems] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CRMContactCreate>({ first_name: "", last_name: "", email: "", phone: "" });

  const accessToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("seka_access_token");
  }, []);

  const getErrorMessage = (e: unknown) => {
    if (e instanceof Error) return e.message;
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }
    return "Une erreur est survenue";
  };

  const fetchContacts = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCRMContacts(accessToken, search || undefined);
      setItems(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const onCreate = async () => {
    if (!accessToken) return;
    setError(null);
    if (!form.first_name || !form.last_name || !form.email) {
      setError("Prénom, nom et email sont requis");
      return;
    }
    try {
      await createCRMContact(accessToken, form);
      setForm({ first_name: "", last_name: "", email: "", phone: "" });
      await fetchContacts();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  const onDelete = async (id: string) => {
    if (!accessToken) return;
    setError(null);
    try {
      await deleteCRMContact(accessToken, id);
      await fetchContacts();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <>
      <Head><title>Contacts - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Users className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Gérez vos contacts CRM</p>
                </div>
              </div>
              <button onClick={fetchContacts} disabled={loading} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="mb-6 flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom / email)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <button onClick={fetchContacts} disabled={loading} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Rechercher
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Créer un contact</h2>
                <div className="space-y-3">
                  <input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Prénom *"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  <input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Nom *"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email *"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  <input value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Téléphone"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  <button onClick={onCreate} className="w-full px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                    Créer le contact
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Liste des contacts</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#1e3a5f]" /></div>
                ) : (
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Aucun contact</div>
                    ) : (
                      items.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{c.full_name || `${c.first_name} ${c.last_name}`}</div>
                            <div className="text-sm text-gray-500 truncate">{c.email}</div>
                          </div>
                          <button onClick={() => onDelete(c.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
