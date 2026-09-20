/**
 * RBAC redirect regression check.
 *
 * Mounts the real route tree for a set of (role, path) pairs and asserts where
 * each one actually lands, so a permission-matrix edit can't quietly open or
 * close a module. Run with `npm run rbac`.
 */
import { loadReact, setupDom, setupVite } from './test-env.mjs'

const { window, container } = setupDom()
const vite = await setupVite()
const { React, act, createRoot, createMemoryRouter, RouterProvider } = await loadReact()
const { routes } = await vite.ssrLoadModule('/src/app/routes.jsx')
const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.js')
const users = (await vite.ssrLoadModule('/src/mocks/data/users.json')).default

const cases = [
  { role: null,            path: '/app/orders',           expect: '/login' },
  { role: 'DESIGNER',      path: '/app/finance/invoices', expect: '/403' },
  { role: 'DESIGNER',      path: '/app/design/samples',   expect: '/app/design/samples' },
  { role: 'CLIENT',        path: '/app/orders',           expect: '/portal/orders' },
  { role: 'MERCHANDISER',  path: '/portal/orders',        expect: '/app/dashboard' },
  { role: 'HR',            path: '/app/hr/payroll',       expect: '/app/hr/payroll' },
  { role: 'HR',            path: '/app/production/tracker', expect: '/403' },
  { role: 'SUPER_ADMIN',   path: '/app/admin/roles',      expect: '/app/admin/roles' },
  { role: 'CXO',           path: '/app/admin/users',      expect: '/403' },
]

let failed = 0
for (const testCase of cases) {
  const user = testCase.role ? users.find((u) => u.role === testCase.role) : null
  useAuthStore.setState(
    user ? { user, role: user.role, token: 'tok', impersonatedRole: null }
         : { user: null, role: null, token: null, impersonatedRole: null },
  )
  const router = createMemoryRouter(routes, { initialEntries: [testCase.path] })
  const routeContainer = window.document.createElement('div')
  window.document.body.appendChild(routeContainer)
  let root
  await act(async () => {
    root = createRoot(routeContainer)
    root.render(React.createElement(RouterProvider, { router }))
  })
  const landed = router.state.location.pathname
  const ok = landed === testCase.expect
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${String(testCase.role ?? 'anonymous').padEnd(14)} ${testCase.path.padEnd(26)} → ${landed}${ok ? '' : `  (expected ${testCase.expect})`}`)
  await act(async () => root.unmount())
  routeContainer.remove()
}
// --- every role's dashboard renders its own content ---------------------------
console.log('')
const { Providers } = await vite.ssrLoadModule('/src/app/Providers.jsx')
const DASHBOARD_EXPECTATIONS = {
  SUPER_ADMIN: ['Executive dashboard', 'Order book'],
  CXO: ['Executive dashboard', 'Revenue vs target', 'Vendor performance'],
  MERCHANDISER: ['Needs attention', 'Live orders', 'Jump back in'],
  DESIGNER: ['Samples pending', 'Needs attention'],
  SOURCING: ['Open material POs', 'Needs attention'],
  PRODUCTION: ['Delayed stages', 'Needs attention'],
  QC: ['Failed inspections', 'Pass rate'],
  LOGISTICS: ['Ready to ship', 'In transit'],
  FINANCE: ['Overdue invoices', 'Receivables'],
  HR: ['Leave to approve', 'Headcount'],
}

for (const [roleId, expectations] of Object.entries(DASHBOARD_EXPECTATIONS)) {
  const user = users.find((candidate) => candidate.role === roleId)
  useAuthStore.setState({ user, role: user.role, token: 'tok', impersonatedRole: null })

  const dashRouter = createMemoryRouter(routes, { initialEntries: ['/app/dashboard'] })
  const dashContainer = window.document.createElement('div')
  window.document.body.appendChild(dashContainer)
  let dashRoot
  await act(async () => {
    dashRoot = createRoot(dashContainer)
    dashRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: dashRouter })),
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  const text = dashContainer.textContent ?? ''
  const missing = expectations.filter(
    (expected) => !text.toLowerCase().includes(expected.toLowerCase()),
  )
  const ok = missing.length === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${roleId.padEnd(14)} dashboard${ok ? '' : ` — missing: ${missing.join(', ')}`}`)

  await act(async () => dashRoot.unmount())
  dashContainer.remove()
}

await vite.close()
console.log(failed === 0 ? '\nAll RBAC redirects and role dashboards correct.' : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
