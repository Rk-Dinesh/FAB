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
import { UiKitPage } from '@/features/ui-kit/pages/UiKitPage'
import { RouteError } from './RouteError'

/** Convenience wrapper for routes whose module arrives in a later phase. */
const soon = (title, description, phase) => ({
  element: <Placeholder title={title} description={description} phase={phase} />,
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
      { path: 'login', ...soon('Sign in', 'Mock login with quick role switching.', 'phase 2') },
      {
        path: 'forgot-password',
        ...soon('Reset password', 'Mock password reset.', 'phase 2'),
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  {
    path: '/app',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'ui-kit', element: <UiKitPage /> },
    ],
  },
  {
    path: '/portal',
    element: <ClientPortalLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/portal/orders" replace /> },
      { path: 'orders', ...soon('My orders', 'Your live and closed orders.', 'phase 10') },
      { path: 'approvals', ...soon('Approvals', 'Samples awaiting your decision.', 'phase 10') },
      { path: 'shipments', ...soon('Shipments', 'Booking and tracking.', 'phase 10') },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
