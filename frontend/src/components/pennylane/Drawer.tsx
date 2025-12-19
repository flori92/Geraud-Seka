/**
 * Drawer latéral style Pennylane
 * Panel de détail avec tabs
 */
import { ReactNode, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerValue?: string;
  headerLabel?: string;
  tabs?: Tab[];
  actions?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
  width?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  headerValue,
  headerLabel,
  tabs,
  actions,
  loading = false,
  children,
  width = 'w-96',
}: DrawerProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || '');

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`${width} border-l bg-white flex flex-col shadow-lg z-50 h-full`}>
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {subtitle && (
            <p className="text-gray-600 text-sm">{subtitle}</p>
          )}
          {headerValue && (
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">{headerValue}</div>
              {headerLabel && (
                <div className="text-sm text-gray-500">{headerLabel}</div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="border-b flex-shrink-0">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : tabs ? (
            tabs.find((t) => t.id === activeTab)?.content
          ) : (
            children
          )}
        </div>

        {/* Footer actions */}
        {actions && (
          <div className="p-4 border-t flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}

/* Liste d'éléments dans le drawer */
interface DrawerListItemProps {
  date?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: 'green' | 'red' | 'gray';
  icons?: ReactNode;
}

export function DrawerListItem({
  date,
  badge,
  title,
  subtitle,
  value,
  valueColor = 'gray',
  icons,
}: DrawerListItemProps) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-700',
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg text-sm">
      {(date || badge) && (
        <div className="flex items-center justify-between mb-1">
          {date && <span className="text-gray-500">{date}</span>}
          {badge && (
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
              {badge}
            </span>
          )}
        </div>
      )}
      <p className="text-gray-700 mb-1">{title}</p>
      {subtitle && <p className="text-gray-500 text-xs mb-1">{subtitle}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icons}
        </div>
        {value && (
          <span className={`font-medium ${colorClasses[valueColor]}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
