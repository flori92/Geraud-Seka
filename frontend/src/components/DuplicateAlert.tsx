import { useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface DuplicateMatch {
  existing_invoice_id: string;
  existing_invoice_number: string;
  existing_supplier: string;
  existing_amount: number;
  existing_date: string;
  match_score: number;
  match_reasons: string[];
}

interface DuplicateAlertProps {
  duplicates: DuplicateMatch[];
  onDismiss: () => void;
  onViewInvoice?: (invoiceId: string) => void;
  onProceedAnyway?: () => void;
}

export function DuplicateAlert({ 
  duplicates, 
  onDismiss, 
  onViewInvoice,
  onProceedAnyway 
}: DuplicateAlertProps) {
  const [expanded, setExpanded] = useState(false);

  if (duplicates.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-red-600 bg-red-100";
    if (score >= 0.7) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return "Très probable";
    if (score >= 0.7) return "Probable";
    return "Possible";
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-800">
                Doublon potentiel détecté
              </h3>
              <p className="text-sm text-orange-700 mt-0.5">
                Cette facture pourrait être un doublon de {duplicates.length} facture(s) existante(s).
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-orange-600" />
            </button>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-3 text-sm text-orange-700 hover:text-orange-800"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Masquer les détails
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Voir les factures similaires
              </>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {duplicates.map((dup, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-orange-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {dup.existing_invoice_number}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getScoreColor(dup.match_score)}`}>
                        {getScoreLabel(dup.match_score)} ({Math.round(dup.match_score * 100)}%)
                      </span>
                    </div>
                    {onViewInvoice && (
                      <button
                        onClick={() => onViewInvoice(dup.existing_invoice_id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Fournisseur:</span>
                      <p className="font-medium">{dup.existing_supplier}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Montant:</span>
                      <p className="font-medium">{dup.existing_amount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{new Date(dup.existing_date).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {dup.match_reasons.map((reason, ridx) => (
                      <span
                        key={ridx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Annuler l&apos;import
            </button>
            {onProceedAnyway && (
              <button
                onClick={onProceedAnyway}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Importer quand même
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
