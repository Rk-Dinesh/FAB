# DECISIONS.md — ApparelFlow ERP mock frontend

Autonomous build decisions, with rationale. Newest phase last.

## Phase 1 — Foundation

### D1. App lives in `fab/`, repo docs at root
The git repo root (`/Users/techi/Desktop/FAB`) already contained a Vite scaffold in `fab/`.
Kept it there rather than flattening, so git history stays linear. `PROGRESS.md`,
`DECISIONS.md` and `claude.md` live at the repo root; `fab/README.md` is the app readme.
All npm commands run from `fab/`.

### D2. React 19 instead of React 18
CLAUDE.md specifies React 18, but the pre-existing scaffold ships React 19.2 with
Vite 8 and `@vitejs/plugin-react` 6. Downgrading a major version to match a doc line
would fight the installed toolchain (and the newer peer ranges of Recharts 3, TanStack
Table v8 and dnd-kit) for no functional gain. Everything else in the "strict" stack is
honoured exactly. JSX/JavaScript only — no TypeScript — as specified.

### D3. Recharts 3.x
Recharts 2.x has React 19 peer-dependency conflicts. 3.x is API-compatible for
everything this app needs (Line/Bar/Area/Pie/Funnel + ResponsiveContainer).

### D4. Tailwind v4 via `@tailwindcss/vite`, tokens in CSS
No `tailwind.config.js` — v4 config is CSS-first. Semantic tokens are declared as CSS
custom properties on `:root` / `.dark` and mapped into Tailwind through `@theme inline`,
so `bg-surface`, `text-muted`, `border-border` etc. work as normal utilities and no
component ever hardcodes a hex value.

### D5. Theme applied pre-paint by an inline script
`index.html` runs a tiny blocking script that reads `localStorage.apparelflow-theme`
(`light | dark | system`) and sets the `dark` class on `<html>` before first paint, so
there is no flash. The Zustand theme store stays in sync with it.

### D6. Own UI primitives, no headless library
CLAUDE.md forbids other UI libraries. Modal/Drawer/Dropdown/Tooltip are built on native
semantics plus small hooks (`useOnClickOutside`, focus trap, `Escape` handling) rather
than Radix/Headless UI. Portals via `createPortal`.

### D7. Toasts via a Zustand store + `<Toaster />` in the root providers
Gives any module `toast.success(...)` without prop drilling and without a context
provider chain.

### D8. A jsdom route smoke test instead of eyeballing every screen
`npm run smoke` boots Vite's SSR module loader, mounts every route from
`src/app/routes.jsx` in a jsdom document and fails on any thrown error, console
error, or empty render. That is why `routes.jsx` exports a plain route array and
`router.jsx` only wraps it in `createBrowserRouter`. It runs in seconds and is part
of the per-phase quality gate.

### D9. A token audit guards dark mode mechanically
`npm run audit` rejects raw hex values and stock Tailwind palette classes
(`bg-gray-100`, `text-red-500`, …) anywhere under `src` except `index.css`. Since
every colour then resolves through a semantic token that is defined for both themes,
dark mode cannot silently regress. Lines that legitimately carry colour data (chart
palettes, seed data) opt out with an `audit-ignore` comment.

### D10. `npm run gate` runs lint → audit → build → smoke
One command for the phase quality gate.

## Phase 2 — Auth + RBAC

### D11. Permissions live in a plain object, not in the user record
`config/permissions.js` maps role → module → actions. Users carry only a role, so
the admin "roles" screen in phase 4 can edit one matrix and have it apply everywhere.
SUPER_ADMIN is generated from `MODULES` with `'*'` rather than hand-listed.

### D12. `area` on ProtectedRoute keeps the two audiences apart
CLIENT users hitting an internal route are redirected to `/portal/orders`, and staff
hitting `/portal` go to their role home. Without this, a client with a stale URL
would land on a 403 instead of somewhere useful.

### D13. The dev role switcher impersonates rather than re-logs-in
`impersonatedRole` overrides the role used by every permission check while keeping
the signed-in identity. This makes the whole RBAC surface reviewable in one session,
and the topbar chip turns amber whenever impersonation is active.

### D14. `npm run rbac` pins the redirect behaviour
`scripts/check-rbac.mjs` mounts the real route tree for nine (role, path) pairs and
asserts the landing path. A careless edit to the matrix now fails the gate instead of
silently opening or closing a module.

### D15. Notifications are a real store from phase 2
The topbar badge needed something to count, so the notification store and slide-over
panel were built here with domain-realistic seeds rather than stubbed and revisited.

## Phase 3 — Mock data layer

### D16. The seed is generated, not hand-written
`scripts/seed/*` plus `npm run seed` produce every file in `src/mocks/data` from a
seeded PRNG (mulberry32), so the data is realistic, internally consistent and
reproducible. The generated JSON is committed, so the app never generates at runtime.

### D17. Dates shift forward in whole weeks at load
The seed is anchored to a fixed `generatedAt`. `src/mocks/db.js` shifts every ISO date
it finds by `floor(elapsed / 7) * 7` days. Whole weeks keep attendance, shift calendars
and weekday-sensitive data on the right day of the week, and the demo never looks stale.

### D18. Session edits persist per collection under a versioned key
`apparelflow-db:<collection>` holds `{version, rows}`; the version embeds the seed's
`generatedAt`, so regenerating the seed automatically invalidates stale local edits
instead of mixing two data sets.

### D19. Domain maths lives in the services, not the components
`calculateFob`, `marginFromPrice`, `aqlPlan`, `getReceivablesAging`, `getOrderPnl` and
`buildSizeMatrix` sit in the service layer so the cost sheet form, the quotation, the
order P&L and the dashboards all agree — and so `npm run services` can assert them.

### D20. `useAsync` derives `loading` instead of setting it in an effect
The lint config forbids synchronous setState inside an effect. The hook stores the key
of the request that landed and derives `loading` from it, which also keeps the previous
data on screen during a refetch instead of flashing a skeleton.

### D21. `npm run check-seed` and `npm run services` joined the gate
Referential integrity plus a 30-assertion service contract run on every phase.

## Phase 4 — Masters + Admin

### D22. One `MastersCRUD` component, 15 configs
`features/masters/config.jsx` holds columns, a zod schema, a field list and defaults
per entity; the page component is generic. Adding a master is a config entry, not a
new screen. Shared column builders (`name`, `money`, `tags`, `boolean`, `count`,
`swatch`) keep each config readable.

### D23. The permission matrix is editable but stored separately
The admin Roles screen edits a copy held in `localStorage` under
`apparelflow-permissions`, leaving `config/permissions.js` as the shipped default that
"Reset to defaults" restores. Toggling any action on a `'*'` module expands the
wildcard into its five explicit actions first, so the grid never lies about what is
granted.

### D24. Audit entries are fire-and-forget
Every mock service call sleeps 300-600 ms. Awaiting the audit write after a save made
the drawer sit open for ~1.3 s. `void recordAudit(...)` keeps the log complete without
putting a second round trip in front of the user.

### D25. The smoke test asserts content, not just "it rendered"
A page stuck on a skeleton, or loading zero rows, still produces non-empty text.
`EXPECTATIONS` in `scripts/smoke.mjs` pins real seeded strings per route (e.g.
`/app/masters/fabrics` must show "Single jersey 180 GSM"), so a broken data path fails
the gate.

### D26. `npm run crud` drives the real UI
`scripts/check-crud.mjs` opens the masters drawer in jsdom, submits an invalid hex,
asserts the zod message, saves a valid one and confirms the row reaches the table,
then edits it. RecordDrawer + FormFields + DataTable back most screens, so this single
path guards a lot of shared surface.

### D27. The one accepted lint warning
`react-hooks/incompatible-library` fires on `useReactTable`. CLAUDE.md mandates
TanStack Table v8; the only ways to clear it are dropping the library or disabling the
rule, and the instruction is not to disable rules. It is a compiler optimisation
notice, not a correctness problem, so it stands alongside 0 errors.

## Phase 5 — CRM, Design, Costing

### D28. Kanban drop targets resolve through both columns and cards
`onDragEnd` accepts an `over.id` that is either a stage id (empty column) or another
lead's id (dropped onto a card), and resolves both to a target stage. Without this,
dropping onto a populated column does nothing.

### D29. Rejecting a sample requires a comment; approving does not
The rejection comment is what the factory actually works from, so the modal blocks a
rejection under ten characters and offers four preset reasons. Approval comments stay
optional.

### D30. The FOB editor is two-way
Editing the margin recalculates the price, and editing the price back-solves the
margin through `marginFromPrice`. Merchants negotiate on price, not margin, so the
sheet has to work from either end.

### D31. Reset-on-prop-change uses render-time state adjustment, not an effect
`SampleDecisionModal` and `CostSheetEditor` compare a request key during render and
reset their local state when it changes. The lint config forbids synchronous setState
in an effect, and this is React's documented alternative.

### D32. Clock reads never happen during render
`react-hooks` flags `Date.now()` in a render path as impure. Default dates for new
records are computed in the click handler that opens the drawer instead.

### D33. `data ?? []` is memoised at every call site
`react-hooks/exhaustive-deps` warns that a logical expression feeding a `useMemo`
dependency changes identity each render. Every list page now does
`useMemo(() => data ?? [], [data])`, which is the fix the rule itself recommends.

## Phase 6 — Orders + Order 360

### D34. Order 360 loads once, through `getOrder360`
One service call resolves the order plus every related collection (samples, POs,
GRNs, stages, inspections, shipment, documents, invoices, activity). Tabs are pure
presentation over that object, so switching tabs costs nothing and the tab content is
always consistent with the header.

### D35. Tabs render conditionally rather than staying mounted
Only the active tab is in the tree. With eleven tabs this keeps the DOM small, and
because the data is already loaded there is no refetch cost to switching.

### D36. The wizard validates per step, and warns rather than blocks at review
Each step has its own validator, so a user is never told about a problem three steps
away. The review step separately surfaces advisory warnings — thin margin, short lead
time, no factory allocated — which inform without preventing creation.

### D37. The size-set switch preserves entered quantities
Changing the size run in step 2 keeps any quantity whose size exists in the new run
instead of clearing the grid, which is what happens when a merchandiser realises
mid-entry that the buy is on the extended run.

### D38. `npm run crud` now walks all eleven Order 360 tabs
Each tab asserts its own distinctive content. A tab that silently renders an empty
panel — the most likely regression on the app's most important screen — fails the gate.

## Phase 7 — Sourcing, Production, Quality

### D39. Quote comparison marks the best price, but awarding is a decision
`getQuoteComparison` flags `isBestPrice` and `isFastest` and computes the % delta
against the cheapest quote, but the award is an explicit action. Sourcing regularly
pays more for a shorter lead time, so the screen informs rather than decides — the
seed's own award logic does the same, skipping quotes whose lead time would blow the
ex-factory date.

### D40. Stage output is entered as a running total
The update drawer asks for the cumulative quantity done, not today's increment, which
is how a floor coordinator reads it off the bundle tickets. The drawer shows the
implied delta so a mistyped total is obvious, and the stage status derives from the
quantity unless it is set explicitly.

### D41. The AQL table lives in the service, and the form reads from it
`aqlPlan(lotSize)` returns the sample size and accept/reject numbers straight from the
AQL 2.5 general-inspection-level-II table. The inspection form cannot disagree with the
standard because it never computes them itself.

### D42. Chart colours come from CSS variables, not literals
Recharts takes `fill`/`stroke` as strings, so every chart passes `var(--primary)`,
`var(--danger)` and so on. The charts then follow the theme automatically and the token
audit stays clean.

### D43. One shared test environment, `scripts/test-env.mjs`
The four gate scripts had drifted into four copies of the jsdom setup. They now share
one, which also fixes charts under test: jsdom reports every element as 0×0, so the
shared env installs a fixed element box and a ResizeObserver that actually reports a
size.

### D44. Vite's default SSR externalisation, restored
The scripts had forced every non-React dependency to be inlined. That broke the moment
Recharts pulled in a CommonJS dependency (`use-sync-external-store`). Only React and the
router now need pinning; everything else is externalised as Vite intends.

## Phase 8 — Logistics + Finance

### D45. Aging buckets are computed in the service, not the page
`getReceivablesAging()` owns the bucket boundaries and returns amounts, invoice counts
and distinct client counts. The page only renders them, and `npm run services` asserts
that the buckets reconcile to the total open balance.

### D46. Order P&L falls back to the cost sheet when actuals are missing
Freight uses the actual shipment cost when a shipment exists and the cost sheet's
per-piece freight otherwise; overhead adds booked expenses to the cost sheet's
allowance. An order that has not shipped still shows a meaningful margin instead of a
misleading 100%.

### D47. Tracking progress is derived from ETD/ETA, not stored
A shipment's percentage complete is `(today − ETD) / (ETA − ETD)`, clamped, and forced
to 100% once it has arrived. Nothing to keep in sync, and it stays correct as the
seed's dates shift forward.

## Phase 9 — HR, Reports, Dashboards

### D48. Reports are config, and the list is permission-filtered
`reportDefinitions.jsx` holds a loader, columns, filters and a summary function per
report; `ReportsPage` is generic. Each definition also names the module it belongs to,
so the sidebar of available reports is filtered by `can()` — a QC lead does not see the
receivables report at all, rather than seeing it and being refused.

### D49. Dashboard data lives in `dashboardData.js`, not in the components
`getExecutiveSummary()` and `getRoleDashboard(role)` assemble everything from the mock
db in one pass. That keeps the components presentational and makes the numbers
assertable from the gate scripts.

### D50. One dashboard route, two dashboards
`/app/dashboard` renders the executive view for CXO and SUPER_ADMIN and the role view
for everyone else. The route stays single so every navigation, breadcrumb and redirect
can point at one path.

### D51. The needs-attention queue is derived, never stored
Each role's queue is computed from live data — delayed orders, pending samples, open
POs, failed inspections, overdue invoices, pending leave — so it can never go stale
against the records it points at.

### D52. `chartTheme.js` is separate from `ChartCard.jsx`
`react-refresh/only-export-components` rejects a component file that also exports
constants. The Recharts colour, tooltip, axis and legend styles now live in their own
module, which is also where any future chart picks them up from.

## Phase 10 — Website + Client portal

### D53. The contact form writes a real record
Rather than faking a success screen, the form calls `leadService.create` and shows the
new lead id, then points the visitor at CRM → Leads. It is the clearest demonstration
that the website and the ERP are one application.

### D54. The portal reuses the internal sample decision path
`PortalApprovalsPage` calls the same `decideSample()` the internal Design module uses
and renders the same `SampleDecisionModal`, only with `decidedBy: 'CLIENT'`. There is no
second code path that could drift, and `npm run crud` proves the round trip.

### D55. Portal scoping is enforced at the query and at the record
Every portal query filters by the signed-in user's `clientId`, and the single-order page
additionally checks `order.clientId` before rendering. A guessed URL gets a not-found
state, not another brand's order.

### D56. The public site is copy, not lorem
Every page carries real domain writing — MOQs, lead times, AQL levels, certifications,
and a sustainability table that admits what is still in progress. The one place the
demo is called out is the clients page, where the brands are fictional.

## Phase 11 — Polish

### D57. The command palette builds its index only while open
`useCommandItems(enabled)` returns `[]` unless the palette is open, so the thousands
of searchable rows are never assembled during normal navigation. The index is also
permission-filtered, so a role cannot find a record through search that it could not
reach through the sidebar.

### D58. Code splitting is per module, and the overlays too
`src/app/pages.js` holds 59 `React.lazy` imports; each layout wraps its `Outlet` in
Suspense. The notifications panel and the command palette load on first open, and
`UserMenu` imports the mock db inside its reset handler. The result: the marketing site
never downloads the ERP, and the entry bundle fell from 2,550 kB to 354 kB.

### D59. The gate scripts poll instead of sleeping
Lazy chunks made every fixed `setTimeout` wait flaky. `smoke.mjs` and `check-crud.mjs`
now poll until the expected content is on screen, with a deadline. Faster in the common
case and correct in the slow one.

### D60. `CardTitle` is an `<h2>`
The accessibility audit caught cards rendering `<h3>` directly beneath a page's `<h1>`.
Cards are sections of the page, so `h2` is correct; `CardTitle` takes an `as` prop for
the rare nested case.

### D61. The dark-mode audit runs on the rendered DOM
The static token audit catches hardcoded colours in source. The rendered pass catches
what it cannot see: an inline `style` that resolves to a literal colour. Colour swatches
— which render master data — are the one documented exception.

### D62. `chunkSizeWarningLimit` is raised, with the reason in the config
The only chunk over 500 kB is the seeded database. It is code-split away from the
public site and gzips to 95 kB, so the default warning is noise here. The limit is
raised to 1000 with a comment stating exactly that, rather than silently.

## Phase 12 — Browser verification

### D63. The React Compiler is disabled, on correctness grounds
It hoists property reads from a closure into its memoisation guard without preserving
null-safety. Two shapes, both of which the app uses widely:

```js
useMemo(() => data?.leaves ?? [], [data])
  → if ($[3] !== data.leaves) { … }          // throws while data is undefined

const save = async () => { …editing.id… }
  → if ($[6] !== editing.id || …) { … }      // throws while editing is null
```

That crashed three pages outright and made every component-body function touching a
nullable value a latent render crash. Auto-memoisation buys nothing at this app's
scale, so the optimisation loses to correctness. `vite.config.js` carries the evidence
so nobody re-enables it without understanding why it was off.

### D64. jsdom was not enough, so the gate now runs a real browser
Every jsdom check passed while three pages were broken, because the Babel transform
only runs in the client build and jsdom has no layout engine. `npm run browser` drives
Chromium over all 72 routes at desktop and phone width and reports uncaught errors,
console errors, failed requests, empty renders, horizontal overflow — naming the
offending element — and sidebar behaviour. It immediately found three mobile overflow
bugs the static audit could not see.

### D65. The sidebar needed a bounded height, not just `overflow-y-auto`
`flex-1 overflow-y-auto` on the nav does nothing while the `<aside>` itself is
unbounded: it simply grew past the viewport and the page scrolled. `lg:sticky lg:top-0
lg:h-screen` on the aside plus `min-h-0` on the nav is what actually makes it scroll
internally. (`min-h-0` matters because a flex child's default `min-height: auto`
refuses to shrink below its content.)

### D66. The sidebar is an accordion, with the route still leading
One group open at a time. The open group defaults to whichever holds the current
route; once the user picks one, their choice wins until they navigate into a different
module. Storing the override alongside the active group it was made against keeps that
re-sync free of an effect.

### D67. `min-width: auto` is why flex and grid children overflow
Three mobile overflows had the same cause: a grid/flex child will not shrink below its
content's intrinsic width unless told to. `min-w-0` on the container and letting rows
wrap fixed all three. Worth remembering — it is invisible to any non-layout test.
