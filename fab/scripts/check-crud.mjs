/**
 * Interaction checks.
 *
 * Drives real screens in jsdom rather than calling services directly:
 *   1. Masters CRUD — open the drawer, hit a zod error, save, edit.
 *   2. Sample approval — reject without a comment, then with one.
 *   3. Order 360 — walk all eleven tabs and assert each one renders its data.
 *   4. Portal approval — a client approves a sample, and the internal Design
 *      module shows that same decision.
 *   5. Command palette — ⌘K opens it, typing filters, Enter navigates.
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

  /**
   * Poll until `predicate` holds. Pages now resolve a lazy chunk before their
   * 300–600 ms service call, so a fixed sleep is the wrong tool.
   */
  const waitFor = async (predicate, timeout = 8000) => {
    const deadline = Date.now() + timeout
    for (;;) {
      await settle(120)
      if (predicate()) return true
      if (Date.now() > deadline) return false
    }
  }

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

  await waitFor(() => textOf().includes('Navy Blazer'))
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
  await waitFor(() => !body().querySelector('[role="dialog"]') && textOf().includes('Signal Teal'))
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
  await waitFor(() => textOf().includes('Signal Teal Deep'))
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
  await waitFor(() => textOf().includes('Awaiting decision') && Boolean(body().querySelector('tbody tr')))
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
  // The toast fires before the list refetches, so wait for the row itself.
  await waitFor(
    () => !body().querySelector('[role="dialog"]') && textOf().includes('over tolerance'),
  )
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
  await waitFor(() => textOf().includes('PO-1019'))
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
    await waitFor(() =>
      expectations.every((expected) => textOf().toLowerCase().includes(expected.toLowerCase())),
      4000,
    )
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
  await waitFor(() => textOf().includes('Client & style'))
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
  await waitFor(() => textOf().includes('Smoke test tee'))
  check('created order opens its 360 page', textOf().includes('Smoke test tee'))

  await act(async () => wizardRoot.unmount())
  resetDemoData()

  // ------------------------------------ portal approval reaches the internal app
  console.log('')
  const clientUser = users.find((user) => user.role === 'CLIENT')
  useAuthStore.setState({
    user: clientUser,
    role: clientUser.role,
    token: 'tok',
    impersonatedRole: null,
  })

  const portalRouter = createMemoryRouter(routes, { initialEntries: ['/portal/approvals'] })
  let portalRoot
  await act(async () => {
    portalRoot = createRoot(container)
    portalRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: portalRouter })),
    )
  })
  await waitFor(() => textOf().includes('Sample approvals') && Boolean(findByText('button', 'Approve')))
  check('portal approvals page renders', textOf().includes('Sample approvals'))
  check('portal is scoped to the signed-in brand', !textOf().includes('Maison Rue'))

  const approveButton = findByText('button', 'Approve')
  check('a pending sample offers approval', Boolean(approveButton))

  // Capture which sample we are approving so we can find it internally after.
  const sampleCard = approveButton?.closest('div[class*="rounded-lg"]')
  const portalSampleRef = (sampleCard?.textContent ?? '').match(/SM-\d+/)?.[0] ?? null
  check('the sample has a reference', Boolean(portalSampleRef), String(portalSampleRef))

  await click(approveButton)
  await settle(250)
  check('approval modal opens', textOf().includes('Approve this sample'))

  await click(findByText('button', 'Approve sample'))
  await waitFor(() => textOf().includes('Sample approved'))
  check('approval confirms to the client', textOf().includes('Sample approved'))

  await act(async () => portalRoot.unmount())

  // Now look at the same record from the inside.
  const admin2 = users.find((user) => user.role === 'SUPER_ADMIN')
  useAuthStore.setState({ user: admin2, role: admin2.role, token: 'tok', impersonatedRole: null })

  const internalRouter = createMemoryRouter(routes, { initialEntries: ['/app/design/samples'] })
  let internalRoot
  await act(async () => {
    internalRoot = createRoot(container)
    internalRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: internalRouter })),
    )
  })
  await waitFor(() => Boolean(body().querySelector('tbody tr')))

  // 60 samples paginate, so search for the one we just decided on.
  const searchBox = [...body().querySelectorAll('input')].find(
    (node) => (node.getAttribute('aria-label') ?? '').startsWith('Search samples'),
  )
  check('the samples list has a search box', Boolean(searchBox))
  await setInput(searchBox, portalSampleRef)
  await settle(400)

  const internalRow = [...body().querySelectorAll('tbody tr')].find((row) =>
    (row.textContent ?? '').includes(portalSampleRef),
  )
  check('the internal samples list shows that sample', Boolean(internalRow), portalSampleRef)
  check(
    'the client decision is visible internally',
    (internalRow?.textContent ?? '').includes('Approved'),
    internalRow?.textContent?.slice(0, 120),
  )

  await act(async () => internalRoot.unmount())

  // ------------------------------------------------------------- ⌘K palette
  console.log('')
  const paletteRouter = createMemoryRouter(routes, { initialEntries: ['/app/dashboard'] })
  let paletteRoot
  await act(async () => {
    paletteRoot = createRoot(container)
    paletteRoot.render(
      React.createElement(Providers, null, React.createElement(RouterProvider, { router: paletteRouter })),
    )
  })
  await waitFor(() => textOf().includes('Executive dashboard'))

  // The shortcut is bound on document, so dispatch there.
  await act(async () => {
    window.document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    )
  })
  await waitFor(() => textOf().includes('Search orders, clients, vendors'))
  check('⌘K opens the command palette', textOf().includes('Search orders, clients, vendors'))

  const paletteInput = [...body().querySelectorAll('input')].find(
    (node) => node.getAttribute('aria-label') === 'Search',
  )
  check('the palette focuses its input', Boolean(paletteInput))

  await setInput(paletteInput, 'northwind')
  await settle(200)
  check('the palette searches across records', textOf().includes('Northwind Apparel'))

  await setInput(paletteInput, 'PO-1019')
  await settle(200)
  check('the palette finds an order by PO', textOf().includes('PO-1019'))

  await act(async () => {
    paletteInput.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  await waitFor(() => paletteRouter.state.location.pathname === '/app/orders/ORD-019')
  check(
    'Enter navigates to the selected record',
    paletteRouter.state.location.pathname === '/app/orders/ORD-019',
    paletteRouter.state.location.pathname,
  )

  await act(async () => paletteRoot.unmount())
  resetDemoData()
} finally {
  await vite.close()
}

if (failures.length > 0) {
  console.log(`\n${failures.length} CRUD check(s) failed.\n`)
  process.exit(1)
}
console.log('\nCRUD interaction path holds.\n')
