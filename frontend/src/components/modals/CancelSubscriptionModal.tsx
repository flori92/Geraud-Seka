import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Textarea } from '@/components/ui/Textarea';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CancelSubscriptionModal({ isOpen, onClose, onSuccess }: CancelSubscriptionModalProps) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('seka_access_token');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/billing/subscription/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Erreur lors de l\'annulation');
            }

            setReason('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Annuler l'abonnement">
            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="error" className="mb-4">
                        {error}
                    </Alert>
                )}

                <Alert variant="warning" className="mb-4">
                    <p className="font-medium">Attention</p>
                    <p className="text-sm mt-1">
                        L'annulation de votre abonnement prendra effet à la fin de la période de facturation en cours.
                        Vous conserverez l'accès à toutes les fonctionnalités jusqu'à cette date.
                    </p>
                </Alert>

                <Textarea
                    label="Raison de l'annulation (optionnel)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Dites-nous pourquoi vous annulez votre abonnement..."
                    rows={4}
                />

                <ModalFooter className="mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        Confirmer l'annulation
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
