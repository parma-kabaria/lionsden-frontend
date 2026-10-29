import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
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

import { useBranches } from 'src/query';
import { api } from 'src/api/api-client';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { usePermissions } from 'src/auth/use-permissions';

// ----------------------------------------------------------------------

export function BranchesView() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canCreate = can('branches:create');

  // TanStack Query for branches
  const { data: branches = [], isLoading: loading, error: queryError } = useBranches();

  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'HEAD_OFFICE',
    phone: '',
    email: '',
    street: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
  });

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;

    try {
      setSubmitting(true);
      setError('');
      await api.post('/branches', {
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        type: form.type,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
      });

      setDialogOpen(false);
      setForm({
        code: '',
        name: '',
        type: 'HEAD_OFFICE',
        phone: '',
        email: '',
        street: '',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
      });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    } catch (err: any) {
      setError(err.message || 'Failed to create branch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardContent>
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: '#1d68d8',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:map-point-wave-bold" width={24} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Locations & Branches
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage the physical resort property at Dhari (Gir Forest) and the corporate booking operations at Ahmedabad Head Office.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: '#1d68d8',
              '&:hover': { bgcolor: '#1552b0' },
              boxShadow: '0 4px 14px rgba(29, 104, 216, 0.35)',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
            }}
          >
            Add Corporate Desk
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Property Architecture Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Dhari Resort Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              border: '2px solid #059669',
              bgcolor: '#f0fdf4',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: '#059669',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:trees-bold" width={26} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>
                      Dhari Resort & Adventure Park
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>
                      Code: DHARI | Location: Gir Forest Eco Zone
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="PHYSICAL RESORT"
                  size="small"
                  sx={{ bgcolor: '#059669', color: '#fff', fontWeight: 800, fontSize: 10 }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: '#064e3b', mb: 2.5, lineHeight: 1.6 }}>
                The physical luxury resort destination situated on Chalala Road, Dhari near Gir Protected Sanctuary. All 80 guest bungalows, gardens, pools, adventure activities, and front-desk check-in are hosted here.
              </Typography>

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid #a7f3d0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>
                      20
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>
                      1BHK Units
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid #a7f3d0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>
                      25
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>
                      2BHK Units
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid #a7f3d0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>
                      20
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>
                      3BHK Units
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid #a7f3d0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>
                      15
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>
                      4BHK Units
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ pt: 1.5, borderTop: '1px dashed #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 700 }}>
                Inventory: 80 Total Bungalows
              </Typography>
              <Chip label="Active Property" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700 }} />
            </Box>
          </Card>
        </Grid>

        {/* Ahmedabad Head Office Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              border: '2px solid #1d68d8',
              bgcolor: '#eff6ff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: '#1d68d8',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:city-bold" width={26} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e40af' }}>
                      Ahmedabad Head Office
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700 }}>
                      Code: AHM | Corporate Sales & Booking HQ
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="HEAD OFFICE"
                  size="small"
                  sx={{ bgcolor: '#1d68d8', color: '#fff', fontWeight: 800, fontSize: 10 }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: '#1e3a8a', mb: 2.5, lineHeight: 1.6 }}>
                The corporate central operations desk located on S.G. Highway, Ahmedabad. Handles corporate sales, guest enquiries, booking management for Dhari bungalows, advance deposit collections, and festival discounts.
              </Typography>

              <Box sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 1.5, border: '1px solid #bfdbfe', mb: 2 }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="solar:check-circle-bold" width={18} sx={{ color: '#1d68d8' }} />
                    <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
                      Live booking allocation directly to Dhari resort bungalows
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="solar:check-circle-bold" width={18} sx={{ color: '#1d68d8' }} />
                    <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
                      Advance payment receipts via UPI, Bank Transfer & Cash
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="solar:check-circle-bold" width={18} sx={{ color: '#1d68d8' }} />
                    <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
                      Corporate sales team reservation dispatch & discount approvals
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ pt: 1.5, borderTop: '1px dashed #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700 }}>
                Operations: Central Reservation Office
              </Typography>
              <Chip label="HQ Active" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700 }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Branches Table */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Registered System Branches & Desks
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Authorized operating units configured in Lions Den backend database
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Branch Name & Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>City & State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role In System</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map(branch => (
                <TableRow key={branch._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          bgcolor: branch.type === 'RESORT' ? '#eaf8f0' : '#e8f1fd',
                          color: branch.type === 'RESORT' ? '#059669' : '#1d68d8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Iconify icon={branch.type === 'RESORT' ? 'solar:trees-bold' : 'solar:city-bold'} width={22} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {branch.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          Code: {branch.code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={branch.type === 'RESORT' ? 'PHYSICAL RESORT' : 'HEAD OFFICE'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: 11,
                        bgcolor: branch.type === 'RESORT' ? '#d1fae5' : '#dbeafe',
                        color: branch.type === 'RESORT' ? '#065f46' : '#1e40af',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {branch.address?.city || 'Gujarat'}, {branch.address?.state || 'Gujarat'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {branch.address?.street || 'Eco Zone'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {branch.phone || '+91 98765 43210'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {branch.email || 'info@lionsdenresort.com'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {branch.type === 'RESORT'
                        ? 'Hosts all 80 Bungalows (1BHK–4BHK)'
                        : 'Central Sales & Booking Management'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Active" size="small" sx={{ bgcolor: '#eaf8f0', color: '#059669', fontWeight: 700 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog: Create Branch */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Register Branch / Sales Office</DialogTitle>
        <form onSubmit={handleCreateBranch}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Branch Code"
                placeholder="e.g. RAJKOT_SALES"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                fullWidth
                required
              />

              <TextField
                label="Branch Name"
                placeholder="e.g. Rajkot Corporate Desk"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                select
                label="Branch Type"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                fullWidth
              >
                <MenuItem value="HEAD_OFFICE">HEAD_OFFICE (Sales / Corporate Desk)</MenuItem>
                <MenuItem value="RESORT">RESORT (Physical Property)</MenuItem>
              </TextField>

              <TextField
                label="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                fullWidth
              />

              <TextField
                label="Street Address"
                value={form.street}
                onChange={e => setForm({ ...form, street: e.target.value })}
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="City"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Pincode"
                    value={form.pincode}
                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !form.code || !form.name}
              sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
            >
              {submitting ? 'Creating...' : 'Register Desk'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardContent>
  );
}
