/**
 * Page Règles Fournisseurs - Auto-imputation
 * Permet de définir comment comptabiliser automatiquement chaque fournisseur
 * 
 * Intégration avec le système d'interconnexion SEKA Business:
 * - Affiche les fournisseurs avec/sans règles
 * - Permet de créer des règles pour les fournisseurs existants
 * - Création automatique du compte auxiliaire si nécessaire
 * - Aperçu des écritures générées
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    Plus, Search, Settings2, Trash2, Edit2, Save, X, Zap, 
    Building, FileText, AlertCircle, CheckCircle, XCircle,
    Eye, Link, ChevronRight, RefreshCw, Download, Filter,
    ArrowRight, Info, Copy, ExternalLink
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
    ocr_keywords?: string[];
}

interface Supplier {
    id: string;
    code: string;
    name: string;
    nif?: string;
    auxiliary_account_code?: string;
    has_active_rule: boolean;
    default_charge_account?: string;
    default_vat_account?: string;
    default_tax_rate?: number;
    default_journal?: string;
    ocr_keywords?: string[];
}

interface Account {
    code: string;
    name: string;
}

// Comptes de charge SYSCOHADA courants
const CHARGE_ACCOUNTS = [
    { code: "6061", name: "Électricité", category: "Énergie" },
    { code: "6062", name: "Eau", category: "Énergie" },
    { code: "6063", name: "Carburants", category: "Énergie" },
    { code: "6064", name: "Fournitures de bureau", category: "Fournitures" },
    { code: "6065", name: "Fournitures informatiques", category: "Fournitures" },
    { code: "6261", name: "Télécommunications", category: "Services" },
    { code: "6262", name: "Internet", category: "Services" },
    { code: "6132", name: "Locations immobilières", category: "Loyers" },
    { code: "6135", name: "Locations mobilières", category: "Loyers" },
    { code: "6225", name: "Rémunérations d'intermédiaires", category: "Honoraires" },
    { code: "6226", name: "Honoraires", category: "Honoraires" },
    { code: "6241", name: "Transport du personnel", category: "Transport" },
    { code: "6242", name: "Transport sur achats", category: "Transport" },
    { code: "6275", name: "Frais de réception", category: "Divers" },
    { code: "6311", name: "Taxe sur la valeur ajoutée", category: "Impôts" },
    { code: "6271", name: "Annonces et insertions", category: "Publicité" },
    { code: "601", name: "Achats de marchandises", category: "Achats" },
    { code: "602", name: "Achats de matières premières", category: "Achats" },
    { code: "604", name: "Achats stockés", category: "Achats" },
    { code: "605", name: "Autres achats", category: "Achats" },
    { code: "627", name: "Services bancaires", category: "Banque" },
];

// Journaux comptables
const JOURNALS = [
    { code: "ACH", name: "Journal des Achats" },
    { code: "VTE", name: "Journal des Ventes" },
    { code: "BQ", name: "Journal de Banque" },
    { code: "CA", name: "Journal de Caisse" },
    { code: "OD", name: "Opérations Diverses" },
];

// Taux de TVA
const VAT_RATES = [
    { rate: 0, label: "0% - Exonéré" },
    { rate: 18, label: "18% - Taux standard (Bénin)" },
    { rate: 10, label: "10% - Taux réduit" },
];

export default function ReglesFournisseursPage() {
    const router = useRouter();
    const [rules, setRules] = useState<SupplierRule[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<SupplierRule | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Filtres
    const [filterStatus, setFilterStatus] = useState<'all' | 'with_rule' | 'without_rule'>('all');
    const [activeTab, setActiveTab] = useState<'rules' | 'suppliers'>('rules');
    
    // Sélection fournisseur pour création rapide
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const [formData, setFormData] = useState<SupplierRule>({
        supplier_name: '',
        supplier_code: '',
        charge_account: '6061',
        vat_account: '4454',
        supplier_account: '',
        vat_rate: 18,
        journal_code: 'ACH',
        is_active: true,
        ocr_keywords: []
    });
    
    // État pour les mots-clés OCR (input texte)
    const [ocrKeywordsInput, setOcrKeywordsInput] = useState('');

    useEffect(() => {
        fetchData();
        
        // Vérifier si on arrive avec un supplier_id en query param
        if (router.query.supplier) {
            // Pré-remplir pour ce fournisseur
            const supplierId = router.query.supplier as string;
            setTimeout(() => {
                const supplier = suppliers.find(s => s.id === supplierId);
                if (supplier) {
                    handleCreateRuleForSupplier(supplier);
                }
            }, 500);
        }
    }, [router.query.supplier]);

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
                fetch(`${API_BASE_URL}/api/v1/accounting-rules/supplier-rules`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/accounting/advanced/accounts`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/suppliers/`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (rulesRes.ok) {
                const data = await rulesRes.json();
                setRules(Array.isArray(data) ? data : []);
            }

            if (accountsRes.ok) {
                const data = await accountsRes.json();
                const formattedAccounts = Array.isArray(data) 
                    ? data.map((a: any) => ({ code: a.code || a.account_number, name: a.name }))
                    : [];
                setAccounts(formattedAccounts);
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
    
    // Créer une règle pour un fournisseur existant
    const handleCreateRuleForSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        
        // Générer le code compte auxiliaire
        const auxiliaryCode = supplier.auxiliary_account_code || 
            `401${(supplier.code || supplier.name.substring(0, 6)).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
        
        setFormData({
            supplier_name: supplier.name,
            supplier_code: supplier.code || '',
            charge_account: supplier.default_charge_account || '6061',
            vat_account: supplier.default_vat_account || '4454',
            supplier_account: auxiliaryCode,
            vat_rate: supplier.default_tax_rate || 18,
            journal_code: supplier.default_journal || 'ACH',
            is_active: true,
            ocr_keywords: supplier.ocr_keywords || [supplier.name]
        });
        setOcrKeywordsInput(supplier.ocr_keywords?.join(', ') || supplier.name);
        setShowModal(true);
    };
    
    // Générer automatiquement le compte auxiliaire
    const generateAuxiliaryCode = (name: string) => {
        const code = name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `401${code}`;
    };

    const handleSave = async () => {
        if (!formData.supplier_name || !formData.charge_account || !formData.supplier_account) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const token = localStorage.getItem('seka_access_token');
        try {
            const url = editingRule?.id 
                ? `${API_BASE_URL}/api/v1/accounting-rules/supplier-rules/${editingRule.id}`
                : `${API_BASE_URL}/api/v1/accounting-rules/supplier-rules`;
            
            const method = editingRule?.id ? 'PUT' : 'POST';
            
            // Préparer les données avec les mots-clés OCR
            const payload = {
                ...formData,
                ocr_keywords: ocrKeywordsInput
                    .split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0)
            };

            const response = await fetch(url, {
                method,
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

            setSuccessMessage(editingRule ? 'Règle mise à jour avec succès !' : 'Règle créée avec succès !');
            await fetchData();
            
            setTimeout(() => {
                handleCloseModal();
                setSuccessMessage(null);
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ? Les prochaines factures de ce fournisseur devront être imputées manuellement.')) return;

        const token = localStorage.getItem('seka_access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting-rules/supplier-rules/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');
            setSuccessMessage('Règle supprimée');
            await fetchData();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            console.error('Delete error:', err);
            setError('Erreur lors de la suppression');
        }
    };

    const handleEdit = (rule: SupplierRule) => {
        setEditingRule(rule);
        setSelectedSupplier(null);
        setFormData(rule);
        setOcrKeywordsInput(rule.ocr_keywords?.join(', ') || rule.supplier_name);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRule(null);
        setSelectedSupplier(null);
        setFormData({
            supplier_name: '',
            supplier_code: '',
            charge_account: '6061',
            vat_account: '4454',
            supplier_account: '',
            vat_rate: 18,
            journal_code: 'ACH',
            is_active: true,
            ocr_keywords: []
        });
        setOcrKeywordsInput('');
        setError(null);
    };

    // Filtrer les règles
    const filteredRules = rules.filter(rule =>
        rule.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.charge_account?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filtrer les fournisseurs selon le filtre actif
    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (filterStatus === 'with_rule') return supplier.has_active_rule;
        if (filterStatus === 'without_rule') return !supplier.has_active_rule;
        return true;
    });
    
    // Statistiques
    const stats = {
        totalRules: rules.length,
        totalSuppliers: suppliers.length,
        suppliersWithRules: suppliers.filter(s => s.has_active_rule).length,
        suppliersWithoutRules: suppliers.filter(s => !s.has_active_rule).length,
    };

    const getAccountLabel = (code: string) => {
        // D'abord chercher dans les comptes chargés
        const account = accounts.find(a => a.code === code);
        if (account) return `${code} - ${account.name}`;
        
        // Sinon chercher dans les comptes prédéfinis
        const chargeAccount = CHARGE_ACCOUNTS.find(a => a.code === code);
        if (chargeAccount) return `${code} - ${chargeAccount.name}`;
        
        return code;
    };
    
    const getChargeAccountCategory = (code: string) => {
        const account = CHARGE_ACCOUNTS.find(a => a.code === code);
        return account?.category || 'Autre';
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
                                    RÈGLES D'IMPUTATION FOURNISSEURS
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Automatisez la comptabilisation de vos factures fournisseurs
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/tiers/fournisseurs')}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    <Building className="h-4 w-4" />
                                    Gérer fournisseurs
                                </button>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium"
                                >
                                    <Plus className="h-5 w-5" />
                                    Nouvelle règle
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Messages de succès/erreur globaux */}
                    {successMessage && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            {successMessage}
                        </div>
                    )}
                    
                    {error && !showModal && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                            <button onClick={() => setError(null)} className="ml-auto">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    
                    {/* Statistiques */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Règles actives</p>
                                    <p className="text-2xl font-bold text-[#1e3a5f]">{stats.totalRules}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Zap className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Fournisseurs</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
                                </div>
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <Building className="h-6 w-6 text-gray-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Avec règle</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.suppliersWithRules}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Sans règle</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.suppliersWithoutRules}</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <AlertCircle className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">Comment ça marche ?</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Une règle définit automatiquement les écritures comptables pour un fournisseur. 
                                    Quand vous uploadez une facture, SEKA reconnaît le fournisseur et génère automatiquement:
                                    <span className="font-mono ml-1">Débit 6XXX + Débit 4454 + Crédit 401XXX</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Tabs & Search */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {/* Onglets */}
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setActiveTab('rules')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'rules' 
                                        ? 'bg-[#1e3a5f] text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Règles ({rules.length})
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('suppliers')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'suppliers' 
                                        ? 'bg-[#1e3a5f] text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Fournisseurs ({suppliers.length})
                                </span>
                            </button>
                        </div>
                        
                        {/* Search & Filters */}
                        <div className="flex gap-3 flex-1 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'rules' ? "Rechercher une règle..." : "Rechercher un fournisseur..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                />
                            </div>
                            
                            {activeTab === 'suppliers' && (
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                                >
                                    <option value="all">Tous</option>
                                    <option value="with_rule">Avec règle</option>
                                    <option value="without_rule">Sans règle</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Content based on active tab */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : activeTab === 'rules' ? (
                            /* Onglet Règles */
                            filteredRules.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Zap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p className="font-medium">Aucune règle définie</p>
                                    <p className="text-sm mt-1">Créez votre première règle pour automatiser la comptabilisation</p>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm"
                                    >
                                        <Plus className="h-4 w-4 inline mr-2" />
                                        Créer une règle
                                    </button>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fournisseur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Schéma d'écriture
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                TVA
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
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
                                                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                            <Building className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{rule.supplier_name}</div>
                                                            {rule.supplier_code && (
                                                                <div className="text-xs text-gray-500">Code: {rule.supplier_code}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600">D</span>
                                                            <span className="font-mono bg-green-50 px-2 py-0.5 rounded">{rule.charge_account}</span>
                                                            <span className="text-gray-400">→ HT</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600">D</span>
                                                            <span className="font-mono bg-green-50 px-2 py-0.5 rounded">{rule.vat_account}</span>
                                                            <span className="text-gray-400">→ TVA</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-red-600">C</span>
                                                            <span className="font-mono bg-red-50 px-2 py-0.5 rounded">{rule.supplier_account}</span>
                                                            <span className="text-gray-400">→ TTC</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {rule.vat_rate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {rule.is_active ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            <XCircle className="h-3 w-3" />
                                                            Inactive
                                                        </span>
                                                    )}
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
                            )
                        ) : (
                            /* Onglet Fournisseurs */
                            filteredSuppliers.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p className="font-medium">Aucun fournisseur trouvé</p>
                                    <p className="text-sm mt-1">Ajoutez des fournisseurs pour créer des règles</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fournisseur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Compte auxiliaire
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Règle d'imputation
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSuppliers.map((supplier) => (
                                            <tr key={supplier.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`p-2 rounded-lg mr-3 ${supplier.has_active_rule ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                            <Building className={`h-4 w-4 ${supplier.has_active_rule ? 'text-green-600' : 'text-gray-400'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {supplier.code && <span className="mr-2">Code: {supplier.code}</span>}
                                                                {supplier.nif && <span>NIF: {supplier.nif}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {supplier.auxiliary_account_code ? (
                                                        <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                            {supplier.auxiliary_account_code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Non créé</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {supplier.has_active_rule ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Active
                                                            </span>
                                                            {supplier.default_charge_account && (
                                                                <span className="text-xs text-gray-500">
                                                                    → {supplier.default_charge_account}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Aucune règle
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {supplier.has_active_rule ? (
                                                        <button
                                                            onClick={() => {
                                                                const rule = rules.find(r => 
                                                                    r.supplier_name.toLowerCase() === supplier.name.toLowerCase()
                                                                );
                                                                if (rule) handleEdit(rule);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                            title="Modifier la règle"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                            <span className="text-xs">Modifier</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCreateRuleForSupplier(supplier)}
                                                            className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                                                            title="Créer une règle"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            <span className="text-xs">Créer règle</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {/* Alert: Suppliers without rules */}
                        {activeTab === 'rules' && stats.suppliersWithoutRules > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            ⚠️ Fournisseurs sans règle
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p className="mb-2">
                                                Les factures de ces fournisseurs devront être imputées manuellement :
                                            </p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {suppliers
                                                    .filter(s => !s.has_active_rule)
                                                    .slice(0, 5)
                                                    .map(supplier => (
                                                        <li key={supplier.id}>
                                                            <strong>{supplier.name}</strong>
                                                            {(supplier as any).pending_invoices && (supplier as any).pending_invoices > 0 && (
                                                                <span className="text-yellow-600"> ({(supplier as any).pending_invoices} facture{(supplier as any).pending_invoices > 1 ? 's' : ''} en attente)</span>
                                                            )}
                                                        </li>
                                                    ))
                                                }
                                                {suppliers.filter(s => !s.has_active_rule).length > 5 && (
                                                    <li className="text-yellow-600">
                                                        ... et {suppliers.filter(s => !s.has_active_rule).length - 5} autre(s)
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={() => setActiveTab('suppliers')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Créer les règles manquantes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {activeTab === 'rules' 
                                    ? `${filteredRules.length} règle(s)` 
                                    : `${filteredSuppliers.length} fournisseur(s)`
                                }
                            </p>
                            {activeTab === 'suppliers' && stats.suppliersWithoutRules > 0 && (
                                <p className="text-sm text-orange-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {stats.suppliersWithoutRules} fournisseur(s) sans règle
                                </p>
                            )}
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
