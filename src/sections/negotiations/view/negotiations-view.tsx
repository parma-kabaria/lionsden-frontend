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

export function NegotiationsView() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = useBranch();
  const { can } = usePermissions();
  const canApprove = can('negotiations:approve');

  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Decision dialog
  const [decisionDialog, setDecisionDialog] = useState<{
    open: boolean;
    item: any | null;
    action: 'approve' | 'reject';
  }>({ open: false, item: null, action: 'approve' });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: requests = [], isLoading: loading, refetch: fetchNegotiations } = useQuery({
    queryKey: ['negotiations', { branchId: selectedBranchId, status: statusFilter }],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/negotiations', params);
      return res?.data || [];
    },
  });

  const handleDecision = async () => {
    if (!decisionDialog.item) return;
    try {
      setSubmitting(true);
      await api.post(`/negotiations/${decisionDialog.item._id}/${decisionDialog.action}`, {
        comment,
      });
      setDecisionDialog({ open: false, item: null, action: 'approve' });
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['negotiations-pending-count'] });
    } catch (err: any) {
      setError(err.message || `Failed to ${decisionDialog.action} request`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
          Rent Negotiation Approval Queue
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Sales discount requests awaiting Branch Admin price approval
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select
          size="small"
          label="Approval Status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="PENDING">Pending Review</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </TextField>

        <Button variant="outlined" color="inherit" onClick={() => fetchNegotiations()} startIcon={<Iconify icon="solar:refresh-bold" />}>
          Refresh
        </Button>
      </Card>

      {/* Requests Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Booking Reference</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Original Rent</TableCell>
                <TableCell>Requested Rent</TableCell>
                <TableCell>Discount Reason</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Admin Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No negotiation requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((item: any) => {
                  const originalRupees = Math.round(item.originalRent / 100);
                  const requestedRupees = Math.round(item.requestedRent / 100);
                  const savings = originalRupees - requestedRupees;

                  return (
                    <TableRow key={item._id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {item.booking?.bookingId}
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {dayjs(item.createdAt).format('DD MMM, hh:mm A')}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2">{item.booking?.customer?.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {item.booking?.customer?.phone}
                        </Typography>
                      </TableCell>

                      <TableCell>₹{originalRupees.toLocaleString('en-IN')} / night</TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                          ₹{requestedRupees.toLocaleString('en-IN')} / night
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'success.main' }}>
                          (Save ₹{savings.toLocaleString('en-IN')} / night)
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" noWrap title={item.reason}>
                          {item.reason}
                        </Typography>
                      </TableCell>

                      <TableCell>{item.requestedBy?.name || 'Sales Staff'}</TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={item.status}
                          color={
                            item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'
                          }
                        />
                      </TableCell>

                      <TableCell align="right">
                        {item.status === 'PENDING' ? (
                          canApprove ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => setDecisionDialog({ open: true, item, action: 'approve' })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => setDecisionDialog({ open: true, item, action: 'reject' })}
                              >
                                Reject
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                              Pending Approval
                            </Typography>
                          )
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Decided by {item.decidedBy?.name || 'Admin'}
                            {item.decisionComment && ` ("${item.decisionComment}")`}
                          </Typography>
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

      {/* Decision Dialog */}
      <Dialog
        open={decisionDialog.open}
        onClose={() => setDecisionDialog({ open: false, item: null, action: 'approve' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textTransform: 'capitalize' }}>
          {decisionDialog.action} Negotiated Rent Request
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {decisionDialog.action === 'approve'
              ? `Approving will automatically update the booking rate to ₹${Math.round(
                  (decisionDialog.item?.requestedRent || 0) / 100
                ).toLocaleString('en-IN')} / night and recalculate outstanding balances.`
              : 'Rejecting will keep the original quoted booking price intact.'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Decision Comment (Optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="e.g. Approved as corporate customer rate"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialog({ open: false, item: null, action: 'approve' })} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color={decisionDialog.action === 'approve' ? 'success' : 'error'}
            onClick={handleDecision}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : `Confirm ${decisionDialog.action}`}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
