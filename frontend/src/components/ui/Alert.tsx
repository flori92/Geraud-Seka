import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  XCircle,
} from "lucide-react";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  title?: string;
  closeable?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
}

/**
 * Alert - Displays important information with different severity levels
 */
export function Alert({
  className,
  variant = "default",
  title,
  closeable = false,
  onClose,
  icon,
  children,
  ...props
}: AlertProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen && closeable) return null;

  const variants = {
    default: {
      container:
        "bg-status-info/10 border-status-info/20 text-status-info",
      icon: <Info className="h-5 w-5" />,
      iconColor: "text-status-info",
    },
    success: {
      container:
        "bg-status-success/10 border-status-success/20 text-status-success",
      icon: <CheckCircle className="h-5 w-5" />,
      iconColor: "text-status-success",
    },
    warning: {
      container:
        "bg-status-warning/10 border-status-warning/20 text-status-warning",
      icon: <AlertTriangle className="h-5 w-5" />,
      iconColor: "text-status-warning",
    },
    danger: {
      container:
        "bg-status-danger/10 border-status-danger/20 text-status-danger",
      icon: <XCircle className="h-5 w-5" />,
      iconColor: "text-status-danger",
    },
    info: {
      container:
        "bg-status-info/10 border-status-info/20 text-status-info",
      icon: <Info className="h-5 w-5" />,
      iconColor: "text-status-info",
    },
  };

  const variantStyles = variants[variant];

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4 transition-all",
        variantStyles.container,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn("mt-0.5 flex-shrink-0", variantStyles.iconColor)}>
          {icon || variantStyles.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          {title && (
            <h5 className="mb-1 font-semibold leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm opacity-90 [&_p]:leading-relaxed">
            {children}
          </div>
        </div>

        {/* Close Button */}
        {closeable && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ========== ALERT VARIANTS ==========

/**
 * Success Alert - Positive feedback
 */
export function SuccessAlert({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Alert variant="success" title={title} className={className}>
      {children}
    </Alert>
  );
}

/**
 * Error Alert - Negative feedback
 */
export function ErrorAlert({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Alert variant="danger" title={title} className={className}>
      {children}
    </Alert>
  );
}

/**
 * Warning Alert - Cautionary feedback
 */
export function WarningAlert({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Alert variant="warning" title={title} className={className}>
      {children}
    </Alert>
  );
}

/**
 * Info Alert - Informational feedback
 */
export function InfoAlert({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Alert variant="info" title={title} className={className}>
      {children}
    </Alert>
  );
