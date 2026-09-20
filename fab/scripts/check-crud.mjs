/**
 * CRUD interaction check.
 *
 * Drives the real masters screen in jsdom — open the drawer, submit an invalid
 * value, see the zod error, fix it, save, and confirm the row appears in the
 * DataTable. RecordDrawer + FormFields + DataTable back most screens in the app,
 * so this one path covers a lot. Run with `npm run crud`.
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
globalThis.localStorage = window.localStorage
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })
for (const key of ['HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent', 'HTMLInputElement']) {
  globalThis[key] = window[key]
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window)
globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0)
globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle)
globalThis.IS_REACT_ACT_ENVIRONMENT = true
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = Observer
globalThis.IntersectionObserver = Observer
window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
  ssr: { external: ['react', 'react-dom', 'react-router-dom', 'react-router'], noExternal: [/^(?!react)/] },
})

const failures = []
const check = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    failures.push(label)
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

try {
  const React = (await import('react')).default
  const { act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { createMemoryRouter, RouterProvider } = await import('react-router-dom')
  const { routes } = await vite.ssrLoadModule('/src/app/routes.jsx')
  const { Providers } = await vite.ssrLoadModule('/src/app/Providers.jsx')
  const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.js')
  const { resetDemoData } = await vite.ssrLoadModule('/src/mocks/db.js')
  const users = (await vite.ssrLoadModule('/src/mocks/data/users.json')).default

  resetDemoData()
  const admin = users.find((user) => user.role === 'SUPER_ADMIN')
  useAuthStore.setState({ user: admin, role: admin.role, token: 'tok', impersonatedRole: null })

  const container = window.document.getElementById('root')
  const router = createMemoryRouter(routes, { initialEntries: ['/app/masters/colors'] })
  let root
  await act(async () => {
    root = createRoot(container)
    root.render(React.createElement(Providers, null, React.createElement(RouterProvider, { router })))
  })
  const settle = async (ms = 900) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms))
    })
  }
  await settle()

  const body = () => window.document.body
  const textOf = () => body().textContent ?? ''
  const findByText = (selector, text) =>
    [...body().querySelectorAll(selector)].find((node) =>
      (node.textContent ?? '').toLowerCase().includes(text.toLowerCase()),
    )
  const click = async (node) => {
    await act(async () => {
      node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
    })
  }
  const setInput = async (node, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    await act(async () => {
      setter.call(node, value)
      node.dispatchEvent(new window.Event('input', { bubbles: true }))
      node.dispatchEvent(new window.Event('change', { bubbles: true }))
    })
  }
  const labelled = (label) => {
    const node = [...body().querySelectorAll('label')].find(
      (entry) => (entry.textContent ?? '').trim().replace('*', '') === label,
    )
    return node ? window.document.getElementById(node.getAttribute('for')) : null
  }

  check('masters list renders seeded rows', textOf().includes('Navy Blazer'))

  const newButton = findByText('button', 'New colour')
  check('create button is present for an admin', Boolean(newButton))
  await click(newButton)
  await settle(200)
  check('drawer opens', Boolean(body().querySelector('[role="dialog"]')))

  const nameInput = labelled('Colour name')
  const hexInput = labelled('Hex')
  check('form fields render from the config', Boolean(nameInput && hexInput))

  // Invalid hex must be rejected by the zod schema before anything is saved.
  await setInput(nameInput, 'Signal Teal')
  await setInput(hexInput, 'teal')
  await click(findByText('button', 'Create colour'))
  await settle(300)
  check('zod rejects an invalid hex', textOf().includes('6-digit hex'))
  check('drawer stays open on a validation error', Boolean(body().querySelector('[role="dialog"]')))

  await setInput(hexInput, '#0E7490')
  await click(findByText('button', 'Create colour'))
  await settle(2600)
  check('drawer closes after a valid save', !body().querySelector('[role="dialog"]'))
  check('new row appears in the table', textOf().includes('Signal Teal'))
  check('a toast confirms the save', textOf().includes('Colour created'))

  // Editing: reopen the row and rename it.
  const row = [...body().querySelectorAll('tbody tr')].find((entry) =>
    (entry.textContent ?? '').includes('Signal Teal'),
  )
  if (!row) throw new Error('the created row never reached the table')
  await click(row)
  await settle(300)
  const editName = labelled('Colour name')
  check('row click opens the edit drawer prefilled', editName?.value === 'Signal Teal', editName?.value)
  await setInput(editName, 'Signal Teal Deep')
  await click(findByText('button', 'Save changes'))
  await settle(2600)
  check('edit persists to the list', textOf().includes('Signal Teal Deep'))

  resetDemoData()
  await act(async () => root.unmount())
} finally {
  await vite.close()
}

if (failures.length > 0) {
  console.log(`\n${failures.length} CRUD check(s) failed.\n`)
  process.exit(1)
}
console.log('\nCRUD interaction path holds.\n')
