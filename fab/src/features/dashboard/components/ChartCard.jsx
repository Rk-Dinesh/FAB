import { Card, CardBody, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'

/**
 * Card wrapper for a dashboard chart, with its own loading state.
 * Chart colours live in `../chartTheme.js`.
 *
 * @param {{title: string, description?: string, loading?: boolean,
 *   height?: number, actions?: import('react').ReactNode, className?: string,
 *   children: import('react').ReactNode}} props
 */
export function ChartCard({
  title,
  description,
  loading = false,
  height = 240,
  actions,
  className,
  children,
}) {
  return (
    <Card className={className}>
      <CardHeader actions={actions}>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardBody>
        {loading ? (
          <Skeleton style={{ height }} className="w-full" />
        ) : (
          <div style={{ height }} className="w-full">
            {children}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
