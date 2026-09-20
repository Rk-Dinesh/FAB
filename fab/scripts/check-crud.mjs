/**
 * Interaction checks.
 *
 * Drives real screens in jsdom rather than calling services directly:
 *   1. Masters CRUD — open the drawer, hit a zod error, save, edit.
 *   2. Sample approval — reject without a comment, then with one.
 *   3. Order 360 — walk all eleven tabs and assert each one renders its data.
 * RecordDrawer + FormFields + DataTable back most screens in the app, so these
 * paths cover a lot of shared surface. Run with `npm run crud`.
 */
import { loadReact, setupDom, setupVite } from './test-env.mjs'

const { window, container } = setupDom()
const vite = await setupVite()

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
  const { React, act, createRoot, createMemoryRouter, RouterProvider } = await loadReact()
  const { routes } = await vite.ssrLoadModule('/src/app/routes.jsx')
  const { Providers } = await vite.ssrLoadModule('/src/app/Providers.jsx')
  const { useAuthStore } = await vite.ssrLoadModule('/src/store/authStore.js')
  const { resetDemoData } = await vite.ssrLoadModule('/src/mocks/db.js')
  const users = (await vite.ssrLoadModule('/src/mocks/data/users.json')).default

  resetDemoData()
  const admin = users.find((user) => user.role === 'SUPER_ADMIN')
  useAuthStore.setState({ user: admin, role: admin.role, token: 'tok', impersonatedRole: null })

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

  // ---------------------------------------------------------------- samples
  console.log('')
  await act(async () => root.unmount())
  resetDemoData()

  const sampleRouter = createMemoryRouter(routes, { initialEntries: ['/app/design/samples'] })
  let sampleRoot
  await act(async () => {
    sampleRoot = createRoot(container)
    sampleRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: sampleRouter })),
    )
  })
  await settle(1200)

  check('samples list renders', textOf().includes('Awaiting decision'))

  const rejectButton = [...body().querySelectorAll('button')].find((node) =>
    (node.getAttribute('aria-label') ?? '').startsWith('Reject '),
  )
  check('pending samples expose approve/reject', Boolean(rejectButton))
  const sampleRef = rejectButton?.getAttribute('aria-label')?.replace('Reject ', '')

  await click(rejectButton)
  await settle(250)
  check('rejection modal opens', textOf().includes('Reject this sample'))

  // A rejection with no explanation must not go through.
  await click(findByText('button', 'Reject sample'))
  await settle(250)
  check('rejection requires a comment', textOf().includes('at least a sentence'))

  const commentBox = body().querySelector('[role="dialog"] textarea')
  const textareaSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value',
  ).set
  await act(async () => {
    textareaSetter.call(commentBox, 'Armhole is 1.2 cm over tolerance — correct the pattern and resubmit.')
    commentBox.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  await click(findByText('button', 'Reject sample'))
  await settle(2200)
  check('rejection closes the modal', !body().querySelector('[role="dialog"]'))
  check('rejection is recorded on the row', textOf().includes('over tolerance'))
  check('a toast confirms the rejection', textOf().includes('Sample rejected'))
  check('the rejected sample left the pending queue', Boolean(sampleRef) && !textOf().includes(`Reject ${sampleRef}`))

  await act(async () => sampleRoot.unmount())
  resetDemoData()

  // ------------------------------------------------------------- order 360
  console.log('')
  const orderRouter = createMemoryRouter(routes, { initialEntries: ['/app/orders/ORD-019'] })
  let orderRoot
  await act(async () => {
    orderRoot = createRoot(container)
    orderRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: orderRouter })),
    )
  })
  await settle(1400)

  check('order 360 header renders', textOf().includes('PO-1019') && textOf().includes('Ex-factory'))
  check('lifecycle stepper renders', textOf().includes('Production') && textOf().includes('Payment received'))

  // Each tab must render its own content, not a blank panel.
  const TAB_EXPECTATIONS = [
    ['Overview', ['Commercial', 'Needs attention', 'Incoterm']],
    ['Style & size matrix', ['Colour × size breakdown', 'Size curve']],
    ['T&A', ['Time & action calendar', 'Milestone', 'Variance']],
    ['Samples', ['Development stages', 'Proto']],
    ['Sourcing', ['Material position', 'Committed']],
    ['Production', ['Stage progress', 'Stitching']],
    ['QC', ['Quality', 'inspection']],
    ['Shipment', ['Shipment']],
    ['Finance', ['Order P&L', 'Gross margin']],
    ['Documents', ['Documents']],
    ['Activity', ['Activity']],
  ]

  for (const [tabLabel, expectations] of TAB_EXPECTATIONS) {
    const tabButton = [...body().querySelectorAll('[role="tab"]')].find((node) =>
      (node.textContent ?? '').startsWith(tabLabel),
    )
    if (!tabButton) {
      check(`tab "${tabLabel}" exists`, false)
      continue
    }
    await click(tabButton)
    await settle(700)
    const text = textOf()
    const missing = expectations.filter(
      (expected) => !text.toLowerCase().includes(expected.toLowerCase()),
    )
    check(`tab "${tabLabel}" renders its content`, missing.length === 0, missing.join(', '))
  }

  await act(async () => orderRoot.unmount())

  // ------------------------------------------------------------ order wizard
  console.log('')
  const wizardRouter = createMemoryRouter(routes, { initialEntries: ['/app/orders/new'] })
  let wizardRoot
  await act(async () => {
    wizardRoot = createRoot(container)
    wizardRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: wizardRouter })),
    )
  })
  await settle(1200)

  check('wizard starts on step 1', textOf().includes('Client & style'))

  // Continuing with nothing filled in must surface validation, not advance.
  await click(findByText('button', 'Continue'))
  await settle(250)
  check('wizard blocks an empty step 1', textOf().includes('Pick the client this order is for'))

  const selectSetter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    'value',
  ).set
  const setSelect = async (label, value) => {
    const node = labelled(label)
    await act(async () => {
      selectSetter.call(node, value)
      node.dispatchEvent(new window.Event('change', { bubbles: true }))
    })
  }

  await setSelect('Client', 'CLI-001')
  await setInput(labelled('Style name'), 'Smoke test tee')
  await setInput(labelled('Style number'), 'ST-0001')
  await setSelect('Merchandiser', 'EMP-005')
  await click(findByText('button', 'Continue'))
  await settle(300)
  check('wizard advances to the size matrix', textOf().includes('Add a colour'))

  await click(findByText('button', 'Continue'))
  await settle(250)
  check('wizard requires at least one colour', textOf().includes('Add at least one colour'))

  await setSelect('Add a colour', 'COL-004')
  await settle(250)
  const firstCell = body().querySelector('tbody input[type="number"]')
  await setInput(firstCell, '1200')
  await settle(200)
  check('size matrix totals the grid', textOf().includes('1,200'))

  await click(findByText('button', 'Continue'))
  await settle(300)
  check('wizard reaches dates', textOf().includes('Ex-factory date'))
  await click(findByText('button', 'Continue'))
  await settle(300)
  check('wizard reaches pricing', textOf().includes('Margin %'))
  await click(findByText('button', 'Continue'))
  await settle(300)
  check('wizard reaches review', textOf().includes('Lead time'))
  check('review warns about the unallocated factory', textOf().includes('No factory allocated'))

  await click(findByText('button', 'Create order'))
  await settle(2600)
  check('created order opens its 360 page', textOf().includes('Smoke test tee'))

  await act(async () => wizardRoot.unmount())
  resetDemoData()
} finally {
  await vite.close()
}

if (failures.length > 0) {
  console.log(`\n${failures.length} CRUD check(s) failed.\n`)
  process.exit(1)
}
console.log('\nCRUD interaction path holds.\n')
