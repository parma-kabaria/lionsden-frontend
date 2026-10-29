import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = false,
  ...other
}: LogoProps) {
  const singleLogo = (
    <Box
      component="img"
      src="/Logo/horizontal-logo-removebg-preview.png"
      alt="Lions Den"
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1.5,
        objectFit: 'contain',
      }}
    />
  );

  const fullLogo = (
    <Box
      component="img"
      src="/Logo/horizontal-logo-removebg-preview.png"
      alt="Lions Den Resort"
      sx={{
        width: '100%',
        height: 'auto',
        maxHeight: 74,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
