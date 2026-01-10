import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLayout } from '@/contexts/LayoutContext';
import {
    Users, TrendingUp, AlertCircle, CheckCircle,
    Search, ArrowRight, Building
} from 'lucide-react';
import { getClients } from '@/lib/api';

interface TenantStats {
    id: string;
    name: string;
    slug: string;
    sector: string;
    pending_docs: number;
    last_activity: string;
}

export default function CabinetDashboard() {
    const router = useRouter();
    const { setAppMode, setCurrentTenant } = useLayout();
    const [tenants, setTenants] = useState<TenantStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('seka_access_token');
            if (!token) return;

            // In a real scenario, we might need a specific endpoint to get stats per tenant
            // For now, we fetch the list of available tenants (clients of the cabinet)
            const clients = await getClients(token);

            // Mocking stats for MVP since API might not return them all yet
            const mockTenants = clients.map((c: any) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                sector: c.sector || 'N/A',
                pending_docs: Math.floor(Math.random() * 20), // Placeholder
                last_activity: new Date().toISOString() // Placeholder
            }));

            setTenants(mockTenants);
        } catch (error) {
            console.error("Error fetching cabinet clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterClient = (tenant: TenantStats) => {
        // Switch context to this tenant and enter Enterprise mode
        setCurrentTenant({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            sector: tenant.sector,
            tenant_id: tenant.id // Assuming client ID is the tenant ID for context
        });
        setAppMode('ENTREPRISE');
        router.push('/dashboard');
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.sector.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head>
                <title>Cabinet Dashboard - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Cabinet</h1>
                            <p className="text-gray-500">Vue d'ensemble de vos dossiers clients</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un dossier..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f] w-64"
                                />
                            </div>
                            <button className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172e4d] flex items-center gap-2">
                                <PlusIcon className="w-4 h-4" /> Nouveau dossier
                            </button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+2 this month</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{tenants.length}</div>
                            <div className="text-sm text-gray-500">Dossiers actifs</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {tenants.reduce((acc, t) => acc + t.pending_docs, 0)}
                            </div>
                            <div className="text-sm text-gray-500">Documents à traiter</div>
                        </div>
                        {/* More stats... */}
                    </div>

                    {/* Clients Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTenants.map((tenant) => (
                            <div key={tenant.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                            {tenant.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-[#1e3a5f] transition-colors">{tenant.name}</h3>
                                            <span className="text-xs text-gray-500 block">{tenant.sector}</span>
                                        </div>
                                    </div>
                                    <div className="p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <MoreVerticalIcon className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Documents en attente</span>
                                        <span className={`font-medium ${tenant.pending_docs > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                                            {tenant.pending_docs}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Dernière activité</span>
                                        <span className="text-gray-900">Today</span>
                                    </div>

                                    <button
                                        onClick={() => handleEnterClient(tenant)}
                                        className="w-full mt-2 py-2 px-3 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-[#1e3a5f] hover:text-white transition-colors flex items-center justify-center gap-2 group-hover:bg-[#1e3a5f] group-hover:text-white"
                                    >
                                        Accéder au dossier <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}

const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
)
const MoreVerticalIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
)
