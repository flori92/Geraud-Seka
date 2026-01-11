/**
 * Page Règles Fournisseurs - Auto-imputation
 * Permet de définir comment comptabiliser automatiquement chaque fournisseur
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    Plus, Search, Settings2, Trash2, Edit2, Save, X, Zap, 
    Building, FileText, AlertCircle, CheckCircle 
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface SupplierRule {
    id?: string;
    supplier_name: string;
    supplier_code: string;
    charge_account: string;
    charge_account_label?: string;
    vat_account: string;
    vat_account_label?: string;
    supplier_account: string;
    supplier_account_label?: string;
    vat_rate: number;
    journal_code: string;
    is_active: boolean;
}

interface Account {
    code: string;
    name: string;
}

export default function ReglesFournisseursPage() {
    const router = useRouter();
    const [rules, setRules] = useState<SupplierRule[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<SupplierRule | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<SupplierRule>({
        supplier_name: '',
        supplier_code: '',
        charge_account: '6061',
        vat_account: '4454',
        supplier_account: '',
        vat_rate: 18,
        journal_code: 'ACH',
        is_active: true
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
            // Fetch rules, accounts, suppliers in parallel
            const [rulesRes, accountsRes, suppliersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/accounting/supplier-rules`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/accounting/accounts`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/suppliers`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (rulesRes.ok) {
                const data = await rulesRes.json();
                setRules(Array.isArray(data) ? data : []);
            }

            if (accountsRes.ok) {
                const data = await accountsRes.json();
                setAccounts(Array.isArray(data) ? data : []);
            }

            if (suppliersRes.ok) {
                const data = await suppliersRes.json();
                setSuppliers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Erreur de chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.supplier_name || !formData.charge_account || !formData.supplier_account) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setSaving(true);
        setError(null);

        const token = localStorage.getItem('seka_access_token');
        try {
            const url = editingRule?.id 
                ? `${API_BASE_URL}/api/v1/accounting/supplier-rules/${editingRule.id}`
                : `${API_BASE_URL}/api/v1/accounting/supplier-rules`;
            
            const method = editingRule?.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de la sauvegarde');
            }

            await fetchData();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;

        const token = localStorage.getItem('seka_access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/supplier-rules/${id}`, {
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

    const handleEdit = (rule: SupplierRule) => {
        setEditingRule(rule);
        setFormData(rule);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRule(null);
        setFormData({
            supplier_name: '',
            supplier_code: '',
            charge_account: '6061',
            vat_account: '4454',
            supplier_account: '',
            vat_rate: 18,
            journal_code: 'ACH',
            is_active: true
        });
        setError(null);
    };

    const filteredRules = rules.filter(rule =>
        rule.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAccountLabel = (code: string) => {
        const account = accounts.find(a => a.code === code);
        return account ? `${code} - ${account.name}` : code;
    };

    return (
        <>
            <Head>
                <title>Règles Fournisseurs - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Settings2 className="h-6 w-6 text-[#1e3a5f]" />
                                    RÈGLES FOURNISSEURS
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Définissez comment comptabiliser automatiquement vos fournisseurs récurrents
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                            >
                                <Plus className="h-5 w-5" />
                                Nouvelle règle
                            </button>
                        </div>

                        {/* Info Banner */}
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">Comment ça marche ?</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Une fois la règle créée, les prochaines factures de ce fournisseur seront automatiquement 
                                        comptabilisées avec les comptes définis. Gain de temps garanti ! ⚡
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un fournisseur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Rules Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredRules.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucune règle définie</p>
                                <p className="text-sm mt-1">Créez votre première règle pour automatiser la comptabilisation</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fournisseur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compte Charge
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compte TVA
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compte 401
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Taux TVA
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Building className="h-4 w-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{rule.supplier_name}</div>
                                                        {rule.supplier_code && (
                                                            <div className="text-xs text-gray-500">{rule.supplier_code}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="font-mono">{getAccountLabel(rule.charge_account)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="font-mono">{getAccountLabel(rule.vat_account)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="font-mono">{getAccountLabel(rule.supplier_account)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {rule.vat_rate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(rule)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => rule.id && handleDelete(rule.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                {filteredRules.length} règle(s) définie(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Création/Édition */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={handleCloseModal}
                        />

                        {/* Modal */}
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {editingRule ? 'Modifier la règle' : 'Nouvelle règle fournisseur'}
                                    </h3>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                {/* Fournisseur */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fournisseur *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.supplier_name}
                                        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                        placeholder="Ex: SBEE, MTN Bénin, Oryx Energies..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                    />
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">IMPUTATION COMPTABLE</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Compte Charge */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Compte de charge *
                                            </label>
                                            <select
                                                value={formData.charge_account}
                                                onChange={(e) => setFormData({ ...formData, charge_account: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                            >
                                                <option value="">-- Sélectionner --</option>
                                                <option value="6061">6061 - Électricité</option>
                                                <option value="6062">6062 - Eau</option>
                                                <option value="6063">6063 - Carburants</option>
                                                <option value="6064">6064 - Fournitures de bureau</option>
                                                <option value="6261">6261 - Télécommunications</option>
                                                <option value="6041">6041 - Achats de matériel</option>
                                                <option value="6051">6051 - Autres achats</option>
                                            </select>
                                        </div>

                                        {/* Journal */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Journal *
                                            </label>
                                            <select
                                                value={formData.journal_code}
                                                onChange={(e) => setFormData({ ...formData, journal_code: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                            >
                                                <option value="ACH">ACH - Achats</option>
                                                <option value="VTE">VTE - Ventes</option>
                                                <option value="BQ">BQ - Banque</option>
                                                <option value="OD">OD - Opérations Diverses</option>
                                            </select>
                                        </div>

                                        {/* Compte TVA */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Compte TVA *
                                            </label>
                                            <select
                                                value={formData.vat_account}
                                                onChange={(e) => setFormData({ ...formData, vat_account: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                            >
                                                <option value="">-- Sélectionner --</option>
                                                <option value="4454">4454 - TVA déductible 18%</option>
                                                <option value="4452">4452 - TVA récupérable sur immobilisations</option>
                                                <option value="4457">4457 - TVA collectée</option>
                                            </select>
                                        </div>

                                        {/* Taux TVA */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Taux TVA *
                                            </label>
                                            <select
                                                value={formData.vat_rate}
                                                onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                            >
                                                <option value="0">0% (Exonéré)</option>
                                                <option value="18">18% (Bénin standard)</option>
                                                <option value="20">20% (Import UE)</option>
                                            </select>
                                        </div>

                                        {/* Compte Fournisseur */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Compte fournisseur (401) *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.supplier_account}
                                                onChange={(e) => setFormData({ ...formData, supplier_account: e.target.value })}
                                                placeholder="Ex: 401SBEE, 401MTN, 401ORYX..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Si le compte n'existe pas, il sera créé automatiquement
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Aperçu des écritures */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">APERÇU DES ÉCRITURES GÉNÉRÉES</h4>
                                    <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono">
                                        <div className="flex justify-between text-gray-600 mb-1">
                                            <span>Compte</span>
                                            <span className="flex gap-8">
                                                <span className="w-16 text-right">Débit</span>
                                                <span className="w-16 text-right">Crédit</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-900">
                                            <span>{formData.charge_account || '6XXX'}</span>
                                            <span className="flex gap-8">
                                                <span className="w-16 text-right">100 000</span>
                                                <span className="w-16 text-right">-</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-900">
                                            <span>{formData.vat_account || '4XXX'}</span>
                                            <span className="flex gap-8">
                                                <span className="w-16 text-right">18 000</span>
                                                <span className="w-16 text-right">-</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-900">
                                            <span>{formData.supplier_account || '401XXX'}</span>
                                            <span className="flex gap-8">
                                                <span className="w-16 text-right">-</span>
                                                <span className="w-16 text-right">118 000</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            💾 Enregistrer la règle
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
