import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Smartphone } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ConfigureKKiaPayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ConfigureKKiaPayModal({ isOpen, onClose, onSuccess }: ConfigureKKiaPayModalProps) {
    const [provider, setProvider] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
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
                `${API_BASE_URL}/api/v1/billing/payment-method/mobile-money`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        provider,
                        phone_number: phoneNumber,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Erreur lors de la configuration');
            }

            setProvider('');
            setPhoneNumber('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurer Mobile Money">
            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="error" className="mb-4">
                        {error}
                    </Alert>
                )}

                <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg">
                    <Smartphone className="h-8 w-8 text-blue-600" />
                    <div>
                        <p className="font-medium text-gray-900">Mobile Money KKiaPay</p>
                        <p className="text-sm text-gray-600">
                            Payez facilement avec Orange Money, MTN Mobile Money, Moov Money ou Wave
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Select
                        label="Opérateur mobile"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        required
                    >
                        <option value="">Sélectionnez un opérateur</option>
                        <option value="orange">Orange Money</option>
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="moov">Moov Money</option>
                        <option value="wave">Wave</option>
                    </Select>

                    <Input
                        label="Numéro de téléphone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+229 XX XX XX XX"
                        required
                    />

                    <Alert variant="default" className="text-sm">
                        Vous recevrez une notification sur votre téléphone pour valider la transaction lors de chaque paiement.
                    </Alert>
                </div>

                <ModalFooter className="mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        Configurer
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
