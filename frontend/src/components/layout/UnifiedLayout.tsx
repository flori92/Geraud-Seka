import { ReactNode } from "react";
import Head from "next/head";
import { commonClasses, utils } from "@/styles/design-system";

interface UnifiedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export default function UnifiedLayout({
  children,
  title = "SEKA",
  description,
  maxWidth = "xl",
  noPadding = false,
}: UnifiedLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className={utils.cn(
          "mx-auto",
          maxWidthClasses[maxWidth],
          !noPadding && "px-4 sm:px-6 py-6"
        )}>
          {children}
        </div>
      </div>
    </>
  );
}

// Composant Header unifié
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// Composant Card unifié
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({ children, className, padding = "md", hover = false }: CardProps) {
  return (
    <div
      className={utils.cn(
        commonClasses.card.base,
        commonClasses.card.padding[padding],
        hover && commonClasses.card.hover,
        className
      )}
    >
      {children}
    </div>
  );
}

// Composant Button unifié
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  icon?: ReactNode;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className,
  icon,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={utils.cn(
        commonClasses.button.base,
        commonClasses.button[variant],
        commonClasses.button.sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// Composant Badge unifié
interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={utils.cn(
        commonClasses.badge.base,
        commonClasses.badge[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Composant Input unifié
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  size = "md",
  disabled = false,
  className,
  label,
  error,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={utils.cn(
          commonClasses.input.base,
          commonClasses.input.sizes[size],
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Composant EmptyState unifié
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

// Composant LoadingState unifié
export function LoadingState({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

// Composant Table unifié
interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({ 
  columns, 
  data, 
  onRowClick, 
  emptyMessage = "Aucune donnée" 
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={utils.cn(
                onRowClick && "cursor-pointer hover:bg-gray-50 transition-colors"
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
