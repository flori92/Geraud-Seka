import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  score?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export function ConfidenceIndicator({ 
  level, 
  score, 
  showLabel = true, 
  size = 'md',
  tooltip 
}: ConfidenceIndicatorProps) {
  const config = {
    high: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      label: 'Confiance élevée',
      description: 'Extraction fiable'
    },
    medium: {
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: Info,
      label: 'Confiance moyenne',
      description: 'À vérifier'
    },
    low: {
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      label: 'Confiance faible',
      description: 'Vérification requise'
    }
  };

  const cfg = config[level];
  const Icon = cfg.icon;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${cfg.bgColor} ${cfg.borderColor} border rounded-md px-2 py-1 ${textSizeClasses[size]}`}
      title={tooltip || `${cfg.description} ${score !== undefined ? `(${Math.round(score * 100)}%)` : ''}`}
    >
      <Icon className={`${sizeClasses[size]} ${cfg.color}`} />
      {showLabel && (
        <span className={`${cfg.color} font-medium`}>
          {score !== undefined ? `${Math.round(score * 100)}%` : cfg.label}
        </span>
      )}
    </div>
  );
}

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

export function calculateFieldConfidence(
  value: any, 
  expectedPattern?: RegExp,
  similarityToHistory?: number
): { score: number; level: ConfidenceLevel; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0.5; // Base score

  // Check if value exists and is not empty
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    reasons.push('Valeur vide ou manquante');
    return { score: 0, level: 'low', reasons };
  }

  score += 0.2;
  reasons.push('Valeur extraite');

  // Pattern validation
  if (expectedPattern) {
    if (expectedPattern.test(String(value))) {
      score += 0.2;
      reasons.push('Format valide');
    } else {
      score -= 0.1;
      reasons.push('Format suspect');
    }
  }

  // Similarity to historical data
  if (similarityToHistory !== undefined) {
    score += similarityToHistory * 0.3;
    if (similarityToHistory > 0.8) {
      reasons.push('Correspond à l\'historique');
    } else if (similarityToHistory < 0.3) {
      reasons.push('Inhabituel pour ce fournisseur');
    }
  }

  // Type-specific validation
  if (typeof value === 'number') {
    if (value > 0) {
      score += 0.1;
      reasons.push('Montant positif');
    } else {
      score -= 0.2;
      reasons.push('Montant invalide');
    }
  }

  // Date validation
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))) {
    const date = new Date(value);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (date >= oneYearAgo && date <= oneYearAhead) {
      score += 0.1;
      reasons.push('Date plausible');
    } else {
      score -= 0.2;
      reasons.push('Date hors période attendue');
    }
  }

  const level = getConfidenceLevel(Math.max(0, Math.min(1, score)));
  return { score: Math.max(0, Math.min(1, score)), level, reasons };
}
