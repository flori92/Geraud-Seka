import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface DuplicateAlertBannerProps {
  pendingDuplicates: Array<{
    id: string;
    detection_reason: string;
    new_document: {
      id: string;
      filename: string;
      supplier_name: string;
      reference_number: string;
      amount_ttc: number | null;
    };
  }>;
  onResolve: (duplicateId: string) => void;
  onDismiss?: () => void;
}

export default function DuplicateAlertBanner({
  pendingDuplicates,
  onResolve,
  onDismiss
}: DuplicateAlertBannerProps) {
  if (pendingDuplicates.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            🛑 {pendingDuplicates.length} doublon{pendingDuplicates.length > 1 ? 's' : ''} en attente de résolution
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-2">
              {pendingDuplicates.length === 1 
                ? 'Une facture nécessite votre attention avant de continuer.'
                : `Plusieurs factures nécessitent votre attention avant de continuer.`
              }
            </p>
            <div className="space-y-1">
              {pendingDuplicates.slice(0, 3).map((dup, index) => (
                <div key={dup.id} className="text-xs">
                  • {dup.new_document.filename} 
                  {dup.new_document.supplier_name && ` - ${dup.new_document.supplier_name}`}
                  {dup.new_document.reference_number && ` (${dup.new_document.reference_number})`}
                </div>
              ))}
              {pendingDuplicates.length > 3 && (
                <div className="text-xs text-red-600">
                  ... et {pendingDuplicates.length - 3} autre(s)
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            {pendingDuplicates.slice(0, 3).map((dup) => (
              <button
                key={dup.id}
                onClick={() => onResolve(dup.id)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Traiter
              </button>
            ))}
            {pendingDuplicates.length > 3 && (
              <button
                onClick={() => onResolve(pendingDuplicates[3].id)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Voir tout
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex rounded-md p-1.5 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
