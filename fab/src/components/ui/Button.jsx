import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover border border-transparent shadow-sm',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-2 hover:border-border-strong',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-surface-2 hover:text-text',
  danger: 'bg-danger text-white hover:opacity-90 border border-transparent shadow-sm',
  success: 'bg-success text-white hover:opacity-90 border border-transparent shadow-sm',
  outline:
    'bg-transparent text-primary border border-primary/40 hover:bg-primary-soft hover:border-primary',
  link: 'bg-transparent text-primary border-none underline-offset-4 hover:underline p-0 h-auto',
}

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-base gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

/**
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'|'ghost'|'danger'|'success'|'outline'|'link'} [variant]
 * @property {'xs'|'sm'|'md'|'lg'|'icon'|'icon-sm'} [size]
 * @property {boolean} [loading]
 * @property {import('react').ElementType} [as]
 */

/** @type {import('react').ForwardRefExoticComponent<ButtonProps & any>} */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    as: Component = 'button',
    type,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      type={Component === 'button' ? (type ?? 'button') : type}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Component>
  )
})
