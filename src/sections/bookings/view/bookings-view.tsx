import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { usePermissions } from 'src/auth/use-permissions';

// ----------------------------------------------------------------------

export function BookingsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedBranchId } = useBranch();
  const { can } = usePermissions();

  const canCreate = can('bookings:create');
  const canUpdate = can('bookings:update');
  const canCancel = can('bookings:cancel');
  const canRecordPayment = can('payments:record');
  const canSubmitNegotiation = can('negotiations:submit');
  const canShowActions = canUpdate || canCancel || canRecordPayment || canSubmitNegotiation;

  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Row Action Menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBooking, setMenuBooking] = useState<any>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, booking: any) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuBooking(booking);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuBooking(null);
  };

  // Check In Confirmation Dialog
  const [checkInConfirmBooking, setCheckInConfirmBooking] = useState<any>(null);

  // Check Out Confirmation Dialog
  const [checkOutConfirmBooking, setCheckOutConfirmBooking] = useState<any>(null);

  // View Details Dialog
  const [detailsBooking, setDetailsBooking] = useState<any>(null);

  // Status updating loader
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Discount negotiation dialog
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedBookingForDiscount, setSelectedBookingForDiscount] = useState<any>(null);
  const [requestedRent, setRequestedRent] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  const { data: bookings = [], isLoading: loading, refetch: fetchBookings } = useQuery({
    queryKey: ['bookings', { branchId: selectedBranchId, status: statusFilter, search: searchQuery }],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/bookings', params);
      return res?.data || [];
    },
  });

  // Execute Check In
  const handleConfirmCheckIn = async () => {
    if (!checkInConfirmBooking) return;
    try {
      setUpdatingStatus(true);
      await api.patch(`/bookings/${checkInConfirmBooking._id}/status`, { status: 'CHECKED_IN' });
      toast.success(`Guest ${checkInConfirmBooking.customer?.name} successfully checked in!`);
      setCheckInConfirmBooking(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete check-in');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Execute Check Out
  const handleConfirmCheckOut = async () => {
    if (!checkOutConfirmBooking) return;
    try {
      setUpdatingStatus(true);
      await api.patch(`/bookings/${checkOutConfirmBooking._id}/status`, { status: 'CHECKED_OUT' });
      toast.success(`Check-out completed for ${checkOutConfirmBooking.customer?.name}!`);
      setCheckOutConfirmBooking(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete check-out');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel || !cancelReason) return;
    try {
      await api.post(`/bookings/${selectedBookingForCancel._id}/cancel`, { reason: cancelReason });
      toast.success(`Booking ${selectedBookingForCancel.bookingId} cancelled`);
      setCancelDialogOpen(false);
      setSelectedBookingForCancel(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

  // Record balance payment
  const handleRecordPayment = async () => {
    if (!selectedBookingForPayment || paymentAmount <= 0) return;
    try {
      await api.post('/payments', {
        bookingId: selectedBookingForPayment._id,
        amount: Math.round(paymentAmount * 100),
        type: 'BALANCE',
        paymentMode,
        notes: paymentNotes,
        idempotencyKey: `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
      toast.success(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully`);
      setPaymentDialogOpen(false);
      setSelectedBookingForPayment(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      setError(err.message || 'Payment recording failed');
      toast.error(err.message || 'Payment recording failed');
    }
  };

  // Submit discount negotiation request
  const handleSubmitDiscount = async () => {
    if (!selectedBookingForDiscount || requestedRent <= 0 || !discountReason) return;
    try {
      await api.post('/negotiations', {
        booking: selectedBookingForDiscount._id,
        requestedRent: Math.round(requestedRent * 100),
        reason: discountReason,
      });
      toast.success('Rent negotiation request submitted for Branch Admin approval');
      setDiscountDialogOpen(false);
      setSelectedBookingForDiscount(null);
      setDiscountReason('');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      setError(err.message || 'Failed to submit negotiation request');
      toast.error(err.message || 'Failed to submit negotiation request');
    }
  };

  // Modern, user-friendly status badge
  const renderBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.25,
              py: 0.45,
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              bgcolor: 'rgba(29, 104, 216, 0.08)',
              color: '#1d68d8',
              border: '1px solid rgba(29, 104, 216, 0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            <Iconify icon="solar:check-circle-bold" width={15} />
            Confirmed
          </Box>
        );
      case 'CHECKED_IN':
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.25,
              py: 0.45,
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              bgcolor: 'rgba(0, 167, 111, 0.1)',
              color: '#00875a',
              border: '1px solid rgba(0, 167, 111, 0.28)',
              whiteSpace: 'nowrap',
            }}
          >
            <Iconify icon="solar:key-minimalistic-square-bold" width={15} />
            Checked In
          </Box>
        );
      case 'CHECKED_OUT':
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.25,
              py: 0.45,
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              bgcolor: 'rgba(99, 115, 129, 0.08)',
              color: '#454f5b',
              border: '1px solid rgba(99, 115, 129, 0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            <Iconify icon="solar:logout-2-bold" width={15} />
            Checked Out
          </Box>
        );
      case 'CANCELLED':
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.25,
              py: 0.45,
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              bgcolor: 'rgba(255, 86, 48, 0.08)',
              color: '#de350b',
              border: '1px solid rgba(255, 86, 48, 0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={15} />
            Cancelled
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.25,
              py: 0.45,
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 700,
              bgcolor: 'rgba(145, 158, 171, 0.1)',
              color: 'text.secondary',
              border: '1px solid rgba(145, 158, 171, 0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {status}
          </Box>
        );
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
            Bookings & Reservations
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage guest check-ins, payments, settlements, and cancellations
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            onClick={() => router.push('/availability')}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            sx={{
              bgcolor: '#1d68d8',
              '&:hover': { bgcolor: '#1552b0' },
              boxShadow: '0 4px 14px rgba(29, 104, 216, 0.35)',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
            }}
          >
            New Booking
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by customer, phone, or ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ width: { xs: 1, sm: 320 } }}
          slotProps={{
            input: {
              startAdornment: <Iconify icon="solar:magnifer-bold" sx={{ color: 'text.disabled', mr: 1 }} />,
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="CONFIRMED">Confirmed</MenuItem>
          <MenuItem value="CHECKED_IN">Checked In</MenuItem>
          <MenuItem value="CHECKED_OUT">Checked Out</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </TextField>

        <Button variant="outlined" color="inherit" onClick={() => fetchBookings()} startIcon={<Iconify icon="solar:refresh-bold" />}>
          Refresh
        </Button>
      </Card>

      {/* Bookings Table */}
      <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#f4f6f8' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Booking ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Bungalow</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Check-in & Out</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Meal Option</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Balance Due</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>Status</TableCell>
                  {canShowActions && (
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#637381', fontSize: 12, py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canShowActions ? 9 : 8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No bookings found matching filters
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking: any) => {
                    const checkInStr = dayjs(booking.checkIn).format('DD MMM');
                    const checkOutStr = dayjs(booking.checkOut).format('DD MMM YYYY');
                    const totalRupees = Math.round(booking.totalAmount / 100);
                    const balanceRupees = Math.round(booking.outstandingBalance / 100);

                    return (
                      <TableRow key={booking._id} hover sx={{ '&:hover': { bgcolor: 'rgba(29, 104, 216, 0.02)' } }}>
                        {/* Booking ID & Branch */}
                        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a202c', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {booking.bookingId}
                          </Typography>
                          <Chip
                            size="small"
                            label={booking.branch?.code || booking.branch?.name || 'MAIN'}
                            sx={{
                              mt: 0.35,
                              height: 18,
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: '#f0f4fe',
                              color: '#1d68d8',
                              borderRadius: '4px',
                            }}
                          />
                        </TableCell>

                        {/* Customer */}
                        <TableCell sx={{ py: 1.25, px: 1.5, whiteSpace: 'nowrap' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {booking.customer?.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary', mt: 0.25, whiteSpace: 'nowrap' }}>
                            <Iconify icon="solar:phone-bold" width={11} sx={{ color: 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                              {booking.customer?.phone}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Bungalow */}
                        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, bgcolor: '#f4f6f8', px: 1, py: 0.35, borderRadius: 1, whiteSpace: 'nowrap' }}>
                            <Iconify icon="solar:home-smile-bold" width={14} sx={{ color: '#1d68d8', flexShrink: 0 }} />
                            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                              {booking.bungalow?.number || '—'}
                            </Typography>
                            {booking.bungalow?.category && (
                              <Typography variant="caption" component="span" sx={{ color: 'text.secondary', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                ({booking.bungalow.category})
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Check-in & Check-out Dates */}
                        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, whiteSpace: 'nowrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#00a76f', flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12.5, color: 'text.primary', whiteSpace: 'nowrap' }}>
                                  {checkInStr}
                                </Typography>
                              </Box>

                              <Iconify icon="solar:arrow-right-linear" width={12} sx={{ color: 'text.disabled', flexShrink: 0 }} />

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ff5630', flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12.5, color: 'text.primary', whiteSpace: 'nowrap' }}>
                                  {checkOutStr}
                                </Typography>
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                alignSelf: 'flex-start',
                                px: 0.75,
                                py: 0.1,
                                borderRadius: 0.75,
                                fontSize: 10.5,
                                fontWeight: 600,
                                bgcolor: 'rgba(145, 158, 171, 0.1)',
                                color: 'text.secondary',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.4,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Iconify icon="solar:moon-stars-bold" width={11} sx={{ color: '#1d68d8' }} />
                              {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Meal Option */}
                        <TableCell sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                          <Chip
                            size="small"
                            icon={
                              <Iconify
                                icon={booking.foodOption === 'WITH_FOOD' ? 'solar:chef-hat-bold' : 'solar:cup-bold'}
                                width={13}
                              />
                            }
                            label={booking.foodOption === 'WITH_FOOD' ? 'With Meals' : 'Stay Only'}
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              height: 24,
                              bgcolor: booking.foodOption === 'WITH_FOOD' ? 'rgba(0, 167, 111, 0.08)' : 'rgba(145, 158, 171, 0.1)',
                              color: booking.foodOption === 'WITH_FOOD' ? '#007b55' : '#454f5b',
                              border: 'none',
                            }}
                          />
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5, fontWeight: 700, fontSize: 13 }}>
                          ₹{totalRupees.toLocaleString('en-IN')}
                        </TableCell>

                        {/* Balance Due */}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                          {balanceRupees > 0 ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                px: 0.85,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: 'rgba(255, 86, 48, 0.08)',
                                color: '#b71d18',
                                fontWeight: 700,
                                fontSize: 12.5,
                                border: '1px solid rgba(255, 86, 48, 0.2)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ₹{balanceRupees.toLocaleString('en-IN')}
                            </Box>
                          ) : balanceRupees < 0 ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.35,
                                px: 0.85,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: 'rgba(0, 167, 111, 0.08)',
                                color: '#007b55',
                                fontWeight: 700,
                                fontSize: 11.5,
                                border: '1px solid rgba(0, 167, 111, 0.2)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Iconify icon="solar:check-circle-bold" width={12} />
                              Credit ₹{Math.abs(balanceRupees).toLocaleString('en-IN')}
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.35,
                                px: 0.85,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: 'rgba(0, 167, 111, 0.08)',
                                color: '#007b55',
                                fontWeight: 700,
                                fontSize: 11.5,
                                border: '1px solid rgba(0, 167, 111, 0.2)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Iconify icon="solar:check-circle-bold" width={12} />
                              Settled (₹0)
                            </Box>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                          {renderBookingStatusBadge(booking.status)}
                        </TableCell>

                        {/* Actions */}
                        {canShowActions && (
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 1.25, px: 1.5 }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, justifyContent: 'flex-end' }}>
                              {/* Primary Check In action */}
                              {canUpdate && booking.status === 'CONFIRMED' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => setCheckInConfirmBooking(booking)}
                                  startIcon={<Iconify icon="solar:login-2-bold" width={15} />}
                                  sx={{
                                    whiteSpace: 'nowrap',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 30,
                                    px: 1.25,
                                    borderRadius: 1,
                                    bgcolor: '#00a76f',
                                    color: '#fff',
                                    boxShadow: '0 2px 6px rgba(0, 167, 111, 0.25)',
                                    '&:hover': { bgcolor: '#008c5c' },
                                  }}
                                >
                                  Check In
                                </Button>
                              )}

                              {/* Primary Check Out action */}
                              {canUpdate && booking.status === 'CHECKED_IN' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => setCheckOutConfirmBooking(booking)}
                                  startIcon={<Iconify icon="solar:logout-2-bold" width={15} />}
                                  sx={{
                                    whiteSpace: 'nowrap',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 30,
                                    px: 1.25,
                                    borderRadius: 1,
                                    bgcolor: '#ffab00',
                                    color: '#1a1d1f',
                                    boxShadow: '0 2px 6px rgba(255, 171, 0, 0.25)',
                                    '&:hover': { bgcolor: '#e69a00' },
                                  }}
                                >
                                  Check Out
                                </Button>
                              )}

                              {/* Completed Status indicator */}
                              {booking.status === 'CHECKED_OUT' && (
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.4,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    bgcolor: 'rgba(145, 158, 171, 0.08)',
                                    border: '1px solid rgba(145, 158, 171, 0.2)',
                                    px: 0.85,
                                    py: 0.35,
                                    borderRadius: 1,
                                  }}
                                >
                                  <Iconify icon="solar:check-read-bold" width={13} sx={{ color: '#00a76f' }} />
                                  Completed
                                </Box>
                              )}

                              {/* Cancelled indicator */}
                              {booking.status === 'CANCELLED' && (
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', px: 0.5 }}>
                                  None
                                </Typography>
                              )}

                              {/* 3-dots actions menu button */}
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenMenu(e, booking)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 1,
                                  color: 'text.secondary',
                                  bgcolor: 'rgba(145, 158, 171, 0.08)',
                                  '&:hover': { bgcolor: 'rgba(145, 158, 171, 0.18)', color: 'text.primary' },
                                }}
                              >
                                <Iconify icon="eva:more-vertical-fill" width={18} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Row Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              borderRadius: 1.5,
              p: 0.5,
            },
          },
        }}
      >
        {menuBooking && (
          <Box>
            <MenuItem
              onClick={() => {
                setDetailsBooking(menuBooking);
                handleCloseMenu();
              }}
              sx={{ gap: 1.5, py: 1, borderRadius: 1 }}
            >
              <Iconify icon="solar:eye-bold" width={18} sx={{ color: '#1d68d8' }} />
              <ListItemText primary="View Details" primaryTypographyProps={{ typography: 'body2', fontWeight: 600 }} />
            </MenuItem>

            {canRecordPayment && menuBooking.status !== 'CANCELLED' && Math.round(menuBooking.outstandingBalance / 100) > 0 && (
              <MenuItem
                onClick={() => {
                  setSelectedBookingForPayment(menuBooking);
                  setPaymentAmount(Math.round(menuBooking.outstandingBalance / 100));
                  setPaymentDialogOpen(true);
                  handleCloseMenu();
                }}
                sx={{ gap: 1.5, py: 1, borderRadius: 1 }}
              >
                <Iconify icon="solar:wallet-money-bold" width={18} sx={{ color: '#00a76f' }} />
                <ListItemText
                  primary="Record Payment"
                  secondary={`₹${Math.round(menuBooking.outstandingBalance / 100).toLocaleString('en-IN')} due`}
                  primaryTypographyProps={{ typography: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ typography: 'caption', color: 'error.main', fontWeight: 700 }}
                />
              </MenuItem>
            )}

            {canSubmitNegotiation && menuBooking.status === 'CONFIRMED' && (
              <MenuItem
                onClick={() => {
                  setSelectedBookingForDiscount(menuBooking);
                  setRequestedRent(Math.round(menuBooking.finalRentPerNight / 100));
                  setDiscountDialogOpen(true);
                  handleCloseMenu();
                }}
                sx={{ gap: 1.5, py: 1, borderRadius: 1 }}
              >
                <Iconify icon="solar:tag-price-bold" width={18} sx={{ color: '#b76e00' }} />
                <ListItemText primary="Request Discount" primaryTypographyProps={{ typography: 'body2', fontWeight: 600 }} />
              </MenuItem>
            )}

            {canCancel && menuBooking.status === 'CONFIRMED' && (
              <>
                <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                <MenuItem
                  onClick={() => {
                    setSelectedBookingForCancel(menuBooking);
                    setCancelDialogOpen(true);
                    handleCloseMenu();
                  }}
                  sx={{ gap: 1.5, py: 1, borderRadius: 1, color: 'error.main' }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ color: 'error.main' }} />
                  <ListItemText
                    primary="Cancel Booking"
                    primaryTypographyProps={{ typography: 'body2', fontWeight: 600, color: 'error.main' }}
                  />
                </MenuItem>
              </>
            )}
          </Box>
        )}
      </Menu>

      {/* Check In Confirmation Dialog */}
      <Dialog
        open={Boolean(checkInConfirmBooking)}
        onClose={() => !updatingStatus && setCheckInConfirmBooking(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(0, 167, 111, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Iconify icon="solar:login-2-bold" width={22} sx={{ color: '#00a76f' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Confirm Guest Check-In
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Verify guest details and settle balance before issuing bungalow keys
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {checkInConfirmBooking && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {/* Summary card */}
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#f4f6f8', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Guest Name</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{checkInConfirmBooking.customer?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phone</Typography>
                  <Typography variant="subtitle2">{checkInConfirmBooking.customer?.phone || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bungalow</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#1d68d8', fontWeight: 700 }}>
                    {checkInConfirmBooking.bungalow?.number} ({checkInConfirmBooking.bungalow?.category})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Stay Duration</Typography>
                  <Typography variant="subtitle2">
                    {dayjs(checkInConfirmBooking.checkIn).format('DD MMM')} → {dayjs(checkInConfirmBooking.checkOut).format('DD MMM YYYY')} ({checkInConfirmBooking.nights}N)
                  </Typography>
                </Box>
              </Box>

              {/* Payment Alert Banner */}
              {Math.round(checkInConfirmBooking.outstandingBalance / 100) > 0 ? (
                <Alert
                  severity="warning"
                  icon={<Iconify icon="solar:wallet-money-bold" width={22} />}
                  action={
                    canRecordPayment && (
                      <Button
                        size="small"
                        color="inherit"
                        variant="outlined"
                        onClick={() => {
                          setSelectedBookingForPayment(checkInConfirmBooking);
                          setPaymentAmount(Math.round(checkInConfirmBooking.outstandingBalance / 100));
                          setPaymentDialogOpen(true);
                        }}
                      >
                        Collect ₹{Math.round(checkInConfirmBooking.outstandingBalance / 100).toLocaleString('en-IN')}
                      </Button>
                    )
                  }
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Pending Balance: ₹{Math.round(checkInConfirmBooking.outstandingBalance / 100).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption">
                    Collect pending dues at reception or proceed with key handover.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" width={22} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    All Charges Settled (₹0 Balance)
                  </Typography>
                  <Typography variant="caption">
                    Payment is clear. Hand over bungalow keys and welcome the guest.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCheckInConfirmBooking(null)} color="inherit" disabled={updatingStatus}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmCheckIn}
            disabled={updatingStatus}
            startIcon={updatingStatus ? <CircularProgress size={16} /> : <Iconify icon="solar:login-2-bold" />}
            sx={{
              bgcolor: '#00a76f',
              '&:hover': { bgcolor: '#008c5c' },
              fontWeight: 700,
            }}
          >
            {updatingStatus ? 'Checking In...' : 'Confirm Check-In'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check Out Confirmation Dialog */}
      <Dialog
        open={Boolean(checkOutConfirmBooking)}
        onClose={() => !updatingStatus && setCheckOutConfirmBooking(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255, 171, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Iconify icon="solar:logout-2-bold" width={22} sx={{ color: '#b76e00' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Confirm Guest Check-Out
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Verify key return, room inspection, and settlement of pending balance
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {checkOutConfirmBooking && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {/* Summary card */}
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#f4f6f8', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Guest Name</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{checkOutConfirmBooking.customer?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bungalow Number</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#1d68d8', fontWeight: 700 }}>
                    {checkOutConfirmBooking.bungalow?.number} ({checkOutConfirmBooking.bungalow?.category})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Stay Charges</Typography>
                  <Typography variant="subtitle2">₹{Math.round(checkOutConfirmBooking.totalAmount / 100).toLocaleString('en-IN')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Amount Paid</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#00a76f', fontWeight: 700 }}>
                    ₹{Math.round(checkOutConfirmBooking.totalPaid / 100).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>

              {/* Settlement Alert */}
              {Math.round(checkOutConfirmBooking.outstandingBalance / 100) > 0 ? (
                <Alert
                  severity="error"
                  icon={<Iconify icon="solar:danger-triangle-bold" width={22} />}
                  action={
                    canRecordPayment && (
                      <Button
                        size="small"
                        color="inherit"
                        variant="outlined"
                        onClick={() => {
                          setSelectedBookingForPayment(checkOutConfirmBooking);
                          setPaymentAmount(Math.round(checkOutConfirmBooking.outstandingBalance / 100));
                          setPaymentDialogOpen(true);
                        }}
                      >
                        Settle Balance
                      </Button>
                    )
                  }
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Unpaid Balance: ₹{Math.round(checkOutConfirmBooking.outstandingBalance / 100).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption">
                    Ensure payment settlement before guest departs from resort.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" width={22} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Full Settlement Complete
                  </Typography>
                  <Typography variant="caption">
                    No outstanding balance. Keys returned. Bungalow will be queued for housekeeping.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCheckOutConfirmBooking(null)} color="inherit" disabled={updatingStatus}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmCheckOut}
            disabled={updatingStatus}
            startIcon={updatingStatus ? <CircularProgress size={16} /> : <Iconify icon="solar:logout-2-bold" />}
            sx={{
              bgcolor: '#ffab00',
              color: '#212b36',
              '&:hover': { bgcolor: '#e69a00' },
              fontWeight: 700,
            }}
          >
            {updatingStatus ? 'Processing Check-Out...' : 'Complete Check-Out & Release'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Booking Details Dialog */}
      <Dialog
        open={Boolean(detailsBooking)}
        onClose={() => setDetailsBooking(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:document-text-bold" width={22} sx={{ color: '#1d68d8' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Booking {detailsBooking?.bookingId}
            </Typography>
          </Box>
          {detailsBooking && renderBookingStatusBadge(detailsBooking.status)}
        </DialogTitle>
        <DialogContent dividers>
          {detailsBooking && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {/* Customer info */}
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>Guest Information</Typography>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f4f6f8', mt: 0.5, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Name</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{detailsBooking.customer?.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phone</Typography>
                    <Typography variant="subtitle2">{detailsBooking.customer?.phone || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Branch</Typography>
                    <Typography variant="subtitle2">{detailsBooking.branch?.name || detailsBooking.branch?.code || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Guests</Typography>
                    <Typography variant="subtitle2">
                      {detailsBooking.guests?.adults || 1} Adults, {detailsBooking.guests?.children || 0} Children
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Stay & Bungalow info */}
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>Stay & Bungalow</Typography>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f4f6f8', mt: 0.5, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bungalow Number</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1d68d8' }}>
                      {detailsBooking.bungalow?.number} ({detailsBooking.bungalow?.category})
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Meal Package</Typography>
                    <Typography variant="subtitle2">
                      {detailsBooking.foodOption === 'WITH_FOOD' ? 'With Meals' : 'Stay Only'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Check-in Date</Typography>
                    <Typography variant="subtitle2">{dayjs(detailsBooking.checkIn).format('DD MMM YYYY')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Check-out Date</Typography>
                    <Typography variant="subtitle2">
                      {dayjs(detailsBooking.checkOut).format('DD MMM YYYY')} ({detailsBooking.nights} Nights)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Financial Breakdown */}
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>Financial Statement</Typography>
                <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#f4f6f8', mt: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Booking Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      ₹{Math.round(detailsBooking.totalAmount / 100).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Amount Paid</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#00a76f' }}>
                      ₹{Math.round(detailsBooking.totalPaid / 100).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Outstanding Balance Due</Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: Math.round(detailsBooking.outstandingBalance / 100) > 0 ? 'error.main' : 'success.main',
                      }}
                    >
                      ₹{Math.round(detailsBooking.outstandingBalance / 100).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailsBooking(null)} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Booking {selectedBookingForCancel?.bookingId}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Cancelling this booking will instantly release Bungalow {selectedBookingForCancel?.bungalow?.number} for other reservations.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason *"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="inherit">
            Dismiss
          </Button>
          <Button variant="contained" color="error" onClick={handleCancelBooking} disabled={!cancelReason}>
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment for {selectedBookingForPayment?.bookingId}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2">
              Customer: <strong>{selectedBookingForPayment?.customer?.name}</strong>
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Amount Received (₹) *"
              value={paymentAmount}
              onChange={e => setPaymentAmount(Number(e.target.value))}
            />
            <TextField
              select
              fullWidth
              label="Payment Mode *"
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
            >
              <MenuItem value="UPI">UPI (Google Pay / PhonePe)</MenuItem>
              <MenuItem value="CASH">Cash Collection</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Notes / Transaction Ref"
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleRecordPayment} disabled={paymentAmount <= 0}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Discount Dialog */}
      <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Submit Negotiated Rent Discount</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2">
              Current Rent: ₹{selectedBookingForDiscount ? Math.round(selectedBookingForDiscount.finalRentPerNight / 100) : 0} / night
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Requested Rent Per Night (₹) *"
              value={requestedRent}
              onChange={e => setRequestedRent(Number(e.target.value))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Business Reason for Discount *"
              value={discountReason}
              onChange={e => setDiscountReason(e.target.value)}
              placeholder="e.g. Long stay 7-night corporate booking exception"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSubmitDiscount}
            disabled={requestedRent <= 0 || !discountReason}
          >
            Submit for Admin Approval
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
