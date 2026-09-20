import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { portalNavigation } from '@/config/navigation'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

/**
 * Shell for the CLIENT role: a slim horizontal nav instead of the internal
 * sidebar, so brands only ever see their own workspace.
 */
export function ClientPortalLayout({ right }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo to="/portal" />
          <span className="hidden rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted sm:inline">
            Client portal
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {right}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 scrollbar-none sm:px-4">
          {portalNavigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
