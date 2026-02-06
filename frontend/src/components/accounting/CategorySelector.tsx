/**
 * Selecteur de categorie fournisseur avec auto-suggestion
 *
 * Fonctionnalites:
 * - Liste des categories systeme et tenant
 * - Affichage de la suggestion auto-detectee
 * - Selection auto-remplit le compte de charge
 */
import { useState, useEffect } from "react";
import { Tag, Sparkles, ChevronDown } from "lucide-react";
import { useAccounts, SupplierCategory } from "@/hooks/useAccounts";

interface CategorySelectorProps {
  value: string | null;
  onChange: (category: SupplierCategory | null) => void;
  suggestedCategory?: SupplierCategory | null;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

export default function CategorySelector({
  value,
  onChange,
  suggestedCategory,
  disabled = false,
  label = "Categorie fournisseur",
  helperText,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getCategories } = useAccounts();

  useEffect(() => {
    setIsLoading(true);
    getCategories()
      .then(setCategories)
      .finally(() => setIsLoading(false));
  }, [getCategories]);

  const selectedCategory = categories.find((c) => c.id === value);

  const handleChange = (categoryId: string) => {
    if (!categoryId) {
      onChange(null);
      return;
    }
    const cat = categories.find((c) => c.id === categoryId);
    onChange(cat || null);
  };

  const handleApplySuggestion = () => {
    if (suggestedCategory) {
      onChange(suggestedCategory);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Suggestion auto-detectee */}
      {suggestedCategory && !value && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-700 flex-1">
            Suggestion: <strong>{suggestedCategory.label}</strong>
            <span className="text-amber-600 ml-1">({suggestedCategory.default_charge_account})</span>
          </span>
          <button
            type="button"
            onClick={handleApplySuggestion}
            className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600 transition-colors"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* Select */}
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <select
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled || isLoading}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        >
          <option value="">-- Aucune categorie --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label} ({cat.default_charge_account})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Info sur la selection */}
      {selectedCategory && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            Compte de charge par defaut: <strong className="font-mono">{selectedCategory.default_charge_account}</strong>
          </span>
          {selectedCategory.keywords.length > 0 && (
            <span className="text-gray-400">
              | Mots-cles: {selectedCategory.keywords.slice(0, 3).join(", ")}
              {selectedCategory.keywords.length > 3 && "..."}
            </span>
          )}
        </div>
      )}

      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
