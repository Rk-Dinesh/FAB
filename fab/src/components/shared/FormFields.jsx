import { Controller } from 'react-hook-form'
import { cn } from '@/utils/cn'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'

/**
 * @typedef {Object} FieldConfig
 * @property {string} name
 * @property {string} label
 * @property {'text'|'number'|'email'|'date'|'select'|'textarea'|'switch'|'checkbox'|'tags'} [type]
 * @property {Array<{value: any, label: string}>} [options]
 * @property {string} [hint]
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @property {boolean} [full] span both columns
 * @property {number} [step]
 */

/**
 * Render a list of fields against a react-hook-form instance.
 * @param {{fields: FieldConfig[], form: import('react-hook-form').UseFormReturn,
 *   columns?: 1|2, className?: string}} props
 */
export function FormFields({ fields, form, columns = 2, className }) {
  const {
    register,
    control,
    formState: { errors },
  } = form

  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
        className,
      )}
    >
      {fields.map((field) => {
        const error = errors[field.name]?.message
        const span = field.full ? 'sm:col-span-2' : undefined

        if (field.type === 'switch' || field.type === 'checkbox') {
          return (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              render={({ field: controlled }) =>
                field.type === 'switch' ? (
                  <Switch
                    label={field.label}
                    description={field.hint}
                    checked={Boolean(controlled.value)}
                    onCheckedChange={controlled.onChange}
                    className={cn('self-end pb-1', span)}
                  />
                ) : (
                  <Checkbox
                    label={field.label}
                    description={field.hint}
                    checked={Boolean(controlled.value)}
                    onChange={(event) => controlled.onChange(event.target.checked)}
                    containerClassName={cn('self-end pb-2', span)}
                  />
                )
              }
            />
          )
        }

        if (field.type === 'select') {
          return (
            <Select
              key={field.name}
              label={field.label}
              hint={field.hint}
              error={error}
              required={field.required}
              options={field.options ?? []}
              placeholder={field.placeholder ?? 'Select…'}
              containerClassName={span}
              {...register(field.name)}
            />
          )
        }

        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.name}
              label={field.label}
              hint={field.hint}
              error={error}
              required={field.required}
              placeholder={field.placeholder}
              containerClassName={cn('sm:col-span-2', span)}
              {...register(field.name)}
            />
          )
        }

        if (field.type === 'tags') {
          return (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              render={({ field: controlled }) => (
                <Input
                  label={field.label}
                  hint={field.hint ?? 'Separate values with a comma'}
                  error={error}
                  required={field.required}
                  placeholder={field.placeholder}
                  containerClassName={cn('sm:col-span-2', span)}
                  value={Array.isArray(controlled.value) ? controlled.value.join(', ') : (controlled.value ?? '')}
                  onChange={(event) =>
                    controlled.onChange(
                      event.target.value
                        .split(',')
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    )
                  }
                />
              )}
            />
          )
        }

        return (
          <Input
            key={field.name}
            type={field.type ?? 'text'}
            step={field.step}
            label={field.label}
            hint={field.hint}
            error={error}
            required={field.required}
            placeholder={field.placeholder}
            containerClassName={span}
            {...register(field.name, field.type === 'number' ? { valueAsNumber: true } : undefined)}
          />
        )
      })}
    </div>
  )
}
