import { Download, FileText } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { toast } from '@/store/toastStore'
import { formatDate } from '@/utils/format'
import { MiniTable, Panel, TabEmpty } from './TabShell'

const TYPE_LABELS = {
  COMMERCIAL_INVOICE: 'Commercial invoice',
  PACKING_LIST: 'Packing list',
  BILL_OF_LADING: 'Bill of lading',
  CERTIFICATE_OF_ORIGIN: 'Certificate of origin',
  INSPECTION_CERTIFICATE: 'Inspection certificate',
}

/** Order 360 → Documents: the export document set for this order. */
export function DocumentsTab({ order }) {
  const documents = order.documents ?? []

  if (documents.length === 0) {
    return (
      <Panel title="Documents" padded>
        <TabEmpty
          icon={FileText}
          title="No documents yet"
          description="Export documents are raised alongside the shipment booking."
        />
      </Panel>
    )
  }

  return (
    <Panel
      title="Export documents"
      description={`${documents.length} documents attached to this order`}
      padded={false}
    >
      <MiniTable head={['Document', 'Number', 'Type', 'Issued', 'Size', 'Status', '']}>
        {documents.map((document) => (
          <tr key={document.id} className="border-b border-border last:border-0">
            <th scope="row" className="px-3 py-2 text-left font-medium text-text">
              <span className="flex items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted" aria-hidden="true" />
                {document.name}
              </span>
            </th>
            <td className="px-3 py-2 text-text">{document.number}</td>
            <td className="px-3 py-2 text-xs text-muted">
              {TYPE_LABELS[document.type] ?? document.type}
            </td>
            <td className="px-3 py-2 text-text">{formatDate(document.issuedAt)}</td>
            <td className="px-3 py-2 text-muted">{document.sizeKb} KB</td>
            <td className="px-3 py-2">
              <Badge tone={document.status === 'ISSUED' ? 'success' : 'default'} size="sm" dot>
                {document.status.toLowerCase()}
              </Badge>
            </td>
            <td className="px-3 py-2 text-right">
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  toast.info(
                    'Demo environment',
                    `${document.fileName} would download from the document store.`,
                  )
                }
              >
                <Download className="size-3.5" /> Download
              </Button>
            </td>
          </tr>
        ))}
      </MiniTable>
    </Panel>
  )
}
