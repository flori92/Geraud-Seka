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

export function CardHeader({ className, children }: any) {
    return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ className, children }: any) {
    return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

export function CardContent({ className, children }: any) {
    return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}
