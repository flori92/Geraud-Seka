/**
 * Carte de module/navigation style Pennylane
 */
import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  iconBgColor?: string;
  badge?: string;
  badgeColor?: string;
}

export function ModuleCard({
  title,
  description,
  href,
  icon,
  iconBgColor = 'bg-blue-500',
  badge,
  badgeColor = 'bg-gray-100 text-gray-700',
}: ModuleCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${iconBgColor} text-white flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {title}
              </h3>
              {badge && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

/* Grille de modules */
interface ModuleGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function ModuleGrid({ children, columns = 3 }: ModuleGridProps) {
  const colClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 ${colClasses[columns]} gap-4`}>
      {children}
    </div>
  );
}
