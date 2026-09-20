import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * Wordmark. The glyph is inline SVG so it inherits the theme tokens.
 * @param {{to?: string, compact?: boolean, className?: string}} props
 */
export function Logo({ to = '/', compact = false, className }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2.5 font-semibold text-text', className)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden="true">
          <path
            d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] leading-none tracking-tight">
          Apparel<span className="text-primary">Flow</span>
        </span>
      )}
    </Link>
  )
}
