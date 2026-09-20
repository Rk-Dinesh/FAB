import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * The one way a failed load is shown. Every screen that fetches uses this, so
 * an error always looks the same and always offers a retry.
 *
 * @param {{error: Error, onRetry?: () => void, title?: string, compact?: boolean}} props
 */
export function ErrorState({ error, onRetry, title = 'Couldn’t load this', compact = false }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title={title}
      description={error?.message ?? 'Something went wrong while fetching the data.'}
      compact={compact}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  )
}
