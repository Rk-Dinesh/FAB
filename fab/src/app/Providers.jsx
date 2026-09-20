import { useEffect } from 'react'
import { Toaster } from '@/components/ui/Toast'
import { useThemeStore } from '@/store/themeStore'

/** App-wide providers: theme sync and the toast outlet. */
export function Providers({ children }) {
  const init = useThemeStore((state) => state.init)

  useEffect(() => init(), [init])

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
