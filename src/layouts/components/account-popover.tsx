import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useAuth } from 'src/auth/auth-context';

// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountPopover({ sx, ...other }: AccountPopoverProps) {
  const { user, logout } = useAuth();
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleLogout = async () => {
    handleClosePopover();
    await logout();
  };

  const displayName = user?.name || 'Staff User';
  const displayEmail = user?.email || 'staff@lionsdenresorts.com';
  const roleCode =
    typeof user?.role === 'object' && user.role !== null ? user.role.name || user.role.code : user?.role || 'Staff';

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={handleOpenPopover}
        sx={{
          border: 'none',
          bgcolor: 'transparent',
          cursor: 'pointer',
          py: 0.5,
          px: { xs: 0.5, sm: 1 },
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          ...sx,
        }}
      >
        <Avatar
          alt={displayName}
          src="/assets/images/avatar/avatar-25.webp"
          sx={{ width: 36, height: 36, bgcolor: '#1d68d8', fontSize: 14, fontWeight: 700 }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ textAlign: 'left', display: { xs: 'none', md: 'block' } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: '#1a202c', lineHeight: 1.2 }}>
            {displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, display: 'block', lineHeight: 1.2 }}>
            {roleCode}
          </Typography>
        </Box>

        <Box component="span" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' }, ml: 0.25, fontSize: 12 }}>
          ▼
        </Box>
      </Box>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 240 },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }} noWrap>
            {displayEmail}
          </Typography>

          <Chip
            size="small"
            color="primary"
            variant="filled"
            label={roleCode}
            sx={{ fontWeight: 'fontWeightBold' }}
          />
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button fullWidth color="error" size="medium" variant="outlined" onClick={handleLogout}>
            Sign Out
          </Button>
        </Box>
      </Popover>
    </>
  );
}
