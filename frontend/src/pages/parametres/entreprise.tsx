/**
 * Page Paramètres Entreprise
 * Infos société, logo, adresse, NIF, RCCM
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Building2, Save, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface CompanySettings {
    name: string;
    legal_form?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    nif?: string;
    rccm?: string;
    currency?: string;
    fiscal_year_start?: string;
    logo_url?: string;
}

export default function EntrepriseSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<CompanySettings>({
        name: "",
        legal_form: "SARL",
        address: "",
        city: "",
        country: "Bénin",
        phone: "",
        email: "",
        website: "",
        nif: "",
        rccm: "",
        currency: "FCFA",
        fiscal_year_start: "01-01"
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
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/company`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(data);
                if (data.logo_url) {
                    setLogoPreview(data.logo_url);
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setMessage({type: 'error', text: 'Le logo ne doit pas dépasser 2 MB'});
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        const token = localStorage.getItem("seka_access_token");

        try {
            // Upload logo si présent
            if (logoFile) {
                const logoFormData = new FormData();
                logoFormData.append("logo", logoFile);

                const logoResponse = await fetch(`${API_BASE_URL}/api/v1/settings/company/logo`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: logoFormData
                });

                if (logoResponse.ok) {
                    const { logo_url } = await logoResponse.json();
                    formData.logo_url = logo_url;
                }
            }

            // Save settings
            const response = await fetch(`${API_BASE_URL}/api/v1/settings/company`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

            setMessage({type: 'success', text: 'Paramètres enregistrés avec succès !'});
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
                <title>Paramètres Entreprise - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-[#1e3a5f]" />
                            PARAMÈTRES ENTREPRISE
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Informations de votre société
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

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Logo */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
                            <div className="flex items-center gap-6">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="h-24 w-24 object-contain border border-gray-200 rounded-lg" />
                                ) : (
                                    <div className="h-24 w-24 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                        <Building2 className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <input
                                        type="file"
                                        id="logo"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="logo"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Changer le logo
                                    </label>
                                    <p className="mt-1 text-xs text-gray-500">PNG, JPG jusqu'à 2MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Informations générales */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Raison sociale *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Forme juridique
                                    </label>
                                    <select
                                        value={formData.legal_form}
                                        onChange={(e) => setFormData({...formData, legal_form: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="SARL">SARL</option>
                                        <option value="SA">SA</option>
                                        <option value="SAS">SAS</option>
                                        <option value="EI">Entreprise Individuelle</option>
                                        <option value="ASSOCIATION">Association</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Devise
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="FCFA">FCFA</option>
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                    <input
                                        type="text"
                                        value={formData.address || ""}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                        <input
                                            type="text"
                                            value={formData.city || ""}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                        <input
                                            type="text"
                                            value={formData.country || ""}
                                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone || ""}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email || ""}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                                    <input
                                        type="url"
                                        value={formData.website || ""}
                                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Informations légales */}
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations légales</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                                    <input
                                        type="text"
                                        value={formData.nif || ""}
                                        onChange={(e) => setFormData({...formData, nif: e.target.value})}
                                        placeholder="Numéro d'Identification Fiscale"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
                                    <input
                                        type="text"
                                        value={formData.rccm || ""}
                                        onChange={(e) => setFormData({...formData, rccm: e.target.value})}
                                        placeholder="Registre du Commerce"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Début exercice fiscal</label>
                                    <input
                                        type="text"
                                        value={formData.fiscal_year_start || ""}
                                        onChange={(e) => setFormData({...formData, fiscal_year_start: e.target.value})}
                                        placeholder="MM-JJ (ex: 01-01)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
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
