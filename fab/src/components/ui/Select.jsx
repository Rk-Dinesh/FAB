import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Native select styled to match Input. Options are `{ value, label }`.
 * @typedef {Object} SelectProps
 * @property {Array<{value: string|number, label: string}>} options
 * @property {string} [placeholder]
 */
export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    options = [],
    placeholder,
    className,
    containerClassName,
    id,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text">
          {label}
          {props.required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-9 w-full appearance-none rounded-lg border border-border bg-surface pl-3 pr-9',
            'text-sm text-text transition-colors',
            'hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
            'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
            error && 'border-danger focus:border-danger focus:ring-danger/25',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>{error || hint}</p>
      )}
    </div>
  )
})
