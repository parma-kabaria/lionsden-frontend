import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useMemo, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import { usePermissions } from 'src/auth/use-permissions';

import { navBadge } from '../nav-config-dashboard';
import { WorkspacesPopover } from '../components/workspaces-popover';

import type { NavItem } from '../nav-config-dashboard';
import type { WorkspacesPopoverProps } from '../components/workspaces-popover';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  workspaces: WorkspacesPopoverProps['data'];
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  workspaces,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2,
        px: 2,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
  workspaces,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2,
          px: 2,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, workspaces, sx }: NavContentProps) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const { selectedBranchId } = useBranch();

  const canReadDashboard = can('dashboard:read');
  const canReadNegotiations = can('negotiations:read');
  const canReadMaintenance = can('maintenance:read');

  // Real-time counts from dashboard summary API
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', { branchId: selectedBranchId }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/dashboard', params);
      return res?.data || null;
    },
    enabled: canReadDashboard,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  // Fallback direct count for negotiations if user lacks full dashboard permission
  const { data: pendingNegotiationsFallback = 0 } = useQuery({
    queryKey: ['negotiations-pending-count', { branchId: selectedBranchId }],
    queryFn: async () => {
      const params: Record<string, any> = { status: 'PENDING', limit: 1 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/negotiations', params);
      return res?.meta?.pagination?.total ?? (res?.data?.length || 0);
    },
    enabled: !canReadDashboard && canReadNegotiations,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  // Fallback direct count for maintenance if user lacks full dashboard permission
  const { data: openMaintenanceFallback = 0 } = useQuery({
    queryKey: ['maintenance-open-count', { branchId: selectedBranchId }],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 100 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/maintenance', params);
      const tickets: any[] = res?.data || [];
      const openStatuses = ['REPORTED', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'];
      return tickets.filter((t) => openStatuses.includes(t.status)).length;
    },
    enabled: !canReadDashboard && canReadMaintenance,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  const pendingNegotiationsCount = canReadDashboard
    ? Number(dashboardData?.actionItems?.pendingNegotiationsCount ?? 0)
    : Number(pendingNegotiationsFallback ?? 0);

  const openMaintenanceCount = canReadDashboard
    ? Number(dashboardData?.actionItems?.openMaintenanceCount ?? 0)
    : Number(openMaintenanceFallback ?? 0);

  // Filter navigation items: if user lacks permission, completely hide the module
  const filteredNavItems = useMemo(() => {
    let currentSubheader: string | undefined = undefined;

    return data.reduce<NavItem[]>((acc, item) => {
      if (item.subheader) {
        currentSubheader = item.subheader;
      }

      const hasPerm = !item.permission || can(item.permission);
      if (!hasPerm) return acc;

      const alreadyHasSubheader = acc.some((x) => x.subheader === currentSubheader);
      const shouldAttachSubheader = currentSubheader && !alreadyHasSubheader;

      let dynamicInfo = item.info;
      if (item.path === '/negotiations') {
        dynamicInfo = pendingNegotiationsCount > 0 ? navBadge(pendingNegotiationsCount) : undefined;
      } else if (item.path === '/maintenance') {
        dynamicInfo = openMaintenanceCount > 0 ? navBadge(openMaintenanceCount) : undefined;
      }

      acc.push({
        ...item,
        subheader: shouldAttachSubheader ? currentSubheader : undefined,
        info: dynamicInfo,
      });

      return acc;
    }, []);
  }, [data, can, pendingNegotiationsCount, openMaintenanceCount]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(145, 158, 171, 0.12)',
        }}
      >
        <Logo sx={{ width: '100%' }} />
      </Box>

      {slots?.topArea}

      <Scrollbar fillContent sx={{ mt: 1, mx: -0.5, px: 0.5 }}>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            component="ul"
            sx={{
              gap: 0.5,
              display: 'flex',
              flexDirection: 'column',
              p: 0,
              m: 0,
              listStyle: 'none',
            }}
          >
            {filteredNavItems.map((item) => {
              const isActived = item.path === pathname;

              return (
                <Box component="li" key={item.title}>
                  {item.subheader && (
                    <Typography
                      variant="overline"
                      sx={{
                        px: 1.5,
                        pt: item.subheader === 'DASHBOARD' ? 1.25 : 2.5,
                        pb: 0.75,
                        display: 'block',
                        fontWeight: 800,
                        fontSize: 10.5,
                        letterSpacing: 0.8,
                        color: 'text.disabled',
                      }}
                    >
                      {item.subheader}
                    </Typography>
                  )}

                  <ListItem disableGutters disablePadding>
                    <ListItemButton
                      disableGutters
                      component={RouterLink}
                      href={item.path}
                      sx={[
                        () => ({
                          pl: 1.5,
                          py: 0.9,
                          gap: 1.5,
                          pr: 1.5,
                          borderRadius: 2,
                          typography: 'body2',
                          fontWeight: 500,
                          color: '#52606d',
                          minHeight: 40,
                          fontSize: 13.5,
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': {
                            bgcolor: '#f4f6fa',
                            color: '#1a202c',
                          },
                          ...(isActived && {
                            fontWeight: 700,
                            color: '#1d68d8',
                            bgcolor: '#e8f1fd',
                            '&:hover': {
                              bgcolor: '#dceafd',
                              color: '#1756b5',
                            },
                          }),
                        }),
                      ]}
                    >
                      <Box component="span" sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.icon}
                      </Box>

                      <Box component="span" sx={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </Box>

                      {item.info && item.info}
                    </ListItemButton>
                  </ListItem>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}

      <Box sx={{ pt: 1.5, pb: 1 }}>
        <WorkspacesPopover data={workspaces} />
      </Box>
    </>
  );
}
