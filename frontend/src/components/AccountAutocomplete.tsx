"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Check } from "lucide-react";

export interface Account {
    code: string;
    name: string;
    type?: string;
    class?: string;
}

interface AccountAutocompleteProps {
    value: string;
    onChange: (code: string) => void;
    accounts: Account[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function AccountAutocomplete({
    value,
    onChange,
    accounts,
    placeholder = "Rechercher un compte...",
    className = "",
    disabled = false,
}: AccountAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredAccounts = useMemo(() => {
        if (!search.trim()) return accounts.slice(0, 50);
        const lowerSearch = search.toLowerCase();
        return accounts
            .filter(
                (acc) =>
                    acc.code.toLowerCase().includes(lowerSearch) ||
                    acc.name.toLowerCase().includes(lowerSearch)
            )
            .slice(0, 50);
    }, [search, accounts]);

    useEffect(() => {
        setSearch(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (account: Account) => {
        setSearch(account.code);
        onChange(account.code);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredAccounts.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Enter":
                e.preventDefault();
                if (filteredAccounts[highlightedIndex]) {
                    handleSelect(filteredAccounts[highlightedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    const selectedAccount = accounts.find((acc) => acc.code === value);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Selected account display */}
            {selectedAccount && !isOpen && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                </div>
            )}

            {/* Dropdown */}
            {isOpen && filteredAccounts.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredAccounts.map((account, index) => (
                        <button
                            key={account.code}
                            type="button"
                            onClick={() => handleSelect(account)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${index === highlightedIndex
                                    ? "bg-purple-50 text-purple-900"
                                    : "hover:bg-gray-50"
                                } ${value === account.code ? "bg-green-50" : ""}`}
                        >
                            <span className="font-mono font-medium text-purple-700 min-w-[70px]">
                                {account.code}
                            </span>
                            <span className="text-gray-700 truncate flex-1">{account.name}</span>
                            {value === account.code && (
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* No results */}
            {isOpen && filteredAccounts.length === 0 && search && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                    Aucun compte trouvé pour "{search}"
                </div>
            )}
        </div>
    );
}
