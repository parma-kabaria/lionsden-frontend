import type { StackProps } from '@mui/material/Stack';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function NavUpgrade({ sx, ...other }: StackProps) {
  return (
    <Box
      sx={[
        {
          mb: 3,
          p: 2,
          mx: 2,
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          bgcolor: 'action.hover',
          borderRadius: 1.5,
          border: '1px dashed',
          borderColor: 'divider',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'fontWeightBold', color: 'primary.main' }}>
        LionsDen Resorts HQ
      </Typography>

      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
        Ahmedabad & Dhari Gir
      </Typography>

      <Chip label="System v1.0.0" size="small" variant="outlined" color="primary" sx={{ fontSize: 10 }} />
    </Box>
  );
}
