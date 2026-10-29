import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { StatusIcon } from 'src/components/status-icon';
import { CustomDatePicker } from 'src/components/custom-date-picker';

import { usePermissions } from 'src/auth/use-permissions';

export function AvailabilityView() {
  const { branches, selectedBranchId } = useBranch();
  const { can } = usePermissions();
  const canBook = can('bookings:create');

  const todayStr = dayjs().format('YYYY-MM-DD');

  // Search form
  const [branchId, setBranchId] = useState('');
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(dayjs().add(2, 'day').format('YYYY-MM-DD'));
  const [category, setCategory] = useState('');
  const [guestsCount, setGuestsCount] = useState('2');

  const minCheckOutStr = dayjs(checkIn).add(1, 'day').format('YYYY-MM-DD');
  const nights = Math.max(1, dayjs(checkOut).diff(dayjs(checkIn), 'day'));

  const handleCheckInChange = (newDate: string) => {
    if (!newDate) return;
    let validated = newDate;
    if (dayjs(newDate).isBefore(dayjs(todayStr), 'day')) {
      validated = todayStr;
    }
    setCheckIn(validated);
    if (!dayjs(checkOut).isAfter(dayjs(validated), 'day')) {
      setCheckOut(dayjs(validated).add(1, 'day').format('YYYY-MM-DD'));
    }
  };

  const handleCheckOutChange = (newDate: string) => {
    if (!newDate) return;
    const minOut = dayjs(checkIn).add(1, 'day');
    if (dayjs(newDate).isBefore(minOut, 'day')) {
      setCheckOut(minOut.format('YYYY-MM-DD'));
    } else {
      setCheckOut(newDate);
    }
  };

  const handleApplyPreset = (nightsCount: number) => {
    const start = todayStr;
    const end = dayjs().add(nightsCount, 'day').format('YYYY-MM-DD');
    setCheckIn(start);
    setCheckOut(end);
  };

  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  // Booking modal
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedBungalow, setSelectedBungalow] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    adults: 2,
    children: 0,
    foodOption: 'WITHOUT_FOOD',
    foodChargesPerNight: 0,
    advancePayment: 0,
    paymentMode: 'UPI',
    specialRequests: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Default branch initialization
  useEffect(() => {
    if (branches.length > 0 && !branchId) {
      setBranchId(selectedBranchId || branches[0]._id);
    }
  }, [branches, selectedBranchId, branchId]);

  const {
    data: result = null,
    isLoading: loading,
    refetch: handleSearch,
  } = useQuery({
    queryKey: ['availability', { branch: branchId, checkIn, checkOut, category, guestsCount }],
    queryFn: async () => {
      if (!branchId) return null;
      const params: Record<string, any> = {
        branch: branchId,
        checkIn: `${checkIn}T14:00:00.000Z`,
        checkOut: `${checkOut}T11:00:00.000Z`,
      };
      if (category) params.category = category;
      if (guestsCount) params.guestsCount = Number(guestsCount);

      const res = await api.get('/availability', params);
      return res?.data || null;
    },
    enabled: Boolean(branchId),
  });

  const handleOpenBooking = (bungalow: any) => {
    setSelectedBungalow(bungalow);
    setBookingForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      adults: bungalow.capacity?.adults || 2,
      children: 0,
      foodOption: 'WITHOUT_FOOD',
      foodChargesPerNight: 0,
      advancePayment: Math.round((bungalow.pricing?.specialRent || bungalow.standardRent) / 100),
      paymentMode: 'UPI',
      specialRequests: '',
    });
    setBookingDialogOpen(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBungalow) return;

    try {
      setBookingSubmitting(true);
      setError('');

      const payload = {
        customer: {
          name: bookingForm.customerName,
          phone: bookingForm.customerPhone,
          email: bookingForm.customerEmail || undefined,
        },
        branch: branchId,
        bungalow: selectedBungalow._id,
        checkIn: `${checkIn}T14:00:00.000Z`,
        checkOut: `${checkOut}T11:00:00.000Z`,
        guests: {
          adults: Number(bookingForm.adults),
          children: Number(bookingForm.children),
        },
        foodOption: bookingForm.foodOption,
        foodChargesPerNight: bookingForm.foodChargesPerNight * 100,
        advancePayment: bookingForm.advancePayment * 100,
        paymentMode: bookingForm.advancePayment > 0 ? bookingForm.paymentMode : undefined,
        specialRequests: bookingForm.specialRequests,
        idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };

      const res = await api.post('/bookings', payload);
      setBookingDialogOpen(false);
      setBookingSuccessMsg(`Booking confirmed successfully! Booking ID: ${res?.data?.bookingId}`);
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
      handleSearch();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
          Live Bungalow Availability & Booking
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Check real-time bungalow status across Ahmedabad & Dhari with dynamic festival pricing
        </Typography>
      </Box>

      {bookingSuccessMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setBookingSuccessMsg('')}>
          {bookingSuccessMsg}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Elevated Search & Calendar Planner Card */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Strip with Quick Stay Presets */}
        <Box
          sx={{
            px: { xs: 2.5, md: 3 },
            py: 2,
            background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#1d68d8',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(29, 104, 216, 0.3)',
              }}
            >
              <Iconify icon="solar:calendar-bold" width={22} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                Stay Planner & Live Calendar
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11.5 }}>
                Select check-in & check-out dates (past dates strictly disabled)
              </Typography>
            </Box>
          </Box>

          {/* Quick Stay Presets */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mr: 0.5 }}>
              Quick Presets:
            </Typography>
            {[
              { label: 'Tonight (1N)', nightsCount: 1, icon: 'solar:moon-bold' },
              { label: 'Weekend (2N)', nightsCount: 2, icon: 'solar:sun-bold' },
              { label: '3 Nights Getaway', nightsCount: 3, icon: 'solar:cup-star-bold' },
              { label: '7 Nights Vacation', nightsCount: 7, icon: 'solar:crown-bold' },
            ].map(preset => {
              const isActive = checkIn === todayStr && nights === preset.nightsCount;
              return (
                <Chip
                  key={preset.nightsCount}
                  size="small"
                  clickable
                  onClick={() => handleApplyPreset(preset.nightsCount)}
                  icon={<Iconify icon={preset.icon} width={14} />}
                  label={preset.label}
                  sx={{
                    fontWeight: 700,
                    fontSize: 11.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    ...(isActive
                      ? {
                        bgcolor: '#1d68d8',
                        color: '#fff',
                        '& .MuiChip-icon': { color: '#fff' },
                        boxShadow: '0 2px 8px rgba(29, 104, 216, 0.35)',
                      }
                      : {
                        bgcolor: '#fff',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
                      }),
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Date Selector Dual Cards & Filters */}
        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Grid container spacing={2.5} alignItems="center">
            {/* Check-In Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: '#fcfdfd',
                  border: '1.5px solid #86efac',
                  boxShadow: '0 2px 10px rgba(34, 197, 94, 0.08)',
                  transition: 'all 0.2s',
                  '&:focus-within': {
                    borderColor: '#16a34a',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.15)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: '#dcfce7',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:calendar-date-bold" width={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803d', letterSpacing: 0.8 }}>
                        CHECK-IN DATE
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11 }}>
                        From 02:00 PM
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    color="success"
                    label={
                      dayjs(checkIn).isSame(dayjs(todayStr), 'day')
                        ? 'Today'
                        : dayjs(checkIn).isSame(dayjs(todayStr).add(1, 'day'), 'day')
                          ? 'Tomorrow'
                          : dayjs(checkIn).format('ddd')
                    }
                    sx={{ fontWeight: 700, fontSize: 11 }}
                  />
                </Box>

                <CustomDatePicker
                  value={checkIn}
                  onChange={handleCheckInChange}
                  minDate={todayStr}
                  helperText={dayjs(checkIn).format('dddd, DD MMMM YYYY')}
                />
              </Box>
            </Grid>

            {/* Stay Duration Center Bridge */}
            <Grid size={{ xs: 12, md: 2 }} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: { xs: 0.5, md: 0 },
                }}
              >
                <Chip
                  icon={<Iconify icon="solar:moon-bold" width={16} />}
                  label={`${nights} Night${nights > 1 ? 's' : ''}`}
                  sx={{
                    bgcolor: '#1e3a8a',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 12.5,
                    py: 2,
                    px: 1,
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(30, 58, 138, 0.28)',
                    '& .MuiChip-icon': { color: '#fbbf24' },
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.75,
                    color: '#64748b',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <Iconify icon="solar:arrow-right-linear" width={14} />
                  <span>Stay Length</span>
                  <Iconify icon="solar:arrow-right-linear" width={14} />
                </Box>
              </Box>
            </Grid>

            {/* Check-Out Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: '#fcfdfd',
                  border: '1.5px solid #93c5fd',
                  boxShadow: '0 2px 10px rgba(59, 130, 246, 0.08)',
                  transition: 'all 0.2s',
                  '&:focus-within': {
                    borderColor: '#2563eb',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: '#dbeafe',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:calendar-mark-bold" width={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.8 }}>
                        CHECK-OUT DATE
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11 }}>
                        Until 11:00 AM
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    color="primary"
                    label={dayjs(checkOut).format('ddd')}
                    sx={{ fontWeight: 700, fontSize: 11 }}
                  />
                </Box>

                <CustomDatePicker
                  value={checkOut}
                  onChange={handleCheckOutChange}
                  minDate={minCheckOutStr}
                  helperText={dayjs(checkOut).format('dddd, DD MMMM YYYY')}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Filter Bar (Branch, Category, Guests, Search CTA) */}
          <Box
            sx={{
              mt: 3,
              pt: 2.5,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Branch / Resort Location"
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Iconify icon="solar:map-point-wave-bold" width={18} sx={{ color: '#1d68d8', mr: 1 }} />
                      ),
                    },
                  }}
                >
                  {branches.map(b => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name} ({b.code}) — {b.code === 'DHARI' ? 'Resort Property' : 'Central Sales HQ'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Bungalow Category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Iconify icon="solar:home-smile-angle-bold" width={18} sx={{ color: '#64748b', mr: 1 }} />
                      ),
                    },
                  }}
                >
                  <MenuItem value="">All Categories (1BHK - 4BHK)</MenuItem>
                  <MenuItem value="1BHK">1BHK Villa</MenuItem>
                  <MenuItem value="2BHK">2BHK Villa</MenuItem>
                  <MenuItem value="3BHK">3BHK Villa</MenuItem>
                  <MenuItem value="4BHK">4BHK Villa</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Guests Count"
                  value={guestsCount}
                  onChange={e => setGuestsCount(e.target.value)}
                  slotProps={{
                    htmlInput: { min: 1, max: 15 },
                    input: {
                      startAdornment: (
                        <Iconify icon="solar:users-group-two-rounded-bold" width={18} sx={{ color: '#64748b', mr: 1 }} />
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="medium"
                  onClick={() => handleSearch()}
                  disabled={loading}
                  startIcon={<Iconify icon="solar:magnifer-bold" />}
                  sx={{
                    bgcolor: '#1d68d8',
                    '&:hover': { bgcolor: '#1552b0' },
                    py: 1,
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(29, 104, 216, 0.35)',
                    textTransform: 'none',
                    fontSize: 14,
                  }}
                >
                  {loading ? 'Searching...' : 'Check Availability'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Real-time Status Badge & Past Dates Protection Hint */}
          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: '1px dashed #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:info-circle-bold" width={18} sx={{ color: '#1d68d8' }} />
              <Typography variant="body2" sx={{ color: '#475569', fontSize: 13 }}>
                Selected Stay: <strong>{dayjs(checkIn).format('DD MMM YYYY')}</strong> &rarr;{' '}
                <strong>{dayjs(checkOut).format('DD MMM YYYY')}</strong> ({nights} {nights === 1 ? 'Night' : 'Nights'}) •
                Live inventory synced across Gir Resort
              </Typography>
            </Box>
            {/* <Chip
              size="small"
              icon={<Iconify icon="solar:shield-check-bold" width={14} />}
              label="Past dates disabled (Strict)"
              color="success"
              variant="outlined"
              sx={{ fontSize: 11, fontWeight: 700 }}
            /> */}
          </Box>
        </Box>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : result ? (
        <>
          {/* Available Bungalows Section (Unbooked) */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <StatusIcon type="unbooked" size={28} />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Available Bungalows ({result.availableBungalows?.length || 0})
              </Typography>
              <Chip label="Ready for Booking" color="success" size="small" sx={{ fontWeight: 700 }} />
            </Box>

            {result.availableBungalows?.length === 0 ? (
              <Alert severity="warning">No bungalows match your criteria for the selected dates.</Alert>
            ) : (
              <Grid container spacing={3}>
                {result.availableBungalows?.map((bungalow: any) => {
                  const standardRupees = Math.round(bungalow.standardRent / 100);
                  const specialRupees = Math.round((bungalow.pricing?.specialRent || bungalow.standardRent) / 100);
                  const hasPeakPricing = specialRupees !== standardRupees;

                  return (
                    <Grid key={bungalow._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <Card sx={{ p: 2.5, height: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {hasPeakPricing && (
                          <Chip
                            label={bungalow.pricing?.appliedRule?.name || 'Festival Rate'}
                            color="warning"
                            size="small"
                            sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700 }}
                          />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <StatusIcon type="unbooked" size={20} />
                          <Typography variant="h6" sx={{ fontWeight: 'fontWeightBold' }}>
                            {bungalow.number}
                          </Typography>
                          <Chip label={bungalow.category} size="small" color="primary" variant="outlined" />
                        </Box>

                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1.5 }}>
                          Max Capacity: {bungalow.capacity?.maxGuests || 4} Guests ({bungalow.capacity?.adults || 2} Adults, {bungalow.capacity?.children || 1} Children)
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {bungalow.facilities?.slice(0, 4).map((f: string) => (
                            <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                          ))}
                        </Box>

                        {bungalow.maintenanceWarnings?.length > 0 && (
                          <Alert severity="info" sx={{ py: 0.5, px: 1, mb: 2, fontSize: 11 }}>
                            Note: {bungalow.maintenanceWarnings[0]?.facilityAffected} under maintenance
                          </Alert>
                        )}

                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Per Night:
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              {hasPeakPricing && (
                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled', mr: 1 }}>
                                  ₹{standardRupees.toLocaleString('en-IN')}
                                </Typography>
                              )}
                              <Typography variant="h6" color={hasPeakPricing ? 'warning.main' : 'primary.main'} sx={{ fontWeight: 'bold', display: 'inline' }}>
                                ₹{specialRupees.toLocaleString('en-IN')}
                              </Typography>
                            </Box>
                          </Box>

                          {canBook && (
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              startIcon={<Iconify icon="solar:cart-bold" />}
                              onClick={() => handleOpenBooking(bungalow)}
                            >
                              Reserve Bungalow
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* Unavailable Bungalows Section (Occupied / Under Maintenance) */}
          {result.unavailableBungalows?.length > 0 && (
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                Unavailable Bungalows ({result.unavailableBungalows.length})
              </Typography>
              <Grid container spacing={2}>
                {result.unavailableBungalows.map((item: any) => {
                  const isMaintenance = item.reason === 'UNDER_MAINTENANCE';
                  return (
                    <Grid key={item.bungalow?._id} size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card sx={{ p: 2, bgcolor: isMaintenance ? '#fffbeb' : '#fef2f2', border: '1px solid', borderColor: isMaintenance ? '#fde68a' : '#fecaca' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <StatusIcon type={isMaintenance ? 'maintenance' : 'booked'} size={20} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {item.bungalow?.number}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={isMaintenance ? 'Maintenance' : 'Booked'}
                            color={isMaintenance ? 'warning' : 'error'}
                            sx={{ fontWeight: 700, fontSize: 10.5 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {item.bungalow?.category} • Base Rent: ₹{Math.round((item.bungalow?.standardRent || 0) / 100).toLocaleString('en-IN')}
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </>
      ) : null}

      {/* Reservation Dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'fontWeightBold' }}>
          New Reservation: Bungalow {selectedBungalow?.number} ({selectedBungalow?.category})
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateBooking}>
          <DialogContent dividers>
            {/* Stay Period Summary */}
            <Box
              sx={{
                mb: 2.5,
                p: 2,
                borderRadius: 2,
                bgcolor: '#f0f7ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                  Stay Period ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {dayjs(checkIn).format('DD MMM YYYY')} (02:00 PM) &rarr; {dayjs(checkOut).format('DD MMM YYYY')} (11:00 AM)
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                  Rate per night
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1d68d8' }}>
                  ₹{Math.round((selectedBungalow?.pricing?.specialRent || selectedBungalow?.standardRent || 0) / 100).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1 }}>
                  Customer Details (Mandatory)
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Customer Full Name *"
                  value={bookingForm.customerName}
                  onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Mobile Number *"
                  value={bookingForm.customerPhone}
                  onChange={e => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                  placeholder="+919876543210"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={bookingForm.customerEmail}
                  onChange={e => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Adult Guests"
                  value={bookingForm.adults}
                  onChange={e => setBookingForm({ ...bookingForm, adults: Number(e.target.value) })}
                  slotProps={{ htmlInput: { min: 1, max: 12 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Children"
                  value={bookingForm.children}
                  onChange={e => setBookingForm({ ...bookingForm, children: Number(e.target.value) })}
                  slotProps={{ htmlInput: { min: 0, max: 8 } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Meal Package Option</FormLabel>
                  <RadioGroup
                    row
                    value={bookingForm.foodOption}
                    onChange={e => setBookingForm({ ...bookingForm, foodOption: e.target.value })}
                  >
                    <FormControlLabel value="WITHOUT_FOOD" control={<Radio />} label="Without Food (Stay Only)" />
                    <FormControlLabel value="WITH_FOOD" control={<Radio />} label="With Food (All Meals Package)" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {bookingForm.foodOption === 'WITH_FOOD' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Food Charges Per Night (₹)"
                    value={bookingForm.foodChargesPerNight}
                    onChange={e => setBookingForm({ ...bookingForm, foodChargesPerNight: Number(e.target.value) })}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Advance Payment (₹)"
                  value={bookingForm.advancePayment}
                  onChange={e => setBookingForm({ ...bookingForm, advancePayment: Number(e.target.value) })}
                />
              </Grid>

              {bookingForm.advancePayment > 0 && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Payment Mode"
                    value={bookingForm.paymentMode}
                    onChange={e => setBookingForm({ ...bookingForm, paymentMode: e.target.value })}
                  >
                    <MenuItem value="UPI">UPI (Google Pay / PhonePe)</MenuItem>
                    <MenuItem value="CASH">Cash Deposit</MenuItem>
                    <MenuItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</MenuItem>
                  </TextField>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Special Requests / Notes"
                  value={bookingForm.specialRequests}
                  onChange={e => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setBookingDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={bookingSubmitting}
            >
              {bookingSubmitting ? <CircularProgress size={24} /> : 'Confirm & Reserve'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </DashboardContent>
  );
}
