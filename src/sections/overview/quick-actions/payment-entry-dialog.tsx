import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';

// ----------------------------------------------------------------------

interface PaymentEntryDialogProps {
  open: boolean;
  onClose: () => void;
  branchId?: string;
}

export function PaymentEntryDialog({ open, onClose, branchId }: PaymentEntryDialogProps) {
  const queryClient = useQueryClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchBookings = async () => {
      try {
        const params: Record<string, any> = { limit: 50 };
        if (branchId) params.branchId = branchId;
        const res = await api.get('/bookings', params);
        const list = res?.data || [];
        setBookings(list);
        if (list.length > 0) {
          setSelectedBookingId(list[0]._id);
        }
      } catch {
        // Ignored
      }
    };
    fetchBookings();
  }, [open, branchId]);

  const selectedBooking = bookings.find(b => b._id === selectedBookingId);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || Number(paymentAmount) <= 0) return;

    try {
      setSubmitting(true);
      await api.post('/payments', {
        bookingId: selectedBookingId,
        amount: Math.round(Number(paymentAmount) * 100),
        type: 'BALANCE',
        paymentMode,
        notes: paymentNotes,
        idempotencyKey: `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      toast.success('Payment recorded successfully!');
      onClose();
      setPaymentAmount('');
      setPaymentNotes('');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast.error(err.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Record Payment {selectedBooking?.bookingId ? `for ${selectedBooking.bookingId}` : ''}
      </DialogTitle>
      <Box component="form" onSubmit={handleRecordPayment}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Select Reservation *"
              value={selectedBookingId}
              onChange={e => setSelectedBookingId(e.target.value)}
              required
            >
              {bookings.map(b => (
                <MenuItem key={b._id} value={b._id}>
                  {b.bookingId} - {b.customer?.name} ({b.bungalow?.number ? `Bungalow ${b.bungalow.number}` : ''})
                </MenuItem>
              ))}
            </TextField>

            {selectedBooking && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                Customer: <strong>{selectedBooking?.customer?.name}</strong>
              </Typography>
            )}

            <TextField
              fullWidth
              type="number"
              label="Amount Received (₹) *"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              required
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
              <MenuItem value="CARD">Debit / Credit Card</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Notes / Transaction Ref"
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting || Number(paymentAmount) <= 0}
          >
            {submitting ? <CircularProgress size={24} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
