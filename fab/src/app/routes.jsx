import { Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ClientPortalLayout } from '@/layouts/ClientPortalLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/website/HomePage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { Placeholder } from '@/pages/Placeholder'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { UiKitPage } from '@/features/ui-kit/pages/UiKitPage'
import { MastersPage } from '@/features/masters/pages/MastersPage'
import { LeadsPage } from '@/features/crm/pages/LeadsPage'
import { ClientsPage } from '@/features/crm/pages/ClientsPage'
import { EnquiriesPage } from '@/features/crm/pages/EnquiriesPage'
import { DesignRequestsPage } from '@/features/design/pages/DesignRequestsPage'
import { TechPacksPage } from '@/features/design/pages/TechPacksPage'
import { SamplesPage } from '@/features/design/pages/SamplesPage'
import { CostSheetsPage } from '@/features/costing/pages/CostSheetsPage'
import { QuotationsPage } from '@/features/costing/pages/QuotationsPage'
import { UsersPage } from '@/features/admin/pages/UsersPage'
import { RolesPage } from '@/features/admin/pages/RolesPage'
import { AuditLogPage } from '@/features/admin/pages/AuditLogPage'
import { SettingsPage } from '@/features/admin/pages/SettingsPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RouteError } from './RouteError'

/** Route whose module arrives in a later phase. */
const soon = (title, description, phase) => ({
  element: <Placeholder title={title} description={description} phase={phase} />,
})

/**
 * A permission-guarded subtree of the app area.
 * @param {string} module
 * @param {Array<object>} children
 */
const guarded = (module, children) => ({
  element: <ProtectedRoute module={module} />,
  children,
})

/** @type {import('react-router-dom').RouteObject[]} */
export const routes = [
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', ...soon('About', 'Who we are and how we work.', 'phase 10') },
      { path: 'services', ...soon('Services', 'What we take on for a brand.', 'phase 10') },
      { path: 'capabilities', ...soon('Capabilities', 'Product and volume capability.', 'phase 10') },
      { path: 'clients', ...soon('Clients', 'Brands we produce for.', 'phase 10') },
      { path: 'sustainability', ...soon('Sustainability', 'Compliance and materials.', 'phase 10') },
      { path: 'contact', ...soon('Contact', 'Start an enquiry.', 'phase 10') },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: 'ui-kit', element: <UiKitPage /> },
          guarded('dashboard', [{ path: 'dashboard', element: <DashboardPage /> }]),
          guarded('crm', [
            { path: 'crm', element: <Navigate to="/app/crm/leads" replace /> },
            { path: 'crm/leads', element: <LeadsPage /> },
            { path: 'crm/clients', element: <ClientsPage /> },
            { path: 'crm/enquiries', element: <EnquiriesPage /> },
          ]),
          guarded('design', [
            { path: 'design', element: <Navigate to="/app/design/requests" replace /> },
            { path: 'design/requests', element: <DesignRequestsPage /> },
            { path: 'design/tech-packs', element: <TechPacksPage /> },
            { path: 'design/samples', element: <SamplesPage /> },
          ]),
          guarded('costing', [
            { path: 'costing', element: <Navigate to="/app/costing/cost-sheets" replace /> },
            { path: 'costing/cost-sheets', element: <CostSheetsPage /> },
            { path: 'costing/quotations', element: <QuotationsPage /> },
          ]),
          guarded('orders', [
            { path: 'orders', ...soon('Orders', 'Every order across the lifecycle.', 'phase 6') },
            { path: 'orders/new', ...soon('New order', 'Order creation wizard.', 'phase 6') },
            { path: 'orders/:id', ...soon('Order 360', 'The full order record.', 'phase 6') },
          ]),
          guarded('sourcing', [
            { path: 'sourcing/vendors', ...soon('Vendors', 'Mills, trims, factories, washing.', 'phase 7') },
            { path: 'sourcing/rfq', ...soon('RFQ', 'Requests for quotation.', 'phase 7') },
            { path: 'sourcing/quote-comparison', ...soon('Quote comparison', 'Best price side by side.', 'phase 7') },
            { path: 'sourcing/material-po', ...soon('Material PO', 'Purchase orders to vendors.', 'phase 7') },
            { path: 'sourcing/grn', ...soon('GRN', 'Goods received notes.', 'phase 7') },
          ]),
          guarded('production', [
            { path: 'production/allocation', ...soon('Allocation', 'Orders to factories.', 'phase 7') },
            { path: 'production/tracker', ...soon('Stage tracker', 'Progress by production stage.', 'phase 7') },
            { path: 'production/daily-output', ...soon('Daily output', 'Line output per day.', 'phase 7') },
            { path: 'production/gantt', ...soon('Gantt', 'Stage timeline across orders.', 'phase 7') },
          ]),
          guarded('quality', [
            { path: 'quality/inspections', ...soon('Inspections', 'Inline and final AQL 2.5.', 'phase 7') },
            { path: 'quality/defects', ...soon('Defect log', 'Defects by type and severity.', 'phase 7') },
          ]),
          guarded('logistics', [
            { path: 'logistics/shipments', ...soon('Shipments', 'Planning and booking.', 'phase 8') },
            { path: 'logistics/documents', ...soon('Documents', 'CI, PL and BL.', 'phase 8') },
            { path: 'logistics/tracking', ...soon('Tracking', 'In-transit milestones.', 'phase 8') },
          ]),
          guarded('clientUpdates', [
            { path: 'client-updates', ...soon('Client updates', 'What the brand has been told.', 'phase 8') },
          ]),
          guarded('finance', [
            { path: 'finance/invoices', ...soon('Invoices (AR)', 'Receivables.', 'phase 8') },
            { path: 'finance/bills', ...soon('Bills (AP)', 'Vendor payables.', 'phase 8') },
            { path: 'finance/payments', ...soon('Payments', 'Received and paid.', 'phase 8') },
            { path: 'finance/expenses', ...soon('Expenses', 'Overheads and claims.', 'phase 8') },
            { path: 'finance/order-pnl', ...soon('Order P&L', 'Margin per order.', 'phase 8') },
          ]),
          guarded('hr', [
            { path: 'hr/employees', ...soon('Employees', 'Own staff records.', 'phase 9') },
            { path: 'hr/departments', ...soon('Departments', 'Org structure.', 'phase 9') },
            { path: 'hr/attendance', ...soon('Attendance', 'Monthly calendar.', 'phase 9') },
            { path: 'hr/leave', ...soon('Leave', 'Apply and approve.', 'phase 9') },
            { path: 'hr/payroll', ...soon('Payroll', 'Monthly run and payslips.', 'phase 9') },
          ]),
          guarded('reports', [
            { path: 'reports', ...soon('Reports', 'Filtered, exportable reports.', 'phase 9') },
          ]),
          guarded('masters', [
            { path: 'masters', element: <Navigate to="/app/masters/company" replace /> },
            { path: 'masters/:entity', element: <MastersPage /> },
          ]),
          guarded('admin', [
            { path: 'admin', element: <Navigate to="/app/admin/users" replace /> },
            { path: 'admin/users', element: <UsersPage /> },
            { path: 'admin/roles', element: <RolesPage /> },
            { path: 'admin/audit-log', element: <AuditLogPage /> },
            { path: 'admin/settings', element: <SettingsPage /> },
          ]),
        ],
      },
    ],
  },
  {
    path: '/portal',
    element: <ProtectedRoute module="portal" area="portal" />,
    errorElement: <RouteError />,
    children: [
      {
        element: <ClientPortalLayout />,
        children: [
          { index: true, element: <Navigate to="/portal/orders" replace /> },
          { path: 'orders', ...soon('My orders', 'Your live and closed orders.', 'phase 10') },
          { path: 'orders/:id', ...soon('Order tracking', 'Milestones for one order.', 'phase 10') },
          { path: 'approvals', ...soon('Approvals', 'Samples awaiting your decision.', 'phase 10') },
          { path: 'shipments', ...soon('Shipments', 'Booking and tracking.', 'phase 10') },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
