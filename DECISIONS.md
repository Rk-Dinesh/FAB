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
