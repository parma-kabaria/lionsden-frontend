import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function Searchbar({ sx, ...other }: BoxProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2,
        py: 0.75,
        borderRadius: 30,
        bgcolor: '#f4f7fb',
        width: { xs: 180, sm: 260, md: 340 },
        border: '1px solid #e2ecf6',
        transition: 'all 0.2s',
        '&:focus-within': {
          bgcolor: '#fff',
          borderColor: '#1d68d8',
          boxShadow: '0 0 0 3px rgba(29, 104, 216, 0.1)',
        },
        ...sx,
      }}
      {...other}
    >
      <Iconify icon="solar:magnifer-linear" width={18} sx={{ color: 'text.secondary' }} />
      <InputBase
        placeholder="Search bungalow, booking, customer..."
        sx={{
          fontSize: 13,
          color: 'text.primary',
          flex: 1,
          '& input': {
            p: 0,
            '&::placeholder': {
              color: '#8c9ba8',
              opacity: 1,
            },
          },
        }}
      />
    </Box>
  );
}
