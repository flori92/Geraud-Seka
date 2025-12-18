import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Form Container - Wraps all form elements
 */
interface FormProps extends HTMLAttributes<HTMLFormElement> {
  // Extends HTMLFormElement attributes
}

export function Form({ className, children, ...props }: FormProps) {
  return (
    <form className={cn("space-y-6", className)} {...props}>
      {children}
    </form>
  );
}

/**
 * Form Group - Groups form field with label and help text
 */
interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export function FormGroup({
  className,
  label,
  description,
  error,
  required,
  children,
  ...props
}: FormGroupProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-status-danger ml-1">*</span>}
        </label>
      )}
      
      {description && !error && (
        <p className="text-xs text-neutral-500">{description}</p>
      )}
      
      {children}
      
      {error && (
        <p className="text-xs text-status-danger font-medium">{error}</p>
      )}
    </div>
  );
}

/**
 * Form Row - Grid layout for form fields
 */
interface FormRowProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
}

export function FormRow({ className, columns = 1, children, ...props }: FormRowProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-4",
  };

  return (
    <div
      className={cn("grid gap-6", gridClass[columns], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Form Actions - Footer with buttons
 */
interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end" | "between";
}

export function FormActions({
  className,
  align = "between",
  children,
  ...props
}: FormActionsProps) {
  const alignClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-6 border-t border-neutral-200",
        alignClass[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Form Section - Grouped form sections
 */
interface FormSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function FormSection({
  className,
  title,
  description,
  children,
  ...props
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-500 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
