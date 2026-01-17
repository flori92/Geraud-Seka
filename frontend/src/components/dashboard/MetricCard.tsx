/**
 * Composant MetricCard pour SEKA Enterprise
 * Affichage élégant des métriques avec tendances et animations
 */

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'gray';
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  loading?: boolean;
}

const colorClasses = {
  green: {
    icon: 'text-green-600 bg-green-100',
    border: 'border-green-200',
    change: 'text-green-600',
    glow: 'shadow-green-100'
  },
  blue: {
    icon: 'text-blue-600 bg-blue-100',
    border: 'border-blue-200',
    change: 'text-blue-600',
    glow: 'shadow-blue-100'
  },
  purple: {
    icon: 'text-purple-600 bg-purple-100',
    border: 'border-purple-200',
    change: 'text-purple-600',
    glow: 'shadow-purple-100'
  },
  red: {
    icon: 'text-red-600 bg-red-100',
    border: 'border-red-200',
    change: 'text-red-600',
    glow: 'shadow-red-100'
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100',
    border: 'border-orange-200',
    change: 'text-orange-600',
    glow: 'shadow-orange-100'
  },
  gray: {
    icon: 'text-gray-600 bg-gray-100',
    border: 'border-gray-200',
    change: 'text-gray-600',
    glow: 'shadow-gray-100'
  }
};

const trendIcons = {
  up: ArrowUpIcon,
  down: ArrowDownIcon,
  stable: MinusIcon
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500'
};

export function MetricCard({
  title,
  value,
  change,
  icon,
  color,
  trend,
  subtitle,
  loading = false
}: MetricCardProps) {
  const classes = colorClasses[color];
  const TrendIcon = trend ? trendIcons[trend] : null;
  const trendColorClass = trend ? trendColors[trend] : '';

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      bg-white rounded-xl border-2 transition-all duration-300 
      hover:shadow-lg hover:-translate-y-1 cursor-pointer
      ${classes.border} ${classes.glow}
      group
    `}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Titre */}
            <h3 className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-800 transition-colors">
              {title}
            </h3>

            {/* Valeur principale */}
            <div className="text-2xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform">
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </div>

            {/* Variation et sous-titre */}
            <div className="flex items-center space-x-2">
              {change !== undefined && change !== 0 && (
                <div className={`
                  flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                  ${change > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }
                `}>
                  {TrendIcon && (
                    <TrendIcon className="h-3 w-3" />
                  )}
                  <span>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              )}

              {subtitle && (
                <span className="text-xs text-gray-500">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Icône */}
          <div className={`
            p-3 rounded-lg transition-all duration-300
            ${classes.icon}
            group-hover:scale-110 group-hover:rotate-3
          `}>
            {icon}
          </div>
        </div>

        {/* Barre de progression si applicable */}
        {change !== undefined && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`
                  h-1.5 rounded-full transition-all duration-1000 ease-out
                  ${change >= 0 ? 'bg-green-500' : 'bg-red-500'}
                `}
                style={{
                  width: `${Math.min(Math.abs(change) * 2, 100)}%`
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Effet de glow au survol */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`absolute inset-0 rounded-xl bg-white/5`}></div>
      </div>
    </div>
  );
}

export function CompactMetricCard({
  title,
  value,
  icon,
  color = 'gray'
}: Omit<MetricCardProps, 'change' | 'trend' | 'subtitle'>) {
  const classes = colorClasses[color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-md ${classes.icon}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">{title}</p>
          <p className="text-lg font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SparklineMetricCard({
  title,
  value,
  change,
  icon,
  color,
  sparklineData = []
}: MetricCardProps & { sparklineData?: number[] }) {
  const classes = colorClasses[color];

  const generateSparklinePath = (data: number[]): string => {
    if (data.length < 2) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className={`bg-white rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${classes.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${classes.icon}`}>
          {icon}
        </div>
      </div>

      <div className="text-2xl font-bold text-gray-900 mb-2">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>

      <div className="flex items-center justify-between">
        {change !== undefined && (
          <div className={`
            text-sm font-medium
            ${change >= 0 ? 'text-green-600' : 'text-red-600'}
          `}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}

        {sparklineData.length > 0 && (
          <svg width="60" height="20" className="text-gray-400">
            <path
              d={generateSparklinePath(sparklineData)}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className={change && change >= 0 ? 'text-green-500' : 'text-red-500'}
            />
          </svg>
        )}
      </div>
    </div>
  );
}