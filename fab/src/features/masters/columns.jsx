import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

/** Column builders shared by the masters configs — keeps each config readable. */

/** @param {string} key @param {string} header @param {object} [meta] */
export const text = (key, header, meta = {}) => ({
  accessorKey: key,
  header,
  meta,
  cell: ({ getValue }) => getValue() || <span className="text-muted">—</span>,
})

/** Bold first column. */
export const name = (key, header = 'Name') => ({
  accessorKey: key,
  header,
  cell: ({ getValue }) => <span className="font-medium text-text">{getValue()}</span>,
})

/** @param {string} key @param {string} header */
export const number = (key, header, decimals = 0) => ({
  accessorKey: key,
  header,
  meta: { align: 'right' },
  cell: ({ getValue }) => formatNumber(getValue(), decimals),
})

/** @param {string} key @param {string} header */
export const money = (key, header, currencyKey = 'currency') => ({
  accessorKey: key,
  header,
  meta: { align: 'right' },
  cell: ({ getValue, row }) =>
    formatCurrency(getValue(), row.original[currencyKey] ?? 'USD', { decimals: 2 }),
})

/** @param {string} key @param {string} header */
export const date = (key, header) => ({
  accessorKey: key,
  header,
  cell: ({ getValue }) => formatDate(getValue()),
})

/** @param {string} key @param {string} header */
export const tags = (key, header) => ({
  accessorKey: key,
  header,
  enableSorting: false,
  meta: { csv: (row) => (row[key] ?? []).join('; ') },
  cell: ({ getValue }) => (
    <span className="flex flex-wrap gap-1">
      {(getValue() ?? []).map((entry) => (
        <Badge key={entry} size="sm" tone="outline">
          {entry}
        </Badge>
      ))}
    </span>
  ),
})

/** Active / inactive flag. */
export const active = (key = 'active', header = 'Status') => boolean(key, header)

/**
 * A boolean rendered as a badge with its own wording.
 * @param {string} key @param {string} header @param {[string, string]} [labels] [true, false]
 */
export const boolean = (key, header, labels = ['Active', 'Inactive'], tones = ['success', 'default']) => ({
  accessorKey: key,
  header,
  cell: ({ getValue }) => {
    const on = Boolean(getValue()) && getValue() !== 'INACTIVE'
    return (
      <Badge tone={on ? tones[0] : tones[1]} size="sm" dot>
        {on ? labels[0] : labels[1]}
      </Badge>
    )
  },
})

/** Length of an array field, e.g. "8 points". */
export const count = (key, header, noun) => ({
  id: key,
  accessorFn: (row) => (row[key] ?? []).length,
  header,
  meta: { align: 'right', csv: (row) => (row[key] ?? []).length },
  cell: ({ getValue }) => `${getValue()} ${noun}`,
})

/** A colour swatch plus its name — hex is master data, so it is applied inline. */
export const swatch = (key = 'hex', header = 'Swatch') => ({
  accessorKey: key,
  header,
  enableSorting: false,
  cell: ({ getValue }) => (
    <span className="inline-flex items-center gap-2">
      <span
        className="size-5 rounded border border-border-strong"
        style={{ backgroundColor: getValue() ?? 'var(--surface-2)' }}
        aria-hidden="true"
      />
      <code className="text-xs text-muted">{getValue() ?? '—'}</code>
    </span>
  ),
})
