import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';
import { useBranches, useBungalows } from 'src/query';

import { CustomDatePicker } from 'src/components/custom-date-picker';

// ----------------------------------------------------------------------

interface NewBookingDialogProps {
  open: boolean;
  onClose: () => void;
  branchId?: string;
}

export function NewBookingDialog({ open, onClose, branchId }: NewBookingDialogProps) {
  const queryClient = useQueryClient();
  const { data: branches = [] } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState(branchId || '');

  useEffect(() => {
    if (branchId) {
      setSelectedBranch(branchId);
    } else if (branches.length > 0 && !selectedBranch) {
      const defaultBranch = branches.find((b: any) => b.type !== 'HEAD_OFFICE') || branches[0];
      setSelectedBranch(defaultBranch?._id || '');
    }
  }, [branchId, branches, selectedBranch]);

  const { data: bungalows = [] } = useBungalows(selectedBranch);

  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bungalowId: '',
    checkIn: dayjs().format('YYYY-MM-DD'),
    checkOut: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    adults: 2,
    children: 0,
    foodOption: 'WITHOUT_FOOD',
    foodChargesPerNight: 0,
    advancePayment: 0,
    paymentMode: 'UPI',
    specialRequests: '',
  });

  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    if (bungalows.length > 0 && !bookingForm.bungalowId) {
      setBookingForm(prev => ({ ...prev, bungalowId: bungalows[0]._id }));
    }
  }, [bungalows, bookingForm.bungalowId]);

  const selectedBungalow = bungalows.find((b: any) => b._id === bookingForm.bungalowId);
  const nights = Math.max(1, dayjs(bookingForm.checkOut).diff(dayjs(bookingForm.checkIn), 'day'));

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.customerName.trim() || !bookingForm.customerPhone.trim() || !bookingForm.bungalowId || !selectedBranch) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    if (!dayjs(bookingForm.checkOut).isAfter(dayjs(bookingForm.checkIn))) {
      toast.error('Check-out date must be strictly after check-in date');
      return;
    }

    if (!/^[0-9+ ]{10,15}$/.test(bookingForm.customerPhone.trim())) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setBookingSubmitting(true);
      const payload = {
        customer: {
          name: bookingForm.customerName.trim(),
          phone: bookingForm.customerPhone.trim(),
          email: bookingForm.customerEmail?.trim() || undefined,
        },
        branch: selectedBranch,
        bungalow: bookingForm.bungalowId,
        checkIn: `${bookingForm.checkIn}T14:00:00.000Z`,
        checkOut: `${bookingForm.checkOut}T11:00:00.000Z`,
        guests: {
          adults: Number(bookingForm.adults),
          children: Number(bookingForm.children),
        },
        foodOption: bookingForm.foodOption,
        foodChargesPerNight: bookingForm.foodOption === 'WITH_FOOD' ? Number(bookingForm.foodChargesPerNight) * 100 : 0,
        advancePayment: Number(bookingForm.advancePayment) * 100,
        paymentMode: bookingForm.advancePayment > 0 ? bookingForm.paymentMode : undefined,
        specialRequests: bookingForm.specialRequests || undefined,
        idempotencyKey: `dash-book-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };

      const res = await api.post('/bookings', payload);
      toast.success(`Booking confirmed successfully! Booking ID: ${res?.data?.bookingId || ''}`);

      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });

      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'fontWeightBold' }}>
        New Reservation: {selectedBungalow ? `Bungalow ${selectedBungalow.number} (${selectedBungalow.category})` : 'Booking'}
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
                {dayjs(bookingForm.checkIn).format('DD MMM YYYY')} (02:00 PM) &rarr; {dayjs(bookingForm.checkOut).format('DD MMM YYYY')} (11:00 AM)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                Rate per night
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1d68d8' }}>
                ₹{Math.round((selectedBungalow?.standardRent || 0) / 100).toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Branch and Bungalow */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Resort Branch *"
                value={selectedBranch}
                onChange={e => {
                  setSelectedBranch(e.target.value);
                  setBookingForm(prev => ({ ...prev, bungalowId: '' }));
                }}
                required
              >
                {branches.map((b: any) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Bungalow Unit *"
                value={bookingForm.bungalowId}
                onChange={e => setBookingForm(prev => ({ ...prev, bungalowId: e.target.value }))}
                required
              >
                {bungalows.map((b: any) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.number} - {b.category} (₹{Math.round((b.standardRent || 0) / 100)})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomDatePicker
                label="Check-In Date *"
                value={bookingForm.checkIn}
                onChange={val => {
                  setBookingForm(prev => {
                    const nextCheckIn = val;
                    let nextCheckOut = prev.checkOut;
                    if (!dayjs(nextCheckOut).isAfter(dayjs(nextCheckIn))) {
                      nextCheckOut = dayjs(nextCheckIn).add(1, 'day').format('YYYY-MM-DD');
                    }
                    return { ...prev, checkIn: nextCheckIn, checkOut: nextCheckOut };
                  });
                }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomDatePicker
                label="Check-Out Date *"
                value={bookingForm.checkOut}
                minDate={dayjs(bookingForm.checkIn).add(1, 'day').format('YYYY-MM-DD')}
                onChange={val => setBookingForm(prev => ({ ...prev, checkOut: val }))}
                required
              />
            </Grid>

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
          <Button onClick={onClose} color="inherit">
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
  );
}
