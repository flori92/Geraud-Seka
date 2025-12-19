/**
 * Carte de statistiques style Pennylane
 */
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  subtitle?: string;
  valueColor?: 'default' | 'green' | 'red' | 'blue';
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor = 'bg-blue-100',
  trend,
  subtitle,
  valueColor = 'default',
}: StatsCardProps) {
  const valueColorClasses = {
    default: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColorClasses[valueColor]}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className={`mt-2 flex items-center text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {trend.positive ? '+' : ''}{trend.value}% {trend.label}
        </div>
      )}

      {subtitle && !trend && (
        <div className="mt-2 text-xs text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}
