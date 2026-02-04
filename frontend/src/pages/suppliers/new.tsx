/**
 * Page Nouveau Fournisseur - Style Pennylane
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PageHeader } from '@/components/pennylane/PageHeader';
import {
  Building2, Mail, Phone, MapPin, CreditCard, 
  Save, X, Globe, FileText, Hash
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SupplierFormData {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  paymentTerms: number;
  notes: string;
  chargeAccount: string;
  vatAccount: string;
  supplierAccount: string;
}

const initialFormData: SupplierFormData = {
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'BJ',
  taxId: '',
  paymentTerms: 30,
  notes: '',
  chargeAccount: '6061',
  vatAccount: '4454',
  supplierAccount: '',
};

const countries = [
  { code: 'BJ', name: 'Bénin' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'SN', name: 'Sénégal' },
  { code: 'TG', name: 'Togo' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'ML', name: 'Mali' },
  { code: 'NE', name: 'Niger' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Congo' },
  { code: 'FR', name: 'France' },
];

export default function NewSupplierPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({});

  const handleChange = (field: keyof SupplierFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const generateSupplierCode = () => {
    const prefix = formData.name.slice(0, 3).toUpperCase() || 'FRN';
    const random = Math.floor(Math.random() * 9000) + 1000;
    handleChange('code', `${prefix}${random}`);
  };

  const generateSupplierAccount = () => {
    const prefix = '401';
    const namePart = formData.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'XXXXX';
    handleChange('supplierAccount', `${prefix}${namePart}`);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SupplierFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Le code est obligatoire';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('seka_access_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country,
          tax_id: formData.taxId || null,
          payment_terms: formData.paymentTerms,
          notes: formData.notes || null,
          charge_account: formData.chargeAccount || null,
          vat_account: formData.vatAccount || null,
          supplier_account: formData.supplierAccount || null,
        }),
      });

      if (response.ok) {
        router.push('/suppliers');
      } else {
        const data = await response.json();
        alert(data.detail || 'Erreur lors de la création du fournisseur');
      }
    } catch (error) {
      console.error('Erreur création fournisseur:', error);
      alert('Erreur lors de la création du fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    field, 
    type = 'text',
    icon: Icon,
    placeholder,
    required,
    suffix,
  }: { 
    label: string; 
    field: keyof SupplierFormData;
    type?: string;
    icon?: React.ComponentType<{ className?: string }>;
    placeholder?: string;
    required?: boolean;
    suffix?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          value={formData[field] as string}
          onChange={(e) => handleChange(field, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      {errors[field] && (
        <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Nouveau Fournisseur - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          breadcrumb={[
            { label: 'Achats', href: '/achats' },
            { label: 'Fournisseurs', href: '/suppliers' },
            { label: 'Nouveau' },
          ]}
        />

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Nouveau Fournisseur</h1>
                  <p className="text-sm text-gray-500">Créer une fiche fournisseur</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Informations générales */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  Informations générales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Nom / Raison sociale"
                    field="name"
                    icon={Building2}
                    placeholder="Ex: SBEE, SONEB..."
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code fournisseur <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                          placeholder="Ex: SBEE001"
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent ${
                            errors.code ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={generateSupplierCode}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Générer
                      </button>
                    </div>
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-500">{errors.code}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Email"
                    field="email"
                    type="email"
                    icon={Mail}
                    placeholder="contact@fournisseur.com"
                  />
                  <InputField
                    label="Téléphone"
                    field="phone"
                    icon={Phone}
                    placeholder="+229 XX XX XX XX"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  Adresse
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Adresse"
                    field="address"
                    icon={MapPin}
                    placeholder="Rue, quartier..."
                  />
                  <InputField
                    label="Ville"
                    field="city"
                    placeholder="Cotonou, Abidjan..."
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pays
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent appearance-none bg-white"
                      >
                        {countries.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <InputField
                    label="N° Identification fiscale (IFU/SIRET)"
                    field="taxId"
                    placeholder="Ex: 3202410xxxxx"
                  />
                </div>
              </div>

              {/* Comptabilité */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  Paramètres comptables
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Délai de paiement (jours)"
                    field="paymentTerms"
                    type="number"
                    placeholder="30"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compte fournisseur (401xxx)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.supplierAccount}
                        onChange={(e) => handleChange('supplierAccount', e.target.value.toUpperCase())}
                        placeholder="Ex: 401SBEE"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={generateSupplierAccount}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Générer
                      </button>
                    </div>
                  </div>
                  <InputField
                    label="Compte de charge par défaut"
                    field="chargeAccount"
                    placeholder="Ex: 6061"
                  />
                  <InputField
                    label="Compte TVA par défaut"
                    field="vatAccount"
                    placeholder="Ex: 4454"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Notes
                </h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Notes internes sur ce fournisseur..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
