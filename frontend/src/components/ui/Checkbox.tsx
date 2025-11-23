import React, { InputHTMLAttributes, forwardRef } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
    error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = "", label, error, id, ...props }, ref) => {
        const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            ref={ref}
                            type="checkbox"
                            id={checkboxId}
                            className="peer sr-only"
                            {...props}
                        />
                        <label
                            htmlFor={checkboxId}
                            className={`
                                flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-accents-3
                                transition-all
                                peer-checked:border-foreground peer-checked:bg-foreground
                                peer-focus:ring-2 peer-focus:ring-accents-2 peer-focus:ring-offset-1
                                peer-disabled:cursor-not-allowed peer-disabled:opacity-50
                                hover:border-accents-5
                                ${error ? "border-error peer-checked:border-error peer-checked:bg-error" : ""}
                                ${className}
                            `}
                        >
                            <Check className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                        </label>
                    </div>
                    {label && (
                        <label
                            htmlFor={checkboxId}
                            className="cursor-pointer text-sm font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                        >
                            {label}
                        </label>
                    )}
                </div>
                {error && (
                    <p className="text-xs text-error">{error}</p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";
