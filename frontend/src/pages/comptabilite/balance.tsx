/**
 * Balance Générale - Interface style Pennylane
 * Compactage par TVA, Classe, Journal avec drawer de détail
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableFooter
} from '@/components/ui/Table';
import {
  Search, RefreshCw, Download, ChevronDown, ChevronRight,
  FileSpreadsheet, FileText, X, MoreHorizontal, Eye, History,
  Paperclip, Check
} from 'lucide-react';
import { useTrialBalance, useAccountDetail } from '@/hooks/useTrialBalance';
import { Account, AccountGroup, CompactBy, ExportFormat } from '@/types/trial-balance';

export default function BalanceGeneralePage() {
  const [period] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    accounts,
    groupedAccounts,
    meta,
    filters,
    loading,
    error,
    setFilters,
    toggleGroup,
    refetch,
  } = useTrialBalance({ period });

  const { detail: accountDetail, loading: detailLoading } = useAccountDetail(selectedAccountId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' €';
  };

  const handleExport = async (format: ExportFormat) => {
    const token = localStorage.getItem('seka_access_token');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/accounting/entries/export/${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
      }
    } catch (err) {
      console.error('Erreur export:', err);
    }
    setShowExportMenu(false);
  };

  const compactByOptions: { value: CompactBy; label: string }[] = [
    { value: 'none', label: 'Aucun' },
    { value: 'vat_rate', label: 'Taux TVA' },
    { value: 'class', label: 'Classe comptable' },
    { value: 'journal', label: 'Journal' },
  ];

  return (
    <DashboardLayout title="Balance Générale">
      <div className="h-full flex flex-col">
        {/* Header Pennylane style */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <nav className="flex items-center text-sm">
                <span className="text-gray-500">Comptabilité</span>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-500">Balance générale</span>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="font-medium text-gray-900">Plan comptable</span>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Période */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                {period.start.split('-').reverse().join('/')} - {period.end.split('-').reverse().join('/')}
              </div>

              <Button variant="secondary" size="sm" onClick={refetch}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Control Bar - sticky */}
        <div className="bg-white border-b px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Compacter par */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Compacter par :</span>
                <select
                  value={filters.compactBy}
                  onChange={(e) => setFilters({ compactBy: e.target.value as CompactBy })}
                  className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {compactByOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.showZeroBalances}
                    onChange={(e) => setFilters({ showZeroBalances: e.target.checked })}
                  />
                  <span className="text-gray-600">Soldes à 0</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.showAuxiliaryAccounts}
                    onChange={(e) => setFilters({ showAuxiliaryAccounts: e.target.checked })}
                  />
                  <span className="text-gray-600">Comptes auxiliaires</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Recherche */}
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  placeholder="Rechercher un compte..."
                  className="w-full pl-10 pr-16 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">
                  {accounts.length} comptes
                </span>
              </div>

              {/* Export */}
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-20">
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Table */}
          <div className={`flex-1 overflow-auto p-6 ${selectedAccountId ? 'pr-3' : ''}`}>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-red-500">{error}</p>
                <Button variant="secondary" className="mt-4" onClick={refetch}>
                  Réessayer
                </Button>
              </Card>
            ) : filters.compactBy !== 'none' ? (
              /* Vue groupée */
              <div className="space-y-2">
                {groupedAccounts.map((group) => (
                  <GroupedAccountsSection
                    key={group.id}
                    group={group}
                    onToggle={() => toggleGroup(group.id)}
                    onSelectAccount={setSelectedAccountId}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            ) : (
              /* Vue plate */
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader className="w-10">
                      <Checkbox />
                    </TableHeader>
                    <TableHeader className="w-32">Compte</TableHeader>
                    <TableHeader>Intitulé</TableHeader>
                    <TableHeader className="w-24">TVA</TableHeader>
                    <TableHeader align="right" className="w-36">Débit</TableHeader>
                    <TableHeader align="right" className="w-36">Crédit</TableHeader>
                    <TableHeader align="right" className="w-36">Solde</TableHeader>
                    <TableHeader className="w-12"></TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onSelect={() => setSelectedAccountId(account.id)}
                      formatCurrency={formatCurrency}
                      isSelected={selectedAccountId === account.id}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={4}>TOTAUX</TableCell>
                    <TableCell align="right">{formatCurrency(meta?.totals.debit || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(meta?.totals.credit || 0)}</TableCell>
                    <TableCell align="right">
                      <span className={meta?.totals.difference === 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(meta?.totals.difference || 0)}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>

          {/* Drawer Détail Compte */}
          {selectedAccountId && (
            <AccountDrawer
              accountId={selectedAccountId}
              detail={accountDetail}
              loading={detailLoading}
              onClose={() => setSelectedAccountId(null)}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Composant ligne de compte */
function AccountRow({
  account,
  onSelect,
  formatCurrency,
  isSelected,
}: {
  account: Account;
  onSelect: () => void;
  formatCurrency: (n: number) => string;
  isSelected: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <TableRow
      className={`group cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2" style={{ paddingLeft: `${account.level * 16}px` }}>
          {account.hasChildren && (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )}
          <button className="font-mono text-sm text-blue-600 hover:underline">
            {account.number}
          </button>
        </div>
      </TableCell>
      <TableCell className="text-gray-700">{account.label}</TableCell>
      <TableCell>
        {account.vatRate !== undefined && (
          <Badge variant={account.vatRate === 20 ? 'primary' : account.vatRate === 5.5 ? 'success' : 'secondary'}>
            {account.vatRate}%
          </Badge>
        )}
      </TableCell>
      <TableCell align="right" monospace>{account.debit > 0 ? formatCurrency(account.debit) : '-'}</TableCell>
      <TableCell align="right" monospace>{account.credit > 0 ? formatCurrency(account.credit) : '-'}</TableCell>
      <TableCell align="right">
        <div className={`px-2 py-1 rounded text-sm font-medium ${
          account.balance > 0 ? 'bg-green-50 text-green-700' : 
          account.balance < 0 ? 'bg-red-50 text-red-700' : 'text-gray-500'
        }`}>
          {formatCurrency(Math.abs(account.balance))}
        </div>
      </TableCell>
      <TableCell>
        {showActions && (
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}

/* Composant section groupée */
function GroupedAccountsSection({
  group,
  onToggle,
  onSelectAccount,
  formatCurrency,
}: {
  group: AccountGroup;
  onToggle: () => void;
  onSelectAccount: (id: string) => void;
  formatCurrency: (n: number) => string;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Header du groupe */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={`w-4 h-4 transition-transform ${group.expanded ? 'rotate-90' : ''}`} />
          <span className="font-medium">{group.label}</span>
          <Badge variant="secondary">{group.accounts.length} comptes</Badge>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span>Débit: <strong>{formatCurrency(group.totalDebit)}</strong></span>
          <span>Crédit: <strong>{formatCurrency(group.totalCredit)}</strong></span>
          <span className={group.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            Solde: <strong>{formatCurrency(Math.abs(group.totalBalance))}</strong>
          </span>
        </div>
      </button>

      {/* Comptes du groupe */}
      {group.expanded && (
        <div className="divide-y">
          {group.accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => onSelectAccount(account.id)}
              className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-blue-600">{account.number}</span>
                <span className="text-gray-700">{account.label}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="w-28 text-right">{formatCurrency(account.debit)}</span>
                <span className="w-28 text-right">{formatCurrency(account.credit)}</span>
                <span className={`w-28 text-right font-medium ${
                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(account.balance))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* Composant Drawer détail compte */
function AccountDrawer({
  accountId,
  detail,
  loading,
  onClose,
  formatCurrency,
}: {
  accountId: string;
  detail: any;
  loading: boolean;
  onClose: () => void;
  formatCurrency: (n: number) => string;
}) {
  const [activeTab, setActiveTab] = useState<'entries' | 'chart' | 'rules'>('entries');

  const account = detail?.account;
  const entries = detail?.entries || [];

  return (
    <div className="w-96 border-l bg-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">{account?.number || accountId}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 text-sm">{account?.label || 'Chargement...'}</p>
        <div className="mt-3">
          <div className="text-2xl font-bold">
            {account ? formatCurrency(account.balance) : '-'}
          </div>
          <div className="text-sm text-gray-500">Solde actuel</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {[
            { id: 'entries', label: 'Écritures' },
            { id: 'chart', label: 'Graphique' },
            { id: 'rules', label: 'Règles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : activeTab === 'entries' ? (
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune écriture</p>
            ) : (
              entries.slice(0, 20).map((entry: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">{entry.date}</span>
                    <Badge variant="secondary">{entry.journal}</Badge>
                  </div>
                  <p className="text-gray-700 mb-1">{entry.label}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.isReconciled && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          <Check className="w-3 h-3 inline mr-1" />
                          Lettré
                        </span>
                      )}
                      {entry.hasAttachment && (
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      entry.debit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.debit > 0 ? '+' : ''}{formatCurrency(entry.debit || -entry.credit)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'chart' ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Graphique à venir
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Règles comptables à venir
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            Grand livre
          </Button>
          <Button variant="secondary" size="sm" className="flex-1">
            <History className="w-4 h-4 mr-2" />
            Historique
          </Button>
        </div>
      </div>
    </div>
  );
}
