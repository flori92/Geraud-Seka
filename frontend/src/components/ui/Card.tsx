import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  hoverable?: boolean;
  interactive?: boolean;
}

/**
 * Card - A flexible, reusable container component
 * Used for grouping related content with consistent styling
 */
export function Card({
  className,
  variant = "default",
  hoverable = false,
  interactive = false,
  children,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-white border border-neutral-200 shadow-sm",
    elevated: "bg-white border border-neutral-100 shadow-md",
    outlined: "bg-transparent border border-neutral-300",
  };

  const interactiveStyles = interactive && "cursor-pointer";
  const hoverStyles = hoverable && "hover:shadow-lg hover:border-neutral-300 transition-all duration-200";

  return (
    <div
      className={cn(
        "rounded-lg p-6 transition-all duration-200",
        variants[variant],
        interactiveStyles,
        hoverStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4 border-b border-neutral-100", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("text-lg font-semibold text-neutral-900 tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-neutral-500", className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn("pt-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("flex items-center justify-between pt-4 border-t border-neutral-100", className)}
      {...props}
    >
      {children}
    </div>
  );
