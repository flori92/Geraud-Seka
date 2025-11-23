import React, { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = "", label, error, helperText, ...props }, ref) => {
        const textareaStyles = `
            block w-full rounded-md border border-accents-2 bg-white px-3 py-2 text-sm
            transition-colors resize-vertical
            focus:border-accents-5 focus:outline-none focus:ring-2 focus:ring-accents-2 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-accents-1
            ${error ? "border-error focus:border-error focus:ring-error" : ""}
        `;

        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`${textareaStyles} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-error">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-xs text-accents-5">{helperText}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
