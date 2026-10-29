import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthGuard, PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const AvailabilityPage = lazy(() => import('src/pages/availability'));
export const BookingsPage = lazy(() => import('src/pages/bookings'));
export const BungalowsPage = lazy(() => import('src/pages/bungalows'));
export const NegotiationsPage = lazy(() => import('src/pages/negotiations'));
export const PaymentsPage = lazy(() => import('src/pages/payments'));
export const MaintenancePage = lazy(() => import('src/pages/maintenance'));
export const PricingPage = lazy(() => import('src/pages/pricing'));
export const ReportsPage = lazy(() => import('src/pages/reports'));
export const UserPage = lazy(() => import('src/pages/user'));
export const RolesPage = lazy(() => import('src/pages/roles'));
export const BranchesPage = lazy(() => import('src/pages/branches'));
export const AuditLogsPage = lazy(() => import('src/pages/audit-logs'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: theme => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'availability',
        element: (
          <PermissionGuard permission="availability:search">
            <AvailabilityPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bookings',
        element: (
          <PermissionGuard permission="bookings:read">
            <BookingsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bungalows',
        element: (
          <PermissionGuard permission="bungalows:read">
            <BungalowsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'negotiations',
        element: (
          <PermissionGuard permission="negotiations:read">
            <NegotiationsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'payments',
        element: (
          <PermissionGuard permission="payments:read">
            <PaymentsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'maintenance',
        element: (
          <PermissionGuard permission="maintenance:read">
            <MaintenancePage />
          </PermissionGuard>
        ),
      },
      {
        path: 'pricing',
        element: (
          <PermissionGuard permission="pricing:read">
            <PricingPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <PermissionGuard permission="reports:read">
            <ReportsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <PermissionGuard permission="users:read">
            <UserPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'user',
        element: (
          <PermissionGuard permission="users:read">
            <UserPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionGuard permission="roles:manage">
            <RolesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'branches',
        element: (
          <PermissionGuard permission="branches:read">
            <BranchesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <PermissionGuard permission="audit_logs:read">
            <AuditLogsPage />
          </PermissionGuard>
        ),
      },
    ],
  },
  {
    path: 'sign-in',
    element: <SignInPage />,
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
