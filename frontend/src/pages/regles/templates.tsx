/**
 * Page Templates SYSCOHADA - Configuration rapide des règles
 * 
 * Permet de:
 * - Visualiser les templates disponibles
 * - Appliquer des templates pour créer fournisseurs + règles
 * - Importer/Exporter des règles
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Download, Upload, Package, CheckCircle, XCircle, AlertCircle,
    ChevronRight, Zap, Building, FileJson, FileSpreadsheet,
    RefreshCw, Plus, Eye, Settings
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Template {
    id: string;
    name: string;
    supplier_count: number;
    suppliers: {
        name: string;
        code: string;
        charge_account: string;
    }[];
}

interface ImportResult {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
}

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
    const [overwrite, setOverwrite] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const token = localStorage.getItem('seka_access_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rules-advanced/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTemplate = async (templateId: string, suppliers?: string[]) => {
        const token = localStorage.getItem('seka_access_token');
        setApplying(templateId);
        setResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rules-advanced/templates/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    template_id: templateId,
                    selected_suppliers: suppliers,
                    overwrite
                })
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                // Rafraîchir après 2 secondes
                setTimeout(() => {
                    setResult(null);
                    setSelectedTemplate(null);
                }, 3000);
            }
        } catch (err) {
            console.error('Error applying template:', err);
            setResult({ success: false, error: 'Erreur réseau' });
        } finally {
            setApplying(null);
        }
    };

    const handleExport = async (format: 'json' | 'csv') => {
        const token = localStorage.getItem('seka_access_token');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rules-advanced/export/${format}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `regles_imputation.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('Erreur lors de l\'export');
        }
    };

    const handleImport = async (file: File, format: 'json' | 'csv') => {
        const token = localStorage.getItem('seka_access_token');
        setImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/rules-advanced/import/${format}?overwrite=${overwrite}`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                }
            );

            const data = await response.json();
            setImportResult(data);
        } catch (err) {
            console.error('Import error:', err);
            setImportResult({ success: false, imported: 0, updated: 0, skipped: 0, errors: ['Erreur réseau'] });
        } finally {
            setImporting(false);
        }
    };

    const toggleSupplierSelection = (code: string) => {
        setSelectedSuppliers(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const selectAllSuppliers = () => {
        if (selectedTemplate) {
            setSelectedSuppliers(selectedTemplate.suppliers.map(s => s.code));
        }
    };

    const deselectAllSuppliers = () => {
        setSelectedSuppliers([]);
    };

    return (
        <>
            <Head>
                <title>Templates SYSCOHADA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="h-6 w-6 text-[#1e3a5f]" />
                                    TEMPLATES SYSCOHADA
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Configuration rapide avec des modèles prédéfinis conformes au plan comptable SYSCOHADA
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/regles/fournisseurs')}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    <Settings className="h-4 w-4" />
                                    Gérer les règles
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Import/Export Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Import / Export de règles
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            {/* Export */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-3">Exporter les règles</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Téléchargez toutes vos règles d'imputation pour sauvegarde ou transfert.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <FileJson className="h-4 w-4" />
                                        Export JSON
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            {/* Import */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-3">Importer des règles</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Importez des règles depuis un fichier JSON ou CSV.
                                </p>
                                <div className="flex items-center gap-3 mb-3">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={overwrite}
                                            onChange={(e) => setOverwrite(e.target.checked)}
                                            className="h-4 w-4 text-[#1e3a5f] rounded"
                                        />
                                        Écraser les règles existantes
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] cursor-pointer">
                                        <Upload className="h-4 w-4" />
                                        Import JSON
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImport(file, 'json');
                                            }}
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] cursor-pointer">
                                        <Upload className="h-4 w-4" />
                                        Import CSV
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImport(file, 'csv');
                                            }}
                                        />
                                    </label>
                                </div>

                                {/* Import Result */}
                                {importResult && (
                                    <div className={`mt-4 p-3 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                        {importResult.success ? (
                                            <div className="text-green-700">
                                                <CheckCircle className="h-4 w-4 inline mr-2" />
                                                Import réussi: {importResult.imported} créé(s), {importResult.updated} mis à jour, {importResult.skipped} ignoré(s)
                                            </div>
                                        ) : (
                                            <div className="text-red-700">
                                                <XCircle className="h-4 w-4 inline mr-2" />
                                                Erreurs: {importResult.errors.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {importing && (
                                    <div className="mt-4 flex items-center gap-2 text-gray-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e3a5f]"></div>
                                        Import en cours...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Templates Grid */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Templates disponibles
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Cliquez sur un template pour voir les fournisseurs inclus et les appliquer.
                        </p>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setSelectedSuppliers(template.suppliers.map(s => s.code));
                                        }}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedTemplate?.id === template.id
                                                ? 'border-[#1e3a5f] bg-blue-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Package className={`h-6 w-6 ${selectedTemplate?.id === template.id ? 'text-[#1e3a5f]' : 'text-gray-400'}`} />
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                {template.supplier_count} fournisseurs
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                        <div className="mt-2 text-xs text-gray-500">
                                            {template.suppliers.slice(0, 3).map(s => s.name).join(', ')}
                                            {template.suppliers.length > 3 && '...'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Template Details */}
                    {selectedTemplate && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedTemplate.name}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectAllSuppliers}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Tout sélectionner
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={deselectAllSuppliers}
                                        className="text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        Tout désélectionner
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSuppliers.length === selectedTemplate.suppliers.length}
                                                    onChange={() => {
                                                        if (selectedSuppliers.length === selectedTemplate.suppliers.length) {
                                                            deselectAllSuppliers();
                                                        } else {
                                                            selectAllSuppliers();
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-[#1e3a5f] rounded"
                                                />
                                            </th>
                                            <th className="px-4 py-2 text-left text-gray-500">Fournisseur</th>
                                            <th className="px-4 py-2 text-left text-gray-500">Code</th>
                                            <th className="px-4 py-2 text-left text-gray-500">Compte de charge</th>
                                            <th className="px-4 py-2 text-left text-gray-500">Compte auxiliaire</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTemplate.suppliers.map((supplier) => (
                                            <tr key={supplier.code} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSuppliers.includes(supplier.code)}
                                                        onChange={() => toggleSupplierSelection(supplier.code)}
                                                        className="h-4 w-4 text-[#1e3a5f] rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                                                <td className="px-4 py-3 font-mono text-gray-600">{supplier.code}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono bg-green-50 text-green-700 px-2 py-1 rounded">
                                                        {supplier.charge_account}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                        401{supplier.code}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={overwrite}
                                        onChange={(e) => setOverwrite(e.target.checked)}
                                        className="h-4 w-4 text-[#1e3a5f] rounded"
                                    />
                                    Écraser les fournisseurs existants
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedTemplate(null)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => handleApplyTemplate(
                                            selectedTemplate.id,
                                            selectedSuppliers.length === selectedTemplate.suppliers.length 
                                                ? undefined 
                                                : selectedSuppliers
                                        )}
                                        disabled={applying !== null || selectedSuppliers.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                                    >
                                        {applying === selectedTemplate.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Application...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Appliquer ({selectedSuppliers.length} fournisseurs)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Result */}
                            {result && (
                                <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    {result.success ? (
                                        <div>
                                            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                                <CheckCircle className="h-5 w-5" />
                                                Template appliqué avec succès !
                                            </div>
                                            <div className="text-sm text-green-600">
                                                {result.created} créé(s), {result.updated} mis à jour, {result.skipped} ignoré(s)
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-700">
                                            <XCircle className="h-5 w-5" />
                                            {result.error || 'Erreur lors de l\'application'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900">Comment ça marche ?</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    Les templates SYSCOHADA créent automatiquement:
                                </p>
                                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                    <li>• Le fournisseur dans votre liste de tiers</li>
                                    <li>• Le compte auxiliaire (401SBEE, 401MTN, etc.) dans le plan comptable</li>
                                    <li>• La règle d'imputation avec le compte de charge approprié</li>
                                    <li>• Les mots-clés OCR pour la reconnaissance automatique</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
