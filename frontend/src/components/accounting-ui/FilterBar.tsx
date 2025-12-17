import React from "react";
import { Calendar, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "date" | "search";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
  onReset?: () => void;
}

export function FilterBar({ filters, values, onChange, onReset }: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some(
    (v) => v !== "" && v !== undefined && v !== null
  );

  return (
    <div className="flex items-center gap-3 flex-wrap py-4 border-b border-neutral-200">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Filter className="w-4 h-4" />
        <span>Filtres</span>
      </div>

      {filters.map((filter) => {
        if (filter.type === "select") {
          return (
            <div key={filter.id} className="w-[180px]">
              <Select
                value={values[filter.id] ?? ""}
                onChange={(e) => onChange(filter.id, e.target.value)}
                aria-label={filter.label}
              >
                <option value="">{filter.placeholder || filter.label}</option>
                {(filter.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          );
        }

        if (filter.type === "date") {
          return (
            <div key={filter.id} className="w-[180px]">
              <Input
                type="date"
                value={values[filter.id] ? String(values[filter.id]).slice(0, 10) : ""}
                onChange={(e) => onChange(filter.id, e.target.value)}
                icon={<Calendar className="w-4 h-4" />}
                aria-label={filter.label}
              />
            </div>
          );
        }

        return (
          <div key={filter.id} className="w-[320px]">
            <Input
              type="search"
              placeholder={filter.placeholder || "Rechercher..."}
              value={values[filter.id] ?? ""}
              onChange={(e) => onChange(filter.id, e.target.value)}
              icon={<Search className="w-4 h-4" />}
              aria-label={filter.label}
            />
          </div>
        );
      })}

      {hasActiveFilters && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          icon={<X className="w-4 h-4" />}
        >
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
