import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Container - Main content wrapper with max width and padding
 */
interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
  className,
  size = "lg",
  children,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Section - Page section with consistent spacing
 */
interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: "sm" | "md" | "lg";
  background?: "default" | "neutral" | "primary";
}

export function Section({
  className,
  spacing = "md",
  background = "default",
  children,
  ...props
}: SectionProps) {
  const spacingClass = {
    sm: "py-8 sm:py-12",
    md: "py-12 sm:py-16",
    lg: "py-16 sm:py-20",
  };

  const bgClass = {
    default: "bg-white",
    neutral: "bg-neutral-50",
    primary: "bg-primary-50",
  };

  return (
    <section
      className={cn(spacingClass[spacing], bgClass[background], className)}
      {...props}
    >
      {children}
    </section>
  );
}

/**
 * Header - Page/section header
 */
interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  className,
  title,
  description,
  action,
  children,
  ...props
}: HeaderProps) {
  return (
    <div
      className={cn("mb-6 flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        )}
        {description && (
          <p className="mt-2 text-neutral-600">{description}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Grid - Responsive grid layout
 */
interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
}

export function Grid({
  className,
  columns = 3,
  gap = "md",
  children,
  ...props
}: GridProps) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  return (
    <div
      className={cn("grid", colClasses[columns], gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Flex - Flexible layout container
 */
interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  align?: "start" | "center" | "end";
  justify?: "start" | "center" | "between" | "around" | "end";
  gap?: "sm" | "md" | "lg";
  wrap?: boolean;
}

export function Flex({
  className,
  direction = "row",
  align = "center",
  justify = "start",
  gap = "md",
  wrap = false,
  children,
  ...props
}: FlexProps) {
  const dirClass = direction === "row" ? "flex-row" : "flex-col";
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  };
  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    between: "justify-between",
    around: "justify-around",
    end: "justify-end",
  };
  const gapClass = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={cn(
        "flex",
        dirClass,
        alignClass[align],
        justifyClass[justify],
        gapClass[gap],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Stack - Vertical stack layout
 */
interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "sm" | "md" | "lg";
}

export function Stack({
  className,
  gap = "md",
  children,
  ...props
}: StackProps) {
  const gapClass = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
  };

  return (
    <div className={cn("flex flex-col", gapClass[gap], className)} {...props}>
      {children}
    </div>
  );
}
