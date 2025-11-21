import React from "react";

interface BadgeProps {
    variant?: "default" | "success" | "warning" | "error";
    children: React.ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
    const variants = {
        default: "bg-accents-1 text-accents-6 border-accents-2",
        success: "bg-success-lighter text-success-dark border-success-light",
        warning: "bg-warning-lighter text-warning-dark border-warning-light",
        error: "bg-error-lighter text-error-dark border-error-light",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
        >
            {children}
        </span>
    );
}
