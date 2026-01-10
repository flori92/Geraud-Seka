/**
 * Page Fournisseurs - Style Pennylane
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PennylaneSidebar } from '@/components/layout/PennylaneSidebar';
import { PageHeader } from '@/components/pennylane/PageHeader';
import { ControlBar } from '@/components/pennylane/ControlBar';
import { DataTable, Column } from '@/components/pennylane/DataTable';
import { Drawer } from '@/components/pennylane/Drawer';
import { StatsCard } from '@/components/pennylane/StatsCard';
import {
  Plus, Building2, Mail, Phone, MapPin, FileText,
  CreditCard, TrendingDown, Eye, History
} from 'lucide-react';

const Badge = ({ children, variant }: { children: React.ReactNode; variant?: string }) => {
  const colors = variant === 'success' ? 'bg-green-50 text-green-700' : variant === 'danger' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>{children}</span>;
};

const Button = ({ children, variant, size, className, onClick }: { children: React.ReactNode; variant?: string; size?: string; className?: string; onClick?: () => void }) => {
  const base = variant === 'secondary' ? 'border border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-[#1e3a5f] text-white hover:bg-[#172e4d]';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';
  return <button onClick={onClick} className={`flex items-center gap-2 rounded-lg font-medium ${base} ${sizeClass} ${className || ''}`}>{children}</button>;
};

interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  taxId: string;
  paymentTerms: number;
  balance: number;
  invoiceCount: number;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('seka_access_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.map((s: any) => ({
          id: s.id,
          name: s.name || s.company_name,
          code: s.code || s.supplier_code || `F${s.id?.slice(0, 6)}`,
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          country: s.country || 'CI',
          taxId: s.tax_id || s.siret || '',
          paymentTerms: s.payment_terms || 30,
          balance: s.balance || 0,
          invoiceCount: s.invoice_count || 0,
          status: s.status || 'active',
          createdAt: s.created_at || new Date().toISOString(),
        })));
      }
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) &&
        !s.code.toLowerCase().includes(q) &&
        !s.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
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

  const totalBalance = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const activeCount = suppliers.filter(s => s.status === 'active').length;

  const columns: Column<Supplier>[] = [
    {
      id: 'code',
      header: 'Code',
      accessor: 'code',
      width: '100px',
      cell: (row) => (
        <span className="font-mono text-sm text-blue-600">{row.code}</span>
      ),
    },
    {
      id: 'name',
      header: 'Fournisseur',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Téléphone',
      accessor: 'phone',
      cell: (row) => row.phone || '-',
    },
    {
      id: 'country',
      header: 'Pays',
      accessor: 'country',
      width: '80px',
    },
    {
      id: 'invoiceCount',
      header: 'Factures',
      accessor: 'invoiceCount',
      align: 'center',
      width: '100px',
      cell: (row) => (
        <Badge variant="neutral">{row.invoiceCount}</Badge>
      ),
    },
    {
      id: 'balance',
      header: 'Solde',
      accessor: 'balance',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <span className={row.balance > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
          {formatCurrency(row.balance)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      accessor: 'status',
      width: '100px',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'blocked' ? 'danger' : 'neutral'}>
          {row.status === 'active' ? 'Actif' : row.status === 'blocked' ? 'Bloqué' : 'Inactif'}
        </Badge>
      ),
    },
  ];

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const token = localStorage.getItem('seka_access_token');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/suppliers/export/${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fournisseurs_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
      }
    } catch (err) {
      console.error('Erreur export:', err);
    }
  };

  return (
    <>
      <Head>
        <title>Fournisseurs - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="h-full flex flex-col">
          <PageHeader
            breadcrumb={[
              { label: 'Achats', href: '/achats' },
              { label: 'Fournisseurs' },
            ]}
            onRefresh={fetchSuppliers}
            actions={
              <Button onClick={() => router.push('/suppliers/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau fournisseur
              </Button>
            }
          />

          {/* Stats */}
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 border-b">
            <StatsCard
              title="Total Fournisseurs"
              value={suppliers.length}
              icon={<Building2 className="w-6 h-6 text-blue-600" />}
              iconBgColor="bg-blue-100"
            />
            <StatsCard
              title="Fournisseurs Actifs"
              value={activeCount}
              icon={<Building2 className="w-6 h-6 text-green-600" />}
              iconBgColor="bg-green-100"
            />
            <StatsCard
              title="Solde Fournisseurs"
              value={formatCurrency(totalBalance)}
              valueColor={totalBalance > 0 ? 'red' : 'default'}
              icon={<TrendingDown className="w-6 h-6 text-red-600" />}
              iconBgColor="bg-red-100"
            />
            <StatsCard
              title="Factures en Attente"
              value={suppliers.reduce((sum, s) => sum + s.invoiceCount, 0)}
              icon={<FileText className="w-6 h-6 text-orange-600" />}
              iconBgColor="bg-orange-100"
            />
          </div>

          <ControlBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: 'Rechercher un fournisseur...',
              resultCount: filteredSuppliers.length,
            }}
            filters={[
              {
                label: 'Statut',
                value: statusFilter,
                options: [
                  { value: 'all', label: 'Tous' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'inactive', label: 'Inactifs' },
                  { value: 'blocked', label: 'Bloqués' },
                ],
                onChange: setStatusFilter,
              },
            ]}
            onExport={handleExport}
          />

          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 overflow-auto p-6 ${selectedSupplier ? 'pr-3' : ''}`}>
              <DataTable
                data={filteredSuppliers}
                columns={columns}
                keyField="id"
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={(row) => setSelectedSupplier(row)}
                loading={loading}
                emptyMessage="Aucun fournisseur trouvé"
                rowActions={[
                  { label: 'Voir détails', onClick: (row) => setSelectedSupplier(row) },
                  { label: 'Modifier', onClick: (row) => router.push(`/suppliers/${row.id}/edit`) },
                  { label: 'Voir factures', onClick: (row) => router.push(`/achats/factures?supplier=${row.id}`) },
                ]}
              />
            </div>

            {selectedSupplier && (
              <Drawer
                open={!!selectedSupplier}
                onClose={() => setSelectedSupplier(null)}
                title={selectedSupplier.name}
                subtitle={selectedSupplier.code}
                headerValue={formatCurrency(selectedSupplier.balance)}
                headerLabel="Solde fournisseur"
                tabs={[
                  {
                    id: 'info',
                    label: 'Informations',
                    content: (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedSupplier.email || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedSupplier.phone || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedSupplier.address || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Délai paiement: {selectedSupplier.paymentTerms} jours</span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'invoices',
                    label: 'Factures',
                    content: (
                      <div className="space-y-2">
                        <p className="text-gray-500 text-center py-8">
                          {selectedSupplier.invoiceCount} facture(s) enregistrée(s)
                        </p>
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
                      Historique
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
