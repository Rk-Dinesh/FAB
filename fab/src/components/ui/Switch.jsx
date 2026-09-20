import { useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Controlled toggle.
 * @param {{checked?: boolean, onCheckedChange?: (value: boolean) => void,
 *   label?: string, description?: string, disabled?: boolean, id?: string,
 *   size?: 'sm'|'md', className?: string}} props
 */
export function Switch({
  checked = false,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
  size = 'md',
  className,
}) {
  const generatedId = useId()
  const switchId = id ?? generatedId
  const small = size === 'sm'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-labelledby={label ? `${switchId}-label` : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          small ? 'h-5 w-9' : 'h-6 w-11',
          checked ? 'bg-primary' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow transition-transform',
            small ? 'size-4' : 'size-5',
            checked ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5',
          )}
        />
      </button>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <label
              id={`${switchId}-label`}
              htmlFor={switchId}
              className="cursor-pointer text-sm font-medium text-text"
            >
              {label}
            </label>
          )}
          {description && <span className="text-xs text-muted">{description}</span>}
        </span>
      )}
    </div>
  )
}
