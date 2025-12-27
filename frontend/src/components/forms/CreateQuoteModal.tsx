import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createQuote, getClients, Client } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export function CreateQuoteModal({ isOpen, onClose, onSuccess }: CreateQuoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    date: new Date().toISOString().split("T")[0],
    valid_until: "",
    status: "En attente",
    notes: "",
  });
  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      setFormData((prev) => ({
        ...prev,
        valid_until: validUntil.toISOString().split("T")[0],
      }));
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;
      const data = await getClients(token);
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "description" ? value : parseFloat(value) || 0,
    };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.client_id) {
      setError("Veuillez sélectionner un client");
      return;
    }
    if (!formData.date) {
      setError("La date est requise");
      return;
    }
    if (!formData.valid_until) {
      setError("La date de validité est requise");
      return;
    }
    if (items.some((item) => !item.description.trim())) {
      setError("Tous les articles doivent avoir une description");
      return;
    }
    if (calculateTotal() <= 0) {
      setError("Le montant total doit être supérieur à 0");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }

      await createQuote(
        {
          title: "Devis",
          client_id: formData.client_id,
          issue_date: formData.date,
          expiry_date: formData.valid_until,
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        },
        token
      );

      setFormData({
        client_id: "",
        date: new Date().toISOString().split("T")[0],
        valid_until: "",
        status: "En attente",
        notes: "",
      });
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création du devis");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouveau devis"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Client"
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>

          <Select
            label="Statut"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="Brouillon">Brouillon</option>
            <option value="En attente">En attente</option>
            <option value="Accepté">Accepté</option>
            <option value="Refusé">Refusé</option>
            <option value="Expiré">Expiré</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date du devis"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label="Valable jusqu'au"
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Articles</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un article
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Description de l'article"
                    required
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    placeholder="Qté"
                    min="1"
                    required
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                    placeholder="Prix unitaire"
                    min="0"
                    step="100"
                    required
                  />
                </div>
                <div className="w-32 pt-2 text-sm font-medium text-foreground">
                  {(item.quantity * item.unit_price).toLocaleString()} FCFA
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="mt-2 p-2 rounded hover:bg-accents-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-error" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-accents-2">
            <div className="text-right">
              <p className="text-sm text-accents-5">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {calculateTotal().toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>

        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes additionnelles..."
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-accents-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Création..." : "Créer le devis"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
