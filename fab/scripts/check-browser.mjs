/**
 * Real-browser check.
 *
 * jsdom has no layout engine and does not run the production transform, so it
 * cannot see a collapsed grid, an element overflowing the viewport, or a
 * component the React Compiler mis-compiles. This drives a real Chromium against
 * the dev server and reports:
 *
 *   - uncaught errors and console errors
 *   - failed network requests
 *   - a page that renders nothing
 *   - horizontal overflow at phone width
 *   - elements wider than the viewport
 *   - sidebar scrolling and accordion behaviour
 *
 * Run with `npm run browser` (add `--mobile` for the 390px pass).
 */
import { createServer } from 'vite'
import { chromium } from 'playwright'

const MOBILE = process.argv.includes('--mobile')
const VIEWPORT = MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 }

const PUBLIC_PATHS = [
  '/', '/about', '/services', '/capabilities', '/clients', '/sustainability', '/contact',
  '/login', '/forgot-password', '/403',
]

const APP_PATHS = [
  '/app/dashboard', '/app/ui-kit',
  '/app/crm/leads', '/app/crm/clients', '/app/crm/enquiries',
  '/app/design/requests', '/app/design/tech-packs', '/app/design/samples',
  '/app/costing/cost-sheets', '/app/costing/quotations',
  '/app/orders', '/app/orders/new', '/app/orders/ORD-019',
  '/app/sourcing/vendors', '/app/sourcing/rfq', '/app/sourcing/quote-comparison',
  '/app/sourcing/material-po', '/app/sourcing/grn',
  '/app/production/allocation', '/app/production/tracker',
  '/app/production/daily-output', '/app/production/gantt',
  '/app/quality/inspections', '/app/quality/defects',
  '/app/logistics/shipments', '/app/logistics/documents', '/app/logistics/tracking',
  '/app/client-updates',
  '/app/finance/invoices', '/app/finance/bills', '/app/finance/payments',
  '/app/finance/expenses', '/app/finance/order-pnl',
  '/app/hr/employees', '/app/hr/departments', '/app/hr/attendance',
  '/app/hr/leave', '/app/hr/payroll',
  '/app/reports',
  '/app/masters/company', '/app/masters/clients', '/app/masters/vendors',
  '/app/masters/categories', '/app/masters/fabrics', '/app/masters/trims',
  '/app/masters/colors', '/app/masters/size-sets', '/app/masters/uom',
  '/app/masters/currencies', '/app/masters/ports', '/app/masters/incoterms',
  '/app/masters/payment-terms', '/app/masters/stages', '/app/masters/qc-checklists',
  '/app/admin/users', '/app/admin/roles', '/app/admin/audit-log', '/app/admin/settings',
]

const PORTAL_PATHS = ['/portal/orders', '/portal/orders/ORD-017', '/portal/approvals', '/portal/shipments']

/** Console noise that is not a defect. */
const IGNORED = [
  'React Router Future Flag Warning',
  'v7_startTransition',
  'v7_relativeSplatPath',
  'Download the React DevTools',
  'favicon',
]

const server = await createServer({
  server: { port: 5178, strictPort: true },
  logLevel: 'error',
})
await server.listen()
const base = `http://localhost:5178`

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: VIEWPORT })
const page = await context.newPage()

const findings = []
let current = []

page.on('pageerror', (error) => current.push(`uncaught: ${error.message}`))
page.on('console', (message) => {
  if (message.type() !== 'error') return
  const text = message.text()
  if (!IGNORED.some((pattern) => text.includes(pattern))) current.push(`console: ${text.slice(0, 300)}`)
})
page.on('requestfailed', (request) => {
  const url = request.url()
  if (IGNORED.some((pattern) => url.includes(pattern))) return
  current.push(`request failed: ${url.replace(base, '')}`)
})

/**
 * Sign in by seeding the auth store's persisted state before the app boots.
 * @param {string} role
 */
async function signInAs(role) {
  // The auth store reads localStorage on boot, so write the shape it persists.
  await page.addInitScript((roleId) => {
    const byRole = {
      SUPER_ADMIN: { id: 'USR-001', name: 'Arjun Mehta', email: 'admin@apparelflow.com', clientId: null },
      CLIENT: { id: 'USR-011', name: 'Ellie Brandt', email: 'buyer@northwindapparel.com', clientId: 'CLI-001' },
    }
    const user = byRole[roleId]
    if (!user) {
      localStorage.removeItem('apparelflow-auth')
      return
    }
    localStorage.setItem(
      'apparelflow-auth',
      JSON.stringify({
        state: { user: { ...user, role: roleId, active: true }, role: roleId, token: 'browser-check', impersonatedRole: null },
        version: 0,
      }),
    )
  }, role)
}

/**
 * @param {string} path
 * @param {string} label
 */
async function visit(path, label) {
  current = []
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })

  // Wait for the page to settle: content present and no skeleton left.
  await page
    .waitForFunction(
      () => {
        const root = document.getElementById('root')
        const text = root?.innerText ?? ''
        // A heading means the page itself rendered; the 403 page is short but valid.
        return (
          root?.querySelector('h1, h2') !== null &&
          text.trim().length > 60 &&
          !text.includes('Loading…')
        )
      },
      { timeout: 8000 },
    )
    .catch(() => current.push('never finished loading'))

  const diagnostics = await page.evaluate(() => {
    const problems = []
    const root = document.getElementById('root')
    const text = root?.innerText ?? ''

    if (text.trim().length < 80) problems.push(`nearly empty page (${text.trim().length} chars)`)
    if (text.includes('Something went wrong')) problems.push('route error boundary rendered')
    if (/Couldn.t (load|calculate)/.test(text)) problems.push('ErrorState rendered')

    // Horizontal overflow: the page should never scroll sideways.
    const docWidth = document.documentElement.scrollWidth
    const viewWidth = document.documentElement.clientWidth
    if (docWidth > viewWidth + 1) {
      // Find what is sticking out, ignoring anything inside a deliberate scroller.
      const culprits = []
      for (const node of document.querySelectorAll('body *')) {
        const rect = node.getBoundingClientRect()
        if (rect.width === 0 || rect.right <= viewWidth + 1) continue
        const scroller = node.closest('.overflow-x-auto, .overflow-auto, .overflow-x-scroll')
        if (scroller) continue
        culprits.push(
          `${node.tagName.toLowerCase()}.${String(node.className).split(' ').slice(0, 3).join('.')} → ${Math.round(rect.right)}px`,
        )
        if (culprits.length >= 3) break
      }
      problems.push(`horizontal overflow ${docWidth}px > ${viewWidth}px${culprits.length ? ` — ${culprits.join('; ')}` : ''}`)
    }

    // A sidebar that cannot scroll leaves its lower items unreachable.
    const nav = document.querySelector('aside nav')
    if (nav && nav.scrollHeight > nav.clientHeight + 2) {
      const style = getComputedStyle(nav)
      if (!['auto', 'scroll'].includes(style.overflowY)) {
        problems.push('sidebar nav overflows but does not scroll')
      }
    }

    return problems
  })

  const problems = [...current, ...diagnostics]
  if (problems.length > 0) {
    findings.push({ path, label, problems: [...new Set(problems)] })
    console.log(`  ✗ ${path}`)
    for (const problem of problems.slice(0, 3)) console.log(`      ${problem}`)
  } else {
    console.log(`  ✓ ${path}`)
  }
}

/** The sidebar is the one piece of chrome on every internal page. */
async function checkSidebar() {
  console.log('--- sidebar ---')
  const problems = []
  await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('aside nav', { timeout: 8000 })

  if (MOBILE) {
    // The sidebar is a drawer under lg; open it first.
    await page.click('button[aria-label="Open navigation"]')
    await page.waitForTimeout(350)
  }

  // Expand every group we can, then confirm only one stays open and the nav scrolls.
  const groupButtons = await page.$$('aside nav button[aria-expanded]')
  if (groupButtons.length < 3) problems.push(`expected several nav groups, found ${groupButtons.length}`)

  for (const button of groupButtons) {
    await button.click()
    await page.waitForTimeout(60)
  }

  const state = await page.evaluate(() => {
    const nav = document.querySelector('aside nav')
    const aside = document.querySelector('aside')
    const expanded = [...nav.querySelectorAll('button[aria-expanded="true"]')].map((b) => b.innerText.trim())
    const style = getComputedStyle(nav)
    return {
      expandedCount: expanded.length,
      expanded,
      overflowY: style.overflowY,
      navScrolls: nav.scrollHeight > nav.clientHeight,
      navClientHeight: nav.clientHeight,
      asideHeight: Math.round(aside.getBoundingClientRect().height),
      viewportHeight: window.innerHeight,
    }
  })

  if (state.expandedCount > 1) {
    problems.push(`${state.expandedCount} nav groups open at once (${state.expanded.join(', ')}) — expected 1`)
  }
  if (!['auto', 'scroll'].includes(state.overflowY)) {
    problems.push(`sidebar nav overflowY is "${state.overflowY}" — it cannot scroll`)
  }
  if (state.asideHeight > state.viewportHeight + 1) {
    problems.push(`sidebar is ${state.asideHeight}px tall in a ${state.viewportHeight}px viewport — it should scroll internally`)
  }

  // Clicking the open group should close it, leaving none open.
  const openButton = await page.$('aside nav button[aria-expanded="true"]')
  if (openButton) {
    await openButton.click()
    await page.waitForTimeout(80)
    const stillOpen = await page.$$eval('aside nav button[aria-expanded="true"]', (nodes) => nodes.length)
    if (stillOpen !== 0) problems.push(`clicking the open group left ${stillOpen} open`)
  }

  if (problems.length > 0) {
    findings.push({ path: 'sidebar', label: 'chrome', problems })
    console.log('  ✗ sidebar')
    for (const problem of problems) console.log(`      ${problem}`)
  } else {
    console.log(`  ✓ sidebar (one group at a time, nav scrolls, ${state.asideHeight}px in ${state.viewportHeight}px)`)
  }
}

try {
  console.log(`\nChecking in Chromium at ${VIEWPORT.width}×${VIEWPORT.height}…\n`)

  console.log('--- public ---')
  await signInAs(null)
  for (const path of PUBLIC_PATHS) await visit(path, 'public')

  console.log('--- app (SUPER_ADMIN) ---')
  await signInAs('SUPER_ADMIN')
  for (const path of APP_PATHS) await visit(path, 'SUPER_ADMIN')

  await checkSidebar()

  console.log('--- portal (CLIENT) ---')
  await signInAs('CLIENT')
  for (const path of PORTAL_PATHS) await visit(path, 'CLIENT')
} finally {
  await browser.close()
  await server.close()
}

if (findings.length > 0) {
  console.log(`\n${findings.length} page(s) with problems:\n`)
  for (const finding of findings) {
    console.log(`${finding.path}  [${finding.label}]`)
    for (const problem of finding.problems) console.log(`   ${problem}`)
    console.log('')
  }
  process.exit(1)
}

console.log('\nBrowser check clean.\n')
