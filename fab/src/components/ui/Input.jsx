import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Text input with optional label, hint, error and leading/trailing adornments.
 * @typedef {Object} InputProps
 * @property {string} [label]
 * @property {string} [hint]
 * @property {string} [error]
 * @property {import('react').ReactNode} [leading]
 * @property {import('react').ReactNode} [trailing]
 */
export const Input = forwardRef(function Input(
  { label, hint, error, leading, trailing, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
          {props.required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leading && (
          <span className="pointer-events-none absolute left-3 flex text-muted">{leading}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn(
            'h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text',
            'placeholder:text-muted/70 transition-colors',
            'hover:border-border-strong focus:border-primary focus:outline-none',
            'focus:ring-2 focus:ring-primary/25',
            'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
            leading && 'pl-9',
            trailing && 'pr-9',
            error && 'border-danger focus:border-danger focus:ring-danger/25',
            className,
          )}
          {...props}
        />
        {trailing && <span className="absolute right-3 flex text-muted">{trailing}</span>}
      </div>
      {(error || hint) && (
        <p id={`${inputId}-desc`} className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  )
})
