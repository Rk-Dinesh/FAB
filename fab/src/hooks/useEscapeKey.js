import { useEffect } from 'react'

/**
 * @param {() => void} handler
 * @param {boolean} [enabled]
 */
export function useEscapeKey(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    const listener = (event) => {
      if (event.key === 'Escape') handler(event)
    }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [handler, enabled])
}
