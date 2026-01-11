/**
 * Page Paramètres TVA
 * Taux par défaut, comptes TVA associés
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Percent, Save, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface VATRate {
    id?: string;
    rate: number;
    name: string;
    deductible_account: string;
    collected_account: string;
    is_default: boolean;
}

const DEFAULT_RATES: VATRate[] = [
    {
        rate: 18,
        name: "TVA standard Bénin",
        deductible_account: "4454",
        collected_account: "4457",
        is_default: true
    },
    {
        rate: 0,
        name: "Exonéré",
        deductible_account: "4454",
        collected_account: "4457",
        is_default: false
    }
];

export default function TVASettingsPage() {
    const router = useRouter();
    const [rates, setRates] = useState<VATRate[]>(DEFAULT_RATES);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/vat`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setRates(data);
                }
            }
        } catch (error) {
            console.error("Error fetching VAT settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/vat`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ rates })
            });

            if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

            setMessage({type: 'success', text: 'Paramètres TVA enregistrés avec succès !'});
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({type: 'error', text: error.message});
        } finally {
            setSaving(false);
        }
    };

    const handleAddRate = () => {
        setRates([...rates, {
            rate: 20,
            name: "Nouvelle TVA",
            deductible_account: "4454",
            collected_account: "4457",
            is_default: false
        }]);
    };

    const handleRemoveRate = (index: number) => {
        if (rates[index].is_default) {
            alert("Impossible de supprimer le taux par défaut");
            return;
        }
        setRates(rates.filter((_, i) => i !== index));
    };

    const handleUpdateRate = (index: number, field: keyof VATRate, value: any) => {
        const newRates = [...rates];
        newRates[index] = { ...newRates[index], [field]: value };
        setRates(newRates);
    };

    const handleSetDefault = (index: number) => {
        const newRates = rates.map((rate, i) => ({
            ...rate,
            is_default: i === index
        }));
        setRates(newRates);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Paramètres TVA - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Percent className="h-6 w-6 text-[#1e3a5f]" />
                            PARAMÈTRES TVA
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configurez les taux de TVA et comptes associés
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {message.text}
                        </div>
                    )}

                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Percent className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">Taux de TVA</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Le taux par défaut (18% au Bénin) sera appliqué automatiquement lors de la création des factures.
                                    Vous pouvez définir plusieurs taux selon vos besoins.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Rates List */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Taux de TVA</h2>
                                <button
                                    onClick={handleAddRate}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Plus className="h-4 w-4" />
                                    Ajouter un taux
                                </button>
                            </div>

                            <div className="space-y-4">
                                {rates.map((rate, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nom du taux
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rate.name}
                                                    onChange={(e) => handleUpdateRate(index, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Taux (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={rate.rate}
                                                    onChange={(e) => handleUpdateRate(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Compte TVA déductible
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rate.deductible_account}
                                                    onChange={(e) => handleUpdateRate(index, 'deductible_account', e.target.value)}
                                                    placeholder="Ex: 4454"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Pour les achats</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Compte TVA collectée
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rate.collected_account}
                                                    onChange={(e) => handleUpdateRate(index, 'collected_account', e.target.value)}
                                                    placeholder="Ex: 4457"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Pour les ventes</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={rate.is_default}
                                                        onChange={() => handleSetDefault(index)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Taux par défaut</span>
                                                </label>
                                                {rate.is_default && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                        Par défaut
                                                    </span>
                                                )}
                                            </div>
                                            {!rate.is_default && (
                                                <button
                                                    onClick={() => handleRemoveRate(index)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comptes TVA Info */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Comptes TVA SYSCOHADA</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-gray-700">TVA déductible (Achats)</p>
                                    <ul className="mt-2 space-y-1 text-gray-600">
                                        <li>• 4452 - TVA récupérable sur immobilisations</li>
                                        <li>• 4454 - TVA récupérable sur achats</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-700">TVA collectée (Ventes)</p>
                                    <ul className="mt-2 space-y-1 text-gray-600">
                                        <li>• 4457 - TVA collectée</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Enregistrer les modifications
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
