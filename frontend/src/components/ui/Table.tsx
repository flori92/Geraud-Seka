import React, { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
}

export function Table({ className = "", children, ...props }: TableProps) {
    return (
        <div className="w-full overflow-x-auto rounded-lg border border-accents-2">
            <table className={`w-full text-left text-sm ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHead({ children }: { children: React.ReactNode }) {
    return <thead className="bg-accents-1 text-accents-5">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
    return <tbody className="divide-y divide-accents-2 bg-white">{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <tr className={`hover:bg-accents-1 ${className}`}>{children}</tr>;
}

interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}

export function TableHeader({ children, className = "", ...props }: TableHeaderProps) {
    return (
        <th className={`px-6 py-3 font-medium text-accents-5 ${className}`} {...props}>
            {children}
        </th>
    );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}

export function TableCell({ children, className = "", ...props }: TableCellProps) {
    return <td className={`px-6 py-4 text-foreground ${className}`} {...props}>{children}</td>;
}
