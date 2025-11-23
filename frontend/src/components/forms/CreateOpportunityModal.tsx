import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createOpportunity } from "@/lib/api";

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOpportunityModal({ isOpen, onClose, onSuccess }: CreateOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
    value: "",
    stage: "Qualification",
    probability: "25",
    close_date: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError("Le titre est requis");
      return;
    }
    if (!formData.client_id.trim()) {
      setError("Le client est requis");
      return;
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      setError("La valeur doit être supérieure à 0");
      return;
    }
    if (!formData.close_date) {
      setError("La date de clôture est requise");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }

      await createOpportunity(
        {
          name: formData.title,
          description: formData.description || undefined,
          client_id: formData.client_id,
          amount: parseFloat(formData.value),
          stage: formData.stage,
          probability: parseInt(formData.probability),
          expected_close_date: formData.close_date,
          notes: formData.notes || undefined,
          assigned_to: formData.client_id, // À corriger selon la logique métier
        },
        token
      );

      // Reset form
      setFormData({
        title: "",
        description: "",
        client_id: "",
        value: "",
        stage: "Qualification",
        probability: "25",
        close_date: "",
        notes: "",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création de l'opportunité");
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

  // Update probability based on stage
  const handleStageChange = (stage: string) => {
    let probability = "25";
    switch (stage) {
      case "Qualification":
        probability = "25";
        break;
      case "Proposition":
        probability = "50";
        break;
      case "Négociation":
        probability = "75";
        break;
      case "Gagné":
        probability = "100";
        break;
      case "Perdu":
        probability = "0";
        break;
    }
    setFormData({ ...formData, stage, probability });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouvelle opportunité"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Input
          label="Titre de l'opportunité"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Projet ERP pour ACME Corp"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez l'opportunité..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ID Client"
            type="text"
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            placeholder="ID du client"
            required
          />

          <Input
            label="Valeur (FCFA)"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="Ex: 5000000"
            min="0"
            step="1000"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Étape"
            value={formData.stage}
            onChange={(e) => handleStageChange(e.target.value)}
            required
          >
            <option value="Qualification">Qualification</option>
            <option value="Proposition">Proposition</option>
            <option value="Négociation">Négociation</option>
            <option value="Gagné">Gagné</option>
            <option value="Perdu">Perdu</option>
          </Select>

          <Input
            label="Probabilité (%)"
            type="number"
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
            min="0"
            max="100"
            required
          />

          <Input
            label="Date de clôture"
            type="date"
            value={formData.close_date}
            onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
            required
          />
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
            {loading ? "Création..." : "Créer l'opportunité"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
