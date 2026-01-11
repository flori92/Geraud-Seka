/**
 * Page Paramètres Sécurité
 * Mot de passe, 2FA
 */
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Shield, Save, CheckCircle, AlertCircle, Lock, Smartphone } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function SecuriteSettingsPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage({type: 'error', text: 'Les mots de passe ne correspondent pas'});
            return;
        }

        setSaving(true);
        setMessage(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
            });

            if (!response.ok) throw new Error("Erreur lors du changement de mot de passe");

            setMessage({type: 'success', text: 'Mot de passe modifié avec succès !'});
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
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
                <title>Sécurité - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="h-6 w-6 text-[#1e3a5f]" />
                            SÉCURITÉ
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Mot de passe et authentification à deux facteurs</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Change Password */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Changer le mot de passe
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving}
                                    className="w-full px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium disabled:opacity-50"
                                >
                                    {saving ? "Modification..." : "Changer le mot de passe"}
                                </button>
                            </div>
                        </div>

                        {/* 2FA */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Authentification à deux facteurs (2FA)
                            </h2>
                            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">Activer 2FA</p>
                                    <p className="text-sm text-gray-500">Protection supplémentaire avec code temporaire</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={twoFactorEnabled}
                                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
