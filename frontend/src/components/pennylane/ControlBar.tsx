/**
 * Barre de contrôle style Pennylane
 * Filtres, recherche, export
 */
import { ReactNode, useState } from 'react';
import { Search, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

interface FilterOption {
  value: string;
  label: string;
}

interface ToggleOption {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface ControlBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    resultCount?: number;
  };
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  toggles?: ToggleOption[];
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  children?: ReactNode;
}

export function ControlBar({
  search,
  filters,
  toggles,
  onExport,
  children,
}: ControlBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="bg-white border-b px-6 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Filtres dropdown */}
          {filters?.map((filter, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{filter.label} :</span>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Toggles */}
          {toggles && toggles.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              {toggles.map((toggle) => (
                <label key={toggle.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={toggle.checked}
                    onChange={(e) => toggle.onChange(e.target.checked)}
                  />
                  <span className="text-gray-600">{toggle.label}</span>
                </label>
              ))}
            </div>
          )}

          {children}
        </div>

        <div className="flex items-center gap-3">
          {/* Recherche */}
          {search && (
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || 'Rechercher...'}
                className="w-full pl-10 pr-16 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {search.resultCount !== undefined && (
                <span className="absolute right-3 top-2 text-xs text-gray-500">
                  {search.resultCount} résultats
                </span>
              )}
            </div>
          )}

          {/* Export */}
          {onExport && (
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-20">
                    <button
                      onClick={() => { onExport('excel'); setShowExportMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                    <button
                      onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button
                      onClick={() => { onExport('csv'); setShowExportMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
