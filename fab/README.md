# ApparelFlow ERP — mock frontend

A complete, frontend-only ERP for an apparel sourcing and buying house. It covers the
whole commercial thread — lead → enquiry → design → costing → order → sourcing →
production → QC → shipping → settlement — plus finance, HR, CXO dashboards, a public
marketing site and a client portal.

There is **no backend**. Every screen reads from seeded JSON through a service layer
that simulates a real API (300–600 ms latency, pagination, filtering, sorting,
mutations), so it can be swapped for `fetch` without touching a component.

---

## Getting started

```bash
cd fab
npm install
npm run dev      # http://localhost:5173
```

| Script                | What it does                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server with HMR                                                    |
| `npm run build`       | Production build into `dist/`                                               |
| `npm run preview`     | Serve the production build                                                  |
| `npm run lint`        | ESLint (flat config, React Compiler rules)                                  |
| `npm run seed`        | Regenerate every file in `src/mocks/data` from `scripts/seed/*`             |
| `npm run gate`        | The full quality gate — everything below, in order                          |
| `npm run audit`       | Design-token discipline (no raw hex, no stock Tailwind palette classes)     |
| `npm run check-seed`  | Referential integrity + the seed volume contract                            |
| `npm run smoke`       | Mounts every route in jsdom and asserts its real content renders            |
| `npm run rbac`        | Asserts RBAC redirects and that all 10 role dashboards render               |
| `npm run services`    | 30 assertions over the service layer and its domain maths                   |
| `npm run crud`        | Drives the real UI: masters CRUD, sample approval, Order 360, wizard, ⌘K    |
| `npm run a11y`        | Renders every route in dark mode and audits accessibility + theme tokens    |
| `npm run browser`     | Drives all 72 routes in a real Chromium at 1440×900                         |
| `npm run browser:mobile` | The same pass at 390×844, checking for horizontal overflow               |

---

## Demo logins

Every account uses the password **`demo123`**. The sign-in page also has a
"Quick login as" card for each role, and the topbar carries a dev-only role switcher
that re-evaluates permissions without signing out.

| Role           | Email                          | Lands on                  | Sees                                                        |
| -------------- | ------------------------------ | ------------------------- | ----------------------------------------------------------- |
| `SUPER_ADMIN`  | admin@apparelflow.com          | `/app/dashboard`          | Everything, plus user and role administration                |
| `CXO`          | cxo@apparelflow.com            | `/app/dashboard`          | Executive dashboard, order book, margins, vendor performance |
| `MERCHANDISER` | merch@apparelflow.com          | `/app/dashboard`          | CRM, design, costing, orders, client updates                 |
| `DESIGNER`     | design@apparelflow.com         | `/app/design/requests`    | Design requests, tech packs, sample approvals                |
| `SOURCING`     | sourcing@apparelflow.com       | `/app/sourcing/rfq`       | Vendors, RFQs, quote comparison, material POs, GRN           |
| `PRODUCTION`   | production@apparelflow.com     | `/app/production/tracker` | Allocation, stage tracker, daily output, Gantt               |
| `QC`           | qc@apparelflow.com             | `/app/quality/inspections`| AQL inspections and the defect log                           |
| `LOGISTICS`    | logistics@apparelflow.com      | `/app/logistics/shipments`| Shipments, export documents, tracking                        |
| `FINANCE`      | finance@apparelflow.com        | `/app/finance/invoices`   | AR, AP, payments, expenses, order P&L                        |
| `HR`           | hr@apparelflow.com             | `/app/hr/employees`       | Employees, departments, attendance, leave, payroll           |
| `CLIENT`       | buyer@northwindapparel.com     | `/portal/orders`          | Only Northwind Apparel's own orders                          |
| `CLIENT`       | buyer@maisonrue.com            | `/portal/orders`          | Only Maison Rue's own orders                                 |

Everything you create, edit or delete is kept in **your browser only**. Reset it from
the profile menu or from Admin → Settings.

---

## Modules

**Public site** — home, about, services, capabilities, clients, sustainability,
contact. The contact form creates a real lead in the CRM.

**Internal app** (`/app`)

| Module          | Screens                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| Dashboard       | CXO executive view; a role-specific home for every other role                   |
| CRM             | Leads (dnd-kit kanban + list), clients, enquiries                               |
| Design          | Design requests, tech packs, samples with approve/reject-with-comments          |
| Costing         | Cost sheets with a live FOB build-up, versioned quotations                      |
| Orders          | Order list with a lifecycle funnel, a 5-step creation wizard, **Order 360**     |
| Sourcing        | Vendors, RFQ, side-by-side quote comparison, material POs, GRN                  |
| Production      | Factory allocation, stage tracker, daily output, Gantt timeline                 |
| Quality         | AQL 2.5 inspections, defect log with a Pareto                                   |
| Logistics       | Shipments, export documents, voyage tracking                                    |
| Client updates  | Every progress note sent to a brand                                             |
| Finance         | Invoices (AR) with aging, bills (AP), payments, expenses, order P&L             |
| HR              | Employees, departments, attendance calendar, leave, payroll with payslips       |
| Reports         | Seven filterable, exportable reports — the list is permission-filtered          |
| Masters         | 15 reference-data screens from one config-driven CRUD component                 |
| Admin           | Users, an editable 16 × 5 permission matrix, audit log, settings                |

**Client portal** (`/portal`) — my orders, per-order tracking, sample approvals and
shipments, all scoped to the signed-in brand.

### Order 360

The most important screen. Header with PO, client, style, quantity, FOB, value,
ex-factory date, status and risk badge, a lifecycle stepper, and eleven tabs:
Overview · Style & size matrix · T&A · Samples & approvals · Sourcing · Production ·
QC · Shipment · Finance · Documents · Activity.

---

## Folder structure

```
fab/
├── scripts/
│   ├── seed/                 seed generators (lib, masters, parties, orders, …)
│   ├── generate-seed.mjs     npm run seed
│   ├── test-env.mjs          shared jsdom + Vite harness for the gate scripts
│   ├── smoke.mjs             route render + content assertions
│   ├── check-rbac.mjs        RBAC redirects and role dashboards
│   ├── check-services.mjs    service-layer contract
│   ├── check-crud.mjs        real-UI interaction paths
│   ├── check-seed.mjs        referential integrity
│   ├── check-a11y.mjs        accessibility + theme audit
│   └── audit-tokens.mjs      design-token discipline
└── src/
    ├── app/                  router, lazy page map, providers, ProtectedRoute
    ├── components/
    │   ├── ui/               20 primitives (Button, Drawer, DataTable deps, …)
    │   └── shared/           DataTable, FilterBar, PageHeader, StatusBadge,
    │                         KpiCard, Timeline, RecordDrawer, CommandPalette, …
    ├── config/               roles, permissions, navigation, statuses
    ├── features/<module>/    pages, components and config per module
    ├── hooks/                useAsync, useFocusTrap, useKeyboardShortcut, …
    ├── layouts/              Public, Auth, App, ClientPortal
    ├── mocks/
    │   ├── data/             46 seeded JSON collections
    │   └── db.js             loads the seed, shifts dates, persists edits
    ├── pages/website/        the marketing site
    ├── services/             createService() + one service per module
    ├── store/                auth, theme, toast, notifications (Zustand)
    └── utils/                cn, formatting, CSV
```

---

## Swapping the mock services for a real API

The service layer is the only place that knows where data comes from. Components call
`orderService.getAll(params)` and never touch `fetch`, `axios` or the mock db.

**1. Replace the factory.** `src/services/createService.js` exposes
`getAll / getById / list / create / update / remove`. Reimplement those bodies against
your API and every screen follows:

```js
export function createService(collection, options = {}) {
  const base = `${import.meta.env.VITE_API_URL}/${collection}`

  return {
    async getAll({ search, filters, sortBy, sortDir, page, pageSize } = {}) {
      const query = new URLSearchParams({ search, sortBy, sortDir, page, pageSize, ...filters })
      const response = await fetch(`${base}?${query}`, { headers: authHeaders() })
      if (!response.ok) throw new Error(await response.text())
      return response.json()   // { rows, total, page, pageSize, pageCount }
    },
    async getById(id) { /* GET  `${base}/${id}` */ },
    async create(values) { /* POST `${base}` */ },
    async update(id, patch) { /* PATCH `${base}/${id}` */ },
    async remove(id) { /* DELETE `${base}/${id}` */ },
  }
}
```

**2. Move the domain helpers server-side, or keep them.** `getOrder360`,
`getOrderPnl`, `getReceivablesAging`, `getStageTracker` and friends currently join
collections in the browser. Each maps to one endpoint (`GET /orders/:id/full`,
`GET /reports/receivables-aging`, …) — change the body, keep the signature.

**3. Swap the auth store.** `src/store/authStore.js` resolves credentials against
`users.json`. Point `login()` at your auth endpoint and store the real token; the
`{user, role, token}` shape and `useCan()` stay as they are.

**4. Load permissions from the API.** `config/permissions.js` ships the matrix as a
constant and `adminService` reads any local override. Fetch it on login and feed the
same shape into `can()`.

**5. Delete the mock layer.** Remove `src/mocks/`, `scripts/seed/` and the
`seed` / `check-seed` scripts. Nothing in `src/features` imports them directly except
where a screen reads reference data synchronously via `table()` — those call sites are
marked and each has a service equivalent.

Keep `useAsync` either way: it already gives every screen its loading, error and retry
behaviour.

---

## Conventions

- **Tailwind v4, tokens only.** Colour comes from semantic CSS variables
  (`--surface`, `--text-muted`, `--danger`, …) mapped into Tailwind through
  `@theme inline`. `npm run audit` fails the build on a raw hex or a stock palette
  class, which is what keeps dark mode correct.
- **Theme** is `light | dark | system`, persisted, and applied by an inline script in
  `index.html` before first paint so there is no flash.
- **Statuses** live only in `config/statuses.js`. `StatusBadge` reads from it, so a
  label or colour change lands everywhere at once.
- **Permissions** live only in `config/permissions.js`. The sidebar, the routes, the
  row actions and the report list all derive from `can(module, action)`.
- **Components stay small.** Anything approaching 200 lines is split.
- **Code splitting** is per module: the marketing site never downloads the ERP, and
  the seeded database is its own chunk loaded only when an app screen needs it.
- **The React Compiler is off.** It generates null-unsafe memoisation guards that
  crash on render; `vite.config.js` has the detail. `npm run browser` exists because
  jsdom could not see those crashes — the Babel transform only runs in the client
  build, and jsdom has no layout engine.
