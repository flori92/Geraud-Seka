import React from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface AlertProps {
    variant?: "default" | "success" | "warning" | "error" | "info";
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Alert({ variant = "default", title, children, className = "" }: AlertProps) {
    const variants = {
        default: {
            container: "bg-accents-1 border-accents-2 text-accents-6",
            icon: <Info className="h-4 w-4" />,
            iconColor: "text-accents-5",
        },
        success: {
            container: "bg-success-lighter border-success-light text-success-dark",
            icon: <CheckCircle className="h-4 w-4" />,
            iconColor: "text-success",
        },
        warning: {
            container: "bg-warning-lighter border-warning-light text-warning-dark",
            icon: <AlertTriangle className="h-4 w-4" />,
            iconColor: "text-warning",
        },
        error: {
            container: "bg-error-lighter border-error-light text-error-dark",
            icon: <AlertCircle className="h-4 w-4" />,
            iconColor: "text-error",
        },
        info: {
            container: "bg-blue-50 border-blue-200 text-blue-900",
            icon: <Info className="h-4 w-4" />,
            iconColor: "text-blue-600",
        },
    };

    const variantStyles = variants[variant];

    return (
        <div className={`relative w-full rounded-lg border p-4 ${variantStyles.container} ${className}`}>
            <div className="flex gap-3">
                <div className={`mt-0.5 ${variantStyles.iconColor}`}>
                    {variantStyles.icon}
                </div>
                <div className="flex-1">
                    {title && (
                        <h5 className="mb-1 font-medium leading-none tracking-tight">
                            {title}
                        </h5>
                    )}
                    <div className="text-sm [&_p]:leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
