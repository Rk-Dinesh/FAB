/**
 * RBAC redirect regression check.
 *
 * Mounts the real route tree for a set of (role, path) pairs and asserts where
 * each one actually lands, so a permission-matrix edit can't quietly open or
 * close a module. Run with `npm run rbac`.
 */
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
const { window } = dom
globalThis.window = window
globalThis.document = window.document
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })
globalThis.HTMLElement = window.HTMLElement
globalThis.Element = window.Element
globalThis.IS_REACT_ACT_ENVIRONMENT = true
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
class RO { observe() {} unobserve() {} disconnect() {} }
globalThis.ResizeObserver = RO

const vite = await createServer({
  server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
  ssr: { external: ['react', 'react-dom', 'react-router-dom', 'react-router'], noExternal: [/^(?!react)/] },
})
const React = (await import('react')).default
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router-dom')
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
  const container = window.document.createElement('div')
  window.document.body.appendChild(container)
  let root
  await act(async () => {
    root = createRoot(container)
    root.render(React.createElement(RouterProvider, { router }))
  })
  const landed = router.state.location.pathname
  const ok = landed === testCase.expect
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${String(testCase.role ?? 'anonymous').padEnd(14)} ${testCase.path.padEnd(26)} → ${landed}${ok ? '' : `  (expected ${testCase.expect})`}`)
  await act(async () => root.unmount())
  container.remove()
}
await vite.close()
console.log(failed === 0 ? '\nAll RBAC redirects correct.' : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
