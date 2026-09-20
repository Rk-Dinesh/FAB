import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CircleDollarSign, Package, Plus, Timer } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader, StatusBadge } from '@/components/shared'
import { useAsync } from '@/hooks'
import { useCan } from '@/store/authStore'
import { orderService } from '@/services/orderService'
import { clientService } from '@/services/crmService'
import { ORDER_STATUS_FLOW, ORDER_STATUSES } from '@/config/statuses'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { StatusFunnel } from '../components/StatusFunnel'

/** Orders → list. The entry point to every Order 360. */
export function OrdersPage() {
  const navigate = useNavigate()
  const can = useCan()
  const [filters, setFilters] = useState({})

  const load = useCallback(async () => {
    const [orders, clients] = await Promise.all([orderService.list(), clientService.list()])
    return { orders, clients }
  }, [])
  const { data, loading, error, reload } = useAsync(load)
  const orders = useMemo(() => data?.orders ?? [], [data])

  const stats = useMemo(() => {
    const live = orders.filter((order) => order.statusIndex >= 5 && order.statusIndex < 14)
    return {
      total: orders.length,
      live: live.length,
      value: live.reduce((sum, order) => sum + order.orderValue, 0),
      units: live.reduce((sum, order) => sum + order.quantity, 0),
      delayed: orders.filter((order) => order.risk === 'DELAYED').length,
      atRisk: orders.filter((order) => order.risk === 'AT_RISK').length,
    }
  }, [orders])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'poNumber',
        header: 'PO',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.poNumber}</span>
            <span className="text-xs text-muted">{row.original.clientPoNumber}</span>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
      {
        accessorKey: 'styleName',
        header: 'Style',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{row.original.styleName}</span>
            <span className="text-xs text-muted">{row.original.styleNumber}</span>
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatNumber(getValue()),
      },
      {
        accessorKey: 'fobPrice',
        header: 'FOB',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { decimals: 2 }),
      },
      {
        accessorKey: 'orderValue',
        header: 'Value',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'exFactoryDate',
        header: 'Ex-factory',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className={cn(row.original.delayDays > 0 && 'text-muted line-through')}>
              {formatDate(row.original.exFactoryDate)}
            </span>
            {row.original.revisedExFactoryDate && (
              <span className="text-xs font-medium text-danger">
                {formatDate(row.original.revisedExFactoryDate)}
              </span>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge value={getValue()} />,
      },
      {
        accessorKey: 'risk',
        header: 'Risk',
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <StatusBadge kind="risk" value={row.original.risk} size="sm" />
            {row.original.delayDays > 0 && (
              <span className="text-xs font-medium text-danger">+{row.original.delayDays}d</span>
            )}
          </span>
        ),
      },
      { accessorKey: 'season', header: 'Season' },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      width: 'w-48',
      options: ORDER_STATUS_FLOW.map((status) => ({
        value: status,
        label: ORDER_STATUSES[status].label,
      })),
    },
    {
      key: 'clientId',
      label: 'Client',
      options: (data?.clients ?? []).map((client) => ({ value: client.id, label: client.name })),
    },
    {
      key: 'risk',
      label: 'Risk',
      width: 'w-36',
      options: [
        { value: 'ON_TRACK', label: 'On track' },
        { value: 'AT_RISK', label: 'At risk' },
        { value: 'DELAYED', label: 'Delayed' },
      ],
    },
    { key: 'exFactoryDate', label: 'Ex-factory', type: 'dateRange' },
  ]

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        if (filters.status && order.status !== filters.status) return false
        if (filters.clientId && order.clientId !== filters.clientId) return false
        if (filters.risk && order.risk !== filters.risk) return false
        const range = filters.exFactoryDate
        if (range?.from && order.exFactoryDate < range.from) return false
        if (range?.to && order.exFactoryDate > range.to) return false
        return true
      }),
    [orders, filters],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Orders"
        description="Every order across the lifecycle, from first enquiry to settled invoice."
        breadcrumbs={[{ label: 'Orders' }]}
        actions={
          can('orders', 'create') && (
            <Button as={Link} to="/app/orders/new">
              <Plus className="size-4" /> New order
            </Button>
          )
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard
          label="Live orders"
          value={stats.live}
          hint={`${stats.total} in total`}
          icon={Package}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Order book"
          value={formatCurrency(stats.value, 'USD', { compact: true })}
          hint={`${formatNumber(stats.units)} pcs`}
          icon={CircleDollarSign}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="At risk"
          value={stats.atRisk}
          icon={Timer}
          tone="warning"
          loading={loading}
          onClick={() => setFilters({ risk: 'AT_RISK' })}
        />
        <KpiCard
          label="Delayed"
          value={stats.delayed}
          icon={AlertTriangle}
          tone="danger"
          loading={loading}
          onClick={() => setFilters({ risk: 'DELAYED' })}
        />
      </KpiGrid>

      <StatusFunnel
        orders={orders}
        loading={loading}
        activeStatus={filters.status}
        onSelect={(status) =>
          setFilters((current) => ({ ...current, status: current.status === status ? '' : status }))
        }
        className="mb-5"
      />

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(order) => navigate(`/app/orders/${order.id}`)}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-orders"
        searchPlaceholder="Search by PO, client or style…"
        emptyTitle="No orders match these filters"
        emptyDescription="Clear the filters to see the whole order book."
        initialSort={[{ id: 'exFactoryDate', desc: false }]}
        getRowClassName={(order) => (order.risk === 'DELAYED' ? 'bg-danger-soft/25' : '')}
      />
    </div>
  )
}
