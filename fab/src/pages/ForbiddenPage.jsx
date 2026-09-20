import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-warning-soft">
        <ShieldAlert className="size-6 text-warning" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-warning">403</p>
        <h1 className="mt-1 text-lg font-semibold text-text">You don’t have access to this</h1>
        <p className="mt-1 max-w-md text-sm text-muted">
          Your role doesn’t include this module. Ask an administrator to update your
          permissions if you need it.
        </p>
      </div>
      <Button as={Link} to="/app/dashboard">
        Back to dashboard
      </Button>
    </div>
  )
}
