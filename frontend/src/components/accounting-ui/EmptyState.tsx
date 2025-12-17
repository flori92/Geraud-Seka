import React from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        {icon || <FileText className="w-8 h-8 text-neutral-400" />}
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} icon={<Plus className="w-4 h-4" />}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
