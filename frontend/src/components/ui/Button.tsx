import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "success" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2",
      "font-medium transition-all duration-200",
      "rounded-lg border border-transparent",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      fullWidth && "w-full"
    );

    const variants = {
      primary: cn(
        "bg-primary-500 text-white",
        "hover:bg-primary-600 focus:ring-primary-500",
        "active:bg-primary-700",
        "shadow-sm hover:shadow-md"
      ),
      secondary: cn(
        "bg-neutral-100 text-neutral-900",
        "hover:bg-neutral-200 focus:ring-neutral-300",
        "active:bg-neutral-300",
        "border-neutral-200"
      ),
      tertiary: cn(
        "bg-transparent text-neutral-700",
        "border-neutral-300 hover:border-neutral-400",
        "hover:bg-neutral-50 focus:ring-neutral-300",
        "active:bg-neutral-100"
      ),
      danger: cn(
        "bg-status-danger text-white",
        "hover:bg-red-700 focus:ring-status-danger",
        "active:bg-red-800",
        "shadow-sm hover:shadow-md"
      ),
      success: cn(
        "bg-status-success text-white",
        "hover:bg-green-600 focus:ring-status-success",
        "active:bg-green-700",
        "shadow-sm hover:shadow-md"
      ),
      outline: cn(
        "bg-white text-primary-600",
        "border-2 border-primary-500",
        "hover:bg-primary-50 focus:ring-primary-500",
        "active:bg-primary-100"
      ),
      ghost: cn(
        "bg-transparent text-neutral-700",
        "hover:bg-neutral-50 focus:ring-neutral-300",
        "active:bg-neutral-100"
      ),
    };

    const sizes = {
      xs: "h-8 px-3 text-xs",
      sm: "h-9 px-3.5 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === "left" && icon}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";
