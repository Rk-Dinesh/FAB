import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-2">
        <SearchX className="size-6 text-muted" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-1 text-lg font-semibold text-text">Page not found</h1>
        <p className="mt-1 max-w-md text-sm text-muted">
          The page you are looking for has moved or never existed.
        </p>
      </div>
      <div className="flex gap-2">
        <Button as={Link} to="/" variant="secondary">
          Go to website
        </Button>
        <Button as={Link} to="/app/dashboard">
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
