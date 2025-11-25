import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CreditCard } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
    const [paymentType, setPaymentType] = useState<'card' | 'mobile'>('card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');
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

            const endpoint = paymentType === 'card'
                ? '/api/v1/billing/payment-method/card'
                : '/api/v1/billing/payment-method/mobile-money';

            const body = paymentType === 'card'
                ? {
                    card_number: cardNumber.replace(/\s/g, ''),
                    expiry_date: expiryDate,
                    cvv,
                    cardholder_name: cardholderName,
                }
                : {};

            const response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Erreur lors de l\'ajout du moyen de paiement');
            }

            // Reset form
            setCardNumber('');
            setExpiryDate('');
            setCvv('');
            setCardholderName('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : cleaned;
    };

    const formatExpiryDate = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un moyen de paiement" size="lg">
            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="error" className="mb-4">
                        {error}
                    </Alert>
                )}

                <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Type de paiement
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setPaymentType('card')}
                            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                paymentType === 'card'
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <CreditCard className="h-5 w-5" />
                            <span className="font-medium">Carte bancaire</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentType('mobile')}
                            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                paymentType === 'mobile'
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <CreditCard className="h-5 w-5" />
                            <span className="font-medium">Mobile Money</span>
                        </button>
                    </div>
                </div>

                {paymentType === 'card' ? (
                    <div className="space-y-4">
                        <Input
                            label="Numéro de carte"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Date d'expiration"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                placeholder="MM/AA"
                                maxLength={5}
                                required
                            />
                            <Input
                                label="CVV"
                                type="password"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                placeholder="123"
                                maxLength={4}
                                required
                            />
                        </div>

                        <Input
                            label="Nom du titulaire"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            placeholder="Jean Dupont"
                            required
                        />

                        <Alert variant="default" className="text-sm">
                            <p className="font-medium">Paiement sécurisé</p>
                            <p className="mt-1">
                                Vos informations bancaires sont cryptées et sécurisées via Stripe.
                                Nous ne stockons pas vos données de carte bancaire.
                            </p>
                        </Alert>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-gray-600 mb-4">
                            Pour configurer Mobile Money, veuillez utiliser le bouton "Configurer" dans la section Mobile Money.
                        </p>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Fermer
                        </Button>
                    </div>
                )}

                {paymentType === 'card' && (
                    <ModalFooter className="mt-6">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            Ajouter
                        </Button>
                    </ModalFooter>
                )}
            </form>
        </Modal>
    );
}
