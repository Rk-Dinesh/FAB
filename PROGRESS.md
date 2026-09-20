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

## Phase 4: Masters + Admin ⬜
- ⬜ DataTable (sort, search, filters, pagination, column visibility, row select, CSV)
- ⬜ FilterBar, PageHeader, StatusBadge
- ⬜ Generic config-driven MastersCRUD + drawer forms (react-hook-form + zod)
- ⬜ All master pages
- ⬜ Admin: users, roles (permission matrix UI), audit log, settings
- ⬜ Quality gate

## Phase 5: CRM, Design, Costing ⬜
- ⬜ Leads: kanban (dnd-kit) + list, convert to enquiry
- ⬜ Clients, enquiries, activity log
- ⬜ Design requests, tech packs, samples + approve/reject with comments
- ⬜ Cost sheets (live FOB + margin), versions, quotations
- ⬜ Quality gate

## Phase 6: Orders + Order 360 ⬜
- ⬜ Orders list with status filters
- ⬜ Order creation wizard (client/style → size matrix → dates/T&A → pricing → review)
- ⬜ Order 360: header, stepper, all 11 tabs, delay highlighting, risk badge
- ⬜ Quality gate

## Phase 7: Sourcing, Production, Quality ⬜
- ⬜ Vendors (rating), RFQ, quote comparison (best price), material PO, GRN
- ⬜ Allocation, stage tracker, daily output, Gantt, delay alerts
- ⬜ QC inspections (AQL 2.5 inline/final), defect log
- ⬜ Quality gate

## Phase 8: Logistics + Finance ⬜
- ⬜ Shipments, documents (CI/PL/BL), tracking timeline
- ⬜ AR invoices, AP bills, payments, expenses
- ⬜ Order P&L, receivables aging
- ⬜ Quality gate

## Phase 9: HR, Reports, Dashboards ⬜
- ⬜ Employees, departments, attendance, leave, payroll
- ⬜ Reports with filters + export
- ⬜ CXO executive dashboard + per-role home dashboards
- ⬜ Quality gate

## Phase 10: Website + Client portal ⬜
- ⬜ Public site: home, about, services, capabilities, clients, sustainability, contact
- ⬜ Client portal: my orders, tracking, pending approvals, shipments
- ⬜ Quality gate

## Phase 11: Polish ⬜
- ⬜ ⌘K global search, notifications panel
- ⬜ Loading/empty/error states everywhere, mobile responsiveness
- ⬜ Keyboard + focus accessibility, spacing consistency, dark-mode audit
- ⬜ Dead code removal, README, final summary

---

## Known issues
- ⚠️ The production bundle is a single ~1.47 MB chunk (263 kB gzipped) because every
  mock JSON file is statically imported. Route-level `React.lazy` splitting and
  dynamic data imports are scheduled for phase 11 (polish).
