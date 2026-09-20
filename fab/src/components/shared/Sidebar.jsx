import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { navigation } from '@/config/navigation'
import { Button } from '@/components/ui/Button'
import { Logo } from './Logo'

/**
 * App sidebar: collapsible groups on desktop, a drawer under `lg`.
 * @param {{open: boolean, onClose: () => void,
 *   filter?: (groups: typeof navigation) => typeof navigation}} props
 */
export function Sidebar({ open, onClose, filter }) {
  const location = useLocation()
  const groups = useMemo(() => (filter ? filter(navigation) : navigation), [filter])

  const activeGroup = useMemo(
    () =>
      groups.find((group) =>
        group.children?.some((child) => location.pathname.startsWith(child.to)),
      )?.label ?? null,
    [groups, location.pathname],
  )

  // The group holding the current route is open by default; these two sets
  // record what the user explicitly opened or closed, so no effect is needed.
  const [opened, setOpened] = useState([])
  const [closed, setClosed] = useState([])

  const isExpanded = (label) =>
    opened.includes(label) || (label === activeGroup && !closed.includes(label))

  const toggle = (label) => {
    if (isExpanded(label)) {
      setOpened((current) => current.filter((item) => item !== label))
      setClosed((current) => (current.includes(label) ? current : [...current, label]))
    } else {
      setClosed((current) => current.filter((item) => item !== label))
      setOpened((current) => (current.includes(label) ? current : [...current, label]))
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface',
          'transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <Logo to="/app/dashboard" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {groups.map((group) =>
            group.children ? (
              <SidebarGroup
                key={group.label}
                group={group}
                expanded={isExpanded(group.label)}
                onToggle={() => toggle(group.label)}
                onNavigate={onClose}
              />
            ) : (
              <SidebarLink
                key={group.label}
                to={group.to}
                icon={group.icon}
                label={group.label}
                onNavigate={onClose}
                end={group.to === '/app/dashboard'}
              />
            ),
          )}
        </nav>

        <div className="shrink-0 border-t border-border px-4 py-3">
          <p className="text-[11px] text-muted">
            ApparelFlow ERP · <span className="font-medium">demo data</span>
          </p>
        </div>
      </aside>
    </>
  )
}

function SidebarGroup({ group, expanded, onToggle, onNavigate }) {
  const Icon = group.icon
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
          'text-muted hover:bg-surface-2 hover:text-text',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div className="mt-0.5 ml-[1.4rem] space-y-0.5 border-l border-border pl-2">
          {group.children.map((child) => (
            <SidebarLink key={child.to} to={child.to} label={child.label} onNavigate={onNavigate} nested />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarLink({ to, icon: Icon, label, onNavigate, nested = false, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
          nested ? 'font-normal' : 'font-medium',
          isActive
            ? 'bg-primary-soft text-primary'
            : 'text-muted hover:bg-surface-2 hover:text-text',
        )
      }
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
