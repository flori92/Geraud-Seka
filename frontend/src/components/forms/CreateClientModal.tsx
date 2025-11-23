"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createClient, ClientCreate } from "@/lib/api";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const [formData, setFormData] = useState<ClientCreate>({
    name: "",
    slug: "",
    sector: "",
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

      await createClient(formData, token);

      // Reset form
      setFormData({ name: "", slug: "", sector: "" });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau client" size="md">
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            label="Nom du client"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Cabinet Avocat XYZ"
            required
          />

          <Input
            label="Slug (identifiant unique)"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="cabinet-avocat-xyz"
            helperText="Généré automatiquement à partir du nom"
            required
          />

          <Input
            label="Secteur d'activité"
            value={formData.sector || ""}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            placeholder="Ex: Services juridiques"
          />
        </div>

        <ModalFooter className="mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Créer le client
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
