import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useEscapeKey, useLockBodyScroll, useOnClickOutside } from '@/hooks'
import { useCommandItems } from './useCommandItems'

const GROUP_ORDER = ['Pages', 'Orders', 'Clients', 'Vendors', 'People']

/**
 * ⌘K palette over orders, clients, vendors, employees and every page the
 * current role can reach.
 *
 * @param {{open: boolean, onClose: () => void}} props
 */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const panelRef = useRef(null)


  const close = useCallback(() => onClose?.(), [onClose])
  useEscapeKey(close, open)
  useLockBodyScroll(open)
  useOnClickOutside([panelRef], close, open)

  const items = useCommandItems(open)

  // Reset the query when the palette is reopened, without a reset effect.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matched = needle
      ? items.filter((item) => item.haystack.includes(needle))
      : items.filter((item) => item.group === 'Pages').slice(0, 8)

    // Prefix matches first, then the rest, capped so the list stays scannable.
    const ranked = [...matched].sort((left, right) => {
      const leftScore = left.title.toLowerCase().startsWith(needle) ? 0 : 1
      const rightScore = right.title.toLowerCase().startsWith(needle) ? 0 : 1
      if (leftScore !== rightScore) return leftScore - rightScore
      return GROUP_ORDER.indexOf(left.group) - GROUP_ORDER.indexOf(right.group)
    })
    return ranked.slice(0, 24)
  }, [items, query])

  const grouped = useMemo(() => {
    const byGroup = new Map()
    results.forEach((item, index) => {
      const entries = byGroup.get(item.group) ?? []
      entries.push({ ...item, index })
      byGroup.set(item.group, entries)
    })
    return [...byGroup.entries()].sort(
      (left, right) => GROUP_ORDER.indexOf(left[0]) - GROUP_ORDER.indexOf(right[0]),
    )
  }, [results])

  const go = (item) => {
    close()
    navigate(item.to)
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || (event.key === 'n' && event.ctrlKey)) {
      event.preventDefault()
      setActiveIndex((current) => (results.length === 0 ? 0 : (current + 1) % results.length))
    } else if (event.key === 'ArrowUp' || (event.key === 'p' && event.ctrlKey)) {
      event.preventDefault()
      setActiveIndex((current) =>
        results.length === 0 ? 0 : (current - 1 + results.length) % results.length,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = results[activeIndex]
      if (item) go(item)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search the app"
        className={cn(
          'relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg',
          'border border-border bg-surface shadow-2xl animate-slide-up',
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            // The palette's whole purpose is to take focus when it opens.
            autoFocus
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search orders, clients, vendors, people and pages…"
            aria-label="Search"
            className="h-12 flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] text-muted">
            esc
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              Nothing matches “{query}”.
            </p>
          ) : (
            grouped.map(([group, entries]) => (
              <div key={group} className="mb-1">
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {group}
                </p>
                <ul>
                  {entries.map((item) => {
                    const Icon = item.icon
                    const active = item.index === activeIndex
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(item.index)}
                          onClick={() => go(item)}
                          aria-current={active ? 'true' : undefined}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                            active ? 'bg-primary-soft' : 'hover:bg-surface-2',
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted')}
                              aria-hidden="true"
                            />
                          )}
                          <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span
                              className={cn(
                                'truncate text-sm',
                                active ? 'font-medium text-primary' : 'text-text',
                              )}
                            >
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="truncate text-xs text-muted">{item.subtitle}</span>
                            )}
                          </span>
                          {active && (
                            <CornerDownLeft className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border bg-surface-2/40 px-4 py-2 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1">↑</kbd>
            <kbd className="rounded border border-border bg-surface px-1">↓</kbd> to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1">↵</kbd> to open
          </span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
