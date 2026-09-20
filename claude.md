# Project: ApparelFlow ERP — Mock Frontend

## Context
Frontend-only mock of an ERP for an apparel sourcing/buying house. The company does not
manufacture; it takes orders from fashion brands, optionally designs garments and gets
client approval, sources materials and third-party vendors/factories, tracks production
stages, updates clients, ships, and closes the deal. It also covers finance, HR of own
employees, and CXO dashboards. NO backend: all data comes from local mock JSON through a
service layer that simulates async API calls, so it can later be swapped for a real API.

## Stack (strict)
- Vite + React 18, JavaScript (JSX). Write clean JSDoc on services/utils so a TS
  migration is easy later.
- Tailwind CSS v4 (@tailwindcss/vite). Dark mode is class-based:
  `@custom-variant dark (&:where(.dark, .dark *));`
- React Router v6 (createBrowserRouter), Zustand, TanStack Table v8, Recharts,
  react-hook-form + zod, lucide-react, date-fns, @dnd-kit, clsx + tailwind-merge (cn()).
- No other UI library. Build our own components in src/components/ui.

## Folder structure
src/app (router, providers) | src/layouts (Public, Auth, App, ClientPortal)
src/components/ui (primitives) | src/components/shared (DataTable, FilterBar,
PageHeader, StatusBadge, Stepper, Timeline, KpiCard, ThemeToggle, EmptyState)
src/features/<module>/{pages,components,config.js} | src/mocks/data/*.json
src/services/<module>Service.js | src/store | src/config (roles, permissions,
navigation, statuses) | src/pages/website | src/hooks | src/utils

## Design system
- Semantic CSS variables in index.css for both themes: --bg, --surface, --surface-2,
  --border, --text, --text-muted, --primary, --success, --warning, --danger, --info.
  Map them to Tailwind theme tokens. Never hardcode hex in components.
- Theme: light | dark | system, persisted in localStorage, applied as a `dark` class
  on <html> before first paint (inline script in index.html to avoid a flash).
- Look: clean enterprise SaaS, dense but readable tables, 8px spacing grid,
  rounded-lg, subtle borders, Inter font. Fully responsive; the sidebar becomes a
  drawer on mobile.
- Every list/detail has loading skeletons, empty states, and error states.

## Auth & RBAC (mock)
- Login page: email/password plus "Quick login as" role cards. Users live in
  mocks/data/users.json (password "demo123" for all). Store {user, role, token} in
  Zustand persisted in localStorage.
- Roles: SUPER_ADMIN, CXO, MERCHANDISER, DESIGNER, SOURCING, PRODUCTION, QC,
  LOGISTICS, FINANCE, HR, CLIENT.
- config/permissions.js: map role -> modules -> actions (view/create/edit/delete/
  approve). Use a single `can(module, action)` helper plus a <Can> component.
- ProtectedRoute checks auth plus permission and redirects to /403. The sidebar is
  generated from config/navigation.js, filtered by permission.
- CLIENT role uses ClientPortalLayout and sees only their own brand's orders.
- A dev-only role switcher in the topbar.

## Order lifecycle (single source of truth: config/statuses.js)
LEAD → ENQUIRY → DESIGN (optional) → COSTING → QUOTED → CONFIRMED → SAMPLING →
SOURCING → PRODUCTION → QC → READY_TO_SHIP → SHIPPED → DELIVERED → PAYMENT_RECEIVED → CLOSED
Production stages: FABRIC_INHOUSE, CUTTING, STITCHING, WASHING_EMB (optional),
FINISHING, PACKING, FINAL_INSPECTION. Each stage has a planned date, actual date,
qty done, and status.
Each status/stage has a label, color token, and icon, and StatusBadge reads from here.

## Modules & routes
/ (website: home, about, services, capabilities, clients, sustainability, contact;
  the contact form creates a mock lead)
/login, /forgot-password, /403
/app/dashboard (role-based home; CXO gets the executive dashboard)
/app/crm/{leads (kanban+list), clients, enquiries}
/app/design/{requests, tech-packs, samples}  (sample types: Proto, Fit, Size set, PP;
  approval states: Pending / Approved / Rejected with comments)
/app/costing/{cost-sheets, quotations}  (fabric, trims, CM, wash, overhead, freight,
  margin %, FOB price auto-calc, versions)
/app/orders (list), /app/orders/new (wizard), /app/orders/:id (ORDER 360)
/app/sourcing/{vendors, rfq, quote-comparison, material-po, grn}
/app/production/{allocation, tracker, daily-output, gantt}
/app/quality/{inspections, defects}  (AQL 2.5 inline/final, pass/fail)
/app/logistics/{shipments, documents, tracking}
/app/client-updates
/app/finance/{invoices (AR), bills (AP), payments, expenses, order-pnl}
/app/hr/{employees, departments, attendance, leave, payroll}
/app/reports
/app/masters/{company, clients, vendors, categories, fabrics, trims, colors,
  size-sets, uom, currencies, ports, incoterms, payment-terms, stages, qc-checklists}
/app/admin/{users, roles (permission matrix UI), audit-log, settings}
/portal (client): my orders, order tracking timeline, pending approvals, shipments

## Order 360 page (most important screen)
Header: PO no, client, style, qty, FOB value, ex-factory date, status, risk badge.
Lifecycle stepper. Tabs: Overview | Style & Size Matrix (color × size qty grid) |
T&A (planned vs actual, delays in red) | Samples & Approvals | Sourcing (materials,
vendors, POs) | Production (stage progress bars per stage) | QC | Shipment |
Finance (invoice, received, vendor cost, margin) | Documents | Activity timeline.

## Reusable patterns
- MastersCRUD: one generic config-driven page (columns + zod schema + form fields)
  used by all masters. Create/edit happen in a right-side Drawer.
- DataTable: sorting, global search, column filters, pagination, row selection,
  column visibility, CSV export, row click opens a drawer or navigates.
- PageHeader: title, breadcrumbs, primary actions.

## Mock data
Use fictional brands (e.g. Northwind Apparel, Blue Harbor Co., Urban Loom, Verde
Kids, Atlas Active, Maison Rue). Seed with realistic, internally consistent,
relational data (IDs link across files): 6 clients, 25 vendors (mills, trims,
factories, washing units), 30 orders spread across all statuses, 8 delayed,
60 samples, 40 invoices/bills, 45 employees, 12 users (one per role, plus a client
user). Currency is USD for export and INR for internal; dates relative to today.
Services: getAll(params) with filter/sort/paginate, getById, create, update, remove,
each with a 300–600ms delay, and mutations persisted in memory (and localStorage)
for the session.

## Dashboards
CXO: order book value, revenue MTD/YTD, gross margin %, on-time delivery %, orders
by status (funnel), monthly revenue vs target (chart), top clients, vendor
performance, delayed orders list, receivables aging, headcount.
Each role: KPIs plus a "My tasks / Needs attention" list relevant to that role.

## Rules
- Build phase by phase. After each phase: run the build, fix errors and lint issues,
  and summarize what was done.
- Components stay small (<200 lines); extract instead of growing them.
- Test every screen in both light and dark mode.
- No placeholder "Lorem ipsum" in the app; use domain-realistic text.