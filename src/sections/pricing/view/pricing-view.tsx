import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useDebounce } from 'src/hooks/use-debounce';

import { api } from 'src/api/api-client';
import { usePaginatedPricingRules } from 'src/query';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomDatePicker } from 'src/components/custom-date-picker';

import { usePermissions } from 'src/auth/use-permissions';

// ----------------------------------------------------------------------

const CATEGORIES = ['1BHK', '2BHK', '3BHK', '4BHK'];

export function PricingView() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = useBranch();
  const { can } = usePermissions();

  const canCreate = can('pricing:create');
  const canUpdate = can('pricing:update');
  const canDelete = can('pricing:delete');
  const canShowActions = canUpdate || canDelete;

  // Search, Filter & Pagination states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // General error banner
  const [errorMessage, setErrorMessage] = useState('');

  // Reset page to first on search or filter change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, selectedBranchId]);

  // Paginated TanStack query
  const {
    data: queryResult,
    isLoading: loading,
    refetch: fetchRules,
  } = usePaginatedPricingRules({
    branchId: selectedBranchId,
    search: debouncedSearch,
    isActive: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: rowsPerPage,
  });

  const rules = queryResult?.rules || [];
  const totalRules = queryResult?.total || 0;

  // --------------------------------------------------------------------
  // CREATE RULE STATE & HANDLERS
  // --------------------------------------------------------------------
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    festivalName: '',
    startDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().add(8, 'day').format('YYYY-MM-DD'),
    adjustmentType: 'PERCENTAGE_SURGE',
    adjustmentValue: 20,
    priority: 1,
    applicableCategory: '',
    isActive: true,
    description: '',
  });

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      festivalName: '',
      startDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(8, 'day').format('YYYY-MM-DD'),
      adjustmentType: 'PERCENTAGE_SURGE',
      adjustmentValue: 20,
      priority: 1,
      applicableCategory: '',
      isActive: true,
      description: '',
    });
    setCreateDialogOpen(true);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.startDate || !createForm.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (dayjs(createForm.endDate).isBefore(dayjs(createForm.startDate))) {
      toast.error('End date must be after or equal to start date');
      return;
    }

    try {
      setCreateSubmitting(true);
      const payload: Record<string, any> = {
        name: createForm.name.trim(),
        festivalName: createForm.festivalName.trim() || undefined,
        startDate: `${createForm.startDate}T00:00:00.000Z`,
        endDate: `${createForm.endDate}T23:59:59.999Z`,
        adjustmentType: createForm.adjustmentType,
        adjustmentValue:
          createForm.adjustmentType === 'FIXED_RENT'
            ? Number(createForm.adjustmentValue) * 100
            : Number(createForm.adjustmentValue),
        priority: Number(createForm.priority),
        applicableBranches: selectedBranchId ? [selectedBranchId] : [],
        applicableCategories: createForm.applicableCategory ? [createForm.applicableCategory] : [],
        isActive: createForm.isActive,
        description: createForm.description.trim() || undefined,
      };

      await api.post('/pricing', payload);
      toast.success('Pricing rule created successfully!');
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create pricing rule');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // --------------------------------------------------------------------
  // UPDATE / EDIT RULE STATE & HANDLERS
  // --------------------------------------------------------------------
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    festivalName: '',
    startDate: '',
    endDate: '',
    adjustmentType: 'PERCENTAGE_SURGE',
    adjustmentValue: 20,
    priority: 1,
    applicableCategory: '',
    isActive: true,
    description: '',
  });

  const handleOpenEdit = (rule: any) => {
    setEditForm({
      id: rule._id,
      name: rule.name || '',
      festivalName: rule.festivalName || '',
      startDate: dayjs(rule.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(rule.endDate).format('YYYY-MM-DD'),
      adjustmentType: rule.adjustmentType || 'PERCENTAGE_SURGE',
      adjustmentValue:
        rule.adjustmentType === 'FIXED_RENT'
          ? Math.round(Number(rule.adjustmentValue || 0) / 100)
          : Number(rule.adjustmentValue || 0),
      priority: rule.priority ?? 1,
      applicableCategory: rule.applicableCategories?.[0] || '',
      isActive: rule.isActive ?? true,
      description: rule.description || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (dayjs(editForm.endDate).isBefore(dayjs(editForm.startDate))) {
      toast.error('End date must be after or equal to start date');
      return;
    }

    try {
      setEditSubmitting(true);
      const payload: Record<string, any> = {
        name: editForm.name.trim(),
        festivalName: editForm.festivalName.trim() || undefined,
        startDate: `${editForm.startDate}T00:00:00.000Z`,
        endDate: `${editForm.endDate}T23:59:59.999Z`,
        adjustmentType: editForm.adjustmentType,
        adjustmentValue:
          editForm.adjustmentType === 'FIXED_RENT'
            ? Number(editForm.adjustmentValue) * 100
            : Number(editForm.adjustmentValue),
        priority: Number(editForm.priority),
        applicableCategories: editForm.applicableCategory ? [editForm.applicableCategory] : [],
        isActive: editForm.isActive,
        description: editForm.description.trim() || undefined,
      };

      await api.put(`/pricing/${editForm.id}`, payload);
      toast.success('Pricing rule updated successfully!');
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update pricing rule');
    } finally {
      setEditSubmitting(false);
    }
  };

  // --------------------------------------------------------------------
  // QUICK ACTIVE TOGGLE
  // --------------------------------------------------------------------
  const handleToggleActive = async (rule: any) => {
    if (!canUpdate) return;
    const newStatus = !rule.isActive;
    try {
      await api.put(`/pricing/${rule._id}`, { isActive: newStatus });
      toast.success(`Rule "${rule.name}" marked as ${newStatus ? 'Active' : 'Inactive'}`);
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change status');
    }
  };

  // --------------------------------------------------------------------
  // DELETE RULE STATE & HANDLERS
  // --------------------------------------------------------------------
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<any | null>(null);

  const handleOpenDelete = (rule: any) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      setDeleteSubmitting(true);
      await api.delete(`/pricing/${ruleToDelete._id}`);
      toast.success(`Pricing rule "${ruleToDelete.name}" deleted successfully!`);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete pricing rule');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Peak Pricing & Festival Management
            </Typography>
            <Chip
              label={`${totalRules} ${totalRules === 1 ? 'Rule' : 'Rules'}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Configure seasonal surcharges, festival rates (Diwali, Navratri, New Year, Long Weekends), and discount rules
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:tag-price-bold" width={20} />}
            onClick={handleOpenCreate}
            sx={{ fontWeight: 700, px: 2.5 }}
          >
            Add Pricing Rule
          </Button>
        )}
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Search and Filters Bar */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by rule name, festival tag, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 300 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <Iconify icon="solar:close-circle-bold" width={18} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="true">Active Only</MenuItem>
          <MenuItem value="false">Inactive Only</MenuItem>
        </TextField>

        <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => fetchRules()}
            startIcon={<Iconify icon="solar:refresh-bold" />}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>
      </Card>

      {/* Rules Table */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8, minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 950 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Rule Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Festival / Tag</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date Range (Active Window)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Adjustment Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Applicable Categories</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Priority</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                  {canShowActions && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canShowActions ? 9 : 8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            color: 'text.secondary',
                          }}
                        >
                          <Iconify icon="solar:tag-price-bold" width={28} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {search ? 'No matching pricing rules found' : 'No pricing rules configured'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                          {search
                            ? `Try clearing your search term "${search}" or change the status filter.`
                            : 'Standard bungalow rents apply across dates until a peak season or festival surcharge is created.'}
                        </Typography>
                        {canCreate && !search && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Iconify icon="solar:tag-price-bold" />}
                            onClick={handleOpenCreate}
                          >
                            Add First Pricing Rule
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((r: any) => {
                    const startDateObj = dayjs(r.startDate);
                    const endDateObj = dayjs(r.endDate);
                    const diffDays = Math.max(1, endDateObj.diff(startDateObj, 'day') + 1);

                    return (
                      <TableRow key={r._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {r.name}
                          </Typography>
                          {r.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                              {r.description}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {r.festivalName ? (
                            <Chip
                              label={r.festivalName}
                              size="small"
                              icon={<Iconify icon="solar:fire-bold" width={14} />}
                              sx={{
                                fontWeight: 700,
                                bgcolor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              Regular Peak
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="solar:calendar-date-bold" width={16} sx={{ color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {startDateObj.format('DD MMM YYYY')} – {endDateObj.format('DD MMM YYYY')}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {diffDays} {diffDays === 1 ? 'day window' : 'days window'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              r.adjustmentType === 'PERCENTAGE_SURGE'
                                ? 'Percentage Surge (+%)'
                                : r.adjustmentType === 'FIXED_RENT'
                                ? 'Fixed Daily Rent (₹)'
                                : 'Percentage Discount (-%)'
                            }
                            sx={{
                              fontWeight: 600,
                              borderColor:
                                r.adjustmentType === 'PERCENTAGE_SURGE'
                                  ? '#fed7aa'
                                  : r.adjustmentType === 'FIXED_RENT'
                                  ? '#bfdbfe'
                                  : '#bbf7d0',
                              bgcolor:
                                r.adjustmentType === 'PERCENTAGE_SURGE'
                                  ? '#fff7ed'
                                  : r.adjustmentType === 'FIXED_RENT'
                                  ? '#eff6ff'
                                  : '#f0fdf4',
                              color:
                                r.adjustmentType === 'PERCENTAGE_SURGE'
                                  ? '#c2410c'
                                  : r.adjustmentType === 'FIXED_RENT'
                                  ? '#1d4ed8'
                                  : '#15803d',
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                          {r.adjustmentType === 'FIXED_RENT' ? (
                            <Box component="span" sx={{ color: '#1d4ed8' }}>
                              ₹{Math.round(r.adjustmentValue / 100).toLocaleString('en-IN')}{' '}
                              <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                                / night
                              </Typography>
                            </Box>
                          ) : r.adjustmentType === 'PERCENTAGE_SURGE' ? (
                            <Box component="span" sx={{ color: '#ea580c' }}>
                              +{r.adjustmentValue}%
                            </Box>
                          ) : (
                            <Box component="span" sx={{ color: '#16a34a' }}>
                              -{r.adjustmentValue}%
                            </Box>
                          )}
                        </TableCell>

                        <TableCell>
                          {r.applicableCategories?.length > 0 ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {r.applicableCategories.map((cat: string) => (
                                <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} />
                              ))}
                            </Stack>
                          ) : (
                            <Chip label="All Villas (1BHK - 4BHK)" size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600, fontSize: 11 }} />
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={`P${r.priority ?? 1}`}
                            sx={{
                              bgcolor: (r.priority ?? 1) > 1 ? '#fdf2f8' : '#f8fafc',
                              color: (r.priority ?? 1) > 1 ? '#be185d' : 'text.primary',
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title={canUpdate ? 'Click to toggle status' : ''}>
                            <Chip
                              size="small"
                              label={r.isActive ? 'Active' : 'Inactive'}
                              color={r.isActive ? 'success' : 'default'}
                              onClick={canUpdate ? () => handleToggleActive(r) : undefined}
                              sx={{
                                fontWeight: 700,
                                cursor: canUpdate ? 'pointer' : 'default',
                                '&:hover': canUpdate ? { opacity: 0.85 } : undefined,
                              }}
                            />
                          </Tooltip>
                        </TableCell>

                        {canShowActions && (
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {canUpdate && (
                                <Tooltip title="Edit Pricing Rule">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEdit(r)}
                                    sx={{
                                      color: '#1d68d8',
                                      bgcolor: '#f0f6ff',
                                      '&:hover': { bgcolor: '#e0edfe' },
                                    }}
                                  >
                                    <Iconify icon="solar:pen-bold" width={18} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {canDelete && (
                                <Tooltip title="Delete Pricing Rule">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDelete(r)}
                                    sx={{
                                      color: '#dc2626',
                                      bgcolor: '#fef2f2',
                                      '&:hover': { bgcolor: '#fee2e2' },
                                    }}
                                  >
                                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Table Pagination */}
        <TablePagination
          component="div"
          page={page}
          count={totalRules}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>

      {/* -------------------------------------------------------------------- */}
      {/* CREATE RULE DIALOG */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:tag-price-bold" width={24} sx={{ color: 'primary.main' }} />
          Create Peak / Festival Pricing Rule
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateRule}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Rule Name *"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Diwali Peak Surcharge 2026"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Festival / Event Tag"
                  value={createForm.festivalName}
                  onChange={e => setCreateForm({ ...createForm, festivalName: e.target.value })}
                  placeholder="e.g. Diwali, Navratri, New Year, Long Weekend"
                  helperText="Optional tag shown on guest quotes and availability calendar"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomDatePicker
                  label="Start Date *"
                  value={createForm.startDate}
                  onChange={val => setCreateForm({ ...createForm, startDate: val })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomDatePicker
                  label="End Date *"
                  value={createForm.endDate}
                  minDate={createForm.startDate}
                  onChange={val => setCreateForm({ ...createForm, endDate: val })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjustment Type *"
                  value={createForm.adjustmentType}
                  onChange={e => setCreateForm({ ...createForm, adjustmentType: e.target.value })}
                >
                  <MenuItem value="PERCENTAGE_SURGE">Percentage Surge (+%)</MenuItem>
                  <MenuItem value="FIXED_RENT">Fixed Rent Flat (₹ / night)</MenuItem>
                  <MenuItem value="PERCENTAGE_DISCOUNT">Percentage Discount (-%)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={
                    createForm.adjustmentType === 'FIXED_RENT'
                      ? 'Fixed Rent Amount (₹) *'
                      : 'Percentage Value (%) *'
                  }
                  value={createForm.adjustmentValue}
                  onChange={e => setCreateForm({ ...createForm, adjustmentValue: Number(e.target.value) })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Category Applicability"
                  value={createForm.applicableCategory}
                  onChange={e => setCreateForm({ ...createForm, applicableCategory: e.target.value })}
                >
                  <MenuItem value="">All Bungalow Categories</MenuItem>
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat} Villas Only
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Resolution Priority"
                  value={createForm.priority}
                  onChange={e => setCreateForm({ ...createForm, priority: Number(e.target.value) })}
                  helperText="Higher priority rules override lower ones during date overlap"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description / Internal Notes"
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="e.g. Surcharge approved by management for high occupancy festival period"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={createForm.isActive}
                      onChange={e => setCreateForm({ ...createForm, isActive: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Activate rule immediately"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit" disabled={createSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createSubmitting}
              startIcon={createSubmitting ? <CircularProgress size={18} /> : null}
            >
              {createSubmitting ? 'Saving...' : 'Save Pricing Rule'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* EDIT / UPDATE RULE DIALOG */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:pen-bold" width={24} sx={{ color: 'primary.main' }} />
          Edit Pricing Rule
        </DialogTitle>
        <Box component="form" onSubmit={handleUpdateRule}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Rule Name *"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Festival / Event Tag"
                  value={editForm.festivalName}
                  onChange={e => setEditForm({ ...editForm, festivalName: e.target.value })}
                  placeholder="e.g. Diwali, Navratri, New Year, Long Weekend"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomDatePicker
                  label="Start Date *"
                  value={editForm.startDate}
                  onChange={val => setEditForm({ ...editForm, startDate: val })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomDatePicker
                  label="End Date *"
                  value={editForm.endDate}
                  minDate={editForm.startDate}
                  onChange={val => setEditForm({ ...editForm, endDate: val })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjustment Type *"
                  value={editForm.adjustmentType}
                  onChange={e => setEditForm({ ...editForm, adjustmentType: e.target.value })}
                >
                  <MenuItem value="PERCENTAGE_SURGE">Percentage Surge (+%)</MenuItem>
                  <MenuItem value="FIXED_RENT">Fixed Rent Flat (₹ / night)</MenuItem>
                  <MenuItem value="PERCENTAGE_DISCOUNT">Percentage Discount (-%)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={
                    editForm.adjustmentType === 'FIXED_RENT'
                      ? 'Fixed Rent Amount (₹) *'
                      : 'Percentage Value (%) *'
                  }
                  value={editForm.adjustmentValue}
                  onChange={e => setEditForm({ ...editForm, adjustmentValue: Number(e.target.value) })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Category Applicability"
                  value={editForm.applicableCategory}
                  onChange={e => setEditForm({ ...editForm, applicableCategory: e.target.value })}
                >
                  <MenuItem value="">All Bungalow Categories</MenuItem>
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat} Villas Only
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Resolution Priority"
                  value={editForm.priority}
                  onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                  helperText="Higher priority rules override lower ones during date overlap"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description / Internal Notes"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.isActive}
                      onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Rule Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit" disabled={editSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={editSubmitting}
              startIcon={editSubmitting ? <CircularProgress size={18} /> : null}
            >
              {editSubmitting ? 'Updating...' : 'Update Pricing Rule'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" width={24} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to delete the pricing rule <strong>&ldquo;{ruleToDelete?.name}&rdquo;</strong>?
          </Typography>

          {ruleToDelete?.festivalName && (
            <Box sx={{ p: 1.5, bgcolor: '#fef3c7', borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700 }}>
                Festival Tag: {ruleToDelete.festivalName}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            This action is permanent and cannot be undone. Bookings falling into this date window will automatically revert to standard bungalow pricing or the next highest priority rule.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteSubmitting}
            startIcon={deleteSubmitting ? <CircularProgress size={18} /> : <Iconify icon="solar:trash-bin-trash-bold" />}
          >
            {deleteSubmitting ? 'Deleting...' : 'Delete Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
