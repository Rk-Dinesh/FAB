/**
 * Route smoke test.
 *
 * Mounts every route from src/app/routes.jsx in a jsdom document through Vite's
 * SSR module loader, and fails if any route throws or logs a console error.
 * Run with `npm run smoke` (optionally passing paths to check a subset).
 */
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

const { window } = dom
globalThis.window = window
globalThis.document = window.document
Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  configurable: true,
  writable: true,
})
globalThis.HTMLElement = window.HTMLElement
globalThis.Element = window.Element
globalThis.Node = window.Node
globalThis.Event = window.Event
globalThis.KeyboardEvent = window.KeyboardEvent
globalThis.MouseEvent = window.MouseEvent
globalThis.getComputedStyle = window.getComputedStyle.bind(window)
globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0)
globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle)
globalThis.IS_REACT_ACT_ENVIRONMENT = true

window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub
window.ResizeObserver = ResizeObserverStub
globalThis.IntersectionObserver = ResizeObserverStub
window.scrollTo = () => {}

// Recharts measures text; jsdom returns zeroes, which is fine for a render check.
window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 200, height: 20 })
window.HTMLElement.prototype.scrollIntoView = () => {}

// React and the router are loaded natively and marked external, so the app
// modules Vite transforms share the exact same instances.
const EXTERNAL = ['react', 'react-dom', 'react-router-dom', 'react-router']

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
  ssr: { external: EXTERNAL, noExternal: [/^(?!react)/] },
})

const failures = []
let consoleErrors = []
const realError = console.error
const realWarn = console.warn
const IGNORED = [
  'React Router Future Flag Warning',
  'v7_startTransition',
  'v7_relativeSplatPath',
  'Not implemented: HTMLCanvasElement',
  'Could not parse CSS stylesheet',
]
const record = (kind) => (...args) => {
  const message = args.map((arg) => (arg instanceof Error ? arg.stack : String(arg))).join(' ')
  if (!IGNORED.some((pattern) => message.includes(pattern))) consoleErrors.push(`${kind}: ${message}`)
  realError(...args)
}

try {
  const [reactModule, clientModule, ReactRouter] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('react-router-dom'),
  ])
  const React = reactModule.default ?? reactModule
  const act = reactModule.act ?? React.act
  const { createRoot } = clientModule
  const routesModule = await vite.ssrLoadModule('/src/app/routes.jsx')
  const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.js')
  const usersModule = await vite.ssrLoadModule('/src/mocks/data/users.json')
  const users = usersModule.default ?? usersModule

  /** Sign in as the role that can actually reach `path`. */
  const signInFor = (path) => {
    const wanted = path.startsWith('/portal') ? 'CLIENT' : 'SUPER_ADMIN'
    const user = users.find((candidate) => candidate.role === wanted)
    useAuthStore.setState({
      user,
      role: user.role,
      token: 'mock.smoke.token',
      impersonatedRole: null,
    })
  }
  const { Providers } = await vite.ssrLoadModule('/src/app/Providers.jsx')
  const { createMemoryRouter, RouterProvider } = ReactRouter

  await checkConfig(vite)

  const explicit = process.argv.slice(2)
  const paths = explicit.length > 0 ? explicit : collectPaths(routesModule.routes)

  console.log(`\nSmoke-testing ${paths.length} routes…\n`)

  for (const path of paths) {
    consoleErrors = []
    console.error = record('error')
    console.warn = record('warn')
    signInFor(path)
    const container = window.document.createElement('div')
    window.document.body.appendChild(container)
    let root
    try {
      const router = createMemoryRouter(routesModule.routes, { initialEntries: [path] })
      await act(async () => {
        root = createRoot(container)
        root.render(React.createElement(Providers, null, React.createElement(RouterProvider, { router })))
      })
      // let mock service delays (300–600ms) resolve
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 900))
      })
      const text = container.textContent ?? ''
      if (text.trim().length === 0) consoleErrors.push('rendered nothing')
    } catch (error) {
      consoleErrors.push(`threw: ${error?.stack ?? error}`)
    } finally {
      if (root) await act(async () => root.unmount())
      container.remove()
      console.error = realError
      console.warn = realWarn
    }

    if (consoleErrors.length > 0) {
      failures.push({ path, errors: [...new Set(consoleErrors)] })
      console.log(`  ✗ ${path}`)
    } else {
      console.log(`  ✓ ${path}`)
    }
  }
} finally {
  await vite.close()
}

if (failures.length > 0) {
  console.log(`\n${failures.length} route(s) failed:\n`)
  for (const failure of failures) {
    console.log(`${failure.path}`)
    for (const error of failure.errors) console.log(`   ${error.split('\n').slice(0, 6).join('\n   ')}`)
    console.log('')
  }
  process.exit(1)
}

console.log('\nAll routes rendered cleanly.\n')
process.exit(0)

/**
 * Assert that navigation, roles and the permission matrix agree with each other.
 * A typo in a module key would otherwise silently hide a whole section of the app.
 * @param {import('vite').ViteDevServer} vite
 */
async function checkConfig(vite) {
  const { navigation, portalNavigation } = await vite.ssrLoadModule('/src/config/navigation.js')
  const { roles } = await vite.ssrLoadModule('/src/config/roles.js')
  const { MODULES, MODULE_LABELS, permissions, filterNavigation, can } =
    await vite.ssrLoadModule('/src/config/permissions.js')

  const problems = []
  const known = new Set(MODULES)

  for (const group of [...navigation, ...portalNavigation]) {
    if (!known.has(group.module)) problems.push(`navigation group "${group.label}" uses unknown module "${group.module}"`)
    for (const child of group.children ?? []) {
      if (!known.has(child.module)) problems.push(`nav item "${child.label}" uses unknown module "${child.module}"`)
    }
  }
  for (const module of MODULES) {
    if (!MODULE_LABELS[module]) problems.push(`module "${module}" has no label`)
  }
  for (const role of roles) {
    const grants = permissions[role.id]
    if (!grants) {
      problems.push(`role "${role.id}" has no permissions entry`)
      continue
    }
    for (const module of Object.keys(grants)) {
      if (!known.has(module)) problems.push(`role "${role.id}" grants unknown module "${module}"`)
    }
    const visible = filterNavigation(navigation, role.id)
    if (role.id === 'CLIENT') {
      if (visible.length > 0) problems.push('CLIENT should see no internal navigation')
      if (!can(role.id, 'portal')) problems.push('CLIENT cannot view the portal')
    } else if (visible.length === 0) {
      problems.push(`role "${role.id}" sees an empty sidebar`)
    }
  }

  if (problems.length > 0) {
    console.log('\nConfig problems:\n')
    for (const problem of problems) console.log(`  ✗ ${problem}`)
    console.log('')
    process.exitCode = 1
    throw new Error('config check failed')
  }
  console.log(`Config check: ${roles.length} roles × ${MODULES.length} modules consistent.`)
}

/**
 * Flatten the route tree into concrete paths, substituting demo ids for params.
 * @param {Array<object>} routes
 * @param {string} prefix
 * @returns {string[]}
 */
function collectPaths(routes, prefix = '') {
  const out = []
  for (const route of routes) {
    if (route.path === '*') continue
    const segment = route.path ?? ''
    const base = segment.startsWith('/')
      ? segment
      : `${prefix}/${segment}`.replace(/\/{2,}/g, '/')
    const full = normalize(base.replace(/:(\w+)/g, (_, name) => `demo-${name}`))
    if (route.index) out.push(normalize(prefix))
    if (route.element && !route.children && !route.index) out.push(full)
    if (route.children) out.push(...collectPaths(route.children, full))
  }
  return [...new Set(out)]
}

/** @param {string} path */
function normalize(path) {
  const trimmed = path.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed || '/' : `/${trimmed}`
}
