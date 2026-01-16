import { useState } from 'react';
import { DocumentUpload } from '@/components/DocumentUpload';
import { NotificationCenter } from '@/components/NotificationCenter';

export default function TestDuplicateDetectionPage() {
    const [uploadCount, setUploadCount] = useState(0);
    const [lastDuplicate, setLastDuplicate] = useState<any>(null);

    const handleUploadSuccess = () => {
        setUploadCount(prev => prev + 1);
        console.log('✅ Upload réussi');
    };

    const handleDuplicateDetected = (info: any) => {
        setLastDuplicate(info);
        console.log('🛑 Doublon détecté:', info);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Test - Détection de Doublons
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Testez l'upload de documents et la détection automatique de doublons
                        </p>
                    </div>
                    <NotificationCenter />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h2 className="font-semibold text-blue-900 mb-2">📋 Instructions de test</h2>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                        <li>Uploadez un document (PDF, JPG, ou PNG)</li>
                        <li>Attendez l'extraction OCR automatique</li>
                        <li>Uploadez le même document à nouveau pour tester la détection</li>
                        <li>Vérifiez que l'alerte de doublon s'affiche</li>
                        <li>Vérifiez que la notification apparaît dans le centre de notifications (cloche en haut à droite)</li>
                        <li>Testez les actions de résolution: Rejeter, Conserver les deux, Remplacer</li>
                    </ol>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Upload de document</h2>
                    <DocumentUpload 
                        onUploadSuccess={handleUploadSuccess}
                        onDuplicateDetected={handleDuplicateDetected}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Documents uploadés</div>
                        <div className="text-3xl font-bold text-green-600">{uploadCount}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Doublons détectés</div>
                        <div className="text-3xl font-bold text-amber-600">
                            {lastDuplicate ? '1+' : '0'}
                        </div>
                    </div>
                </div>

                {lastDuplicate && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h3 className="font-semibold text-amber-900 mb-2">
                            🛑 Dernier doublon détecté
                        </h3>
                        <div className="text-sm space-y-1 text-amber-800">
                            <div><strong>Raison:</strong> {lastDuplicate.reason_text}</div>
                            <div><strong>Document existant:</strong> {lastDuplicate.existing_document?.reference_number || 'N/A'}</div>
                            <div><strong>Fournisseur:</strong> {lastDuplicate.existing_document?.supplier_name || 'N/A'}</div>
                            <div><strong>Montant:</strong> {lastDuplicate.existing_document?.amount_ttc || 0} €</div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">✅ Points de vérification</h2>
                    <div className="space-y-2 text-sm">
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>L'upload du document fonctionne correctement</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>L'OCR extrait les données (numéro, fournisseur, montant)</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>La détection de doublon fonctionne lors du 2ème upload</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>L'alerte de doublon (modal) s'affiche automatiquement</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Une notification apparaît dans le NotificationCenter</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Une notification navigateur s'affiche (si autorisé)</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Les actions de résolution (Rejeter/Conserver/Remplacer) fonctionnent</span>
                        </label>
                        <label className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Le message de statut change de couleur selon le type (succès/warning/erreur)</span>
                        </label>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 mt-6 text-xs text-green-400 font-mono">
                    <div>💡 Ouvrez la console JavaScript (F12) pour voir les logs détaillés</div>
                </div>
            </div>
        </div>
    );
}
