import { Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ClientPortalLayout } from '@/layouts/ClientPortalLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/website/HomePage'
import { AboutPage } from '@/pages/website/AboutPage'
import { ServicesPage } from '@/pages/website/ServicesPage'
import { CapabilitiesPage } from '@/pages/website/CapabilitiesPage'
import { ClientsPage as WebsiteClientsPage } from '@/pages/website/ClientsPage'
import { SustainabilityPage } from '@/pages/website/SustainabilityPage'
import { ContactPage } from '@/pages/website/ContactPage'
import { PortalOrdersPage } from '@/features/portal/pages/PortalOrdersPage'
import { PortalOrderPage } from '@/features/portal/pages/PortalOrderPage'
import { PortalApprovalsPage } from '@/features/portal/pages/PortalApprovalsPage'
import { PortalShipmentsPage } from '@/features/portal/pages/PortalShipmentsPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { UiKitPage } from '@/features/ui-kit/pages/UiKitPage'
import { MastersPage } from '@/features/masters/pages/MastersPage'
import { EmployeesPage } from '@/features/hr/pages/EmployeesPage'
import { DepartmentsPage } from '@/features/hr/pages/DepartmentsPage'
import { AttendancePage } from '@/features/hr/pages/AttendancePage'
import { LeavePage } from '@/features/hr/pages/LeavePage'
import { PayrollPage } from '@/features/hr/pages/PayrollPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { ShipmentsPage } from '@/features/logistics/pages/ShipmentsPage'
import { DocumentsPage } from '@/features/logistics/pages/DocumentsPage'
import { TrackingPage } from '@/features/logistics/pages/TrackingPage'
import { InvoicesPage } from '@/features/finance/pages/InvoicesPage'
import { BillsPage } from '@/features/finance/pages/BillsPage'
import { PaymentsPage } from '@/features/finance/pages/PaymentsPage'
import { ExpensesPage } from '@/features/finance/pages/ExpensesPage'
import { OrderPnlPage } from '@/features/finance/pages/OrderPnlPage'
import { ClientUpdatesPage } from '@/features/clientUpdates/pages/ClientUpdatesPage'
import { VendorsPage } from '@/features/sourcing/pages/VendorsPage'
import { RfqPage } from '@/features/sourcing/pages/RfqPage'
import { QuoteComparisonPage } from '@/features/sourcing/pages/QuoteComparisonPage'
import { MaterialPoPage } from '@/features/sourcing/pages/MaterialPoPage'
import { GrnPage } from '@/features/sourcing/pages/GrnPage'
import { AllocationPage } from '@/features/production/pages/AllocationPage'
import { StageTrackerPage } from '@/features/production/pages/StageTrackerPage'
import { DailyOutputPage } from '@/features/production/pages/DailyOutputPage'
import { GanttPage } from '@/features/production/pages/GanttPage'
import { InspectionsPage } from '@/features/quality/pages/InspectionsPage'
import { DefectsPage } from '@/features/quality/pages/DefectsPage'
import { OrdersPage } from '@/features/orders/pages/OrdersPage'
import { OrderNewPage } from '@/features/orders/pages/OrderNewPage'
import { Order360Page } from '@/features/orders/pages/Order360Page'
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
      { path: 'about', element: <AboutPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'capabilities', element: <CapabilitiesPage /> },
      { path: 'clients', element: <WebsiteClientsPage /> },
      { path: 'sustainability', element: <SustainabilityPage /> },
      { path: 'contact', element: <ContactPage /> },
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
            { path: 'orders', element: <OrdersPage /> },
            { path: 'orders/new', element: <OrderNewPage /> },
            { path: 'orders/:id', element: <Order360Page /> },
          ]),
          guarded('sourcing', [
            { path: 'sourcing', element: <Navigate to="/app/sourcing/vendors" replace /> },
            { path: 'sourcing/vendors', element: <VendorsPage /> },
            { path: 'sourcing/rfq', element: <RfqPage /> },
            { path: 'sourcing/quote-comparison', element: <QuoteComparisonPage /> },
            { path: 'sourcing/material-po', element: <MaterialPoPage /> },
            { path: 'sourcing/grn', element: <GrnPage /> },
          ]),
          guarded('production', [
            { path: 'production', element: <Navigate to="/app/production/tracker" replace /> },
            { path: 'production/allocation', element: <AllocationPage /> },
            { path: 'production/tracker', element: <StageTrackerPage /> },
            { path: 'production/daily-output', element: <DailyOutputPage /> },
            { path: 'production/gantt', element: <GanttPage /> },
          ]),
          guarded('quality', [
            { path: 'quality', element: <Navigate to="/app/quality/inspections" replace /> },
            { path: 'quality/inspections', element: <InspectionsPage /> },
            { path: 'quality/defects', element: <DefectsPage /> },
          ]),
          guarded('logistics', [
            { path: 'logistics', element: <Navigate to="/app/logistics/shipments" replace /> },
            { path: 'logistics/shipments', element: <ShipmentsPage /> },
            { path: 'logistics/documents', element: <DocumentsPage /> },
            { path: 'logistics/tracking', element: <TrackingPage /> },
          ]),
          guarded('clientUpdates', [
            { path: 'client-updates', element: <ClientUpdatesPage /> },
          ]),
          guarded('finance', [
            { path: 'finance', element: <Navigate to="/app/finance/invoices" replace /> },
            { path: 'finance/invoices', element: <InvoicesPage /> },
            { path: 'finance/bills', element: <BillsPage /> },
            { path: 'finance/payments', element: <PaymentsPage /> },
            { path: 'finance/expenses', element: <ExpensesPage /> },
            { path: 'finance/order-pnl', element: <OrderPnlPage /> },
          ]),
          guarded('hr', [
            { path: 'hr', element: <Navigate to="/app/hr/employees" replace /> },
            { path: 'hr/employees', element: <EmployeesPage /> },
            { path: 'hr/departments', element: <DepartmentsPage /> },
            { path: 'hr/attendance', element: <AttendancePage /> },
            { path: 'hr/leave', element: <LeavePage /> },
            { path: 'hr/payroll', element: <PayrollPage /> },
          ]),
          guarded('reports', [
            { path: 'reports', element: <ReportsPage /> },
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
          { path: 'orders', element: <PortalOrdersPage /> },
          { path: 'orders/:id', element: <PortalOrderPage /> },
          { path: 'approvals', element: <PortalApprovalsPage /> },
          { path: 'shipments', element: <PortalShipmentsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
