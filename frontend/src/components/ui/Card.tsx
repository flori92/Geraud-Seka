import React, { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export function Card({ className = "", hoverable = false, children, ...props }: CardProps) {
    return (
        <div
            className={`rounded-lg border border-accents-2 bg-white p-6 transition-shadow ${hoverable ? "hover:shadow-geist-hover cursor-pointer" : "shadow-sm"
                } ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
