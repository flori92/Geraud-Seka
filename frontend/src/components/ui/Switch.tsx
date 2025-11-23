"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
    description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className = "", label, description, id, ...props }, ref) => {
        const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    {label && (
                        <label
                            htmlFor={switchId}
                            className="block cursor-pointer text-sm font-medium text-foreground"
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="mt-0.5 text-xs text-accents-5">
                            {description}
                        </p>
                    )}
                </div>
                <div className="relative">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={switchId}
                        className="peer sr-only"
                        {...props}
                    />
                    <label
                        htmlFor={switchId}
                        className={`
                            block h-6 w-11 cursor-pointer rounded-full bg-accents-2 transition-all
                            peer-checked:bg-foreground
                            peer-focus:ring-2 peer-focus:ring-accents-2 peer-focus:ring-offset-1
                            peer-disabled:cursor-not-allowed peer-disabled:opacity-50
                            ${className}
                        `}
                    >
                        <div
                            className="
                                absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all
                                peer-checked:translate-x-5
                            "
                        />
                    </label>
                </div>
            </div>
        );
    }
);

Switch.displayName = "Switch";
