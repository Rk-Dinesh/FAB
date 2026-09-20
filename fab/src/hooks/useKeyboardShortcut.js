import { useEffect } from 'react'

/**
 * Bind a global keyboard shortcut.
 *
 * @param {{key: string, meta?: boolean, ctrl?: boolean, shift?: boolean}} combo
 * @param {(event: KeyboardEvent) => void} handler
 * @param {boolean} [enabled]
 */
export function useKeyboardShortcut(combo, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined

    const listener = (event) => {
      if (event.key.toLowerCase() !== combo.key.toLowerCase()) return
      // `meta` accepts either modifier so the shortcut works on macOS and Windows.
      if (combo.meta && !(event.metaKey || event.ctrlKey)) return
      if (combo.ctrl && !event.ctrlKey) return
      if (combo.shift && !event.shiftKey) return

      // Don't hijack a shortcut the user is typing into a field.
      const target = event.target
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (typing && !combo.meta && !combo.ctrl) return

      event.preventDefault()
      handler(event)
    }

    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [combo.key, combo.meta, combo.ctrl, combo.shift, handler, enabled])
}
