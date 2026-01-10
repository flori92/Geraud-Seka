import Head from 'next/head';
import { useRouter } from 'next/router';
import { Users, Plus, Search, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getClients } from '@/lib/api';

interface Client {
    id: string;
    name: string;
    email?: string;
    sector?: string;
}

export default function CabinetClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            const token = localStorage.getItem('seka_access_token');
            if (!token) return;
            try {
                const data = await getClients(token);
                setClients(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    return (
        <>
            <Head><title>Mes Clients - Cabinet</title></Head>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Mes Clients</h1>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg">
                        <Plus className="w-4 h-4" /> Nouveau Client
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-6 text-center">Chargement...</td></tr>
                                ) : clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{client.sector || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{client.email || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 rounded-full">
                                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
