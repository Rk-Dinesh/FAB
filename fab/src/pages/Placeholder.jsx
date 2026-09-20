import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'

/**
 * Temporary scaffold for routes whose module lands in a later build phase.
 * Every one of these is replaced before the build is complete.
 * @param {{title: string, description?: string, phase?: string}} props
 */
export function Placeholder({ title, description, phase }) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={Construction}
          title="This module is being built"
          description={phase ? `Scheduled for ${phase} of the build.` : undefined}
        />
      </Card>
    </div>
  )
}
