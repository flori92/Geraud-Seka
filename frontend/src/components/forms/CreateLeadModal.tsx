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
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    source: "direct",
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

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        company: "",
        source: "direct",
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
            label="Prénom"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Ex: Sophie"
            required
          />

          <Input
            label="Nom"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Ex: Bernard"
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
            <option value="direct">Direct</option>
            <option value="website">Site web</option>
            <option value="referral">Recommandation</option>
            <option value="social">LinkedIn</option>
            <option value="advertising">Publicité</option>
            <option value="event">Salon professionnel</option>
            <option value="other">Autre</option>
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
