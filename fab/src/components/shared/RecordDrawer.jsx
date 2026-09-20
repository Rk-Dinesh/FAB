import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { FormFields } from './FormFields'

/**
 * Create / edit a record in a right-side drawer, validated with zod.
 * Used by MastersCRUD and by every module that edits a single record.
 *
 * @param {{open: boolean, onClose: () => void, title: string, description?: string,
 *   schema: import('zod').ZodTypeAny, fields: Array<object>, defaultValues: object,
 *   onSubmit: (values: object) => Promise<void>, submitLabel?: string,
 *   size?: 'sm'|'md'|'lg'|'xl', columns?: 1|2,
 *   footerExtra?: import('react').ReactNode, children?: import('react').ReactNode}} props
 */
export function RecordDrawer({
  open,
  onClose,
  title,
  description,
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  size = 'md',
  columns = 2,
  footerExtra,
  children,
}) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues })
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form

  // Re-seed the form whenever a different record is opened.
  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, defaultValues, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
    onClose()
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          {footerExtra}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <FormFields fields={fields} form={form} columns={columns} />
        {typeof children === 'function' ? children(form) : children}
        {/* Enables Enter-to-submit without a visible duplicate button. */}
        <button type="submit" className="sr-only">
          {submitLabel}
        </button>
      </form>
    </Drawer>
  )
}
