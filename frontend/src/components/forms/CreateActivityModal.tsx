import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createCRMActivity } from "@/lib/api";

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateActivityModal({ isOpen, onClose, onSuccess }: CreateActivityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "call" as "call" | "meeting" | "email" | "task",
    title: "",
    description: "",
    date: "",
    duration: "",
    status: "scheduled",
    client_id: "",
    contact_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError("Le titre est requis");
      return;
    }
    if (!formData.date) {
      setError("La date est requise");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }

      await createCRMActivity(
        {
          type: formData.type,
          title: formData.title,
          notes: formData.description || undefined,
          date: formData.date,
          duration: formData.duration || undefined,
          status: formData.status,
          client_id: formData.client_id || undefined,
          contact_id: formData.contact_id || undefined,
        },
        token
      );

      // Reset form
      setFormData({
        type: "call",
        title: "",
        description: "",
        date: "",
        duration: "",
        status: "scheduled",
        client_id: "",
        contact_id: "",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création de l'activité");
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
      title="Nouvelle activité CRM"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type d'activité"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as "call" | "meeting" | "email" | "task",
              })
            }
            required
          >
            <option value="call">Appel téléphonique</option>
            <option value="meeting">Réunion</option>
            <option value="email">Email</option>
            <option value="task">Tâche</option>
          </Select>

          <Select
            label="Statut"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="scheduled">Planifié</option>
            <option value="pending">En attente</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </Select>
        </div>

        <Input
          label="Titre"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Appel de suivi avec le client"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Détails de l'activité..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date et heure"
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label="Durée estimée"
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="Ex: 30 min, 1h, 2h"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ID Client (optionnel)"
            type="text"
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            placeholder="ID du client"
          />

          <Input
            label="ID Contact (optionnel)"
            type="text"
            value={formData.contact_id}
            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
            placeholder="ID du contact"
          />
        </div>

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
            {loading ? "Création..." : "Créer l'activité"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
