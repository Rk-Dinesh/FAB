import { useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keep Tab focus inside `ref` while active, and restore focus on close.
 * @param {import('react').RefObject<HTMLElement>} ref
 * @param {boolean} active
 */
export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return undefined

    const container = ref.current
    const previouslyFocused = document.activeElement

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE))
    const first = focusables()[0]
    // Focus the panel itself when it holds nothing focusable yet.
    ;(first ?? container).focus({ preventScroll: true })

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [ref, active])
}
