import { Badge } from '@/components/ui/Badge'
import { statusMeta } from '@/config/statuses'

/**
 * The only way a status is rendered anywhere in the app. Reads its label, tone
 * and icon from config/statuses.js so one edit updates every screen.
 * @param {{kind?: keyof import('@/config/statuses').STATUS_REGISTRY, value: string,
 *   size?: 'sm'|'md', withIcon?: boolean, dot?: boolean, className?: string}} props
 */
export function StatusBadge({ kind = 'order', value, size = 'md', withIcon = false, dot = true, className }) {
  if (!value) return <span className="text-muted">—</span>
  const meta = statusMeta(kind, value)
  const Icon = withIcon ? meta.icon : null

  return (
    <Badge
      tone={meta.tone}
      size={size}
      dot={dot && !Icon}
      icon={Icon ? <Icon className="size-3" aria-hidden="true" /> : undefined}
      className={className}
    >
      {meta.label}
    </Badge>
  )
}
