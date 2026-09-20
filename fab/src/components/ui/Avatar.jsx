import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
}

// Deterministic tint per person so the same user always looks the same.
const TINTS = [
  'bg-primary-soft text-primary',
  'bg-success-soft text-success',
  'bg-warning-soft text-warning',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
]

/**
 * @param {{name?: string, src?: string, size?: keyof typeof SIZES,
 *   className?: string, status?: 'online'|'offline'}} props
 */
export function Avatar({ name = '', src, size = 'md', className, status }) {
  const tint = TINTS[Math.abs(hash(name)) % TINTS.length]

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('rounded-full object-cover', SIZES[size])}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex items-center justify-center rounded-full font-semibold select-none',
            SIZES[size],
            tint,
          )}
        >
          {initials(name) || '?'}
        </span>
      )}
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface',
            status === 'online' ? 'bg-success' : 'bg-border-strong',
          )}
        />
      )}
      <span className="sr-only">{name}</span>
    </span>
  )
}

function hash(value) {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index)
    result |= 0
  }
  return result
}
