/**
 * Accessibility audit.
 *
 * Renders every route in jsdom — in dark mode — and checks the resulting DOM for
 * the mistakes a component library can actually make: controls with no
 * accessible name, inputs with no label, images with no alt text, duplicate ids,
 * skipped heading levels, and inline styles carrying a literal colour instead of
 * a theme token. Run with `npm run a11y`.
 */
import { loadReact, setupDom, setupVite } from './test-env.mjs'

const { window } = setupDom()
const vite = await setupVite()

/** Paths worth auditing — one representative route per layout and module. */
const PATHS = [
  '/',
  '/about',
  '/services',
  '/capabilities',
  '/clients',
  '/sustainability',
  '/contact',
  '/login',
  '/forgot-password',
  '/403',
  '/app/dashboard',
  '/app/ui-kit',
  '/app/orders',
  '/app/orders/ORD-019',
  '/app/orders/new',
  '/app/crm/leads',
  '/app/crm/clients',
  '/app/crm/enquiries',
  '/app/design/requests',
  '/app/design/tech-packs',
  '/app/design/samples',
  '/app/costing/cost-sheets',
  '/app/costing/quotations',
  '/app/sourcing/vendors',
  '/app/sourcing/rfq',
  '/app/sourcing/quote-comparison',
  '/app/sourcing/material-po',
  '/app/sourcing/grn',
  '/app/production/allocation',
  '/app/production/tracker',
  '/app/production/daily-output',
  '/app/production/gantt',
  '/app/quality/inspections',
  '/app/quality/defects',
  '/app/logistics/shipments',
  '/app/logistics/documents',
  '/app/logistics/tracking',
  '/app/client-updates',
  '/app/finance/invoices',
  '/app/finance/bills',
  '/app/finance/payments',
  '/app/finance/expenses',
  '/app/finance/order-pnl',
  '/app/hr/employees',
  '/app/hr/departments',
  '/app/hr/attendance',
  '/app/hr/leave',
  '/app/hr/payroll',
  '/app/reports',
  '/app/masters/fabrics',
  '/app/masters/colors',
  '/app/admin/users',
  '/app/admin/roles',
  '/app/admin/audit-log',
  '/app/admin/settings',
  '/portal/orders',
  '/portal/orders/ORD-017',
  '/portal/approvals',
  '/portal/shipments',
]

/**
 * The accessible name of an element, near enough for this audit.
 * @param {Element} node
 */
function accessibleName(node) {
  const aria = node.getAttribute('aria-label')
  if (aria?.trim()) return aria.trim()

  const labelledBy = node.getAttribute('aria-labelledby')
  if (labelledBy) {
    const target = node.ownerDocument.getElementById(labelledBy)
    if (target?.textContent?.trim()) return target.textContent.trim()
  }

  const title = node.getAttribute('title')
  if (title?.trim()) return title.trim()

  // Text content, ignoring anything explicitly hidden from assistive tech.
  const clone = node.cloneNode(true)
  for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return (clone.textContent ?? '').trim()
}

/**
 * @param {Element} root
 * @returns {string[]} problems found
 */
function audit(root) {
  const problems = []
  const document = root.ownerDocument

  for (const button of root.querySelectorAll('button')) {
    if (!accessibleName(button)) {
      problems.push(`<button> with no accessible name: ${button.outerHTML.slice(0, 90)}`)
    }
  }

  for (const link of root.querySelectorAll('a[href]')) {
    if (!accessibleName(link)) {
      problems.push(`<a> with no accessible name: ${link.outerHTML.slice(0, 90)}`)
    }
  }

  for (const input of root.querySelectorAll('input, select, textarea')) {
    if (input.type === 'hidden') continue
    const id = input.getAttribute('id')
    // jsdom has no global CSS.escape, and React's useId values contain colons.
    const hasLabel =
      id &&
      [...document.querySelectorAll('label[for]')].some(
        (label) => label.getAttribute('for') === id,
      )
    const wrapped = input.closest('label')
    if (!hasLabel && !wrapped && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      problems.push(`form control with no label: ${input.outerHTML.slice(0, 90)}`)
    }
  }

  for (const image of root.querySelectorAll('img')) {
    if (image.getAttribute('alt') === null) {
      problems.push(`<img> with no alt attribute: ${image.outerHTML.slice(0, 90)}`)
    }
  }

  const ids = new Map()
  for (const node of root.querySelectorAll('[id]')) {
    const id = node.getAttribute('id')
    ids.set(id, (ids.get(id) ?? 0) + 1)
  }
  for (const [id, count] of ids) {
    if (count > 1) problems.push(`duplicate id "${id}" used ${count} times`)
  }

  // Heading levels should not jump (h1 → h3).
  const levels = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((node) =>
    Number(node.tagName[1]),
  )
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] - levels[index - 1] > 1) {
      problems.push(`heading level jumps from h${levels[index - 1]} to h${levels[index]}`)
      break
    }
  }

  for (const table of root.querySelectorAll('table')) {
    if (table.querySelectorAll('th').length === 0) {
      problems.push('<table> with no header cells')
    }
  }

  // Inline colours must come from a theme token, or dark mode breaks. The one
  // legitimate exception is a colour swatch, which renders master data.
  for (const node of root.querySelectorAll('[style]')) {
    const style = node.getAttribute('style') ?? ''
    const literal = style.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/)
    if (!literal) continue
    const isSwatch =
      node.className.includes('rounded border border-border-strong') ||
      node.closest('[data-colour-swatch]') !== null
    if (!isSwatch) {
      problems.push(`inline literal colour "${literal[0]}" — use a theme token`)
    }
  }

  return problems
}

const failures = []

try {
  const { React, act, createRoot, createMemoryRouter, RouterProvider } = await loadReact()
  const { routes } = await vite.ssrLoadModule('/src/app/routes.jsx')
  const { Providers } = await vite.ssrLoadModule('/src/app/Providers.jsx')
  const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.js')
  const users = (await vite.ssrLoadModule('/src/mocks/data/users.json')).default

  // Audit in dark mode: it is the theme most likely to expose a hardcoded colour.
  window.document.documentElement.classList.add('dark')

  console.log(`\nAuditing ${PATHS.length} routes (dark mode)…\n`)

  for (const path of PATHS) {
    const wanted = path.startsWith('/portal') ? 'CLIENT' : 'SUPER_ADMIN'
    const user = users.find((candidate) => candidate.role === wanted)
    useAuthStore.setState({ user, role: user.role, token: 'tok', impersonatedRole: null })

    const container = window.document.createElement('div')
    window.document.body.appendChild(container)
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    let root
    await act(async () => {
      root = createRoot(container)
      root.render(
        React.createElement(Providers, null, React.createElement(RouterProvider, { router })),
      )
    })

    // Give the lazy chunk and the service call time to land.
    const deadline = Date.now() + 5000
    for (;;) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })
      const text = (container.textContent ?? '').trim()
      const loaded =
        text.length > 300 &&
        !text.includes('Loading') &&
        container.querySelectorAll('h1, h2, h3').length > 0
      if (loaded || Date.now() > deadline) break
    }

    const problems = audit(container)
    if (problems.length > 0) {
      failures.push({ path, problems: [...new Set(problems)] })
      console.log(`  ✗ ${path} — ${problems.length} issue(s)`)
    } else {
      console.log(`  ✓ ${path}`)
    }

    await act(async () => root.unmount())
    container.remove()
  }
} finally {
  await vite.close()
}

if (failures.length > 0) {
  console.log(`\n${failures.length} route(s) with accessibility issues:\n`)
  for (const failure of failures) {
    console.log(failure.path)
    for (const problem of failure.problems.slice(0, 6)) console.log(`   ${problem}`)
    if (failure.problems.length > 6) console.log(`   … and ${failure.problems.length - 6} more`)
    console.log('')
  }
  process.exit(1)
}

console.log('\nAccessibility and theme audit clean.\n')
