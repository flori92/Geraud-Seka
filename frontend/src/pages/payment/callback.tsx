import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { verifyKKiaPayTransaction } from '@/lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallbackPage() {
    const router = useRouter();
    const { transaction_id, status } = router.query;
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Vérification du paiement en cours...');

    useEffect(() => {
        if (!transaction_id) return;

        const verifyPayment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const result = await verifyKKiaPayTransaction(transaction_id as string, token);

                if (result.status === 'SUCCESS') {
                    setVerificationStatus('success');
                    setMessage('Paiement confirmé avec succès ! Votre abonnement est maintenant actif.');

                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                } else {
                    setVerificationStatus('error');
                    setMessage('Le paiement n\'a pas pu être confirmé. Veuillez contacter le support.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                setVerificationStatus('error');
                setMessage('Une erreur est survenue lors de la vérification du paiement.');
            }
        };

        verifyPayment();
    }, [transaction_id, router]);

    return (
        <>
            <Head>
                <title>Vérification du paiement - SEKA</title>
            </Head>

            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    {verificationStatus === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérification en cours</h1>
                            <p className="text-gray-600">{message}</p>
                        </>
                    )}

                    {verificationStatus === 'success' && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
                            <p className="text-gray-600 mb-4">{message}</p>
                            <div className="text-sm text-gray-500">
                                Redirection vers le tableau de bord...
                            </div>
                        </>
                    )}

                    {verificationStatus === 'error' && (
                        <>
                            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Échec du paiement</h1>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <button
                                onClick={() => router.push('/pricing')}
                                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                            >
                                Retour aux tarifs
                            </button>
                        </>
                    )}

                    {status && (
                        <div className="mt-4 text-xs text-gray-400">
                            Transaction ID: {transaction_id}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
