import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AccountFormData {
  account_code: string;
  account_name: string;
  account_type: string;
  currency: string;
  description: string;
  is_active: boolean;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    account_code: "",
    account_name: "",
    account_type: "asset",
    currency: "XOF",
    description: "",
    is_active: true,
  });

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
      
      const response = await fetch(`${API_BASE_URL}/api/v1/accounting/ledger-accounts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          account_code: "",
          account_name: "",
          account_type: "asset",
          currency: "XOF",
          description: "",
          is_active: true,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Erreur lors de la création du compte");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-accents-2 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Nouveau compte comptable</h2>
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

          {/* Informations de base */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Informations du compte</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code compte *"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="Ex: 401000"
                required
              />
              <Input
                label="Nom du compte *"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="Ex: Fournisseurs"
                required
              />
            </div>
          </div>

          {/* Type et devise */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Classification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type de compte *
                </label>
                <Select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  required
                >
                  <option value="asset">Actif</option>
                  <option value="liability">Passif</option>
                  <option value="equity">Capitaux propres</option>
                  <option value="revenue">Produits</option>
                  <option value="expense">Charges</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Devise
                </label>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description optionnelle du compte..."
            />
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-sm text-foreground">Compte actif</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-accents-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Créer le compte
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
