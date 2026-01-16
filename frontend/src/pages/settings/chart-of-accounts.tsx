import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
    FolderTree, Plus, Edit2, Trash2, ChevronRight, ChevronDown,
    Building2, Users, TrendingUp, Search, Filter, CheckCircle
} from 'lucide-react';
import { PennylaneSidebar } from '@/components/layout/PennylaneSidebar';
import { api } from '@/lib/api';

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

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ledger-accounts');
            const accountsData = response.data;
            
            // Organiser en hiérarchie
            const hierarchy = buildHierarchy(accountsData);
            setAccounts(hierarchy);
        } catch (error) {
            console.error('Erreur chargement plan comptable:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchy = (flatAccounts: LedgerAccount[]): LedgerAccount[] => {
        const map = new Map<string, LedgerAccount>();
        const roots: LedgerAccount[] = [];

        // Créer une map de tous les comptes
        flatAccounts.forEach(acc => {
            map.set(acc.id, { ...acc, child_accounts: [] });
        });

        // Construire la hiérarchie
        flatAccounts.forEach(acc => {
            const account = map.get(acc.id)!;
            if (acc.parent_account_id && map.has(acc.parent_account_id)) {
                const parent = map.get(acc.parent_account_id)!;
                parent.child_accounts = parent.child_accounts || [];
                parent.child_accounts.push(account);
            } else {
                roots.push(account);
            }
        });

        return roots.sort((a, b) => a.account_code.localeCompare(b.account_code));
    };

    const toggleExpand = (accountId: string) => {
        const newExpanded = new Set(expandedAccounts);
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId);
        } else {
            newExpanded.add(accountId);
        }
        setExpandedAccounts(newExpanded);
    };

    const renderAccount = (account: LedgerAccount, level: number = 0) => {
        const hasChildren = account.child_accounts && account.child_accounts.length > 0;
        const isExpanded = expandedAccounts.has(account.id);
        const indent = level * 24;

        return (
            <div key={account.id}>
                <div
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${
                        account.is_auxiliary ? 'bg-purple-50/30' : ''
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
                                // TODO: handleEdit
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        {account.is_auxiliary && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: handleDelete
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
                                onClick={() => {/* TODO: handleCreate */}}
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
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
                            <div className="text-sm text-blue-700 mb-1">Comptes généraux</div>
                            <div className="text-3xl font-bold text-blue-900">{stats.general}</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
                            <div className="text-sm text-purple-700 mb-1">Comptes auxiliaires</div>
                            <div className="text-3xl font-bold text-purple-900">{stats.auxiliary}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
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
                                <span>Sous-compte d'un collectif (401SBEE)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
