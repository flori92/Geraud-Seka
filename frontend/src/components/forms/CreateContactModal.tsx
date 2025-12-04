import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contactId?: string; // Pour l'édition
  clientId?: string; // Pour pré-remplir le client
  leadId?: string; // Pour pré-remplir le lead
}

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  job_title: string;
  department: string;
  contact_type: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  preferred_contact_method: string;
  language: string;
  linkedin_url: string;
  twitter_handle: string;
  is_primary: boolean;
  is_active: boolean;
  do_not_contact: boolean;
  email_opt_out: boolean;
  notes: string;
  client_id: string;
  lead_id: string;
}

export function CreateContactModal({
  isOpen,
  onClose,
  onSuccess,
  contactId,
  clientId,
  leadId,
}: CreateContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    job_title: "",
    department: "",
    contact_type: "other",
    address: "",
    city: "",
    postal_code: "",
    country: "Bénin",
    preferred_contact_method: "email",
    language: "fr",
    linkedin_url: "",
    twitter_handle: "",
    is_primary: false,
    is_active: true,
    do_not_contact: false,
    email_opt_out: false,
    notes: "",
    client_id: clientId || "",
    lead_id: leadId || "",
  });

  useEffect(() => {
    if (contactId && isOpen) {
      fetchContact();
    } else if (isOpen) {
      // Reset form for new contact
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        mobile: "",
        job_title: "",
        department: "",
        contact_type: "other",
        address: "",
        city: "",
        postal_code: "",
        country: "Bénin",
        preferred_contact_method: "email",
        language: "fr",
        linkedin_url: "",
        twitter_handle: "",
        is_primary: false,
        is_active: true,
        do_not_contact: false,
        email_opt_out: false,
        notes: "",
        client_id: clientId || "",
        lead_id: leadId || "",
      });
    }
  }, [contactId, isOpen, clientId, leadId]);

  const fetchContact = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          mobile: data.mobile || "",
          job_title: data.job_title || "",
          department: data.department || "",
          contact_type: data.contact_type || "other",
          address: data.address || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
          country: data.country || "Bénin",
          preferred_contact_method: data.preferred_contact_method || "email",
          language: data.language || "fr",
          linkedin_url: data.linkedin_url || "",
          twitter_handle: data.twitter_handle || "",
          is_primary: data.is_primary || false,
          is_active: data.is_active !== undefined ? data.is_active : true,
          do_not_contact: data.do_not_contact || false,
          email_opt_out: data.email_opt_out || false,
          notes: data.notes || "",
          client_id: data.client_id || "",
          lead_id: data.lead_id || "",
        });
      }
    } catch (err) {
      console.error("Error fetching contact:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Préparer les données (enlever les champs vides)
      const submitData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        contact_type: formData.contact_type,
        language: formData.language,
        is_primary: formData.is_primary,
        is_active: formData.is_active,
        do_not_contact: formData.do_not_contact,
        email_opt_out: formData.email_opt_out,
      };

      // Ajouter les champs optionnels s'ils sont remplis
      if (formData.phone) submitData.phone = formData.phone;
      if (formData.mobile) submitData.mobile = formData.mobile;
      if (formData.job_title) submitData.job_title = formData.job_title;
      if (formData.department) submitData.department = formData.department;
      if (formData.address) submitData.address = formData.address;
      if (formData.city) submitData.city = formData.city;
      if (formData.postal_code) submitData.postal_code = formData.postal_code;
      if (formData.country) submitData.country = formData.country;
      if (formData.preferred_contact_method) submitData.preferred_contact_method = formData.preferred_contact_method;
      if (formData.linkedin_url) submitData.linkedin_url = formData.linkedin_url;
      if (formData.twitter_handle) submitData.twitter_handle = formData.twitter_handle;
      if (formData.notes) submitData.notes = formData.notes;
      if (formData.client_id) submitData.client_id = formData.client_id;
      if (formData.lead_id) submitData.lead_id = formData.lead_id;

      const url = contactId
        ? `${API_BASE_URL}/api/v1/crm/contacts/${contactId}`
        : `${API_BASE_URL}/api/v1/crm/contacts/`;

      const response = await fetch(url, {
        method: contactId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Erreur lors de l'enregistrement du contact");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement du contact");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-accents-2 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {contactId ? "Modifier le contact" : "Nouveau contact"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accents-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-accents-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {/* Informations personnelles */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Nom *"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Téléphone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
          </div>

          {/* Informations professionnelles */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Informations professionnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Poste"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
              <Input
                label="Département"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type de contact *
                </label>
                <Select
                  value={formData.contact_type}
                  onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
                  required
                >
                  <option value="decision_maker">Décideur</option>
                  <option value="influencer">Influenceur</option>
                  <option value="technical">Technique</option>
                  <option value="financial">Financier</option>
                  <option value="user">Utilisateur</option>
                  <option value="other">Autre</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Adresse</h3>
            <div className="space-y-4">
              <Input
                label="Adresse"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Ville"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Code postal"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
                <Input
                  label="Pays"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Préférences */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Préférences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Méthode de contact préférée
                </label>
                <Select
                  value={formData.preferred_contact_method}
                  onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                >
                  <option value="email">Email</option>
                  <option value="phone">Téléphone</option>
                  <option value="mobile">Mobile</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Langue
                </label>
                <Select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Réseaux sociaux</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="LinkedIn URL"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
              <Input
                label="Twitter"
                value={formData.twitter_handle}
                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-foreground">Contact principal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-foreground">Actif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.do_not_contact}
                  onChange={(e) => setFormData({ ...formData, do_not_contact: e.target.checked })}
                  className="w-4 h-4 text-error rounded"
                />
                <span className="text-sm text-foreground">Ne pas contacter</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email_opt_out}
                  onChange={(e) => setFormData({ ...formData, email_opt_out: e.target.checked })}
                  className="w-4 h-4 text-error rounded"
                />
                <span className="text-sm text-foreground">Désinscrit des emails</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Notes internes sur ce contact..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-accents-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {contactId ? "Mettre à jour" : "Créer le contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
