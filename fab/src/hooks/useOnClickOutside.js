import { useEffect } from 'react'

/**
 * Call `handler` when a pointer event lands outside every supplied ref.
 * @param {Array<import('react').RefObject<HTMLElement>>} refs
 * @param {(event: Event) => void} handler
 * @param {boolean} [enabled]
 */
export function useOnClickOutside(refs, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined

    const listener = (event) => {
      const isInside = refs.some((ref) => ref.current?.contains(event.target))
      if (!isInside) handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [refs, handler, enabled])
}
