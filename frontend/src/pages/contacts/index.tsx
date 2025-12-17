import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
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

  const [form, setForm] = useState<CRMContactCreate>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const accessToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("seka_access_token");
  }, []);

  const getErrorMessage = (e: unknown) => {
    if (e instanceof Error) {
      return e.message;
    }

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
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <button
            onClick={fetchContacts}
            className="px-4 py-2 rounded bg-slate-900 text-white"
            disabled={loading}
          >
            Rafraîchir
          </button>
        </div>

        <div className="mb-4 flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom / email)"
            className="border rounded px-3 py-2 w-full max-w-md"
          />
          <button
            onClick={fetchContacts}
            className="px-4 py-2 rounded border"
            disabled={loading}
          >
            Rechercher
          </button>
        </div>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-3">Créer un contact</h2>
            <div className="grid grid-cols-1 gap-3">
              <input
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                placeholder="Prénom"
                className="border rounded px-3 py-2"
              />
              <input
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                placeholder="Nom"
                className="border rounded px-3 py-2"
              />
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="border rounded px-3 py-2"
              />
              <input
                value={form.phone || ""}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Téléphone"
                className="border rounded px-3 py-2"
              />
              <button onClick={onCreate} className="px-4 py-2 rounded bg-blue-600 text-white">
                Créer
              </button>
            </div>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-3">Liste</h2>
            {loading ? (
              <div>Chargement…</div>
            ) : (
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-slate-500">Aucun contact</div>
                ) : (
                  items.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border rounded px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.full_name || `${c.first_name} ${c.last_name}`}</div>
                        <div className="text-sm text-slate-600 truncate">{c.email}</div>
                      </div>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="px-3 py-1.5 rounded border text-red-600"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
