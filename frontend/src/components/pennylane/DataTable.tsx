/**
 * Tableau de données style Pennylane
 * Avec tri, sélection, actions
 */
import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  cell?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
  rowActions?: { label: string; onClick: (row: T) => void }[];
  emptyMessage?: string;
  loading?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
  rowActions,
  emptyMessage = 'Aucune donnée',
  loading = false,
  sortField,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const allSelected = data.length > 0 && data.every((row) => selectedIds.has(String(row[keyField])));

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map((row) => String(row[keyField]))));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange?.(newSelection);
  };

  const getCellValue = (row: T, column: Column<T>): ReactNode => {
    if (column.cell) {
      return column.cell(row);
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as ReactNode;
  };

  const handleSort = (columnId: string) => {
    if (onSort) {
      onSort(columnId);
    }
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="animate-pulse p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {selectable && (
              <th className="w-10 px-4 py-3">
                <Checkbox checked={allSelected} onChange={toggleSelectAll} />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                className={`px-4 py-3 font-semibold text-gray-700 ${
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                } ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.id)}
              >
                <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''}`}>
                  {column.header}
                  {column.sortable && sortField === column.id && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
            ))}
            {rowActions && <th className="w-12 px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                className="px-4 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowId = String(row[keyField]);
              const isSelected = selectedIds.has(rowId);
              const isHovered = hoveredRow === rowId;

              return (
                <tr
                  key={rowId}
                  className={`transition-colors ${
                    isSelected ? 'bg-blue-50' : isHovered ? 'bg-gray-50' : ''
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                  onMouseEnter={() => setHoveredRow(rowId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelect(rowId)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-4 py-3 ${
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                      }`}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3 relative">
                      {isHovered && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenu(openActionMenu === rowId ? null : rowId);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button>
                          {openActionMenu === rowId && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenActionMenu(null)}
                              />
                              <div className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-20">
                                {rowActions.map((action, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(row);
                                      setOpenActionMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
