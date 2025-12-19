import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getActivities, createActivity, getClients, type Activity, type Client } from "@/lib/api";
import { Plus, X, Activity as ActivityIcon, Loader2 } from "lucide-react";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<"REVENUE" | "EXPENSE">("EXPENSE");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (token) {
      try {
        const data = await getActivities(token);
        setActivities(data);
        const clientsData = await getClients(token);
        setClients(clientsData);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    try {
      await createActivity({ type, date, amount: Number(amount), description, client_id: clientId || clients[0]?.id || "00000000-0000-0000-0000-000000000000" }, token);
      setShowCreate(false);
      setDate(""); setAmount(""); setDescription("");
      fetchActivities();
    } catch {
      setError("Erreur lors de la création de l&apos;activité");
    } finally {
      setCreating(false);
    }
  };

  const stats = [
    { label: "Total activités", value: activities.length, color: "bg-[#1e3a5f]" },
    { label: "Recettes", value: activities.filter(a => a.type === "REVENUE").length, color: "bg-green-600" },
    { label: "Dépenses", value: activities.filter(a => a.type === "EXPENSE").length, color: "bg-red-600" },
    { label: "Solde", value: activities.reduce((sum, a) => sum + (a.type === "REVENUE" ? a.amount : -a.amount), 0).toLocaleString(), color: "bg-blue-600" },
  ];

  return (
    <>
      <Head><title>Activités - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><ActivityIcon className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Activités</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Suivi simplifié des ventes et dépenses</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showCreate ? "Fermer" : "Nouvelle Activité"}
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="grid gap-4 md:grid-cols-4 mb-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <span className="text-lg font-bold text-white">{typeof stat.value === "number" ? stat.value : ""}</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {showCreate && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 max-w-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvelle Activité</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setType("EXPENSE")} className={`px-4 py-2 text-sm font-medium rounded-lg ${type === "EXPENSE" ? "bg-[#1e3a5f] text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>Dépense</button>
                      <button type="button" onClick={() => setType("REVENUE")} className={`px-4 py-2 text-sm font-medium rounded-lg ${type === "REVENUE" ? "bg-[#1e3a5f] text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>Recette</button>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="Ex: 50000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Vente marchandises" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </select></div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                    <button type="submit" disabled={creating} className="px-4 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d] disabled:opacity-50">
                      {creating ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activities.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">Aucune activité enregistrée.</td></tr>
                      ) : (
                        activities.map((activity) => (
                          <tr key={activity.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{new Date(activity.date).toLocaleDateString("fr-FR")}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.type === "REVENUE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {activity.type === "REVENUE" ? "Recette" : "Dépense"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{activity.description || "-"}</td>
                            <td className="px-4 py-3 text-sm font-medium">
                              <span className={activity.type === "REVENUE" ? "text-green-600" : "text-red-600"}>
                                {activity.type === "REVENUE" ? "+" : "-"} {activity.amount.toLocaleString()} FCFA
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
