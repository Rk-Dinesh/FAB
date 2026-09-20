import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'

/**
 * Declarative filter row. Each filter is `{key, label, type, options}` where
 * type is 'select' | 'date' | 'dateRange' | 'text'.
 *
 * @param {{filters: Array<object>, values: Record<string, any>,
 *   onChange: (values: Record<string, any>) => void, className?: string,
 *   extra?: import('react').ReactNode}} props
 */
export function FilterBar({ filters, values, onChange, className, extra }) {
  const set = (key, value) => onChange({ ...values, [key]: value })
  const activeCount = filters.filter((filter) => hasValue(values[filter.key])).length

  return (
    <div className={cn('flex flex-wrap items-end gap-2', className)}>
      {filters.map((filter) => {
        if (filter.type === 'dateRange') {
          const range = values[filter.key] ?? {}
          return (
            <div key={filter.key} className="flex items-end gap-1.5">
              <Input
                type="date"
                label={`${filter.label} from`}
                value={range.from ?? ''}
                onChange={(event) => set(filter.key, { ...range, from: event.target.value })}
                containerClassName="w-40"
                className="h-8"
              />
              <Input
                type="date"
                label="to"
                value={range.to ?? ''}
                onChange={(event) => set(filter.key, { ...range, to: event.target.value })}
                containerClassName="w-40"
                className="h-8"
              />
            </div>
          )
        }

        if (filter.type === 'date') {
          return (
            <Input
              key={filter.key}
              type="date"
              label={filter.label}
              value={values[filter.key] ?? ''}
              onChange={(event) => set(filter.key, event.target.value)}
              containerClassName="w-44"
              className="h-8"
            />
          )
        }

        if (filter.type === 'text') {
          return (
            <Input
              key={filter.key}
              label={filter.label}
              value={values[filter.key] ?? ''}
              onChange={(event) => set(filter.key, event.target.value)}
              placeholder={filter.placeholder}
              containerClassName="w-44"
              className="h-8"
            />
          )
        }

        return (
          <Select
            key={filter.key}
            label={filter.label}
            value={values[filter.key] ?? ''}
            onChange={(event) => set(filter.key, event.target.value)}
            placeholder={filter.placeholder ?? `All ${filter.label.toLowerCase()}`}
            options={filter.options ?? []}
            containerClassName={filter.width ?? 'w-48'}
            className="h-8"
          />
        )
      })}

      {extra}

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})} className="mb-0.5">
          <X className="size-3.5" /> Clear {activeCount}
        </Button>
      )}
    </div>
  )
}

/** @param {unknown} value */
function hasValue(value) {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.values(value).some((entry) => entry !== '' && entry != null)
  return true
}
