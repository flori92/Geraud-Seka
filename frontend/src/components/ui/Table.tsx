import React, { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// ========== TABLE CONTAINER ==========

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

/**
 * Table - Main table wrapper with professional styling
 */
export function Table({
  className,
  striped = false,
  hover = true,
  compact = false,
  children,
  ...props
}: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
      <table
        className={cn("w-full text-sm text-neutral-700", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

// ========== TABLE HEADER ==========

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <thead
      className={cn(
        "bg-neutral-50 border-b border-neutral-200",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

// ========== TABLE BODY ==========

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn("divide-y divide-neutral-200 bg-white", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

// ========== TABLE ROW ==========

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  variant?: "default" | "highlight" | "interactive";
  highlighted?: boolean;
}

export function TableRow({
  className,
  variant = "default",
  highlighted = false,
  children,
  ...props
}: TableRowProps) {
  const variants = {
    default: "hover:bg-neutral-50 transition-colors",
    highlight: "bg-primary-50 hover:bg-primary-100",
    interactive: "hover:bg-neutral-100 cursor-pointer transition-colors",
  };

  return (
    <tr
      className={cn(
        variants[variant],
        highlighted && "bg-primary-50",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// ========== TABLE HEADER CELL ==========

interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
}

export function TableHeader({
  className,
  align = "left",
  sortable = false,
  sorted = null,
  children,
  ...props
}: TableHeaderProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      className={cn(
        "px-6 py-4 font-semibold text-neutral-700 bg-neutral-50",
        alignClass[align],
        sortable && "cursor-pointer hover:bg-neutral-100 select-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-neutral-400 transition-transform",
              sorted === "asc" && "rotate-180",
              sorted === "desc" && "rotate-0"
            )}
          />
        )}
      </div>
    </th>
  );
}

// ========== TABLE DATA CELL ==========

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  muted?: boolean;
  monospace?: boolean;
}

export function TableCell({
  className,
  align = "left",
  muted = false,
  monospace = false,
  children,
  ...props
}: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td
      className={cn(
        "px-6 py-4 text-neutral-700",
        alignClass[align],
        muted && "text-neutral-500",
        monospace && "font-mono text-sm",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// ========== TABLE FOOTER ==========

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableFooter({ className, children, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn(
        "bg-neutral-50 border-t border-neutral-200",
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
}

// ========== TABLE EMPTY STATE ==========

interface TableEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function TableEmpty({
  className,
  message = "Aucun résultat trouvé",
  ...props
}: TableEmptyProps) {
  return (
    <div
      className={cn(
        "w-full py-12 text-center",
        className
      )}
      {...props}
    >
      <p className="text-neutral-500 text-sm">{message}</p>
    </div>
  );
}
