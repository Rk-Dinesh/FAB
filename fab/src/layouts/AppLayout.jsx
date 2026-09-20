import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/shared/Sidebar'
import { Topbar } from '@/components/shared/Topbar'

/**
 * Shell for every authenticated internal route: sidebar + topbar + outlet.
 * Auth-aware widgets are layered in during phase 2.
 */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
