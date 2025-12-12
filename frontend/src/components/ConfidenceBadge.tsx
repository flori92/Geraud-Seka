"use client";

interface ConfidenceBadgeProps {
    confidence: number; // 0-1
    label?: string;
    showPercentage?: boolean;
    size?: "sm" | "md";
}

export default function ConfidenceBadge({
    confidence,
    label,
    showPercentage = true,
    size = "sm",
}: ConfidenceBadgeProps) {
    const percentage = Math.round(confidence * 100);

    // Determine color based on confidence level
    const getColorClasses = () => {
        if (confidence >= 0.9) {
            return "bg-green-100 text-green-700 border-green-200";
        } else if (confidence >= 0.7) {
            return "bg-yellow-100 text-yellow-700 border-yellow-200";
        } else if (confidence >= 0.5) {
            return "bg-orange-100 text-orange-700 border-orange-200";
        } else {
            return "bg-red-100 text-red-700 border-red-200";
        }
    };

    const getIcon = () => {
        if (confidence >= 0.9) return "✓";
        if (confidence >= 0.7) return "~";
        return "!";
    };

    const sizeClasses = size === "sm"
        ? "text-[10px] px-1.5 py-0.5"
        : "text-xs px-2 py-1";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border font-medium ${getColorClasses()} ${sizeClasses}`}
            title={`Confiance: ${percentage}%${label ? ` - ${label}` : ""}`}
        >
            <span className="font-bold">{getIcon()}</span>
            {showPercentage && <span>{percentage}%</span>}
        </span>
    );
}
