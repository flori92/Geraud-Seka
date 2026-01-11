/**
 * Page Paramètres Notifications
 * Règles, alertes email et push
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Bell, Mail, Smartphone, Save, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface NotificationSettings {
    email_enabled: boolean;
    push_enabled: boolean;
    invoice_pending: boolean;
    invoice_validated: boolean;
    invoice_error: boolean;
    payment_received: boolean;
    export_ready: boolean;
    daily_summary: boolean;
}

export default function NotificationsSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const [settings, setSettings] = useState<NotificationSettings>({
        email_enabled: true,
        push_enabled: false,
        invoice_pending: true,
        invoice_validated: true,
        invoice_error: true,
        payment_received: true,
        export_ready: true,
        daily_summary: false
    });

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
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Error fetching notifications settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/notifications`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

            setMessage({type: 'success', text: 'Paramètres de notifications enregistrés !'});
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({type: 'error', text: error.message});
        } finally {
            setSaving(false);
        }
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
                <title>Notifications - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="h-6 w-6 text-[#1e3a5f]" />
                            NOTIFICATIONS
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configurez vos alertes email et push
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
                        {/* Canaux */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Canaux de notification</h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">Notifications par email</p>
                                            <p className="text-sm text-gray-500">Recevez des emails pour les événements importants</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.email_enabled}
                                        onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">Notifications push</p>
                                            <p className="text-sm text-gray-500">Recevez des notifications sur votre navigateur</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.push_enabled}
                                        onChange={(e) => setSettings({...settings, push_enabled: e.target.checked})}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Événements */}
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Événements</h2>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">Nouvelle facture en attente</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.invoice_pending}
                                        onChange={(e) => setSettings({...settings, invoice_pending: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">Facture validée</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.invoice_validated}
                                        onChange={(e) => setSettings({...settings, invoice_validated: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">Erreur de traitement</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.invoice_error}
                                        onChange={(e) => setSettings({...settings, invoice_error: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">Paiement reçu</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.payment_received}
                                        onChange={(e) => setSettings({...settings, payment_received: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">Export terminé</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.export_ready}
                                        onChange={(e) => setSettings({...settings, export_ready: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">Résumé quotidien</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.daily_summary}
                                        onChange={(e) => setSettings({...settings, daily_summary: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
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
