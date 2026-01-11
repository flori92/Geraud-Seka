/**
 * Page Paramètres Apparence
 * Thème et personnalisation
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Palette, Save, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function ApparenceSettingsPage() {
    const router = useRouter();
    const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
    const [primaryColor, setPrimaryColor] = useState("#1e3a5f");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("seka_access_token");
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/appearance`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ theme, primaryColor })
            });

            if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

            setMessage({type: 'success', text: 'Paramètres d\'apparence enregistrés !'});
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
                <title>Apparence - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Palette className="h-6 w-6 text-[#1e3a5f]" />
                            APPARENCE
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Personnalisez l'apparence de SEKA
                        </p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thème</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer ${
                                        theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}>
                                        <div className="w-16 h-16 bg-white border border-gray-300 rounded-lg mb-2"></div>
                                        <span className="text-sm font-medium">Clair</span>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="light"
                                            checked={theme === 'light'}
                                            onChange={(e) => setTheme(e.target.value as any)}
                                            className="sr-only"
                                        />
                                    </label>
                                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer ${
                                        theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}>
                                        <div className="w-16 h-16 bg-gray-900 border border-gray-700 rounded-lg mb-2"></div>
                                        <span className="text-sm font-medium">Sombre</span>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="dark"
                                            checked={theme === 'dark'}
                                            onChange={(e) => setTheme(e.target.value as any)}
                                            className="sr-only"
                                        />
                                    </label>
                                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer ${
                                        theme === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}>
                                        <div className="w-16 h-16 bg-gradient-to-r from-white to-gray-900 border border-gray-400 rounded-lg mb-2"></div>
                                        <span className="text-sm font-medium">Auto</span>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="auto"
                                            checked={theme === 'auto'}
                                            onChange={(e) => setTheme(e.target.value as any)}
                                            className="sr-only"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Couleur principale</h2>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{primaryColor}</p>
                                        <p className="text-xs text-gray-500">Couleur utilisée dans l'interface</p>
                                    </div>
                                </div>
                            </div>
                        </div>

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
