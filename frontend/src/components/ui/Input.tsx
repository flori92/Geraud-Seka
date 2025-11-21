import React, { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-accents-6">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-accents-3 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground disabled:cursor-not-allowed disabled:bg-accents-1 ${error ? "border-error" : "border-accents-2"
                        } ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-error">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
