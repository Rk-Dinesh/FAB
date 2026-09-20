import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageSpinner } from '@/components/ui'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

/** Centred card shell for login / forgot-password, with a brand panel on xl. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-fg lg:flex">
        <Logo to="/" className="text-primary-fg [&_span]:text-primary-fg" />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            From enquiry to export, one thread.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-90">
            ApparelFlow runs the whole buying-house workflow — leads, design approvals,
            costing, sourcing, production stages, QC, shipping and settlement — on one
            order record.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="opacity-80">Live orders</dt>
              <dd className="mt-1 text-2xl font-semibold">30</dd>
            </div>
            <div>
              <dt className="opacity-80">Vendors</dt>
              <dd className="mt-1 text-2xl font-semibold">25</dd>
            </div>
            <div>
              <dt className="opacity-80">On-time</dt>
              <dd className="mt-1 text-2xl font-semibold">92%</dd>
            </div>
          </dl>
        </div>
        <p className="text-xs opacity-75">Demo environment · mock data only</p>
      </div>

      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between p-4">
          <Logo to="/" className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10">
          <div className="w-full max-w-sm">
            <Suspense fallback={<PageSpinner />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
