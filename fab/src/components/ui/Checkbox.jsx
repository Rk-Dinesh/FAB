import { forwardRef, useId } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * @typedef {Object} CheckboxProps
 * @property {string} [label]
 * @property {string} [description]
 * @property {boolean} [indeterminate]
 */
export const Checkbox = forwardRef(function Checkbox(
  { label, description, indeterminate = false, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  return (
    <div className={cn('flex items-start gap-2.5', containerClassName)}>
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'peer size-4 cursor-pointer appearance-none rounded border border-border-strong',
            'bg-surface transition-colors',
            'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
            'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
        {indeterminate ? (
          <Minus
            className="pointer-events-none absolute size-3 text-primary-fg opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        ) : (
          <Check
            className="pointer-events-none absolute size-3 text-primary-fg opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        )}
      </span>
      {(label || description) && (
        <span className="-mt-0.5 flex flex-col">
          {label && (
            <label htmlFor={checkboxId} className="cursor-pointer text-sm text-text">
              {label}
            </label>
          )}
          {description && <span className="text-xs text-muted">{description}</span>}
        </span>
      )}
    </div>
  )
})
