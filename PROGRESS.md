# PROGRESS.md — ApparelFlow ERP mock frontend

Legend: ✅ done · 🔄 in progress · ⬜ not started · ⚠️ issue

---

## Phase 1: Foundation ✅
- ✅ Vite + React + JS scaffold, all dependencies installed (pinned TanStack Table v8
  and React Router v6 per the spec)
- ✅ Tailwind v4 (@tailwindcss/vite) + semantic CSS variable tokens (light + dark),
  mapped into Tailwind via `@theme inline`
- ✅ Theme light/dark/system, no flash (pre-paint inline script), persisted in
  localStorage, OS changes tracked
- ✅ `cn()` util, format utils (currency/date/percent/initials), 6 shared hooks
  (click-outside, escape, focus trap, body-scroll lock, media query, debounce)
- ✅ UI primitives: Button, Input, Select, Textarea, Checkbox, Switch, Badge, Card,
  Tabs, Modal (+ConfirmModal), Drawer, Dropdown, Tooltip, Avatar, Skeleton
  (+SkeletonTable/Cards), Toast (+Toaster), Stepper, Progress (+ProgressRing),
  EmptyState, Spinner
- ✅ Shared: Logo, ThemeToggle, Sidebar, Topbar, Breadcrumbs, PageHeader
- ✅ Layouts: PublicLayout, AuthLayout, AppLayout, ClientPortalLayout
- ✅ Router (createBrowserRouter over an exported `routes` array), RouteError,
  403/404 pages, `/app/ui-kit` demo page
- ✅ Build tooling: `npm run smoke` (mounts every route in jsdom, fails on console
  errors) and `npm run audit` (rejects hardcoded hex / stock Tailwind palette
  classes so dark mode can't silently break). `npm run gate` runs the whole gate.
- ✅ Quality gate: lint 0, audit clean (60 files), build 0 errors, 17/17 routes
  render cleanly, dev server serves both token sets

## Phase 2: Auth + RBAC ✅
- ✅ Mock login: email/password (react-hook-form + zod) plus 11 "quick login as"
  role cards; 12 seeded users in `mocks/data/users.json`, password `demo123`
- ✅ Zustand auth store persisted in localStorage as `{user, role, token}`; the
  password never reaches app state
- ✅ `config/roles.js` (11 roles with labels, descriptions and per-role home) and
  `config/permissions.js` (role → module → actions, 16 modules × 5 actions)
- ✅ `can()` helper, `useCan()` hook and the `<Can>` component
- ✅ `ProtectedRoute`: requires a session, checks the module permission, keeps
  CLIENT inside `/portal` and staff out of it
- ✅ Sidebar generated from `config/navigation.js`, filtered by permission
- ✅ Topbar: ⌘K search trigger, notifications (store + slide-over panel with unread
  badge), theme toggle, dev role switcher, profile menu with sign out
- ✅ Breadcrumbs (in PageHeader), 403, 404 and forgot-password pages
- ✅ Full route tree behind guards (61 routes)
- ✅ Quality gate: lint 0, audit clean (72 files), build 0 errors, config check
  (11 roles × 16 modules consistent), 61/61 routes render, 9/9 RBAC redirects correct

## Phase 3: Mock data layer ✅
- ✅ 46 seed collections / 3,182 records in `src/mocks/data`, generated deterministically
  by `npm run seed` from `scripts/seed/*` — 6 clients, 25 vendors, 30 orders across all
  15 statuses (8 delayed), 60 samples, 42 invoices + 28 bills, 45 employees, 12 users
- ✅ All foreign keys resolve — enforced by `npm run check-seed`, which also pins the
  CLAUDE.md volume contract
- ✅ `config/statuses.js`: lifecycle flow, production stages, stage/sample/approval/
  risk/lead/invoice/PO/shipment/inspection registries, `statusMeta()` lookup
- ✅ `src/mocks/db.js`: loads the seed, shifts every ISO date forward in whole weeks so
  the demo never goes stale, persists session edits to localStorage, `resetDemoData()`
- ✅ `createService()` factory: getAll (search + filters + sort + pagination), getById,
  list, create, update, remove, peek — each with a 300–600 ms delay
- ✅ 13 module services with domain helpers: `getOrder360`, `buildSizeMatrix`,
  `calculateFob`, `aqlPlan` (real AQL 2.5 table), `getStageTracker`, `getDelayAlerts`,
  `getQuoteComparison`, `getReceivablesAging`, `getOrderPnl`, `getAttendanceMonth`, …
- ✅ `useAsync` hook — the single loading/error contract every screen will use
- ✅ "Reset demo data" in the profile menu
- ✅ Quality gate: lint 0, audit clean (90 files), seed check clean, build 0 errors,
  61/61 routes render, 9/9 RBAC redirects, 30/30 service contract checks

## Phase 4: Masters + Admin ✅
- ✅ `DataTable` on TanStack Table v8: column sorting, global search, pagination
  (10/25/50/100), row selection with a bulk-action banner, column visibility menu,
  CSV export (selection-aware), row click, dense mode, and built-in
  loading / empty / error states
- ✅ `FilterBar` (select / text / date / date-range filters with a clear-all),
  `PageHeader` with breadcrumbs, `StatusBadge` reading from config/statuses.js
- ✅ `FormFields` + `RecordDrawer`: config-driven react-hook-form + zod forms in a
  right-side drawer, supporting text/number/email/date/select/textarea/switch/
  checkbox/tags fields
- ✅ `MastersCRUD`: one component driving all 15 master screens from
  `features/masters/config.jsx` (columns + zod schema + field list per entity)
- ✅ Masters: company, clients, vendors, categories, fabrics, trims, colours,
  size sets, UOM, currencies, ports, incoterms, payment terms, stages, QC checklists
- ✅ Admin: users (with activate/deactivate), roles with a live editable 16×5
  permission matrix, filterable audit log, settings (commercial defaults,
  operations thresholds, notification toggles, reset demo data)
- ✅ Every mutation writes to the audit log, fire-and-forget so it adds no latency
- ✅ Quality gate: lint 0 errors, audit clean (107 files), seed clean, build clean,
  96/96 routes render *with their seeded content asserted*, 9/9 RBAC redirects,
  30/30 service checks, 11/11 CRUD interaction checks

## Phase 5: CRM, Design, Costing ✅
- ✅ Leads: dnd-kit kanban across the six pipeline stages (drag to change stage,
  drag overlay, per-column count and value) plus a full list view, with pipeline /
  weighted-pipeline / win-rate KPIs and a "Convert to enquiry" action that moves the
  lead to WON and opens a linked enquiry
- ✅ Clients: account list with live order book, outstanding balance and rating, plus a
  360 drawer (terms, orders, activity timeline)
- ✅ Enquiries: filterable list linked back to the order it became
- ✅ Activity log: `getActivityFor(entity, id)` feeding the shared `Timeline`
- ✅ Design requests: raise/assign/prioritise briefs, overdue highlighting
- ✅ Tech packs: version, POM and BOM counts, release action bumping the version
- ✅ Samples: proto / fit / size set / PP with an approve-or-reject-with-comments
  modal — rejection requires an explanation, and preset reasons speed it up
- ✅ Cost sheets: live FOB build-up (fabric, trims, CM, wash, overhead, freight →
  margin → FOB), two-way margin ⇄ price editing, versioning on save
- ✅ Quotations: versions with supersede/accept states and a version-history timeline
- ✅ Shared `KpiCard`/`KpiGrid` and `Timeline` added for use across the remaining phases
- ✅ Quality gate: lint 0 errors, audit clean (121 files), seed clean, build clean,
  96/96 routes render with content assertions, 9/9 RBAC, 30/30 service checks,
  18/18 interaction checks (masters CRUD + sample approval flow)

## Phase 6: Orders + Order 360 ✅
- ✅ Orders list: KPI row (live orders, order book, at risk, delayed), a clickable
  15-stage lifecycle funnel that filters the table, status / client / risk / date-range
  filters, delayed rows tinted, revised ex-factory dates shown struck through
- ✅ Order creation wizard, five steps with per-step validation:
  client & style → colour × size matrix (live row/column/grand totals, add & remove
  colours, size-set switch preserving entered quantities) → dates & T&A (generates the
  standard 14-milestone calendar back from the ex-factory date) → pricing (live FOB
  build-up) → review (advisory warnings on thin margin, short lead time, no factory)
- ✅ Order 360 with all eleven tabs:
  Overview (commercial terms, progress, needs-attention) · Style & size matrix
  (colour × size grid with totals both ways plus a size curve) · T&A (planned vs
  actual, variance in red, delivery-impact note) · Samples & approvals · Sourcing
  (material position, POs, GRNs with shortfalls, RFQs) · Production (per-stage
  progress bars, delay highlighting, factory allocation) · QC (AQL 2.5 accept/reject
  numbers, defect log) · Shipment (booking + tracking timeline) · Finance (order P&L
  with a cost build-up bar, receivables, vendor bills) · Documents · Activity (one
  merged stream from activities, client updates, sample decisions, quotations,
  shipment and invoices)
- ✅ Header carries PO, client, style, qty, FOB, value, ex-factory, status, risk badge
  and the lifecycle stepper
- ✅ Quality gate: lint 0 errors, audit clean (140 files), seed clean, build clean,
  96/96 routes render with content assertions, 9/9 RBAC, 30/30 service checks,
  47/47 interaction checks (masters CRUD, sample approval, 11-tab Order 360 walk,
  full wizard run ending in a created order)

## Phase 7: Sourcing, Production, Quality ✅
- ✅ Vendors: rating, on-time %, defect rate, lead days and live-order load, with a
  detail drawer showing performance bars, specialities and certifications
- ✅ RFQ list with quote counts against invited vendors, linking straight to comparison
- ✅ Quote comparison: vendor quotes side by side as cards, **best price** and
  **fastest** badges, % delta against the best price, and an award action that flips
  the selected quote and closes the RFQ
- ✅ Material POs with a received-percentage bar and overdue highlighting
- ✅ GRN: received vs ordered, shortfall column, 4-point inspection score against the
  20-point limit
- ✅ Factory allocation with a per-factory load chart (units, days of work, order count)
  that turns amber/red as a unit gets over-committed
- ✅ Stage tracker: every live order as a card with one progress tile per stage, delay
  tinting, and an update-output drawer that rolls the quantity up and derives the
  stage status
- ✅ Daily output: Recharts composed chart (produced/rejected bars against a target
  line), efficiency and reject-rate KPIs, filterable by factory, stage and date range
- ✅ Production Gantt: all stages on one week-ruled timeline with a "today" marker,
  per-bar tooltips and delay colouring
- ✅ QC inspections: record a new inspection and the **AQL 2.5 table derives the sample
  size and accept/reject numbers**, then decides pass/fail automatically
- ✅ Defect log with a severity-tinted Pareto of the worst defect types
- ✅ Test harness refactored into `scripts/test-env.mjs` — one jsdom environment with a
  real element box and a reporting ResizeObserver, so charts render under test
- ✅ Quality gate: lint 0 errors, audit clean (152 files), seed clean, build clean,
  105/105 routes render with content assertions, 9/9 RBAC, 30/30 service checks,
  47/47 interaction checks

## Phase 8: Logistics + Finance ✅
- ✅ Shipments: sea/air bookings with carrier, B/L or AWB, container, cartons, weight,
  CBM, ETD/ETA and freight cost, plus a detail drawer carrying the tracking timeline
  and the attached document set
- ✅ Documents: CI, PL, B/L, certificate of origin and inspection certificate across
  every shipment, filterable by type and status
- ✅ Tracking: voyage progress from ETD to ETA per shipment, days-to-arrival, and the
  seven tracking milestones laid out inline
- ✅ Invoices (AR): advance and commercial invoices, balances, and a **receivables aging
  band** (not due / 1–30 / 31–60 / 61–90 / 90+) reconciled against the open balance
- ✅ Bills (AP): vendor payables against material POs with overdue highlighting
- ✅ Payments: receipts and payments in one ledger with a net-position KPI
- ✅ Expenses: INR and USD amounts, order attribution, billable flag, approval state
- ✅ Order P&L: revenue vs material / CMT / freight / overhead → margin and margin %,
  with a colour-coded margin-by-order chart and loss-making / thin-margin filters
- ✅ Client updates: every progress note sent to a brand, by order and area, with a
  compose drawer that posts by email or into the client portal
- ✅ Quality gate: lint 0 errors, audit clean (161 files), seed clean, build clean,
  114/114 routes render with content assertions, 9/9 RBAC, 30/30 service checks,
  47/47 interaction checks

## Phase 9: HR, Reports, Dashboards ✅
- ✅ Employees: 45 staff with grade, reporting line and leave balance, plus a profile
  drawer listing direct reports
- ✅ Departments: org cards with department head, share-of-headcount bar and cost
- ✅ Attendance: a Monday-first month calendar, per employee or across the team, with
  a present/late/leave/absent legend and per-day tooltips
- ✅ Leave: apply on behalf of an employee (date-range validated) and approve or reject
- ✅ Payroll: the monthly run with a full payslip drawer (earnings, deductions, LOP,
  net pay) on the company letterhead
- ✅ Reports: seven config-driven reports (order book, order margin, vendor performance,
  inspection results, sample approvals, production output, receivables) — each with its
  own filters, summary band and CSV export. **The report list is permission-filtered**,
  so a role only sees the reports it can run
- ✅ CXO executive dashboard: order book, revenue MTD/YTD, gross margin %, on-time
  delivery %, a 12-month revenue-vs-target chart, the lifecycle funnel, top clients,
  vendor performance bars, the delayed-orders list, receivables and headcount
- ✅ A role home for each of the other roles: four KPIs tuned to that role plus a
  "needs attention" queue that links straight to the record, and quick links
- ✅ `npm run rbac` now also asserts that all 10 role dashboards render their own content
- ✅ Quality gate: lint 0 errors, audit clean (174 files), seed clean, build clean,
  121/121 routes render with content assertions, 9/9 RBAC redirects, 10/10 role
  dashboards, 30/30 service checks, 47/47 interaction checks

## Phase 10: Website + Client portal ✅
- ✅ Public marketing site, seven pages, all with domain-real copy:
  home (hero, six services, the seven-stage lifecycle, portal pitch) · about (values,
  history timeline) · services (six services with detailed inclusions) · capabilities
  (six product groups with MOQ and lead time, fabric base, compliance) · clients (six
  brands, testimonials, clearly marked fictional) · sustainability (six pillars plus an
  honest in-place / in-progress / planned commitment table) · contact
- ✅ **The contact form creates a real lead** in the mock CRM, assigned to a
  merchandiser, and tells the visitor where to find it
- ✅ Client portal: my orders (live/development/shipped filter with a production
  progress bar per order) · order tracking (lifecycle stepper, per-stage progress,
  shipment milestones, samples, updates from us) · approvals · shipments
- ✅ **Portal approvals write to the same sample record the internal Design module
  reads** — verified end to end by the interaction check: a client approves in the
  portal, and the internal samples list shows that decision
- ✅ Portal data is scoped to the signed-in brand; opening another brand's order shows
  a not-found state rather than the record
- ✅ **All placeholder scaffolding removed** — every route in the app is now a real page
- ✅ Quality gate: lint 0 errors, audit clean (185 files), seed clean, build clean,
  85/85 routes render with content assertions, 9/9 RBAC, 10/10 role dashboards,
  30/30 service checks, 56/56 interaction checks

## Phase 11: Polish ✅
- ✅ **⌘K global search**: a command palette over orders, clients, vendors, people and
  every page the current role can reach, with prefix-first ranking, grouped results,
  arrow-key navigation and Enter to open. Its index is permission-filtered and built
  only while the palette is open
- ✅ Notifications panel (store + slide-over with unread badge) reachable from the topbar
- ✅ **Loading / empty / error on every screen**: added a shared `ErrorState` and wired
  the five screens that were still swallowing load failures (both dashboards, the
  Order 360 finance tab, the portal order page and quote comparison)
- ✅ **Accessibility audit** (`npm run a11y`): renders all 59 representative routes and
  checks accessible names, form labels, alt text, duplicate ids, heading order and
  table headers. Two real issues found and fixed — `CardTitle`/`Panel` were `h3` under
  an `h1` (now `h2`), and completed stepper buttons had no accessible name
- ✅ **Dark-mode audit**: the same pass runs with `.dark` on the document and rejects
  any inline literal colour, on top of the static token audit
- ✅ **Mobile**: every wide surface (tables, Gantt, kanban) sits in an overflow
  container; the only `min-w` in the codebase is the Gantt's, inside its scroller;
  no unprefixed `grid-cols-3+` that isn't a calendar or a short stat row
- ✅ **Dead code removed**: 0 unreferenced files, 0 unused exports (dropped
  `orderStatusIndex`, `productionStagesFor`, `masterKeys`, `VENDOR_TYPE_LABELS`,
  `mastersServiceFor`; `CardFooter` now demonstrated in the UI kit)
- ✅ **Code splitting**: 59 pages lazy-loaded per module, overlays loaded on open, and
  the mock database split into its own chunk. The entry bundle went from
  **2,550 kB → 354 kB** (573 kB → 110 kB gzipped); the marketing site no longer
  downloads the ERP or the seed data at all
- ✅ README rewritten: setup, scripts, the full demo credentials table, module list,
  folder structure, and a step-by-step guide to swapping the mock services for a real API
- ✅ Quality gate (9 stages): lint 0 errors, token audit clean (190 files), seed clean,
  build clean, 85/85 routes render with content assertions, 9/9 RBAC redirects,
  10/10 role dashboards, 30/30 service checks, 61/61 interaction checks,
  59/59 routes accessibility + theme clean

## Phase 12: Browser verification & fixes ✅
Raised after the phase-11 sign-off: pages were breaking in the browser that every
jsdom check passed.

- ✅ **Root cause found: the React Compiler generates unsafe memo guards.** It hoists
  property reads out of a closure into its guard *without* the optional chaining:
  `useMemo(() => data?.leaves ?? [], [data])` compiles to `if ($[3] !== data.leaves)`,
  which throws while `data` is undefined; a body function using `editing.id` compiles
  to `if ($[6] !== editing.id || …)`, which throws while `editing` is null. It crashed
  **design requests, cost sheets and leave**, and could have hit any component
  dereferencing a nullable value. The Babel transform only runs in the client build,
  which is exactly why every SSR/jsdom check passed. **The compiler is now off**, with
  the evidence in `vite.config.js`
- ✅ **`npm run browser` / `npm run browser:mobile`** — a real Chromium (Playwright)
  drives all 72 routes at 1440×900 and 390×844, reporting uncaught errors, console
  errors, failed requests, the error boundary, empty renders, horizontal overflow
  (naming the offending element) and sidebar behaviour. Both are in the gate
- ✅ **Three mobile overflow bugs fixed**, all invisible to jsdom: the UI-kit token grid
  and identity row (grid/flex children default to `min-width: auto`, so the section
  refused to shrink), and the attendance filters (two fixed-width selects side by side)
- ✅ **Sidebar is now scrollable** — it was `lg:static` with no bounded height, so it grew
  past the viewport and the page scrolled instead of the nav. Now
  `lg:sticky lg:top-0 lg:h-screen` with `min-h-0` on the nav, so it scrolls internally
- ✅ **Sidebar is now an accordion** — opening a module closes the previously open one.
  The open group still follows the current route, and re-syncs when you navigate into
  a different module
- ✅ Quality gate is now **11 stages**: lint · token audit · seed · build · smoke · rbac ·
  services · crud · a11y · browser (desktop) · browser (mobile)

## Known issues
- ⚠️ `npm run lint` reports one **warning** (0 errors): `react-hooks/incompatible-library`
  on `useReactTable` in DataTable.jsx. It is now moot — the React Compiler is disabled
  (see phase 12) — but the rule still fires. TanStack Table v8 is mandated by CLAUDE.md
  and silencing the rule would mean disabling it, so the warning is accepted.
- ⚠️ The React Compiler is **off** because it generates null-unsafe memo guards. If a
  future React version fixes this, re-enable it in `vite.config.js` and run
  `npm run browser` to confirm.
- ✅ ~~The production bundle is a single large chunk~~ — resolved in phase 11. The entry
  chunk is now 354 kB (110 kB gzipped); pages are code-split per module and the seeded
  database is its own chunk that the marketing site never loads.
- ⚠️ The seed-data chunk is 922 kB raw (95 kB gzipped). That is the nature of shipping
  3,182 realistic records to the browser with no backend; `vite.config.js` raises
  `chunkSizeWarningLimit` with a comment explaining why. A real API removes it entirely.
- ⚠️ Charts are not virtualised and tables paginate at 100 rows maximum. Neither is a
  problem at demo volumes but both would need attention against a real data set.
