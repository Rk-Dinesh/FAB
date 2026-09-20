import { Link, useRouteError } from 'react-router-dom'
import { AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** Router `errorElement`: shown when a route loader or render throws. */
export function RouteError() {
  const error = useRouteError()
  const message =
    error?.statusText || error?.message || 'The page could not be loaded. Please try again.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft">
        <AlertOctagon className="size-6 text-danger" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-text">Something went wrong</h1>
        <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Button as={Link} to="/app/dashboard">
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
