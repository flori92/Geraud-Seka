import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Archive } from 'lucide-react';

interface Duplicate {
  id: string;
  detection_reason: string;
  new_document: {
    id: string;
    filename: string;
    supplier_name: string;
    reference_number: string;
    document_date: string | null;
    amount_ttc: number | null;
    file_path: string;
  };
  existing_document: {
    id: string;
    filename: string;
    supplier_name: string;
    reference_number: string;
    document_date: string | null;
    amount_ttc: number | null;
    status: string;
    file_path: string;
    created_at: string | null;
  };
  comparison: {
    fields: Array<{
      field: string;
      label: string;
      new_value: any;
      existing_value: any;
      identical: boolean;
    }>;
    all_identical: boolean;
  };
}

interface DuplicateConfrontationModalProps {
  duplicate: Duplicate;
  onClose: () => void;
  onResolve: (duplicateId: string, resolution: string, reason?: string) => void;
  isLoading?: boolean;
}

export default function DuplicateConfrontationModal({
  duplicate,
  onClose,
  onResolve,
  isLoading = false
}: DuplicateConfrontationModalProps) {
  const [resolution, setResolution] = useState<string>('keep_both');
  const [reason, setReason] = useState<string>('');

  // Validation des données
  if (!duplicate || !duplicate.id || !duplicate.new_document || !duplicate.existing_document) {
    console.error('DuplicateConfrontationModal: Données invalides', duplicate);
    return null;
  }

  const handleSubmit = () => {
    if (resolution === 'kept_both' && !reason.trim()) {
      alert('Veuillez fournir un motif pour conserver les deux documents.');
      return;
    }
    onResolve(duplicate.id, resolution, reason.trim() || undefined);
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALIDEE':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'EXPORTED':
        return <Archive className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">🛑 DOUBLON DÉTECTÉ</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message */}
        <div className="px-6 py-4 bg-yellow-50 border-b">
          <p className="text-sm text-yellow-800">
            Cette facture existe déjà dans le système. Comparez les deux documents avant de continuer.
          </p>
          <div className="mt-2 text-xs text-yellow-700 font-medium">
            Raison du blocage : {duplicate.detection_reason === 'same_invoice_number' 
              ? 'Même fournisseur + Même N° facture' 
              : 'Même fournisseur + Même montant + Même date'}
          </div>
        </div>

        {/* Documents comparison */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New document */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">📄 NOUVELLE FACTURE</h3>
              <div className="text-xs text-gray-500 mb-3">(vient d'être uploadée)</div>
              
              <div className="space-y-3">
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{duplicate.new_document.filename}</div>
                  <div className="text-xs text-gray-500 mt-1">Fournisseur: {duplicate.new_document.supplier_name || 'N/A'}</div>
                  <div className="text-xs text-gray-500">N°: {duplicate.new_document.reference_number || 'N/A'}</div>
                  <div className="text-xs text-gray-500">Date: {formatDate(duplicate.new_document.document_date)}</div>
                  <div className="text-xs text-gray-500">Montant: {formatAmount(duplicate.new_document.amount_ttc)}</div>
                </div>
                
                <div className="text-xs text-gray-600">
                  <strong>INFORMATIONS EXTRAITES</strong>
                </div>
                <div className="text-xs space-y-1">
                  <div>Fournisseur: {duplicate.new_document.supplier_name || 'N/A'}</div>
                  <div>N° facture: {duplicate.new_document.reference_number || 'N/A'}</div>
                  <div>Date: {formatDate(duplicate.new_document.document_date)}</div>
                  <div>Montant TTC: {formatAmount(duplicate.new_document.amount_ttc)}</div>
                </div>
              </div>
            </div>

            {/* Existing document */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">📄 FACTURE EXISTANTE</h3>
              <div className="text-xs text-gray-500 mb-3">(déjà dans le système)</div>
              
              <div className="space-y-3">
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{duplicate.existing_document.filename}</div>
                  <div className="text-xs text-gray-500 mt-1">Fournisseur: {duplicate.existing_document.supplier_name || 'N/A'}</div>
                  <div className="text-xs text-gray-500">N°: {duplicate.existing_document.reference_number || 'N/A'}</div>
                  <div className="text-xs text-gray-500">Date: {formatDate(duplicate.existing_document.document_date)}</div>
                  <div className="text-xs text-gray-500">Montant: {formatAmount(duplicate.existing_document.amount_ttc)}</div>
                </div>
                
                <div className="text-xs text-gray-600">
                  <strong>INFORMATIONS ENREGISTRÉES</strong>
                </div>
                <div className="text-xs space-y-1">
                  <div>Fournisseur: {duplicate.existing_document.supplier_name || 'N/A'}</div>
                  <div>N° facture: {duplicate.existing_document.reference_number || 'N/A'}</div>
                  <div>Date: {formatDate(duplicate.existing_document.document_date)}</div>
                  <div>Montant TTC: {formatAmount(duplicate.existing_document.amount_ttc)}</div>
                  <div className="flex items-center space-x-1">
                    <span>STATUT : </span>
                    {getStatusIcon(duplicate.existing_document.status)}
                    <span className="capitalize">{duplicate.existing_document.status}</span>
                  </div>
                  <div>Enregistrée le: {formatDate(duplicate.existing_document.created_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">COMPARAISON DÉTAILLÉE</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Champ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nouvelle</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Existante</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Identique</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {duplicate.comparison.fields.map((field, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{field.label}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{field.new_value || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{field.existing_value || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        {field.identical ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {duplicate.comparison.all_identical 
                ? "→ TOUS LES CHAMPS SONT IDENTIQUES = C'EST UN DOUBLON"
                : "→ DES DIFFÉRENCES ONT ÉTÉ DÉTECTÉES"
              }
            </div>
          </div>
        </div>

        {/* Resolution options */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Que voulez-vous faire ?</h3>
          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="resolution"
                value="rejected"
                checked={resolution === 'rejected'}
                onChange={(e) => setResolution(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">C'est un doublon → Rejeter la nouvelle facture</div>
                <div className="text-sm text-gray-500">(la facture existante sera conservée)</div>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="resolution"
                value="kept_both"
                checked={resolution === 'kept_both'}
                onChange={(e) => setResolution(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Ce n'est PAS un doublon → Conserver les deux</div>
                <div className="text-sm text-gray-500">Motif obligatoire :</div>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ex: 'Facture rectificative', 'Avoir', etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={resolution !== 'kept_both'}
                />
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="radio"
                name="resolution"
                value="replaced"
                checked={resolution === 'replaced'}
                onChange={(e) => setResolution(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">Remplacer l'existante → Utiliser la nouvelle version</div>
                <div className="text-sm text-gray-500">(l'ancienne sera archivée)</div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Traitement...' : 'Confirmer mon choix'}
          </button>
        </div>
      </div>
    </div>
  );
}
