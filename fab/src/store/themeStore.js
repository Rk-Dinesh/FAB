import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'apparelflow-theme'

/**
 * Resolve a theme preference into the class actually applied to <html>.
 * @param {'light'|'dark'|'system'} theme
 * @returns {'light'|'dark'}
 */
export function resolveTheme(theme) {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply the resolved theme to the document element. */
function applyTheme(theme) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  return resolved
}

/**
 * Theme preference store. The inline script in index.html applies the stored
 * value before first paint; this store keeps it in sync afterwards.
 */
export const useThemeStore = create()(
  persist(
    (set, get) => ({
      /** @type {'light'|'dark'|'system'} */
      theme: 'system',
      /** @type {'light'|'dark'} */
      resolved: 'light',

      /** @param {'light'|'dark'|'system'} theme */
      setTheme: (theme) => set({ theme, resolved: applyTheme(theme) }),

      /** Cycle light → dark → system. */
      cycleTheme: () => {
        const order = ['light', 'dark', 'system']
        const next = order[(order.indexOf(get().theme) + 1) % order.length]
        set({ theme: next, resolved: applyTheme(next) })
      },

      /** Re-apply on mount and subscribe to OS changes. Returns an unsubscribe fn. */
      init: () => {
        set({ resolved: applyTheme(get().theme) })
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const listener = () => {
          if (get().theme === 'system') set({ resolved: applyTheme('system') })
        }
        media.addEventListener('change', listener)
        return () => media.removeEventListener('change', listener)
      },
    }),
    {
      name: STORAGE_KEY,
      // Store the bare preference string so the pre-paint inline script can read it.
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name)
            return value ? { state: { theme: value } } : null
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value.state.theme)
          } catch {
            /* storage blocked — theme simply won't persist */
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {
            /* no-op */
          }
        },
      },
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)
