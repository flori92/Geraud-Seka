/**
 * Page Clients - Style Pennylane
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PageHeader } from '@/components/pennylane/PageHeader';
import { ControlBar } from '@/components/pennylane/ControlBar';
import { DataTable, Column } from '@/components/pennylane/DataTable';
import { Drawer } from '@/components/pennylane/Drawer';
import { StatsCard } from '@/components/pennylane/StatsCard';
import {
    Plus, Users, Mail, Phone, MapPin, FileText,
    CreditCard, TrendingDown, Eye, History, AlertCircle
} from 'lucide-react';

const Badge = ({ children, variant }: { children: React.ReactNode; variant?: string }) => {
    const colors = variant === 'success' ? 'bg-green-50 text-green-700' :
        variant === 'danger' ? 'bg-red-50 text-red-700' :
            variant === 'warning' ? 'bg-orange-50 text-orange-700' :
                'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>{children}</span>;
};

const Button = ({ children, variant, size, className, onClick }: { children: React.ReactNode; variant?: string; size?: string; className?: string; onClick?: () => void }) => {
    const base = variant === 'secondary' ? 'border border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-[#1e3a5f] text-white hover:bg-[#172e4d]';
    const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';
    return <button onClick={onClick} className={`flex items-center gap-2 rounded-lg font-medium ${base} ${sizeClass} ${className || ''}`}>{children}</button>;
};

interface ClientRow {
    id: string;
    client_name: string;
    client_code: string;
    balance: number;
    overdue_amount: number;
    upcoming_30d_amount: number;
    invoices_count: number;
    contact_email?: string;
    contact_phone?: string;
    last_invoice_date?: string;
    last_invoice_number?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('seka_access_token');
            // Using /balance endpoint for rich data
            const response = await fetch(`${API_BASE_URL}/api/v1/clients/balance?limit=500`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (error) {
            console.error('Erreur chargement clients:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const filteredClients = clients.filter((c) => {
        if (search) {
            const q = search.toLowerCase();
            if (!c.client_name.toLowerCase().includes(q) &&
                !c.client_code.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0);
    const totalOverdue = clients.reduce((sum, c) => sum + c.overdue_amount, 0);
    const activeCount = clients.filter(c => c.balance > 0).length;

    const columns: Column<ClientRow>[] = [
        {
            id: 'code',
            header: 'Code',
            accessor: 'client_code',
            width: '100px',
            cell: (row) => (
                <span className="font-mono text-sm text-blue-600">{row.client_code}</span>
            ),
        },
        {
            id: 'name',
            header: 'Client',
            accessor: 'client_name',
            sortable: true,
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.client_name}</div>
                    <div className="text-xs text-gray-500">{row.contact_email || '-'}</div>
                </div>
            ),
        },
        {
            id: 'invoices',
            header: 'Factures',
            accessor: 'invoices_count',
            align: 'center',
            width: '100px',
            cell: (row) => <Badge variant="neutral">{row.invoices_count}</Badge>,
        },
        {
            id: 'balance',
            header: 'Solde Dû',
            accessor: 'balance',
            align: 'right',
            sortable: true,
            cell: (row) => (
                <span className={row.balance > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}>
                    {formatCurrency(row.balance)}
                </span>
            ),
        },
        {
            id: 'overdue',
            header: 'En Retard',
            accessor: 'overdue_amount',
            align: 'right',
            sortable: true,
            cell: (row) => row.overdue_amount > 0 ? (
                <span className="text-red-600 font-medium">
                    {formatCurrency(row.overdue_amount)}
                </span>
            ) : <span className="text-gray-400">-</span>,
        },
    ];

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        // TODO: Implement export endpoint in backend if not exists
        console.log('Export format:', format);
        alert("Export bientôt disponible");
    };

    return (
        <>
            <Head>
                <title>Clients - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                <div className="h-full flex flex-col">
                    <PageHeader
                        breadcrumb={[
                            { label: 'Ventes', href: '/ventes' },
                            { label: 'Clients' },
                        ]}
                        onRefresh={fetchClients}
                        actions={
                            <Button onClick={() => router.push('/clients/new')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Nouveau client
                            </Button>
                        }
                    />

                    {/* Stats */}
                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 border-b">
                        <StatsCard
                            title="Total Clients"
                            value={clients.length}
                            icon={<Users className="w-6 h-6 text-blue-600" />}
                            iconBgColor="bg-blue-100"
                        />
                        <StatsCard
                            title="Clients avec Solde"
                            value={activeCount}
                            icon={<AlertCircle className="w-6 h-6 text-orange-600" />}
                            iconBgColor="bg-orange-100"
                        />
                        <StatsCard
                            title="Encours Client Total"
                            value={formatCurrency(totalBalance)}
                            valueColor={totalBalance > 0 ? 'default' : 'default'}
                            icon={<CreditCard className="w-6 h-6 text-blue-600" />}
                            iconBgColor="bg-blue-100"
                        />
                        <StatsCard
                            title="Montant en Retard"
                            value={formatCurrency(totalOverdue)}
                            valueColor={totalOverdue > 0 ? 'red' : 'green'}
                            icon={<TrendingDown className="w-6 h-6 text-red-600" />}
                            iconBgColor="bg-red-100"
                        />
                    </div>

                    <ControlBar
                        search={{
                            value: search,
                            onChange: setSearch,
                            placeholder: 'Rechercher un client...',
                            resultCount: filteredClients.length,
                        }}
                        // TODO: Add status filter if API supports it
                        onExport={handleExport}
                    />

                    <div className="flex-1 flex overflow-hidden">
                        <div className={`flex-1 overflow-auto p-6 ${selectedClient ? 'pr-3' : ''}`}>
                            <DataTable
                                data={filteredClients}
                                columns={columns}
                                keyField="id"
                                selectable
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                onRowClick={(row) => setSelectedClient(row)}
                                loading={loading}
                                emptyMessage="Aucun client trouvé"
                                rowActions={[
                                    { label: 'Voir détails', onClick: (row) => setSelectedClient(row) },
                                    { label: 'Modifier', onClick: (row) => router.push(`/clients/${row.id}/edit`) },
                                    { label: 'Voir factures', onClick: (row) => router.push(`/ventes/factures?client=${row.id}`) },
                                ]}
                            />
                        </div>

                        {selectedClient && (
                            <Drawer
                                open={!!selectedClient}
                                onClose={() => setSelectedClient(null)}
                                title={selectedClient.client_name}
                                subtitle={selectedClient.client_code}
                                headerValue={formatCurrency(selectedClient.balance)}
                                headerLabel="Solde dû"
                                tabs={[
                                    {
                                        id: 'info',
                                        label: 'Informations',
                                        content: (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm">{selectedClient.contact_email || 'Email non renseigné'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm">{selectedClient.contact_phone || 'Tél non renseigné'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <span className="text-xs text-gray-500 block mb-1">Dernière facture</span>
                                                        <span className="text-sm font-medium">#{selectedClient.last_invoice_number || '-'}</span>
                                                        <span className="text-xs text-gray-400 ml-2">({selectedClient.last_invoice_date || '-'})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        id: 'history',
                                        label: 'Historique',
                                        content: (
                                            <div className="text-center py-8 text-gray-500">
                                                Historique à venir
                                            </div>
                                        ),
                                    },
                                ]}
                                actions={
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" className="flex-1">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Voir fiche
                                        </Button>
                                        <Button variant="secondary" size="sm" className="flex-1">
                                            <History className="w-4 h-4 mr-2" />
                                            Bientôt
                                        </Button>
                                    </div>
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
