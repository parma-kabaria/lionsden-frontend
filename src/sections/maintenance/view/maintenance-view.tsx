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
import Switch from '@mui/material/Switch';
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
import FormControlLabel from '@mui/material/FormControlLabel';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { StatusIcon } from 'src/components/status-icon';

import { usePermissions } from 'src/auth/use-permissions';

export function MaintenanceView() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = useBranch();
  const { can } = usePermissions();

  const canCreate = can('maintenance:create');
  const canUpdate = can('maintenance:update');
  const canApprove = can('maintenance:approve');
  const canShowActions = canUpdate || canApprove;

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // TanStack Query for maintenance tickets
  const {
    data: tickets = [],
    isLoading: loading,
    refetch: fetchTickets,
  } = useQuery({
    queryKey: ['maintenance', { branchId: selectedBranchId, status: statusFilter, priority: priorityFilter }],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/maintenance', params);
      return res?.data || [];
    },
  });

  const [error, setError] = useState('');

  // Report dialog
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [bungalowsList, setBungalowsList] = useState<any[]>([]);
  const [reportForm, setReportForm] = useState({
    bungalowId: '',
    facilityAffected: 'Air Conditioning',
    problemDescription: '',
    priority: 'MEDIUM',
    blocksAvailability: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; ticket: any | null; nextStatus: string }>({
    open: false,
    ticket: null,
    nextStatus: 'APPROVED',
  });
  const [statusRemarks, setStatusRemarks] = useState('');

  // Fetch bungalows for the report dropdown
  const fetchBungalows = async () => {
    try {
      const res = await api.get('/bungalows', { branchId: selectedBranchId || undefined, limit: 100 });
      setBungalowsList(res?.data || []);
      if (res?.data?.length > 0) {
        setReportForm(prev => ({ ...prev, bungalowId: res.data[0]._id }));
      }
    } catch {
      // Ignored
    }
  };

  const handleOpenReportDialog = () => {
    fetchBungalows();
    setReportDialogOpen(true);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.bungalowId || !reportForm.problemDescription) return;

    try {
      setSubmitting(true);
      await api.post('/maintenance', {
        bungalow: reportForm.bungalowId,
        facilityAffected: reportForm.facilityAffected,
        problemDescription: reportForm.problemDescription,
        priority: reportForm.priority,
        blocksAvailability: reportForm.blocksAvailability,
      });
      setReportDialogOpen(false);
      setReportForm({
        bungalowId: '',
        facilityAffected: 'Air Conditioning',
        problemDescription: '',
        priority: 'MEDIUM',
        blocksAvailability: false,
      });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-open-count'] });
    } catch (err: any) {
      setError(err.message || 'Failed to report maintenance ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicketStatus = async () => {
    if (!statusDialog.ticket) return;
    try {
      setSubmitting(true);
      await api.patch(`/maintenance/${statusDialog.ticket._id}/status`, {
        status: statusDialog.nextStatus,
        remarks: statusRemarks,
      });
      setStatusDialog({ open: false, ticket: null, nextStatus: 'APPROVED' });
      setStatusRemarks('');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-open-count'] });
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket status');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'warning';
      case 'APPROVED':
        return 'info';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
            Maintenance & Repairs
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track facility work orders, priority escalation, and bungalow availability blocking
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<StatusIcon type="maintenance" size={20} />}
            onClick={handleOpenReportDialog}
          >
            Report New Issue
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="REPORTED">Reported</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Priority"
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          sx={{ width: 160 }}
        >
          <MenuItem value="">All Priorities</MenuItem>
          <MenuItem value="CRITICAL">Critical</MenuItem>
          <MenuItem value="HIGH">High</MenuItem>
          <MenuItem value="MEDIUM">Medium</MenuItem>
          <MenuItem value="LOW">Low</MenuItem>
        </TextField>

        <Button variant="outlined" color="inherit" onClick={() => fetchTickets()} startIcon={<Iconify icon="solar:refresh-bold" />}>
          Refresh
        </Button>
      </Card>

      {/* Tickets Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Ticket #</TableCell>
                <TableCell>Bungalow</TableCell>
                <TableCell>Affected Facility</TableCell>
                <TableCell>Problem Description</TableCell>
                <TableCell align="center">Priority</TableCell>
                <TableCell align="center">Availability</TableCell>
                <TableCell align="center">Status</TableCell>
                {canShowActions && <TableCell align="right">Workflow Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canShowActions ? 8 : 7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No maintenance tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t: any) => (
                  <TableRow key={t._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {t.ticketNumber}
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {dayjs(t.createdAt).format('DD MMM, hh:mm A')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, bgcolor: '#f4f6f8', px: 1.25, py: 0.5, borderRadius: 1 }}>
                        <Iconify icon="solar:home-smile-bold" width={16} sx={{ color: '#1d68d8' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: '#1a202c' }}>
                          {t.bungalow?.number || '—'}
                        </Typography>
                        {t.bungalow?.category && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            ({t.bungalow.category})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 'medium' }}>{t.facilityAffected}</TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap title={t.problemDescription}>
                        {t.problemDescription}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={t.priority} color={getPriorityColor(t.priority)} size="small" />
                    </TableCell>

                    <TableCell align="center">
                      {t.blocksAvailability ? (
                        <Chip
                          icon={<StatusIcon type="maintenance" size={16} />}
                          label="Blocks Booking"
                          color="error"
                          size="small"
                          variant="filled"
                        />
                      ) : (
                        <Chip
                          icon={<StatusIcon type="maintenance" size={16} />}
                          label="Partial / Warning"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={t.status} color={getStatusColor(t.status)} size="small" />
                    </TableCell>

                    {canShowActions && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {canApprove && t.status === 'REPORTED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              onClick={() => setStatusDialog({ open: true, ticket: t, nextStatus: 'APPROVED' })}
                            >
                              Approve
                            </Button>
                          )}

                          {canUpdate && t.status === 'APPROVED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => setStatusDialog({ open: true, ticket: t, nextStatus: 'IN_PROGRESS' })}
                            >
                              Start Work
                            </Button>
                          )}

                          {canUpdate && t.status === 'IN_PROGRESS' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => setStatusDialog({ open: true, ticket: t, nextStatus: 'COMPLETED' })}
                            >
                              Complete
                            </Button>
                          )}

                          {t.status === 'COMPLETED' && (
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                              Resolved {t.resolvedAt ? dayjs(t.resolvedAt).format('DD MMM') : ''}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Report New Issue Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Report Maintenance Request</DialogTitle>
        <Box component="form" onSubmit={handleCreateReport}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                select
                fullWidth
                label="Bungalow *"
                value={reportForm.bungalowId}
                onChange={e => setReportForm({ ...reportForm, bungalowId: e.target.value })}
                required
              >
                {bungalowsList.map(b => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.number} ({b.category}) - {b.branch?.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Facility / Asset *"
                value={reportForm.facilityAffected}
                onChange={e => setReportForm({ ...reportForm, facilityAffected: e.target.value })}
              >
                <MenuItem value="Air Conditioning">Air Conditioning (AC)</MenuItem>
                <MenuItem value="Geyser">Geyser / Hot Water</MenuItem>
                <MenuItem value="Plunge Pool">Plunge Pool / Pump</MenuItem>
                <MenuItem value="Smart TV">Smart TV / Cable</MenuItem>
                <MenuItem value="Wi-Fi">Wi-Fi Router</MenuItem>
                <MenuItem value="Plumbing">Plumbing & Bathroom</MenuItem>
                <MenuItem value="Electrical">Electrical / Power</MenuItem>
                <MenuItem value="Entire Bungalow">Entire Bungalow (Deep Repair)</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Priority Level"
                value={reportForm.priority}
                onChange={e => setReportForm({ ...reportForm, priority: e.target.value })}
              >
                <MenuItem value="LOW">Low (Minor cosmetic)</MenuItem>
                <MenuItem value="MEDIUM">Medium (Non-urgent appliance)</MenuItem>
                <MenuItem value="HIGH">High (Essential comfort issue)</MenuItem>
                <MenuItem value="CRITICAL">Critical (Immediate danger or complete shutdown)</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={reportForm.blocksAvailability}
                    onChange={e => setReportForm({ ...reportForm, blocksAvailability: e.target.checked })}
                    color="error"
                  />
                }
                label="Block Entire Bungalow from New Bookings"
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Problem Description *"
                value={reportForm.problemDescription}
                onChange={e => setReportForm({ ...reportForm, problemDescription: e.target.value })}
                placeholder="Explain the breakdown, symptom, and urgency..."
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setReportDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Submit Ticket'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, ticket: null, nextStatus: 'APPROVED' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Status to {statusDialog.nextStatus}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Updating ticket <strong>{statusDialog.ticket?.ticketNumber}</strong> ({statusDialog.ticket?.facilityAffected} on Bungalow {statusDialog.ticket?.bungalow?.number}).
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Remarks / Work Notes"
            value={statusRemarks}
            onChange={e => setStatusRemarks(e.target.value)}
            placeholder="e.g. Technician deployed, replaced AC capacitor"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, ticket: null, nextStatus: 'APPROVED' })} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleUpdateTicketStatus} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Confirm Status Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
