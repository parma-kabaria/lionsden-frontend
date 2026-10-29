import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { useAuth } from 'src/auth/auth-context';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('superadmin@lionsdenresorts.com');
  const [password, setPassword] = useState('Anshit@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'RECEPTIONIST'>('SUPER_ADMIN');

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials or server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (role: 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'RECEPTIONIST') => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'SUPER_ADMIN') {
      setEmail('superadmin@lionsdenresorts.com');
      setPassword('Anshit@123');
    } else if (role === 'BRANCH_ADMIN') {
      setEmail('dhari.admin@lionsdenresorts.com');
      setPassword('Anshit@123');
    } else if (role === 'RECEPTIONIST') {
      setEmail('receptionist@lionsdenresorts.com');
      setPassword('Anshit@123');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#f4f6f8',
      }}
    >
      {/* Left Column: Luxury Resort Showcase (Desktop only) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: '1 1 50%',
          position: 'relative',
          overflow: 'hidden',
          p: { md: 6, lg: 8 },
          background: 'linear-gradient(145deg, #061c14 0%, #0c2b20 50%, #0d233a 100%)',
          color: '#ffffff',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/assets/images/resort-premium.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.22,
            filter: 'saturate(1.2)',
          },
        }}
      >
        {/* Top Logo Glass Card */}
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(10px)',
              px: 2.5,
              py: 1.25,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
            }}
          >
            <Box
              component="img"
              src="/Logo/horizontal-logo-removebg-preview.png"
              alt="Lions Den Resort"
              sx={{ height: 48, objectFit: 'contain' }}
            />
          </Box>
        </Box>

        {/* Center Content */}
        <Box sx={{ position: 'relative', zIndex: 2, my: 'auto', py: 4, maxWidth: 540 }}>
          {/* Gir Forest Tag */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.75,
              py: 0.6,
              borderRadius: '20px',
              bgcolor: 'rgba(255, 171, 0, 0.15)',
              border: '1px solid rgba(255, 171, 0, 0.35)',
              color: '#ffab00',
              fontWeight: 700,
              fontSize: 12.5,
              mb: 3,
            }}
          >
            <Iconify icon="solar:crown-star-bold" width={16} />
            Gir Forest, Gujarat • Luxury Resort & Adventure Park
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              mb: 2,
              letterSpacing: '-0.5px',
            }}
          >
            Resort Management & Operations Portal
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.76)',
              fontSize: 15.5,
              lineHeight: 1.7,
              mb: 4,
            }}
          >
            Integrated enterprise suite for bungalow bookings, guest relations, dynamic seasonal pricing, maintenance
            workflows, and multi-branch revenue tracking.
          </Typography>

          {/* 3 Value Pillars */}
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 167, 111, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00a76f',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="solar:home-smile-bold" width={22} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
                  Luxury Bungalows & Villa Inventories
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  Seamless live management across Ahmedabad & Dhari resort branches
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: 'rgba(29, 104, 216, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4094f7',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="solar:calendar-date-bold" width={22} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
                  Instant Check-In & Financial Settlements
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  Front-desk key handover, balance collections, UPI and cash payments
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Bottom Tagline */}
        <Box sx={{ position: 'relative', zIndex: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
            LionsDen Enterprise PMS v1.0 • Authorized Resort Personnel Only
          </Typography>
        </Box>
      </Box>

      {/* Right Column: Sign In Form */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '1 1 50%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2.5, sm: 4, md: 6 },
          position: 'relative',
        }}
      >
        <Card
          sx={{
            width: 1,
            maxWidth: 440,
            p: { xs: 3, sm: 4 },
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.08)',
            borderRadius: 2.5,
            border: '1px solid rgba(145, 158, 171, 0.16)',
            bgcolor: '#ffffff',
          }}
        >
          {/* Header & Brand Logo */}
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box
              component="img"
              src="/Logo/horizontal-logo-removebg-preview.png"
              alt="LionsDen Resort"
              sx={{
                height: 58,
                maxWidth: 220,
                objectFit: 'contain',
                mx: 'auto',
                mb: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Staff Portal Sign In
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13.5 }}>
              Enter your credentials to access resort management
            </Typography>
          </Box>

          {/* Error Banner */}
          {errorMsg && (
            <Alert
              severity="error"
              onClose={() => setErrorMsg('')}
              sx={{
                mb: 3,
                fontSize: 13,
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 86, 48, 0.08)',
                color: '#de350b',
                border: '1px solid rgba(255, 86, 48, 0.25)',
              }}
            >
              {errorMsg}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSignIn} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              name="email"
              label="Staff Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. staff@lionsdenresorts.com"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:letter-bold" width={18} sx={{ color: '#1d68d8' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              name="password"
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:lock-password-bold" width={18} sx={{ color: '#1d68d8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    sx={{ color: '#1d68d8', '&.Mui-checked': { color: '#1d68d8' } }}
                  />
                }
                label={<Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>Remember me</Typography>}
              />

              <Link
                href="#"
                onClick={e => {
                  e.preventDefault();
                  alert('For password resets or login assistance, please contact the System Administrator or IT Helpdesk.');
                }}
                sx={{ fontSize: 12.5, color: '#1d68d8', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Need help?
              </Link>
            </Box>

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={!loading && <Iconify icon="solar:login-2-bold" width={18} />}
              sx={{
                py: 1.3,
                fontSize: 15,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 1.5,
                bgcolor: '#1d68d8',
                boxShadow: '0 4px 16px rgba(29, 104, 216, 0.35)',
                '&:hover': {
                  bgcolor: '#1552b0',
                  boxShadow: '0 6px 20px rgba(29, 104, 216, 0.45)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Portal'}
            </Button>
          </Box>

          {/* Quick Demo Credentials Auto-Fill */}
          <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px dashed rgba(145, 158, 171, 0.25)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 1.5 }}>
              <Iconify icon="solar:key-bold" width={15} sx={{ color: '#ffab00' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                1-Click Quick Demo Login:
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip
                label="Super Admin"
                size="small"
                variant={selectedRole === 'SUPER_ADMIN' ? 'filled' : 'outlined'}
                onClick={() => handleSelectDemoUser('SUPER_ADMIN')}
                icon={<Iconify icon="solar:crown-bold" width={14} />}
                sx={{
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  borderColor: 'rgba(29, 104, 216, 0.4)',
                  bgcolor: selectedRole === 'SUPER_ADMIN' ? '#1d68d8' : 'transparent',
                  color: selectedRole === 'SUPER_ADMIN' ? '#ffffff' : '#1d68d8',
                  '&:hover': { bgcolor: selectedRole === 'SUPER_ADMIN' ? '#1552b0' : 'rgba(29, 104, 216, 0.08)' },
                }}
              />

              <Chip
                label="Dhari Admin"
                size="small"
                variant={selectedRole === 'BRANCH_ADMIN' ? 'filled' : 'outlined'}
                onClick={() => handleSelectDemoUser('BRANCH_ADMIN')}
                icon={<Iconify icon="solar:shield-user-bold" width={14} />}
                sx={{
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  borderColor: 'rgba(0, 167, 111, 0.4)',
                  bgcolor: selectedRole === 'BRANCH_ADMIN' ? '#00a76f' : 'transparent',
                  color: selectedRole === 'BRANCH_ADMIN' ? '#ffffff' : '#00a76f',
                  '&:hover': { bgcolor: selectedRole === 'BRANCH_ADMIN' ? '#008c5c' : 'rgba(0, 167, 111, 0.08)' },
                }}
              />

              <Chip
                label="Receptionist"
                size="small"
                variant={selectedRole === 'RECEPTIONIST' ? 'filled' : 'outlined'}
                onClick={() => handleSelectDemoUser('RECEPTIONIST')}
                icon={<Iconify icon="solar:user-bold" width={14} />}
                sx={{
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  borderColor: 'rgba(255, 171, 0, 0.4)',
                  bgcolor: selectedRole === 'RECEPTIONIST' ? '#ffab00' : 'transparent',
                  color: selectedRole === 'RECEPTIONIST' ? '#212b36' : '#b76e00',
                  '&:hover': { bgcolor: selectedRole === 'RECEPTIONIST' ? '#e69a00' : 'rgba(255, 171, 0, 0.08)' },
                }}
              />
            </Stack>
          </Box>

          {/* Security Assurance */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, color: 'text.disabled' }}>
            <Iconify icon="solar:shield-check-bold" width={14} sx={{ color: '#00a76f' }} />
            <Typography variant="caption" sx={{ fontSize: 11.5, color: 'text.secondary' }}>
              End-to-End Encrypted Session • Enterprise Security
            </Typography>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
