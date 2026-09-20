/**
 * Route smoke test.
 *
 * Mounts every route from src/app/routes.jsx in a jsdom document through Vite's
 * SSR module loader, and fails if any route throws or logs a console error.
 * Run with `npm run smoke` (optionally passing paths to check a subset).
 */
import { loadReact, setupDom, setupVite } from './test-env.mjs'

const { window } = setupDom()
const vite = await setupVite()

/**
 * Substrings that must appear once a route has finished loading. Without these
 * a page that renders a permanent skeleton, or loads zero rows, still "passes".
 * Extended as each phase lands.
 */
const EXPECTATIONS = {
  '/': ['ApparelFlow', 'enquiry'],
  '/login': ['Sign in', 'Quick login', 'Merchandiser'],
  '/forgot-password': ['Reset your password'],
  '/403': ['403'],
  '/app/ui-kit': ['UI kit', 'Design tokens'],
  '/app/masters/company': ['ApparelFlow Sourcing', 'Tiruppur'],
  '/app/masters/clients': ['Northwind Apparel', 'Maison Rue'],
  '/app/masters/vendors': ['Coimbatore Spinning Mills', 'Fabric mill'],
  '/app/masters/fabrics': ['Single jersey 180 GSM', 'combed cotton'],
  '/app/masters/trims': ['Main label'],
  '/app/masters/colors': ['Navy Blazer', 'TCX'],
  '/app/masters/size-sets': ['Adult standard'],
  '/app/masters/uom': ['Kilogram'],
  '/app/masters/currencies': ['Indian Rupee'],
  '/app/masters/ports': ['Chennai'],
  '/app/masters/incoterms': ['Free on Board'],
  '/app/masters/payment-terms': ['Telegraphic transfer'],
  '/app/masters/stages': ['Final inspection'],
  '/app/masters/qc-checklists': ['final inspection', 'points'],
  '/app/masters/categories': ['Knit tops'],
  '/app/logistics/shipments': ['SHP-96', 'Freight spend', 'Cartons shipped'],
  '/app/logistics/documents': ['Commercial invoice', 'Export documents'],
  '/app/logistics/tracking': ['Shipment tracking', 'transit'],
  '/app/client-updates': ['Client updates', 'Acknowledged', 'Production'],
  '/app/finance/invoices': ['INV-2026', 'Receivables aging', 'Outstanding'],
  '/app/finance/bills': ['BIL-2026', 'Payables', 'Outstanding'],
  '/app/finance/payments': ['Net position', 'Received'],
  '/app/finance/expenses': ['EXP-44', 'Billable to clients'],
  '/app/finance/order-pnl': ['Margin by order', 'Blended margin', 'CMT'],
  '/app/sourcing/vendors': ['Coimbatore Spinning Mills', 'Average on-time', 'Fabric mill'],
  '/app/sourcing/rfq': ['RFQ-61', 'Awaiting quotes'],
  '/app/sourcing/quote-comparison': ['Pick an RFQ'],
  '/app/sourcing/material-po': ['MPO-71', 'Committed'],
  '/app/sourcing/grn': ['GRN-81', '4-point'],
  '/app/production/allocation': ['Factory load', 'Daily capacity'],
  '/app/production/tracker': ['Stage tracker', 'Overall completion', 'Stitching'],
  '/app/production/daily-output': ['Output against target', 'Efficiency'],
  '/app/production/gantt': ['Production timeline', 'Today'],
  '/app/quality/inspections': ['QC-91', 'Pass rate', 'Ac / Re'],
  '/app/quality/defects': ['Top defect types', 'Units affected'],
  '/app/orders': ['PO-10', 'Order book', 'Orders by lifecycle stage'],
  '/app/orders/new': ['Client & style', 'Size matrix', 'Continue'],
  '/app/orders/ORD-019': ['PO-1019', 'Style & size matrix', 'T&A', 'Ex-factory'],
  '/app/crm/leads': ['Copper Row Supply', 'Pipeline value', 'Qualified'],
  '/app/crm/clients': ['Northwind Apparel', 'Order book', 'Verde Kids'],
  '/app/crm/enquiries': ['ENQ-26', 'Indicative value'],
  '/app/design/requests': ['DR-14', 'Design requests'],
  '/app/design/tech-packs': ['Tech packs', 'POMs'],
  '/app/design/samples': ['SM-32', 'Awaiting decision', 'Proto'],
  '/app/costing/cost-sheets': ['CS-41', 'Average margin', 'FOB / pc'],
  '/app/costing/quotations': ['QT-52', 'Accepted value'],
  '/app/admin/users': ['admin@apparelflow.com', 'SUPER_ADMIN'],
  '/app/admin/roles': ['Roles & permissions', 'Merchandiser'],
  '/app/admin/audit-log': ['Audit log'],
  '/app/admin/settings': ['Commercial defaults', 'Demo data'],
}

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
  const { React, act, createRoot, createMemoryRouter, RouterProvider } = await loadReact()
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

  await checkConfig(vite)

  const explicit = process.argv.slice(2)
  const paths = explicit.length > 0 ? explicit : expandParams(collectPaths(routesModule.routes))

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
      if (text.trim().length === 0) {
        consoleErrors.push('rendered nothing')
      } else {
        for (const expected of EXPECTATIONS[path] ?? []) {
          if (!text.toLowerCase().includes(expected.toLowerCase())) {
            consoleErrors.push(`expected content missing: "${expected}"`)
          }
        }
      }
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
 * Replace the generic `demo-<param>` placeholders with real ids from the seed,
 * and fan the masters route out across every configured entity.
 * @param {string[]} paths
 */
function expandParams(paths) {
  const MASTERS = ['company', 'clients', 'vendors', 'categories', 'fabrics', 'trims', 'colors',
    'size-sets', 'uom', 'currencies', 'ports', 'incoterms', 'payment-terms', 'stages', 'qc-checklists']
  const out = []
  for (const path of paths) {
    if (path === '/app/masters/demo-entity') {
      out.push(...MASTERS.map((entity) => `/app/masters/${entity}`))
    } else if (path.includes('demo-id')) {
      out.push(path.replace('demo-id', 'ORD-019'))
    } else {
      out.push(path)
    }
  }
  return [...new Set(out)]
}

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
