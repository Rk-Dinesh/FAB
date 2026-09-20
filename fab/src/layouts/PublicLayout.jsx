import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Capabilities', to: '/capabilities' },
  { label: 'Clients', to: '/clients' },
  { label: 'Sustainability', to: '/sustainability' },
  { label: 'Contact', to: '/contact' },
]

/** Marketing site shell: sticky header, footer, mobile menu. */
export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo to="/" />
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted hover:text-text',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button as={Link} to="/login" size="sm" className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-border bg-surface px-4 py-2 md:hidden">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-1 block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-fg"
            >
              Sign in
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo to="/" />
            <p className="mt-2 max-w-sm text-xs text-muted">
              Apparel sourcing and buying house services — design, costing, production
              management, quality and export logistics.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="transition-colors hover:text-text">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} ApparelFlow. Demo site with fictional data.
        </div>
      </footer>
    </div>
  )
}
