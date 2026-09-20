import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Horizontal (or vertical) progress stepper. Used by the order lifecycle and
 * by the order creation wizard.
 * @param {{steps: Array<{value: string, label: string, description?: string,
 *     icon?: import('react').ElementType}>,
 *   current: number, orientation?: 'horizontal'|'vertical',
 *   onStepClick?: (index: number) => void, className?: string}} props
 */
export function Stepper({
  steps,
  current = 0,
  orientation = 'horizontal',
  onStepClick,
  className,
}) {
  const vertical = orientation === 'vertical'

  return (
    <ol
      className={cn(
        vertical ? 'flex flex-col gap-0' : 'flex w-full items-start overflow-x-auto scrollbar-none',
        className,
      )}
    >
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        const Icon = step.icon
        const interactive = Boolean(onStepClick) && index <= current
        const last = index === steps.length - 1

        return (
          <li
            key={step.value}
            className={cn(
              'relative',
              vertical ? 'flex gap-3 pb-6 last:pb-0' : 'flex flex-1 flex-col items-center',
            )}
            aria-current={active ? 'step' : undefined}
          >
            {/* connector */}
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  done ? 'bg-primary' : 'bg-border',
                  vertical
                    ? 'absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-0.5'
                    : 'absolute left-1/2 top-3 h-0.5 w-full',
                )}
              />
            )}

            <button
              type="button"
              disabled={!interactive}
              onClick={interactive ? () => onStepClick(index) : undefined}
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                done && 'border-primary bg-primary text-primary-fg',
                active && 'border-primary bg-surface text-primary',
                !done && !active && 'border-border bg-surface text-muted',
                interactive ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
              ) : Icon ? (
                <Icon className="size-3" aria-hidden="true" />
              ) : (
                <span className="text-[10px] font-bold">{index + 1}</span>
              )}
            </button>

            <div className={cn(vertical ? 'min-w-0 pt-0.5' : 'mt-2 px-1 text-center')}>
              <p
                className={cn(
                  'text-xs font-medium',
                  active ? 'text-text' : done ? 'text-text' : 'text-muted',
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-[11px] text-muted">{step.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
