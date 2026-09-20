import { Columns3, Download, Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'

/**
 * Search box, column visibility, CSV export and the selection banner.
 * @param {{search: string, onSearchChange: (value: string) => void,
 *   table: import('@tanstack/react-table').Table<any>,
 *   onExport?: () => void, selectedCount?: number,
 *   onClearSelection?: () => void, bulkActions?: import('react').ReactNode,
 *   filters?: import('react').ReactNode, searchPlaceholder?: string}} props
 */
export function DataTableToolbar({
  search,
  onSearchChange,
  table,
  onExport,
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  filters,
  searchPlaceholder = 'Search…',
}) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.id !== 'select' && column.id !== 'actions')

  return (
    <div className="flex flex-col gap-3 border-b border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          leading={<Search className="size-4" />}
          trailing={
            search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="text-muted transition-colors hover:text-text"
              >
                <X className="size-3.5" />
              </button>
            ) : undefined
          }
          containerClassName="w-full sm:max-w-xs"
          aria-label={searchPlaceholder}
        />

        <div className="ml-auto flex items-center gap-2">
          {hideableColumns.length > 0 && (
            <Dropdown
              align="end"
              trigger={
                <Button variant="secondary" size="sm">
                  <Columns3 className="size-4" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              }
              items={[
                { heading: 'Show columns' },
                ...hideableColumns.map((column) => ({
                  label: `${column.getIsVisible() ? '✓ ' : '　'}${columnLabel(column)}`,
                  onSelect: () => column.toggleVisibility(),
                })),
              ]}
            />
          )}
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}

      {selectedCount > 0 && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 rounded-lg border border-primary/25',
            'bg-primary-soft px-3 py-2 text-sm text-primary',
          )}
        >
          <span className="font-medium">{selectedCount} selected</span>
          <div className="ml-auto flex items-center gap-2">
            {bulkActions}
            <Button variant="ghost" size="xs" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** @param {import('@tanstack/react-table').Column<any>} column */
function columnLabel(column) {
  const header = column.columnDef.header
  if (typeof header === 'string') return header
  return column.columnDef.meta?.label ?? column.id
}
