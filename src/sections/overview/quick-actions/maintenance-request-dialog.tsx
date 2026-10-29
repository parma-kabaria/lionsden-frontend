import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';

// ----------------------------------------------------------------------

interface MaintenanceRequestDialogProps {
  open: boolean;
  onClose: () => void;
  branchId?: string;
}

export function MaintenanceRequestDialog({ open, onClose, branchId }: MaintenanceRequestDialogProps) {
  const queryClient = useQueryClient();
  const [bungalowsList, setBungalowsList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [reportForm, setReportForm] = useState({
    bungalowId: '',
    facilityAffected: 'Air Conditioning',
    problemDescription: '',
    priority: 'MEDIUM',
    blocksAvailability: false,
  });

  // Fetch bungalows for the report dropdown
  useEffect(() => {
    if (!open) return;
    const fetchBungalows = async () => {
      try {
        const res = await api.get('/bungalows', { branchId: branchId || undefined, limit: 100 });
        const list = res?.data || [];
        setBungalowsList(list);
        if (list.length > 0) {
          setReportForm(prev => ({ ...prev, bungalowId: list[0]._id }));
        }
      } catch {
        // Ignored
      }
    };
    fetchBungalows();
  }, [open, branchId]);

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

      toast.success('Maintenance ticket reported successfully!');
      onClose();
      setReportForm({
        bungalowId: bungalowsList[0]?._id || '',
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
      toast.error(err.message || 'Failed to submit maintenance ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
