import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getClients, createClient, type Client } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContainer";
import { Plus, Users, Search, Eye, RefreshCw, Loader2, X } from "lucide-react";

export default function ClientsPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [sector, setSector] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchClients = async () => {
        setLoading(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) { router.push("/login"); return; }
        try {
            const data = await getClients(token);
            setClients(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            await createClient({ name, slug, sector }, token);
            success("Client créé avec succès !");
            setShowCreate(false);
            setName(""); setSlug(""); setSector("");
            fetchClients();
        } catch (error: unknown) {
            console.error(error);
            showError("Erreur lors de la création du client");
        } finally {
            setCreating(false);
        }
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Clients - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                <PennylaneSidebar />
                <main className="ml-[220px]">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
                                <p className="text-sm text-gray-600 mt-0.5">Gérez vos dossiers clients</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchClients} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                    <RefreshCw className="h-5 w-5" />
                                </button>
                                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                                    <Plus className="h-4 w-4" />
                                    Nouveau client
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Total clients</span>
                                    <Users className="h-4 w-4 text-[#1e3a5f]" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Actifs</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{clients.length}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Secteurs</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{new Set(clients.map(c => c.sector).filter(Boolean)).size}</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un client..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifiant</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-500">Aucun client trouvé</td>
                                        </tr>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <tr key={client.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{client.slug}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{client.sector || "-"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">Actif</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => router.push(`/clients/${client.id}`)} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] rounded">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <span className="text-sm text-gray-500">{filteredClients.length} client(s)</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Création */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreate(false)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Nouveau Client</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Acme Corp" required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant (Slug)</label>
                                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: acme-corp" required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d&apos;activité</label>
                                <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: Commerce"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                                <button type="submit" disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d] disabled:opacity-50">
                                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
