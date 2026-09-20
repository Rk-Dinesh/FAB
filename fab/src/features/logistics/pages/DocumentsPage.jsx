import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileCheck2, FileText, Files } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { DataTable, FilterBar, KpiCard, KpiGrid, PageHeader } from '@/components/shared'
import { useAsync } from '@/hooks'
import { toast } from '@/store/toastStore'
import { documentService } from '@/services/logisticsService'
import { formatDate } from '@/utils/format'

const TYPE_LABELS = {
  COMMERCIAL_INVOICE: 'Commercial invoice',
  PACKING_LIST: 'Packing list',
  BILL_OF_LADING: 'Bill of lading / AWB',
  CERTIFICATE_OF_ORIGIN: 'Certificate of origin',
  INSPECTION_CERTIFICATE: 'Inspection certificate',
}

/** Logistics → Documents: the export document set across all shipments. */
export function DocumentsPage() {
  const [filters, setFilters] = useState({})

  const load = useCallback(() => documentService.list(), [])
  const { data, loading, error, reload } = useAsync(load)
  const documents = useMemo(() => data ?? [], [data])

  const stats = useMemo(
    () => ({
      total: documents.length,
      issued: documents.filter((entry) => entry.status === 'ISSUED').length,
      draft: documents.filter((entry) => entry.status === 'DRAFT').length,
      shipments: new Set(documents.map((entry) => entry.shipmentId)).size,
    }),
    [documents],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Document',
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="font-medium text-text">{row.original.name}</span>
              <span className="text-xs text-muted">{row.original.fileName}</span>
            </span>
          </span>
        ),
      },
      { accessorKey: 'number', header: 'Number' },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted">{TYPE_LABELS[getValue()] ?? getValue()}</span>
        ),
      },
      {
        accessorKey: 'poNumber',
        header: 'Order',
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <Link to={`/app/orders/${row.original.orderId}`} className="text-primary hover:underline">
              {row.original.poNumber}
            </Link>
          </span>
        ),
      },
      { accessorKey: 'clientName', header: 'Client' },
      {
        accessorKey: 'issuedAt',
        header: 'Issued',
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: 'sizeKb',
        header: 'Size',
        meta: { align: 'right' },
        cell: ({ getValue }) => `${getValue()} KB`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge tone={getValue() === 'ISSUED' ? 'success' : 'default'} dot>
            {getValue().toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'download',
        header: '',
        enableSorting: false,
        enableHiding: false,
        meta: { align: 'right', width: 120 },
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                toast.info(
                  'Demo environment',
                  `${row.original.fileName} would download from the document store.`,
                )
              }
            >
              <Download className="size-3.5" /> Download
            </Button>
          </span>
        ),
      },
    ],
    [],
  )

  const filterConfig = [
    {
      key: 'type',
      label: 'Type',
      width: 'w-56',
      options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-40',
      options: [
        { value: 'ISSUED', label: 'Issued' },
        { value: 'DRAFT', label: 'Draft' },
      ],
    },
  ]

  const filtered = documents.filter(
    (entry) =>
      (!filters.type || entry.type === filters.type) &&
      (!filters.status || entry.status === filters.status),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Export documents"
        description="Commercial invoices, packing lists, bills of lading and certificates."
        breadcrumbs={[{ label: 'Logistics' }, { label: 'Documents' }]}
      />

      <KpiGrid className="mb-5">
        <KpiCard label="Documents" value={stats.total} icon={Files} tone="primary" loading={loading} />
        <KpiCard label="Issued" value={stats.issued} icon={FileCheck2} tone="success" loading={loading} />
        <KpiCard label="Still draft" value={stats.draft} icon={FileText} tone="warning" loading={loading} />
        <KpiCard label="Shipments covered" value={stats.shipments} tone="info" loading={loading} />
      </KpiGrid>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={reload}
        filters={<FilterBar filters={filterConfig} values={filters} onChange={setFilters} />}
        exportFileName="apparelflow-documents"
        searchPlaceholder="Search documents…"
        emptyTitle="No documents match these filters"
        initialSort={[{ id: 'issuedAt', desc: true }]}
      />
    </div>
  )
}
