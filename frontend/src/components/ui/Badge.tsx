import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  dot?: boolean;
}

/**
 * Badge - A compact label component for displaying status, tags, or labels
 * Used throughout the app for visual categorization
 */
export function Badge({
  className,
  variant = "default",
  size = "sm",
  icon,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-neutral-100 text-neutral-700 border-neutral-200",
    primary: "bg-primary-100 text-primary-700 border-primary-200",
    success: "bg-status-success/10 text-status-success border-status-success/20",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
    danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
    info: "bg-status-info/10 text-status-info border-status-info/20",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        "hover:opacity-80 cursor-default",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-status-success",
            variant === "warning" && "bg-status-warning",
            variant === "danger" && "bg-status-danger",
            variant === "info" && "bg-status-info",
            variant !== "success" &&
              variant !== "warning" &&
              variant !== "danger" &&
              variant !== "info" &&
              "bg-current"
          )}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// ========== BADGE VARIANTS PRESETS ==========

/**
 * Status Badge - For displaying status like "Active", "Inactive", "Pending"
 */
export function StatusBadge({
  status,
  className,
}: {
  status: "active" | "inactive" | "pending" | "processing" | "completed" | "failed";
  className?: string;
}) {
  const statusMap = {
    active: {
      variant: "success",
      dot: true,
      label: "Actif",
    },
    inactive: {
      variant: "neutral",
      dot: true,
      label: "Inactif",
    },
    pending: {
      variant: "warning",
      dot: true,
      label: "En attente",
    },
    processing: {
      variant: "info",
      dot: true,
      label: "En cours",
    },
    completed: {
      variant: "success",
      dot: true,
      label: "Complété",
    },
    failed: {
      variant: "danger",
      dot: true,
      label: "Échoué",
    },
  };

  const config = statusMap[status];

  return (
    <Badge
      variant={config.variant as any}
      dot={config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Category Badge - For displaying categories with custom colors
 */
export function CategoryBadge({
  label,
  color = "primary",
  className,
}: {
  label: string;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}) {
  return (
    <Badge variant={color} size="md" className={className}>
      {label}
    </Badge>
  );
}

/**
 * Priority Badge - For displaying priority levels
 */
export function PriorityBadge({
  level,
  className,
}: {
  level: "low" | "medium" | "high" | "urgent";
  className?: string;
}) {
  const priorityMap = {
    low: { variant: "neutral", label: "Basse" },
    medium: { variant: "info", label: "Moyenne" },
    high: { variant: "warning", label: "Haute" },
    urgent: { variant: "danger", label: "Urgente" },
  };

  const config = priorityMap[level];

  return (
    <Badge variant={config.variant as any} className={className}>
      {config.label}
    </Badge>
  );
}
