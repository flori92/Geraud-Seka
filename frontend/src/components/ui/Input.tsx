import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: "default" | "subtle";
}

/**
 * Input - A reusable input component with consistent styling
 * Supports labels, descriptions, error messages, and icons
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      description,
      error,
      icon,
      variant = "default",
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "border-neutral-200 bg-white",
      subtle: "border-transparent bg-neutral-100",
    };

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="text-status-danger ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              "block w-full rounded-lg px-3 py-2 text-sm",
              "transition-colors duration-200",
              "placeholder:text-neutral-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              icon && "pl-10",
              error
                ? "border-2 border-status-danger focus:ring-status-danger/20"
                : "border border-neutral-200 focus:ring-primary-500/20 focus:border-primary-500",
              disabled && "cursor-not-allowed bg-neutral-50 opacity-60",
              variantStyles[variant],
              className
            )}
            {...props}
          />
        </div>

        {description && !error && (
          <p className="mt-1.5 text-xs text-neutral-500">{description}</p>
        )}
        
        {error && (
          <p className="mt-1.5 text-xs text-status-danger font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
