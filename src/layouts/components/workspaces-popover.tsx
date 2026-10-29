import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useBranch } from 'src/context/branch-context';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type WorkspacesPopoverProps = ButtonBaseProps & {
  data?: {
    id: string;
    name: string;
    logo: string;
    plan: string;
  }[];
};

export function WorkspacesPopover({ data = [], sx, ...other }: WorkspacesPopoverProps) {
  const { selectedBranchId, setSelectedBranchId, branches } = useBranch();

  // Combine static fallback with dynamic branches
  const options = [
    {
      id: '',
      name: 'Consolidated (All)',
      logo: '/assets/icons/workspaces/logo-1.webp',
      plan: 'GLOBAL',
      roleNote: 'HQ & Resort Operations',
    },
    ...branches.map((b) => ({
      id: b._id,
      name: b.code === 'DHARI' ? 'Dhari (Gir Resort)' : 'Ahmedabad (Head Office)',
      logo: b.code === 'DHARI' ? '/Logo/square-logo.jpeg' : '/assets/icons/workspaces/logo-2.webp',
      plan: b.code === 'DHARI' ? 'RESORT' : 'HEAD OFFICE',
      roleNote: b.code === 'DHARI' ? 'Physical Resort Location' : 'Corporate Sales Desk',
    })),
  ];

  const currentWorkspace = options.find(o => o.id === selectedBranchId) || options[0];

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleChangeWorkspace = useCallback(
    (option: (typeof options)[number]) => {
      setSelectedBranchId(option.id);
      handleClosePopover();
    },
    [handleClosePopover, setSelectedBranchId]
  );

  const renderAvatar = (alt: string, src: string) => (
    <Box component="img" alt={alt} src={src} sx={{ width: 24, height: 24, borderRadius: '50%' }} />
  );


  return (
    <>
      <ButtonBase
        disableRipple
        onClick={handleOpenPopover}
        sx={{
          p: 1.25,
          width: 1,
          borderRadius: 2,
          textAlign: 'left',
          justifyContent: 'flex-start',
          bgcolor: '#f4f8fd',
          border: '1px solid #e1ecfa',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: '#eaf3fd',
            borderColor: '#bcd7fb',
          },
          ...sx,
        }}
        {...other}
      >
        <Box
          component="img"
          alt="Branch"
          src="/Logo/square-logo.jpeg"
          sx={{ width: 42, height: 42, borderRadius: 1.5, objectFit: 'contain', bgcolor: '#fff', border: '1px solid #edf2f7' }}
        />

        <Box sx={{ flexGrow: 1, minWidth: 0, ml: 1.25 }}>
          <Box component="span" sx={{ color: 'text.secondary', fontSize: 11, display: 'block', lineHeight: 1.2 }}>
            Current Branch
          </Box>
          <Box component="span" sx={{ fontWeight: 700, fontSize: 13.5, color: '#1a202c', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentWorkspace?.name}
          </Box>
        </Box>

        <Iconify width={16} icon="solar:alt-arrow-down-bold" sx={{ color: 'text.secondary', ml: 0.5 }} />
      </ButtonBase>

      <Popover open={!!openPopover} anchorEl={openPopover} onClose={handleClosePopover}>
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              p: 1.5,
              gap: 1.5,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: {
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {options.map(option => (
            <MenuItem
              key={option.id}
              selected={option.id === selectedBranchId}
              onClick={() => handleChangeWorkspace(option)}
            >
              {renderAvatar(option.name, option.logo)}

              <Box component="span" sx={{ flexGrow: 1, typography: 'body2' }}>
                <Box component="span" sx={{ fontWeight: 600, display: 'block', color: 'text.primary' }}>
                  {option.name}
                </Box>
                {option.roleNote && (
                  <Box component="span" sx={{ fontSize: 11, color: 'text.secondary', display: 'block' }}>
                    {option.roleNote}
                  </Box>
                )}
              </Box>

              <Label color={option.plan === 'RESORT' ? 'success' : option.plan === 'HEAD OFFICE' ? 'info' : 'default'}>
                {option.plan}
              </Label>
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}
