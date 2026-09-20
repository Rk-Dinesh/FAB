Read CLAUDE.md fully. You are building the entire ApparelFlow ERP mock frontend
autonomously, end to end, without asking me questions. Make reasonable decisions
yourself and log them in DECISIONS.md.

## Execution protocol
1. First, create PROGRESS.md with a checklist of all 11 phases below and their
   sub-tasks. Update it after every sub-task (✅ done / 🔄 in progress / ⚠️ issue).
2. Work strictly in phase order. Don't start a phase until the previous one passes
   its quality gate.
3. Quality gate after EVERY phase:
   - `npm run build` passes with zero errors
   - `npm run lint` passes (fix everything, don't disable rules)
   - Start the dev server and confirm every new route renders without console errors
   - Check the new screens in both light and dark mode
   - `git add -A && git commit -m "phase X: <summary>"`
4. If something fails, fix it and re-run the gate. If you're stuck after 3 attempts,
   log it in PROGRESS.md under "Known issues", pick a simpler working solution, and
   continue. Never stop the run.
5. If context gets long, re-read CLAUDE.md and PROGRESS.md before continuing, so the
   conventions stay consistent.
6. Reuse, don't duplicate: before building any component, check
   src/components first.

## Phases
### Phase 1: Foundation
Vite + React + JS scaffold, all dependencies from CLAUDE.md, Tailwind v4 with
semantic CSS-variable tokens, a light/dark/system theme with no flash, cn() util,
UI primitives (Button, Input, Select, Textarea, Checkbox, Switch, Badge, Card, Tabs,
Modal, Drawer, Dropdown, Tooltip, Avatar, Skeleton, Toast, Stepper, Progress,
EmptyState), the 4 layouts (Public, Auth, App, ClientPortal), and a /app/ui-kit
demo page.

### Phase 2: Auth + RBAC
Mock login (email/password plus quick-login role cards), Zustand persisted auth
store, config/roles.js, config/permissions.js, a `can()` helper, the <Can>
component, ProtectedRoute, a sidebar generated from config/navigation.js filtered
by permission, the topbar (search trigger, notifications, theme toggle, dev role
switcher, profile menu), breadcrumbs, 403 and 404 pages, and the forgot-password
page.

### Phase 3: Mock data layer
All seed JSON in src/mocks/data with relational, consistent IDs per the CLAUDE.md
volumes. A generic createService() factory (getAll with filter/sort/paginate,
getById, create, update, remove, 300–600ms delay, in-memory plus localStorage
persistence, and a "Reset demo data" action). One service file per module.
config/statuses.js as the single source of truth for statuses and stages.

### Phase 4: Masters + Admin
Shared DataTable (sort, search, filters, pagination, column visibility, row
select, CSV export), FilterBar, PageHeader, StatusBadge. A generic config-driven
MastersCRUD with drawer forms (react-hook-form + zod), and all master pages. Admin:
users, roles with an editable permission matrix, audit log, settings.

### Phase 5: CRM, Design, Costing
Leads (kanban with dnd-kit plus list view, where the "Convert to enquiry" action
moves the status), clients, enquiries, activity log. Design requests, tech packs,
and samples (Proto/Fit/Size set/PP) with an approve/reject-with-comments flow.
Cost sheets with live FOB and margin calculation, plus versions and quotations.

### Phase 6: Orders + Order 360
Orders list with status filters, a multi-step order creation wizard (client and
style → color × size qty matrix → dates and T&A → pricing → review), and the full
Order 360 page with all tabs exactly as defined in CLAUDE.md, including delay
highlighting and a risk badge.

### Phase 7: Sourcing, Production, Quality
Vendors (with rating), RFQ, a side-by-side quote comparison that marks the best
price, material PO, and GRN. Factory allocation, a stage tracker (per-stage
progress bars, update-output drawer), daily output, a production Gantt/timeline,
and delay alerts. QC inspections (inline/final AQL 2.5, pass/fail) and a defect
log.

### Phase 8: Logistics + Finance
Shipments (planning, booking, documents CI/PL/BL, tracking timeline). AR invoices,
AP bills, payments, expenses, and an order-wise P&L (revenue vs material, CMT,
freight, and overhead → margin %), plus receivables aging.

### Phase 9: HR, Reports, Dashboards
Employees, departments, attendance calendar, leave apply/approve, payroll (mock
payslip). Reports with filters and export. The CXO executive dashboard and a
role-specific home dashboard for every role, with KPIs, charts, and "Needs
attention" lists.

### Phase 10: Website + Client portal
A public marketing site (home, about, services, capabilities, clients,
sustainability, contact form that creates a mock lead), polished and responsive.
The client portal: my orders, a tracking timeline, pending sample approvals the
client can approve or reject (which reflects in the internal app), and shipments.

### Phase 11: Polish
⌘K global search (orders, clients, vendors, employees, pages), a notifications
panel, loading/empty/error states on every page, mobile responsiveness on every
screen, keyboard and focus accessibility, consistent spacing, and a final
dark-mode audit. Remove dead code.

## Final deliverable
When all phases pass, update README.md with the setup steps, the demo login
credentials table (one row per role), the module list, the folder structure, and
how to swap the mock services for a real API. Then give me a final summary: what
was built, the known issues, and suggested next steps.

Start now with Phase 1.