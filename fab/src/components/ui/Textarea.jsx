import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, containerClassName, id, rows = 4, ...props },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-text">
          {label}
          {props.required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${textareaId}-desc` : undefined}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text',
          'placeholder:text-muted/70 transition-colors resize-y',
          'hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
          'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
          error && 'border-danger focus:border-danger focus:ring-danger/25',
          className,
        )}
        {...props}
      />
      {(error || hint) && (
        <p id={`${textareaId}-desc`} className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  )
})
