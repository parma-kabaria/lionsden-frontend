import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { usePermissions } from 'src/auth/use-permissions';

export function PaymentsView() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = useBranch();
  const { can } = usePermissions();
  const canReverse = can('payments:reverse');

  const [error, setError] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Reversal dialog
  const [reversalDialog, setReversalDialog] = useState<{ open: boolean; payment: any | null }>({
    open: false,
    payment: null,
  });
  const [reversalReason, setReversalReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const { data: payments = [], isLoading: loading, refetch: fetchPayments } = useQuery({
    queryKey: ['payments', { branchId: selectedBranchId, mode: modeFilter, search }],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (modeFilter) params.paymentMode = modeFilter;
      if (search) params.search = search;

      const res = await api.get('/payments', params);
      return res?.data || [];
    },
  });

  const handleReversePayment = async () => {
    if (!reversalDialog.payment || !reversalReason) return;
    try {
      setReversing(true);
      await api.post(`/payments/${reversalDialog.payment._id}/reverse`, {
        reason: reversalReason,
      });
      setReversalDialog({ open: false, payment: null });
      setReversalReason('');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    } catch (err: any) {
      setError(err.message || 'Payment reversal failed');
    } finally {
      setReversing(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
          Payments & Financial Ledger
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Immutable ledger of advance deposits, balance collections, and authorized reversals
        </Typography>
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
          placeholder="Search receipt #, customer, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: { xs: 1, sm: 300 } }}
          slotProps={{
            input: {
              startAdornment: <Iconify icon="solar:magnifer-bold" sx={{ color: 'text.disabled', mr: 1 }} />,
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Payment Mode"
          value={modeFilter}
          onChange={e => setModeFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="">All Modes</MenuItem>
          <MenuItem value="UPI">UPI</MenuItem>
          <MenuItem value="CASH">Cash</MenuItem>
          <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
        </TextField>

        <Button variant="outlined" color="inherit" onClick={() => fetchPayments()} startIcon={<Iconify icon="solar:refresh-bold" />}>
          Refresh
        </Button>
      </Card>

      {/* Payments Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Receipt Number</TableCell>
                <TableCell>Booking Ref</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Payment Mode</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Collected By</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell align="right">Ledger Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No payment records found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p: any) => {
                  const amountRupees = Math.round(p.amount / 100);
                  const isRev = p.isReversal;

                  return (
                    <TableRow key={p._id} hover sx={isRev ? { bgcolor: 'error.lighter' } : undefined}>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {p.receiptNumber}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{p.booking?.bookingId}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {p.branch?.code}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2">{p.customer?.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {p.customer?.phone}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={p.type}
                          color={p.type === 'ADVANCE' ? 'info' : p.type === 'REVERSAL' ? 'error' : 'default'}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip size="small" variant="outlined" label={p.paymentMode} />
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'bold',
                            color: isRev ? 'error.main' : 'success.main',
                          }}
                        >
                          {isRev ? '-' : '+'}₹{amountRupees.toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>

                      <TableCell>{p.collectingUser?.name || 'Staff'}</TableCell>

                      <TableCell>{dayjs(p.createdAt).format('DD MMM YYYY, hh:mm A')}</TableCell>

                      <TableCell align="right">
                        {isRev ? (
                          <Chip size="small" label="Reversal Entry" color="error" variant="filled" />
                        ) : canReverse ? (
                          <Tooltip title="Reverse this ledger payment entry">
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => setReversalDialog({ open: true, payment: p })}
                            >
                              Reverse
                            </Button>
                          </Tooltip>
                        ) : (
                          <Chip size="small" label="Settled" color="success" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Reversal Confirmation Dialog */}
      <Dialog
        open={reversalDialog.open}
        onClose={() => setReversalDialog({ open: false, payment: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Reverse Payment Entry</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are reversing receipt <strong>{reversalDialog.payment?.receiptNumber}</strong> of ₹
            {Math.round((reversalDialog.payment?.amount || 0) / 100).toLocaleString('en-IN')}.
            This will record an authorized negative ledger entry and restore the guest&apos;s outstanding balance.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Mandatory Reversal Reason *"
            value={reversalReason}
            onChange={e => setReversalReason(e.target.value)}
            placeholder="e.g. Duplicate cash entry correction by cashier"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReversalDialog({ open: false, payment: null })} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReversePayment}
            disabled={!reversalReason || reversing}
          >
            {reversing ? <CircularProgress size={24} /> : 'Confirm Reversal Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
