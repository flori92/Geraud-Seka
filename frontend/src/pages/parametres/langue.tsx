/**
 * Page Paramètres Langue et Région
 * Devise, format de date, langue
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Globe, Save, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function LangueSettingsPage() {
    const router = useRouter();
    const [language, setLanguage] = useState("fr");
    const [currency, setCurrency] = useState("FCFA");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [timezone, setTimezone] = useState("Africa/Porto-Novo");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/locale`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ language, currency, dateFormat, timezone })
            });

            if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

            setMessage({type: 'success', text: 'Paramètres de langue enregistrés !'});
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({type: 'error', text: error.message});
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Head>
                <title>Langue et Région - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Globe className="h-6 w-6 text-[#1e3a5f]" />
                            LANGUE ET RÉGION
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Devise, format de date, fuseau horaire</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="FCFA">FCFA (Franc CFA)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="USD">USD (Dollar)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Format de date</label>
                            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
                            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="Africa/Porto-Novo">Afrique/Porto-Novo (Bénin)</option>
                                <option value="Africa/Abidjan">Afrique/Abidjan (Côte d'Ivoire)</option>
                                <option value="Africa/Dakar">Afrique/Dakar (Sénégal)</option>
                                <option value="Europe/Paris">Europe/Paris</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
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
                                        Enregistrer
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
