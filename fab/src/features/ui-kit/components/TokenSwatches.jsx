const TOKENS = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-2', className: 'bg-surface-2' },
  { name: 'border', className: 'bg-border' },
  { name: 'text', className: 'bg-text' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'info', className: 'bg-info' },
]

/** Renders every semantic token so the dark-mode audit is a single glance. */
export function TokenSwatches() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {TOKENS.map((token) => (
        <div key={token.name} className="min-w-0">
          <div className={`h-12 rounded-lg border border-border ${token.className}`} />
          <p className="mt-1.5 truncate text-xs text-muted">--{token.name}</p>
        </div>
      ))}
    </div>
  )
}
