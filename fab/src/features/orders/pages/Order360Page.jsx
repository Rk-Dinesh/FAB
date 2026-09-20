import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  Banknote,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Factory,
  Grid3x3,
  LayoutDashboard,
  Ship,
  Shirt,
} from 'lucide-react'
import { Button, PageSpinner, Tabs } from '@/components/ui'
import { Breadcrumbs } from '@/components/shared'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAsync } from '@/hooks'
import { getOrder360 } from '@/services/orderService'
import { table } from '@/mocks/db'
import { OrderHeader } from '../components/OrderHeader'
import { OverviewTab } from '../components/tabs/OverviewTab'
import { SizeMatrixTab } from '../components/tabs/SizeMatrixTab'
import { TnaTab } from '../components/tabs/TnaTab'
import { SamplesTab } from '../components/tabs/SamplesTab'
import { SourcingTab } from '../components/tabs/SourcingTab'
import { ProductionTab } from '../components/tabs/ProductionTab'
import { QcTab } from '../components/tabs/QcTab'
import { ShipmentTab } from '../components/tabs/ShipmentTab'
import { FinanceTab } from '../components/tabs/FinanceTab'
import { DocumentsTab } from '../components/tabs/DocumentsTab'
import { ActivityTab } from '../components/tabs/ActivityTab'

/** The most important screen in the app: one order, eleven tabs. */
export function Order360Page() {
  const { id } = useParams()
  const [tab, setTab] = useState('overview')

  const load = useCallback(() => getOrder360(id), [id])
  const { data: order, loading, error, reload } = useAsync(load, [id])

  // Lookup maps for the tabs — read straight from the db, no extra round trip.
  const lookups = useMemo(
    () => ({
      vendorsById: Object.fromEntries(table('vendors').map((row) => [row.id, row])),
      portsById: Object.fromEntries(table('ports').map((row) => [row.id, row])),
      employeesById: Object.fromEntries(table('employees').map((row) => [row.id, row])),
    }),
    [],
  )

  const tabs = useMemo(() => {
    if (!order) return []
    const lateCount = (order.milestones ?? []).filter((entry) => entry.status === 'LATE').length
    const pendingSamples = (order.samples ?? []).filter((entry) => entry.status === 'PENDING').length
    return [
      { value: 'overview', label: 'Overview', icon: LayoutDashboard },
      { value: 'matrix', label: 'Style & size matrix', icon: Grid3x3 },
      { value: 'tna', label: 'T&A', icon: CalendarClock, count: lateCount || undefined },
      { value: 'samples', label: 'Samples', icon: Shirt, count: pendingSamples || undefined },
      { value: 'sourcing', label: 'Sourcing', icon: Boxes },
      { value: 'production', label: 'Production', icon: Factory },
      { value: 'qc', label: 'QC', icon: ClipboardCheck },
      { value: 'shipment', label: 'Shipment', icon: Ship },
      { value: 'finance', label: 'Finance', icon: Banknote },
      { value: 'documents', label: 'Documents', icon: FileText },
      { value: 'activity', label: 'Activity', icon: Activity },
    ]
  }, [order])

  if (loading && !order) return <PageSpinner label="Loading order" />

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title={error ? 'Couldn’t load this order' : 'Order not found'}
          description={
            error
              ? error.message
              : `No order matches the reference "${id}". It may have been removed from the demo data.`
          }
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
              <Button as={Link} to="/app/orders">
                Back to orders
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumbs
        className="mb-3"
        items={[{ label: 'Orders', to: '/app/orders' }, { label: order.poNumber }]}
      />

      <OrderHeader order={order} />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mt-5" />

      <div className="mt-5">
        {tab === 'overview' && <OverviewTab order={order} />}
        {tab === 'matrix' && <SizeMatrixTab order={order} />}
        {tab === 'tna' && <TnaTab order={order} />}
        {tab === 'samples' && <SamplesTab order={order} />}
        {tab === 'sourcing' && <SourcingTab order={order} vendorsById={lookups.vendorsById} />}
        {tab === 'production' && <ProductionTab order={order} />}
        {tab === 'qc' && <QcTab order={order} />}
        {tab === 'shipment' && <ShipmentTab order={order} portsById={lookups.portsById} />}
        {tab === 'finance' && <FinanceTab order={order} vendorsById={lookups.vendorsById} />}
        {tab === 'documents' && <DocumentsTab order={order} />}
        {tab === 'activity' && <ActivityTab order={order} employeesById={lookups.employeesById} />}
      </div>
    </div>
  )
}
