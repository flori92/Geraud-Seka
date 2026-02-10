import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
    FolderTree, Plus, Edit2, Trash2, ChevronRight, ChevronDown,
    Search, X, AlertTriangle
} from 'lucide-react';
import { PennylaneSidebar } from '@/components/layout/PennylaneSidebar';
import { api, getApiErrorMessage } from '@/lib/api';
import { CreateAccountModal } from '@/components/forms/CreateAccountModal';

interface LedgerAccount {
    id: string;
    account_code: string;
    account_name: string;
    is_active: boolean;
    parent_account_id?: string;
    is_auxiliary: boolean;
    is_collective: boolean;
    account_type?: string;
    child_accounts?: LedgerAccount[];
}

interface EditFormData {
    account_name: string;
    account_type: string;
    is_active: boolean;
}

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
    const [filterType, setFilterType] = useState<string>('all');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<LedgerAccount | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({ account_name: '', account_type: 'asset', is_active: true });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ledger-accounts');
            const accountsData = response.data;
            const hierarchy = buildHierarchy(accountsData);
            setAccounts(hierarchy);
        } catch (error) {
            // Silently handle - empty state is shown
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchy = (flatAccounts: LedgerAccount[]): LedgerAccount[] => {
        const map = new Map<string, LedgerAccount>();
        const roots: LedgerAccount[] = [];

        flatAccounts.forEach(acc => {
            map.set(acc.id, { ...acc, child_accounts: [] });
        });

        flatAccounts.forEach(acc => {
            const account = map.get(acc.id)!;
            if (acc.parent_account_id && map.has(acc.parent_account_id)) {
                const parent = map.get(acc.parent_account_id)!;
                parent.child_accounts = parent.child_accounts ?? [];
                parent.child_accounts.push(account);
            } else {
                roots.push(account);
            }
        });

        return roots.sort((a, b) => a.account_code.localeCompare(b.account_code));
    };

    const toggleExpand = (accountId: string) => {
        setExpandedAccounts(prev => {
            const next = new Set(prev);
            if (next.has(accountId)) {
                next.delete(accountId);
            } else {
                next.add(accountId);
            }
            return next;
        });
    };

    // --- Edit handlers ---
    const handleEditOpen = (account: LedgerAccount) => {
        setEditingAccount(account);
        setEditForm({
            account_name: account.account_name,
            account_type: account.account_type ?? 'asset',
            is_active: account.is_active,
        });
        setEditError(null);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;

        setEditLoading(true);
        setEditError(null);

        try {
            await api.put(`/ledger-accounts/${editingAccount.id}`, {
                account_name: editForm.account_name,
                account_type: editForm.account_type,
                is_active: editForm.is_active,
            });
            setEditingAccount(null);
            await loadAccounts();
        } catch (err: unknown) {
            const message = getApiErrorMessage(err);
            setEditError(message ?? "Erreur lors de la modification du compte");
        } finally {
            setEditLoading(false);
        }
    };

    // --- Delete handlers ---
    const handleDeleteOpen = (account: LedgerAccount) => {
        setDeletingAccount(account);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingAccount) return;

        setDeleteLoading(true);
        setDeleteError(null);

        try {
            await api.delete(`/ledger-accounts/${deletingAccount.id}`);
            setDeletingAccount(null);
            await loadAccounts();
        } catch (err: unknown) {
            const message = getApiErrorMessage(err);
            setDeleteError(message ?? "Erreur lors de la suppression du compte");
        } finally {
            setDeleteLoading(false);
        }
    };

    const renderAccount = (account: LedgerAccount, level: number = 0) => {
        const hasChildren = account.child_accounts && account.child_accounts.length > 0;
        const isExpanded = expandedAccounts.has(account.id);
        const indent = level * 24;

        return (
            <div key={account.id}>
                <div
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${account.is_auxiliary ? 'bg-purple-50/30' : ''
                        }`}
                    style={{ paddingLeft: `${indent + 16}px` }}
                >
                    <div className="flex items-center gap-3 flex-1">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(account.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}

                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <code className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                    {account.account_code}
                                </code>
                                <span className="text-sm text-gray-900">{account.account_name}</span>

                                {account.is_collective && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                        Collectif
                                    </span>
                                )}
                                {account.is_auxiliary && (
                                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                        Auxiliaire
                                    </span>
                                )}
                                {!account.is_active && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        Inactif
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditOpen(account);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        {account.is_auxiliary && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOpen(account);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {account.child_accounts!.map(child => renderAccount(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch =
            acc.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.account_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filterType === 'all' ||
            (filterType === 'auxiliary' && acc.is_auxiliary) ||
            (filterType === 'collective' && acc.is_collective) ||
            (filterType === 'general' && !acc.is_auxiliary && !acc.is_collective);

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: accounts.length,
        auxiliary: accounts.filter(a => a.is_auxiliary).length,
        collective: accounts.filter(a => a.is_collective).length,
        general: accounts.filter(a => !a.is_auxiliary && !a.is_collective).length
    };

    return (
        <>
            <Head>
                <title>Plan Comptable - SEKA</title>
            </Head>

            <div className="flex h-screen bg-gray-50">
                <PennylaneSidebar />

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <FolderTree className="h-7 w-7 text-green-600" />
                                    Plan Comptable
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Gérez vos comptes généraux et auxiliaires (SYSCOHADA)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg transition"
                            >
                                <Plus className="h-5 w-5" />
                                Nouveau compte
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="px-6 py-4 grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Total comptes</div>
                            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                            <div className="text-sm text-blue-700 mb-1">Comptes généraux</div>
                            <div className="text-3xl font-bold text-blue-900">{stats.general}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                            <div className="text-sm text-purple-700 mb-1">Comptes auxiliaires</div>
                            <div className="text-3xl font-bold text-purple-900">{stats.auxiliary}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                            <div className="text-sm text-green-700 mb-1">Comptes collectifs</div>
                            <div className="text-3xl font-bold text-green-900">{stats.collective}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-3 bg-white border-b border-gray-200">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher un compte..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">Tous les comptes</option>
                                <option value="general">Comptes généraux</option>
                                <option value="auxiliary">Comptes auxiliaires</option>
                                <option value="collective">Comptes collectifs</option>
                            </select>
                        </div>
                    </div>

                    {/* Accounts Tree */}
                    <div className="flex-1 overflow-auto bg-white">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-gray-500">Chargement...</div>
                            </div>
                        ) : filteredAccounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <FolderTree className="h-12 w-12 mb-4 text-gray-400" />
                                <p>Aucun compte trouvé</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredAccounts.map(account => renderAccount(account))}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
                        <div className="flex items-center gap-6 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Collectif</span>
                                <span>Compte collectif (401, 411)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Auxiliaire</span>
                                <span>Sous-compte d&apos;un collectif (401SBEE)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <CreateAccountModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={loadAccounts}
            />

            {/* Edit Modal */}
            {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Modifier le compte</h2>
                            <button
                                onClick={() => setEditingAccount(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {editError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {editError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code compte</label>
                                <input
                                    type="text"
                                    value={editingAccount.account_code}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Le code compte ne peut pas être modifié</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte *</label>
                                <input
                                    type="text"
                                    value={editForm.account_name}
                                    onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de compte</label>
                                <select
                                    value={editForm.account_type}
                                    onChange={(e) => setEditForm({ ...editForm, account_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="asset">Actif</option>
                                    <option value="liability">Passif</option>
                                    <option value="equity">Capitaux propres</option>
                                    <option value="revenue">Produits</option>
                                    <option value="expense">Charges</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="w-4 h-4 text-green-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Compte actif</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setEditingAccount(null)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Supprimer le compte</h2>
                            <button
                                onClick={() => setDeletingAccount(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            {deleteError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {deleteError}
                                </div>
                            )}

                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-900">
                                        Voulez-vous vraiment supprimer le compte{' '}
                                        <strong>{deletingAccount.account_code}</strong> -{' '}
                                        <strong>{deletingAccount.account_name}</strong> ?
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Cette action est irréversible. Le compte sera définitivement supprimé.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setDeletingAccount(null)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deleteLoading ? 'Suppression...' : 'Supprimer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
