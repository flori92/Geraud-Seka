"use client";

import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createInvoice, InvoiceCreate, getClients, Client } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;
      const data = await getClients(token);
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        throw new Error("Vous devez être connecté");
      }

      const data: InvoiceCreate = {
        title: "Facture", // Titre par défaut requis
        client_id: formData.client_id,
        issue_date: formData.date,
        due_date: formData.due_date,
        items: items.filter((item) => item.description && item.quantity > 0),
      };

      if (data.items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      await createInvoice(data, token);

      // Reset form
      setFormData({
        client_id: "",
        date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle facture" size="lg">
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          {/* Client & Dates */}
          <div className="grid gap-4 md:grid-cols-3">
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

            <Input
              label="Date de facture"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <Input
              label="Date d'échéance"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          {/* Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Articles</label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-24"
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Prix unitaire"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-32"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded p-2 text-accents-5 hover:bg-accents-1 hover:text-error transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-accents-2 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">
                {calculateTotal().toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        <ModalFooter className="mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Créer la facture
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
