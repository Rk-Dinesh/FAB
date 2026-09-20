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
await vite.close()
console.log(failed === 0 ? '\nAll RBAC redirects correct.' : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
