/**
 * Selecteur de compte SYSCOHADA avec recherche et navigation
 *
 * Fonctionnalites:
 * - Recherche instantanee par numero ou libelle
 * - Bouton pour ouvrir le navigateur hierarchique
 * - Affichage des comptes recents
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, FolderTree, X } from "lucide-react";
import { useAccounts, SyscohadaAccount } from "@/hooks/useAccounts";
import AccountBrowserModal from "./AccountBrowserModal";

interface AccountSelectorProps {
  value: string | null;
  onChange: (account: string) => void;
  filterClass?: number[];
  placeholder?: string;
  showBrowseButton?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export default function AccountSelector({
  value,
  onChange,
  filterClass,
  placeholder = "Rechercher un compte...",
  showBrowseButton = true,
  disabled = false,
  label,
  helperText,
  required = false,
}: AccountSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SyscohadaAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const { searchAccounts, loading } = useAccounts();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Recherche avec debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length >= 1) {
      debounceRef.current = setTimeout(async () => {
        const accounts = await searchAccounts(query);
        const filtered = filterClass
          ? accounts.filter((a) => filterClass.includes(a.account_class))
          : accounts;
        setResults(filtered);
        setIsOpen(true);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchAccounts, filterClass]);

  // Fermer dropdown si clic exterieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mettre a jour le label quand la valeur change
  useEffect(() => {
    if (value && results.length > 0) {
      const account = results.find((a) => a.account_number === value);
      if (account) {
        setSelectedLabel(account.account_label);
      }
    }
  }, [value, results]);

  const handleSelect = useCallback(
    (account: SyscohadaAccount) => {
      onChange(account.account_number);
      setSelectedLabel(account.account_label);
      setQuery("");
      setIsOpen(false);
    },
    [onChange]
  );

  const handleBrowserSelect = useCallback(
    (accountNumber: string, accountLabel?: string) => {
      onChange(accountNumber);
      if (accountLabel) {
        setSelectedLabel(accountLabel);
      }
      setShowBrowser(false);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
    setSelectedLabel(null);
    setQuery("");
  }, [onChange]);

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query || (value ? `${value}${selectedLabel ? ` - ${selectedLabel}` : ""}` : "")}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value && value) {
                // User is clearing, reset the selection
              }
            }}
            onFocus={() => {
              if (value && !query) {
                setQuery("");
              }
              if (query) setIsOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent font-mono text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Indicateurs a droite */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#1e3a5f] rounded-full animate-spin" />
            )}
            {value && !loading && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
                title="Effacer"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {showBrowseButton && (
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Parcourir le plan comptable"
          >
            <FolderTree className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}

      {/* Dropdown resultats */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((account) => (
            <button
              key={account.account_number}
              type="button"
              onClick={() => handleSelect(account)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 ${
                value === account.account_number ? "bg-blue-50" : ""
              }`}
            >
              <span className="font-mono text-sm font-semibold text-[#1e3a5f] min-w-[60px]">
                {account.account_number}
              </span>
              <span className="text-sm text-gray-700 truncate flex-1">{account.account_label}</span>
              <span className="text-xs text-gray-400 whitespace-nowrap">Cl.{account.account_class}</span>
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de resultats */}
      {isOpen && query.length >= 1 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          Aucun compte trouve pour &quot;{query}&quot;
        </div>
      )}

      {/* Modal navigation */}
      {showBrowser && (
        <AccountBrowserModal
          isOpen={showBrowser}
          onClose={() => setShowBrowser(false)}
          onSelect={handleBrowserSelect}
          filterClass={filterClass}
        />
      )}
    </div>
  );
}
