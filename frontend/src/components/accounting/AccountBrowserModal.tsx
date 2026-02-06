/**
 * Modal de navigation hierarchique du plan comptable SYSCOHADA
 *
 * Interface 3 colonnes style Finder:
 * - Colonne 1: Classes (1-8)
 * - Colonne 2: Comptes principaux
 * - Colonne 3: Sous-comptes
 */
import { useState, useEffect } from "react";
import { X, ChevronRight, Check, Search } from "lucide-react";
import { useAccounts, AccountHierarchy, HierarchyChild } from "@/hooks/useAccounts";

interface AccountBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (accountNumber: string, accountLabel?: string) => void;
  filterClass?: number[];
}

export default function AccountBrowserModal({
  isOpen,
  onClose,
  onSelect,
  filterClass,
}: AccountBrowserModalProps) {
  const [hierarchy, setHierarchy] = useState<AccountHierarchy>({});
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { getHierarchy, loading } = useAccounts();

  useEffect(() => {
    if (isOpen) {
      getHierarchy().then(setHierarchy);
    }
  }, [isOpen, getHierarchy]);

  const handleSelectSubAccount = (child: HierarchyChild) => {
    if (child.is_detail) {
      onSelect(child.number, child.label);
    }
  };

  const handleSelectMainAccount = (number: string, label: string, isDetail: boolean) => {
    setSelectedAccount(number);
    if (isDetail) {
      onSelect(number, label);
    }
  };

  if (!isOpen) return null;

  // Filtrer les classes
  const classes = Object.entries(hierarchy)
    .filter(([cls]) => !filterClass || filterClass.includes(Number(cls)))
    .sort(([a], [b]) => Number(a) - Number(b));

  // Comptes de la classe selectionnee
  const accounts =
    selectedClass !== null && hierarchy[selectedClass]
      ? Object.entries(hierarchy[selectedClass].accounts).filter(([num, data]) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return num.includes(q) || data.label.toLowerCase().includes(q);
        })
      : [];

  // Sous-comptes du compte selectionne
  const subAccounts =
    selectedAccount && selectedClass !== null
      ? hierarchy[selectedClass]?.accounts[selectedAccount]?.children.filter((child) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return child.number.includes(q) || child.label.toLowerCase().includes(q);
        }) || []
      : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[75vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1e3a5f] p-4 text-white rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Plan Comptable SYSCOHADA</h2>
            <p className="text-blue-200 text-sm">Selectionnez un compte de detail</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="p-3 border-b bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer par numero ou libelle..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* 3-column browser */}
        <div className="flex-1 flex overflow-hidden">
          {/* Colonne 1: Classes */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-2 bg-gray-100 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Classes
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1e3a5f] rounded-full animate-spin mx-auto mb-2" />
                  Chargement...
                </div>
              ) : (
                classes.map(([cls, data]) => (
                  <button
                    key={cls}
                    onClick={() => {
                      setSelectedClass(Number(cls));
                      setSelectedAccount(null);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                      selectedClass === Number(cls) ? "bg-blue-50 border-l-4 border-l-[#1e3a5f]" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-[#1e3a5f]">{cls}.</span>
                      <span className="text-sm text-gray-700">{data.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Colonne 2: Comptes principaux */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-2 bg-gray-100 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Comptes
            </div>
            <div className="flex-1 overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {selectedClass === null ? "Selectionnez une classe" : "Aucun compte"}
                </div>
              ) : (
                accounts.map(([num, data]) => (
                  <button
                    key={num}
                    onClick={() => handleSelectMainAccount(num, data.label, data.is_detail)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                      selectedAccount === num ? "bg-blue-50 border-l-4 border-l-[#1e3a5f]" : ""
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="font-mono font-semibold text-[#1e3a5f]">{num}</span>
                      <span className="ml-2 text-sm text-gray-700 truncate block">{data.label}</span>
                    </span>
                    {data.children && data.children.length > 0 ? (
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : data.is_detail ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Colonne 3: Sous-comptes */}
          <div className="w-1/3 flex flex-col">
            <div className="p-2 bg-gray-100 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Sous-comptes
            </div>
            <div className="flex-1 overflow-y-auto">
              {subAccounts.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {selectedAccount === null ? "Selectionnez un compte" : "Pas de sous-comptes"}
                </div>
              ) : (
                subAccounts.map((sub) => (
                  <button
                    key={sub.number}
                    onClick={() => handleSelectSubAccount(sub)}
                    disabled={!sub.is_detail}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between border-b border-gray-100 transition-colors ${
                      sub.is_detail
                        ? "hover:bg-green-50 cursor-pointer"
                        : "opacity-50 cursor-not-allowed bg-gray-50"
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="font-mono font-semibold text-[#1e3a5f]">{sub.number}</span>
                      <span className="ml-2 text-sm text-gray-700 truncate block">{sub.label}</span>
                    </span>
                    {sub.is_detail && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Cliquez sur un compte avec <Check className="h-3 w-3 text-green-500 inline" /> pour le
            selectionner
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
