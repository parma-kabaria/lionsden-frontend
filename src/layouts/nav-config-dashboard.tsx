import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NavItem = {
  subheader?: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  permission?: string;
};

export const navBadge = (count: number) => {
  if (!count || count <= 0) return null;

  return (
    <Box
      sx={{
        bgcolor: '#ff4842',
        color: '#fff',
        borderRadius: '10px',
        minWidth: 18,
        height: 18,
        px: 0.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        ml: 'auto',
        lineHeight: 1,
      }}
    >
      {count > 99 ? '99+' : count}
    </Box>
  );
};

export const navData: NavItem[] = [
  // DASHBOARD
  {
    subheader: 'DASHBOARD',
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon="solar:home-2-bold" width={22} />,
    permission: 'dashboard:read',
  },
  // MANAGEMENT
  {
    subheader: 'MANAGEMENT',
    title: 'Bungalows',
    path: '/bungalows',
    icon: <Iconify icon="solar:home-smile-angle-outline" width={22} />,
    permission: 'bungalows:read',
  },
  {
    title: 'Bookings',
    path: '/bookings',
    icon: <Iconify icon="solar:calendar-date-outline" width={22} />,
    permission: 'bookings:read',
  },
  {
    title: 'Check Availability',
    path: '/availability',
    icon: <Iconify icon="solar:calendar-search-outline" width={22} />,
    permission: 'availability:search',
  },
  {
    title: 'Peak Pricing & Festival',
    path: '/pricing',
    icon: <Iconify icon="solar:calendar-mark-bold" width={22} />,
    permission: 'pricing:read',
  },
  {
    title: 'Negotiation Requests',
    path: '/negotiations',
    icon: <Iconify icon="solar:hand-money-bold" width={22} />,
    permission: 'negotiations:read',
  },
  {
    title: 'Payments & Collections',
    path: '/payments',
    icon: <Iconify icon="solar:card-outline" width={22} />,
    permission: 'payments:read',
  },
  {
    title: 'Maintenance Requests',
    path: '/maintenance',
    icon: <Iconify icon="solar:wrench-bold" width={22} />,
    permission: 'maintenance:read',
  },
  // USERS & ACCESS
  {
    subheader: 'USERS & ACCESS',
    title: 'Users',
    path: '/users',
    icon: <Iconify icon="solar:user-outline" width={22} />,
    permission: 'users:read',
  },
  {
    title: 'Roles & Permissions',
    path: '/roles',
    icon: <Iconify icon="solar:shield-keyhole-outline" width={22} />,
    permission: 'roles:manage',
  },
  {
    title: 'Branches',
    path: '/branches',
    icon: <Iconify icon="solar:map-point-wave-outline" width={22} />,
    permission: 'branches:read',
  },
  // REPORTS
  {
    subheader: 'REPORTS',
    title: 'Reports',
    path: '/reports',
    icon: <Iconify icon="solar:chart-2-outline" width={22} />,
    permission: 'reports:read',
  },
  {
    title: 'Booking History',
    path: '/bookings',
    icon: <Iconify icon="solar:history-outline" width={22} />,
    permission: 'bookings:read',
  },
  {
    title: 'Activity Logs',
    path: '/audit-logs',
    icon: <Iconify icon="solar:document-text-outline" width={22} />,
    permission: 'audit_logs:read',
  },
];
