"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createLead, LeadCreate } from "@/lib/api";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const [formData, setFormData] = useState<LeadCreate>({
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "Site web",
    status: "Nouveau",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        throw new Error("Vous devez être connecté");
      }

      await createLead(formData, token);

      // Reset form
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        source: "Site web",
        status: "Nouveau",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau lead" size="md">
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Sophie Bernard"
            required
          />

          <Input
            label="Entreprise"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Ex: StartUp InnoTech"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="sophie@innotech.com"
            required
          />

          <Input
            label="Téléphone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+229 97 12 34 56"
          />

          <Select
            label="Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            required
          >
            <option value="Site web">Site web</option>
            <option value="Recommandation">Recommandation</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Publicité">Publicité</option>
            <option value="Salon">Salon professionnel</option>
            <option value="Autre">Autre</option>
          </Select>

          <Select
            label="Statut"
            value={formData.status || "Nouveau"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Nouveau">Nouveau</option>
            <option value="Contacté">Contacté</option>
            <option value="Qualifié">Qualifié</option>
            <option value="Non qualifié">Non qualifié</option>
          </Select>
        </div>

        <ModalFooter className="mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Créer le lead
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
