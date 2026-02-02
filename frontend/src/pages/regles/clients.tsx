/**
 * Page Regles Clients - Auto-imputation des ventes
 * Permet de definir comment comptabiliser automatiquement chaque client
 *
 * Integration avec le systeme d'interconnexion SEKA Business:
 * - Affiche les clients avec/sans regles
 * - Permet de creer des regles pour les clients existants
 * - Creation automatique du compte auxiliaire si necessaire
 * - Apercu des ecritures generees (Journal VTE)
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Plus, Search, Settings2, Trash2, Edit2, Save, X, Zap,
    Users, FileText, AlertCircle, CheckCircle, XCircle,
    Eye, Link, ChevronRight, RefreshCw, Download, Filter,
    ArrowRight, Info, Copy, ExternalLink
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ClientRule {
    id?: string;
    client_name: string;
    client_code: string;
    revenue_account: string;
    revenue_account_label?: string;
    vat_account: string;
    vat_account_label?: string;
    client_account: string;
    client_account_label?: string;
    vat_rate: number;
    journal_code: string;
    is_active: boolean;
    ocr_keywords?: string[];
}

interface Client {
    id: string;
    code: string;
    name: string;
    nif?: string;
    auxiliary_account_code?: string;
    has_active_rule: boolean;
    default_revenue_account?: string;
    default_vat_account?: string;
    default_tax_rate?: number;
    default_journal?: string;
    ocr_keywords?: string[];
}

// Comptes de produits SYSCOHADA courants
const REVENUE_ACCOUNTS = [
    { code: "701", name: "Ventes de marchandises", category: "Ventes" },
    { code: "702", name: "Ventes de produits finis", category: "Ventes" },
    { code: "703", name: "Ventes de produits intermediaires", category: "Ventes" },
    { code: "704", name: "Travaux", category: "Prestations" },
    { code: "705", name: "Etudes", category: "Prestations" },
    { code: "706", name: "Prestations de services", category: "Prestations" },
    { code: "707", name: "Produits accessoires", category: "Autres" },
    { code: "708", name: "Produits des activites annexes", category: "Autres" },
    { code: "709", name: "Rabais, remises et ristournes accordes", category: "Reductions" },
];

// Journaux comptables
const JOURNALS = [
    { code: "VTE", name: "Journal des Ventes" },
    { code: "OD", name: "Operations Diverses" },
];

// Taux de TVA
const VAT_RATES = [
    { rate: 0, label: "0% - Exonere" },
    { rate: 18, label: "18% - Taux standard (Benin)" },
    { rate: 10, label: "10% - Taux reduit" },
];

export default function ReglesClientsPage() {
    const router = useRouter();
    const [rules, setRules] = useState<ClientRule[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<ClientRule | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'with_rule' | 'without_rule'>('all');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        client_name: string;
        client_code: string;
        revenue_account: string;
        vat_account: string;
        vat_rate: number;
        journal_code: string;
        is_active: boolean;
        ocr_keywords: string;
    }>({
        client_name: '',
        client_code: '',
        revenue_account: '706',
        vat_account: '4457',
        vat_rate: 18,
        journal_code: 'VTE',
        is_active: true,
        ocr_keywords: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('seka_access_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            // Recuperer les regles clients existantes
            const rulesResponse = await fetch(`${API_BASE_URL}/api/v1/accounting-rules/client-rules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (rulesResponse.ok) {
                const rulesData = await rulesResponse.json();
                setRules(Array.isArray(rulesData) ? rulesData : []);
            }

            // Recuperer la liste des clients
            const clientsResponse = await fetch(`${API_BASE_URL}/api/v1/clients/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json();
                setClients(Array.isArray(clientsData) ? clientsData : []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        if (filterStatus === 'with_rule' && !client.has_active_rule) return false;
        if (filterStatus === 'without_rule' && client.has_active_rule) return false;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                client.name.toLowerCase().includes(term) ||
                client.code?.toLowerCase().includes(term) ||
                client.auxiliary_account_code?.toLowerCase().includes(term)
            );
        }
        return true;
    });

    const handleCreateRule = (client: Client) => {
        setSelectedClient(client);
        setFormData({
            client_name: client.name,
            client_code: client.code || '',
            revenue_account: client.default_revenue_account || '706',
            vat_account: client.default_vat_account || '4457',
            vat_rate: client.default_tax_rate || 18,
            journal_code: client.default_journal || 'VTE',
            is_active: true,
            ocr_keywords: client.ocr_keywords?.join(', ') || client.name
        });
        setShowModal(true);
    };

    const handleSaveRule = async () => {
        if (!formData.revenue_account) {
            setError('Le compte de produit est obligatoire');
            return;
        }

        setSaving(true);
        setError(null);
        const token = localStorage.getItem('seka_access_token');

        try {
            const payload = {
                client_name: formData.client_name,
                client_code: formData.client_code,
                revenue_account: formData.revenue_account,
                vat_account: formData.vat_account || '4457',
                client_account: selectedClient?.auxiliary_account_code || `411${formData.client_code}`,
                vat_rate: formData.vat_rate,
                journal_code: formData.journal_code || 'VTE',
                is_active: formData.is_active,
                ocr_keywords: formData.ocr_keywords.split(',').map(k => k.trim()).filter(k => k)
            };

            const response = await fetch(`${API_BASE_URL}/api/v1/accounting-rules/client-rules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de la sauvegarde');
            }

            await fetchData();
            handleCloseModal();
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Etes-vous sur de vouloir supprimer cette regle ?')) return;

        const token = localStorage.getItem('seka_access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting-rules/${ruleId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');
            await fetchData();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRule(null);
        setSelectedClient(null);
        setFormData({
            client_name: '',
            client_code: '',
            revenue_account: '706',
            vat_account: '4457',
            vat_rate: 18,
            journal_code: 'VTE',
            is_active: true,
            ocr_keywords: ''
        });
        setError(null);
    };

    const generateClientAccount = (code: string, name: string) => {
        const prefix = (code || name.substring(0, 6)).toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `411${prefix}`;
    };

    return (
        <>
            <Head>
                <title>Regles Clients (Ventes) - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Zap className="h-6 w-6 text-green-600" />
                                    REGLES CLIENTS (VENTES)
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Definissez les regles d'imputation automatique pour vos factures de vente
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/regles/fournisseurs')}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                <Settings2 className="h-5 w-5" />
                                Regles Fournisseurs
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-green-800">
                                    <p className="font-medium">Logique SI / ALORS pour les ventes</p>
                                    <p className="mt-1">
                                        <strong>SI</strong> le document est une facture de vente ET le client est reconnu
                                        <br />
                                        <strong>ALORS</strong> imputer automatiquement:
                                        Journal VTE + Compte produit (70X) + TVA collectee (4457) + Client (411XXX)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'with_rule', 'without_rule'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as typeof filterStatus)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        filterStatus === status
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {status === 'all' && 'Tous'}
                                    {status === 'with_rule' && 'Avec regle'}
                                    {status === 'without_rule' && 'Sans regle'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
                            <div className="text-sm text-gray-500">Total clients</div>
                        </div>
                        <div className="bg-white rounded-lg border border-green-200 p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {clients.filter(c => c.has_active_rule).length}
                            </div>
                            <div className="text-sm text-gray-500">Avec regle</div>
                        </div>
                        <div className="bg-white rounded-lg border border-amber-200 p-4">
                            <div className="text-2xl font-bold text-amber-600">
                                {clients.filter(c => !c.has_active_rule).length}
                            </div>
                            <div className="text-sm text-gray-500">Sans regle</div>
                        </div>
                    </div>

                    {/* Client List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun client</p>
                                <p className="text-sm mt-1">
                                    {filterStatus === 'without_rule'
                                        ? 'Tous les clients ont une regle'
                                        : 'Creez votre premier client'}
                                </p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte 411</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte auxiliaire</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comptes (Produit/TVA)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut regle</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{client.name}</div>
                                                        <div className="text-xs text-gray-500">{client.code || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                                                    411
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {client.auxiliary_account_code ? (
                                                    <span className="font-mono text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                                        {client.auxiliary_account_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs">Non cree</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {client.has_active_rule && client.default_revenue_account ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                                            {client.default_revenue_account}
                                                        </span>
                                                        <span className="text-gray-400 text-xs">/</span>
                                                        <span className="font-mono text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                                            {client.default_vat_account || '4457'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {client.has_active_rule ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Creee
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                        <XCircle className="h-3 w-3" />
                                                        Non creee
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {!client.has_active_rule ? (
                                                    <button
                                                        onClick={() => handleCreateRule(client)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Creer la regle
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleCreateRule(client)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => client.id && handleDeleteRule(client.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Creation Regle */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={handleCloseModal}
                        />

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-green-600" />
                                        Nouvelle regle client
                                    </h3>
                                    <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                {/* Client Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-8 w-8 text-green-600" />
                                        <div>
                                            <div className="font-medium text-gray-900">{formData.client_name}</div>
                                            <div className="text-sm text-gray-500">Code: {formData.client_code || 'Auto-genere'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* SI / ALORS */}
                                <div className="border border-green-200 rounded-lg overflow-hidden">
                                    <div className="bg-green-50 px-4 py-2">
                                        <span className="text-sm font-bold text-green-700">SI</span>
                                        <span className="text-sm text-green-600 ml-2">
                                            Document = Facture de vente ET Client reconnu
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="text-sm font-bold text-green-700">ALORS imputer:</div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Journal *
                                                </label>
                                                <select
                                                    value={formData.journal_code}
                                                    onChange={(e) => setFormData({ ...formData, journal_code: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                >
                                                    {JOURNALS.map(j => (
                                                        <option key={j.code} value={j.code}>{j.code} - {j.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Taux TVA *
                                                </label>
                                                <select
                                                    value={formData.vat_rate}
                                                    onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                >
                                                    {VAT_RATES.map(v => (
                                                        <option key={v.rate} value={v.rate}>{v.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Compte de produit * (70X)
                                            </label>
                                            <select
                                                value={formData.revenue_account}
                                                onChange={(e) => setFormData({ ...formData, revenue_account: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="">Selectionner un compte...</option>
                                                {REVENUE_ACCOUNTS.map(acc => (
                                                    <option key={acc.code} value={acc.code}>
                                                        {acc.code} - {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Compte TVA collectee
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.vat_account}
                                                    onChange={(e) => setFormData({ ...formData, vat_account: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                                    placeholder="4457"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Compte client
                                                </label>
                                                <input
                                                    type="text"
                                                    value={selectedClient?.auxiliary_account_code || generateClientAccount(formData.client_code, formData.client_name)}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mots-cles OCR */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mots-cles OCR (separes par virgule)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ocr_keywords}
                                        onChange={(e) => setFormData({ ...formData, ocr_keywords: e.target.value })}
                                        placeholder="Nom client, Entreprise ABC..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ces mots-cles permettent de reconnaitre automatiquement les factures de ce client
                                    </p>
                                </div>

                                {/* Apercu de l'ecriture */}
                                {formData.revenue_account && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <p className="text-sm font-medium text-emerald-800 mb-3">Apercu de l'ecriture generee (Journal VTE):</p>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="text-emerald-700">
                                                    <th className="text-left pb-2">Compte</th>
                                                    <th className="text-left pb-2">Libelle</th>
                                                    <th className="text-right pb-2">Debit</th>
                                                    <th className="text-right pb-2">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-emerald-900 font-mono">
                                                <tr className="border-t border-emerald-200">
                                                    <td className="py-1">{selectedClient?.auxiliary_account_code || generateClientAccount(formData.client_code, formData.client_name)}</td>
                                                    <td className="py-1">Client {formData.client_name}</td>
                                                    <td className="text-right py-1 font-bold">TTC</td>
                                                    <td className="text-right py-1">-</td>
                                                </tr>
                                                <tr className="border-t border-emerald-200">
                                                    <td className="py-1">{formData.revenue_account}</td>
                                                    <td className="py-1">Vente</td>
                                                    <td className="text-right py-1">-</td>
                                                    <td className="text-right py-1 font-bold">HT</td>
                                                </tr>
                                                <tr className="border-t border-emerald-200">
                                                    <td className="py-1">{formData.vat_account}</td>
                                                    <td className="py-1">TVA collectee {formData.vat_rate}%</td>
                                                    <td className="text-right py-1">-</td>
                                                    <td className="text-right py-1 font-bold">TVA</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveRule}
                                    disabled={saving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Enregistrer la regle
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
