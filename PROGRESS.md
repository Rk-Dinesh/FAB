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

## Phase 3: Mock data layer ⬜
- ⬜ Seed JSON in src/mocks/data (relational IDs, CLAUDE.md volumes)
- ⬜ `createService()` factory: getAll(filter/sort/paginate), getById, create, update,
  remove, 300–600ms delay, in-memory + localStorage persistence
- ⬜ "Reset demo data" action
- ⬜ One service file per module
- ⬜ config/statuses.js (single source of truth: lifecycle + production stages)
- ⬜ Quality gate

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
- ⚠️ The production bundle is a single ~543 kB chunk and Vite warns about it.
  Route-level `React.lazy` splitting is scheduled for phase 11 (polish).
