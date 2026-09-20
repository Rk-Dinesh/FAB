import { useCallback, useMemo, useState } from 'react'
import { Building2, Package, Star, Wallet } from 'lucide-react'
import { Badge, Button, Drawer } from '@/components/ui'
import { DataTable, KpiCard, KpiGrid, PageHeader, StatusBadge, Timeline } from '@/components/shared'
import { useAsync } from '@/hooks'
import { clientService, getActivityFor } from '@/services/crmService'
import { orderService } from '@/services/orderService'
import { invoiceService } from '@/services/financeService'
import { formatCurrency, formatDate } from '@/utils/format'

/** Five-star rating as text plus stars, so it exports cleanly to CSV. */
function Rating({ value }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={index < value ? 'size-3.5 fill-warning text-warning' : 'size-3.5 text-border-strong'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/** CRM → Clients: the brand accounts, with a 360 drawer per client. */
export function ClientsPage() {
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    const [clients, orders, invoices] = await Promise.all([
      clientService.list(),
      orderService.list(),
      invoiceService.list(),
    ])
    return clients.map((client) => {
      const clientOrders = orders.filter((order) => order.clientId === client.id)
      const clientInvoices = invoices.filter((invoice) => invoice.clientId === client.id)
      return {
        ...client,
        orderCount: clientOrders.length,
        liveOrders: clientOrders.filter((order) => order.statusIndex >= 5 && order.statusIndex < 14).length,
        orderBookValue: clientOrders
          .filter((order) => order.statusIndex >= 5)
          .reduce((sum, order) => sum + order.orderValue, 0),
        outstanding: clientInvoices.reduce((sum, invoice) => sum + invoice.balance, 0),
        overdue: clientInvoices.filter((invoice) => invoice.status === 'OVERDUE').length,
      }
    })
  }, [])

  const { data, loading, error, reload } = useAsync(load)
  const clients = useMemo(() => data ?? [], [data])

  const totals = useMemo(
    () => ({
      count: clients.length,
      orderBook: clients.reduce((sum, client) => sum + client.orderBookValue, 0),
      outstanding: clients.reduce((sum, client) => sum + client.outstanding, 0),
      live: clients.reduce((sum, client) => sum + client.liveOrders, 0),
    }),
    [clients],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Brand',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="font-medium text-text">{row.original.name}</span>
            <span className="text-xs text-muted">
              {row.original.code} · {row.original.segment}
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'country',
        header: 'Location',
        cell: ({ row }) => (
          <span className="flex flex-col leading-tight">
            <span className="text-text">{row.original.country}</span>
            <span className="text-xs text-muted">{row.original.city}</span>
          </span>
        ),
      },
      { accessorKey: 'incoterm', header: 'Incoterm' },
      { accessorKey: 'paymentTermCode', header: 'Terms' },
      { accessorKey: 'liveOrders', header: 'Live orders', meta: { align: 'right' } },
      {
        accessorKey: 'orderBookValue',
        header: 'Order book',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatCurrency(getValue(), 'USD', { compact: true }),
      },
      {
        accessorKey: 'outstanding',
        header: 'Outstanding',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className={row.original.overdue > 0 ? 'font-medium text-danger' : undefined}>
            {formatCurrency(row.original.outstanding, 'USD', { compact: true })}
          </span>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        meta: { csv: (row) => row.rating },
        cell: ({ getValue }) => <Rating value={getValue()} />,
      },
    ],
    [],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Clients"
        description="The brands we produce for, with their live order book and balances."
        breadcrumbs={[{ label: 'CRM' }, { label: 'Clients' }]}
        actions={
          <Button as="a" href="/app/masters/clients" variant="secondary">
            Manage in masters
          </Button>
        }
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Active clients" value={totals.count} icon={Building2} tone="primary" loading={loading} />
        <KpiCard label="Live orders" value={totals.live} icon={Package} tone="info" loading={loading} />
        <KpiCard
          label="Order book"
          value={formatCurrency(totals.orderBook, 'USD', { compact: true })}
          icon={Wallet}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(totals.outstanding, 'USD', { compact: true })}
          icon={Wallet}
          tone="warning"
          loading={loading}
        />
      </KpiGrid>

      <DataTable
        data={clients}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={setSelected}
        exportFileName="apparelflow-clients"
        searchPlaceholder="Search clients…"
        emptyTitle="No clients yet"
      />

      <ClientDrawer client={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function ClientDrawer({ client, onClose }) {
  const load = useCallback(async () => {
    if (!client) return null
    const [orders, activities] = await Promise.all([
      orderService.list({ filters: { clientId: client.id } }),
      getActivityFor('client', client.id),
    ])
    return { orders, activities }
  }, [client])

  const { data, loading } = useAsync(load, [client?.id], { enabled: Boolean(client) })

  return (
    <Drawer
      open={Boolean(client)}
      onClose={onClose}
      title={client?.name}
      description={client ? `${client.segment} · ${client.city}, ${client.country}` : undefined}
      size="lg"
    >
      {client && (
        <div className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Detail label="Contact" value={`${client.contactName} — ${client.contactTitle}`} />
            <Detail label="Email" value={client.email} />
            <Detail label="Incoterm" value={client.incoterm} />
            <Detail label="Payment terms" value={client.paymentTermCode} />
            <Detail label="Currency" value={client.currency} />
            <Detail label="Credit limit" value={formatCurrency(client.creditLimitUsd, 'USD')} />
            <Detail label="Client since" value={formatDate(client.since)} />
            <Detail label="Rating" value={<Rating value={client.rating} />} />
          </dl>

          {client.notes && (
            <p className="rounded-lg border border-border bg-surface-2/40 p-3 text-sm text-muted">
              {client.notes}
            </p>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text">Orders</h3>
            {loading ? (
              <p className="text-sm text-muted">Loading orders…</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {(data?.orders ?? []).slice(0, 8).map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-medium text-text">
                        {order.poNumber} · {order.styleName}
                      </span>
                      <span className="text-xs text-muted">
                        {order.quantity.toLocaleString('en-US')} pcs ·{' '}
                        {formatCurrency(order.orderValue, 'USD', { compact: true })}
                      </span>
                    </span>
                    <StatusBadge value={order.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text">Recent activity</h3>
            <Timeline
              items={(data?.activities ?? []).map((activity) => ({
                id: activity.id,
                title: activity.summary,
                at: activity.at,
                tone: activity.type === 'MEETING' ? 'primary' : 'default',
                meta: <Badge size="sm" tone="outline">{activity.type.replace('_', ' ')}</Badge>,
              }))}
              emptyTitle="No activity logged"
            />
          </section>
        </div>
      )}
    </Drawer>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-text">{value}</dd>
    </div>
  )
}
