import React, { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-md bg-accents-2 ${className}`}
            {...props}
        />
    );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`rounded-lg border border-accents-2 bg-white p-6 ${className}`}>
            <Skeleton className="mb-4 h-6 w-1/3" />
            <SkeletonText lines={3} />
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-3">
            <div className="flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-8 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-12 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
