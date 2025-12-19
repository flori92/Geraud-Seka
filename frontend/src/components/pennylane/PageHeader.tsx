/**
 * Header de page style Pennylane
 * Breadcrumb + Actions + Période
 */
import { ReactNode } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumb: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  period?: { start: string; end: string };
  onRefresh?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  period,
  onRefresh,
  actions,
  children,
}: PageHeaderProps) {
  const formatDate = (dateStr: string) => {
    return dateStr.split('-').reverse().join('/');
  };

  return (
    <div className="bg-white border-b">
      {/* Top bar avec breadcrumb */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
                {item.href ? (
                  <Link href={item.href} className="text-gray-500 hover:text-gray-700">
                    {item.label}
                  </Link>
                ) : (
                  <span className={index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'}>
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {period && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
              {formatDate(period.start)} - {formatDate(period.end)}
            </div>
          )}

          {onRefresh && (
            <Button variant="secondary" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          )}

          {actions}
        </div>
      </div>

      {/* Title section si présent */}
      {(title || subtitle || children) && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
