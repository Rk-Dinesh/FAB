import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, TriangleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { downloadCsv, toCsv } from '@/utils/csv'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'

/**
 * The one table in the app: sorting, global search, pagination, row selection,
 * column visibility and CSV export. Rows carry their own click behaviour so a
 * list can open a drawer or navigate.
 *
 * @param {{data: Array<object>, columns: Array<object>, loading?: boolean,
 *   error?: Error|null, onRetry?: () => void, onRowClick?: (row: object) => void,
 *   selectable?: boolean, bulkActions?: (rows: Array<object>) => import('react').ReactNode,
 *   filters?: import('react').ReactNode, exportFileName?: string,
 *   searchPlaceholder?: string, emptyTitle?: string, emptyDescription?: string,
 *   emptyAction?: import('react').ReactNode, initialSort?: Array<{id: string, desc: boolean}>,
 *   pageSize?: number, dense?: boolean, className?: string,
 *   getRowClassName?: (row: object) => string}} props
 */
export function DataTable({
  data,
  columns,
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  selectable = false,
  bulkActions,
  filters,
  exportFileName = 'export',
  searchPlaceholder = 'Search…',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  initialSort = [],
  pageSize = 25,
  dense = false,
  className,
  getRowClassName,
}) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState(initialSort)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState({})

  const tableColumns = useMemo(
    () => (selectable ? [selectionColumn, ...columns] : columns),
    [columns, selectable],
  )

  const table = useReactTable({
    data: data ?? [],
    columns: tableColumns,
    state: { sorting, globalFilter: search, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageSize } },
    enableRowSelection: selectable,
    getRowId: (row, index) => row.id ?? String(index),
  })

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
  const visibleRows = table.getRowModel().rows

  const exportCsv = () => {
    const exportable = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== 'select' && column.id !== 'actions')
    const csvColumns = exportable.map((column) => ({
      key: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
      value: (row) => {
        const accessor = column.columnDef.meta?.csv
        if (accessor) return accessor(row)
        const value = row[column.id]
        return typeof value === 'object' && value !== null ? JSON.stringify(value) : value
      },
    }))
    const rows = (selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows.map((row) => row.original))
    downloadCsv(exportFileName, toCsv(rows, csvColumns))
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-surface', className)}>
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        table={table}
        onExport={exportCsv}
        selectedCount={selectedRows.length}
        onClearSelection={() => setRowSelection({})}
        bulkActions={bulkActions?.(selectedRows)}
        filters={filters}
        searchPlaceholder={searchPlaceholder}
      />

      {error ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn’t load this list"
          description={error.message}
          action={onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
        />
      ) : loading ? (
        <SkeletonTable rows={6} columns={Math.min(6, tableColumns.length)} />
      ) : visibleRows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-2/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortable = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        style={{ width: header.column.columnDef.meta?.width }}
                        className={cn(
                          'border-b border-border px-3 py-2.5 text-left text-xs font-semibold text-muted',
                          header.column.columnDef.meta?.align === 'right' && 'text-right',
                          header.column.columnDef.meta?.headerClassName,
                        )}
                      >
                        {header.isPlaceholder ? null : sortable ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className={cn(
                              'inline-flex items-center gap-1.5 transition-colors hover:text-text',
                              header.column.columnDef.meta?.align === 'right' && 'flex-row-reverse',
                            )}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp className="size-3" aria-hidden="true" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="size-3" aria-hidden="true" />
                            ) : (
                              <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-surface-2/60',
                    row.getIsSelected() && 'bg-primary-soft/40',
                    getRowClassName?.(row.original),
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-3 text-text',
                        dense ? 'py-1.5' : 'py-2.5',
                        cell.column.columnDef.meta?.align === 'right' && 'text-right tabular-nums',
                        cell.column.columnDef.meta?.cellClassName,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && visibleRows.length > 0 && (
        <DataTablePagination table={table} total={table.getFilteredRowModel().rows.length} />
      )}
    </div>
  )
}

const selectionColumn = {
  id: 'select',
  enableSorting: false,
  enableHiding: false,
  meta: { width: 44 },
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
      onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
      aria-label="Select all rows on this page"
    />
  ),
  cell: ({ row }) => (
    <span onClick={(event) => event.stopPropagation()} role="presentation">
      <Checkbox
        checked={row.getIsSelected()}
        onChange={(event) => row.toggleSelected(event.target.checked)}
        aria-label={`Select row ${row.id}`}
      />
    </span>
  ),
}
