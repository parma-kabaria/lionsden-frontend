import * as Yup from 'yup';
import { toast } from 'sonner';
import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
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
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useDebounce } from 'src/hooks/use-debounce';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { StatusIcon } from 'src/components/status-icon';

import { usePermissions } from 'src/auth/use-permissions';

// ----------------------------------------------------------------------

const bungalowValidationSchema = Yup.object().shape({
  number: Yup.string().trim().required('Unit number is required'),
  category: Yup.string().required('Category is required'),
  branchId: Yup.string().required('Branch location is required'),
  standardRentRupees: Yup.number()
    .typeError('Rent must be a number')
    .min(0, 'Rent must be positive')
    .required('Standard base rent is required'),
  adults: Yup.number()
    .typeError('Must be a number')
    .min(1, 'Minimum 1 adult')
    .required('Adults capacity is required'),
  children: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative')
    .required('Children capacity is required'),
  maxGuests: Yup.number()
    .typeError('Must be a number')
    .min(1, 'Minimum 1 guest')
    .required('Max guests is required'),
  maintenanceStatus: Yup.string().default('NONE'),
  isActive: Yup.boolean().default(true),
  facilities: Yup.array().of(Yup.string()).default([]),
  description: Yup.string().default(''),
});

const ALL_FACILITIES = [
  'Air Conditioning',
  'Geyser',
  'Smart TV',
  'High-Speed Wi-Fi',
  'Private Lawn',
  'Plunge Pool',
  'Refrigerator',
  'Electric Kettle',
  'Balcony View',
  'Power Backup',
];

const CATEGORIES = ['1BHK', '2BHK', '3BHK', '4BHK'];

const DEFAULT_CATEGORY_DEFAULTS: Record<string, { rent: number; adults: number; children: number; maxGuests: number }> = {
  '1BHK': { rent: 4500, adults: 2, children: 1, maxGuests: 4 },
  '2BHK': { rent: 7500, adults: 4, children: 2, maxGuests: 6 },
  '3BHK': { rent: 11000, adults: 6, children: 3, maxGuests: 9 },
  '4BHK': { rent: 15000, adults: 8, children: 4, maxGuests: 12 },
};

export function BungalowsView() {
  const queryClient = useQueryClient();
  const { selectedBranchId, branches } = useBranch();
  const { can } = usePermissions();

  const canCreate = can('bungalows:create');
  const canUpdate = can('bungalows:update');
  const canDelete = can('bungalows:delete');
  const canShowActions = canUpdate || canDelete;

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('');
  const [maintenanceFilter, setMaintenanceFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset to first page when any filter or search changes
  useEffect(() => {
    setPage(0);
  }, [categoryFilter, maintenanceFilter, debouncedSearch, selectedBranchId]);

  // TanStack Query for automatic caching & revalidation
  const {
    data: queryResult,
    isLoading: loading,
    refetch: fetchBungalows,
  } = useQuery({
    queryKey: [
      'bungalows',
      {
        branchId: selectedBranchId,
        category: categoryFilter,
        maintenance: maintenanceFilter,
        search: debouncedSearch,
        page,
        limit: rowsPerPage,
      },
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (categoryFilter) params.category = categoryFilter;
      if (maintenanceFilter) params.maintenanceStatus = maintenanceFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get('/bungalows', params);
      return {
        bungalows: res?.data || [],
        total: res?.meta?.pagination?.total ?? (res?.data?.length || 0),
      };
    },
  });

  const bungalows = queryResult?.bungalows || [];
  const totalBungalows = queryResult?.total || 0;

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bungalowToDelete, setBungalowToDelete] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formik: Create Bungalow
  const createFormik = useFormik({
    initialValues: {
      number: '',
      category: '2BHK',
      branchId: '',
      standardRentRupees: 7500,
      adults: 4,
      children: 2,
      maxGuests: 6,
      facilities: ['Air Conditioning', 'Geyser', 'Smart TV', 'High-Speed Wi-Fi', 'Private Lawn'],
      description: '',
      isActive: true,
      maintenanceStatus: 'NONE',
    },
    validationSchema: bungalowValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitting(true);
        await api.post('/bungalows', {
          number: values.number.trim().toUpperCase(),
          branch: values.branchId,
          category: values.category,
          standardRent: Math.round(Number(values.standardRentRupees) * 100), // convert rupees to paise
          capacity: {
            adults: Number(values.adults),
            children: Number(values.children),
            maxGuests: Number(values.maxGuests),
          },
          facilities: values.facilities,
          description: values.description.trim(),
          isActive: values.isActive,
          maintenanceStatus: values.maintenanceStatus,
        });

        setCreateDialogOpen(false);
        const defaults = DEFAULT_CATEGORY_DEFAULTS['2BHK'];
        const dhari = branches.find(b => b.code === 'DHARI') || branches[0];
        resetForm({
          values: {
            number: '',
            category: '2BHK',
            branchId: dhari?._id || '',
            standardRentRupees: defaults.rent,
            adults: defaults.adults,
            children: defaults.children,
            maxGuests: defaults.maxGuests,
            facilities: ['Air Conditioning', 'Geyser', 'Smart TV', 'High-Speed Wi-Fi', 'Private Lawn'],
            description: '',
            isActive: true,
            maintenanceStatus: 'NONE',
          },
        });
        toast.success('Bungalow created successfully!');
        queryClient.invalidateQueries({ queryKey: ['bungalows'] });
      } catch (err: any) {
        toast.error(err.message || 'Failed to create bungalow');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Formik: Edit Bungalow
  const editFormik = useFormik({
    initialValues: {
      id: '',
      number: '',
      category: '2BHK',
      branchId: '',
      standardRentRupees: 7500,
      adults: 4,
      children: 2,
      maxGuests: 6,
      facilities: [] as string[],
      description: '',
      isActive: true,
      maintenanceStatus: 'NONE',
    },
    validationSchema: bungalowValidationSchema,
    onSubmit: async values => {
      if (!values.id) return;
      try {
        setSubmitting(true);
        await api.put(`/bungalows/${values.id}`, {
          number: values.number.trim().toUpperCase(),
          category: values.category,
          standardRent: Math.round(Number(values.standardRentRupees) * 100),
          capacity: {
            adults: Number(values.adults),
            children: Number(values.children),
            maxGuests: Number(values.maxGuests),
          },
          facilities: values.facilities,
          description: values.description.trim(),
          isActive: values.isActive,
          maintenanceStatus: values.maintenanceStatus,
        });

        setEditDialogOpen(false);
        toast.success(`Bungalow ${values.number} updated successfully!`);
        queryClient.invalidateQueries({ queryKey: ['bungalows'] });
      } catch (err: any) {
        toast.error(err.message || 'Failed to update bungalow');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Default branch to Dhari (where all physical bungalows exist)
  useEffect(() => {
    if (branches.length > 0 && !createFormik.values.branchId) {
      const dhari = branches.find(b => b.code === 'DHARI') || branches[0];
      if (dhari) {
        createFormik.setFieldValue('branchId', dhari._id);
      }
    }
  }, [branches, createFormik]);

  // When changing category in create dialog, update defaults
  const handleCreateCategoryChange = (cat: string) => {
    const defaults = DEFAULT_CATEGORY_DEFAULTS[cat] || DEFAULT_CATEGORY_DEFAULTS['2BHK'];
    createFormik.setValues({
      ...createFormik.values,
      category: cat,
      standardRentRupees: defaults.rent,
      adults: defaults.adults,
      children: defaults.children,
      maxGuests: defaults.maxGuests,
    });
  };

  // Toggle facility in create form
  const toggleCreateFacility = (facility: string) => {
    const current = createFormik.values.facilities;
    const exists = current.includes(facility);
    createFormik.setFieldValue(
      'facilities',
      exists ? current.filter(f => f !== facility) : [...current, facility]
    );
  };

  // Toggle facility in edit form
  const toggleEditFacility = (facility: string) => {
    const current = editFormik.values.facilities;
    const exists = current.includes(facility);
    editFormik.setFieldValue(
      'facilities',
      exists ? current.filter(f => f !== facility) : [...current, facility]
    );
  };

  // Open Edit Dialog
  const handleOpenEdit = (b: any) => {
    editFormik.resetForm({
      values: {
        id: b._id,
        number: b.number || '',
        category: b.category || '2BHK',
        branchId: b.branch?._id || b.branch || '',
        standardRentRupees: Math.round((b.standardRent || 0) / 100),
        adults: b.capacity?.adults || 2,
        children: b.capacity?.children || 1,
        maxGuests: b.capacity?.maxGuests || 4,
        facilities: b.facilities || [],
        description: b.description || '',
        isActive: b.isActive !== undefined ? b.isActive : true,
        maintenanceStatus: b.maintenanceStatus || 'NONE',
      },
    });
    setEditDialogOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (b: any) => {
    setBungalowToDelete(b);
    setDeleteDialogOpen(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!bungalowToDelete) return;

    try {
      setSubmitting(true);
      await api.delete(`/bungalows/${bungalowToDelete._id}`);
      setDeleteDialogOpen(false);
      toast.success(`Bungalow ${bungalowToDelete.number} deleted successfully!`);
      setBungalowToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete bungalow');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
              <Iconify icon="solar:home-smile-angle-bold" width={24} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Bungalow Master Inventory
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage ~80 luxury villa units at Dhari Resort, Gir Forest. Create units, modify base rents, and control operational maintenance.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              bgcolor: '#1d68d8',
              '&:hover': { bgcolor: '#1552b0' },
              boxShadow: '0 4px 14px rgba(29, 104, 216, 0.35)',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
            }}
          >
            Add Bungalow Unit
          </Button>
        )}
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <TextField
          size="small"
          placeholder="Search bungalow number (e.g. B-101)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: { xs: 1, sm: 280 } }}
          slotProps={{
            input: {
              startAdornment: <Iconify icon="solar:magnifer-bold" sx={{ color: 'text.disabled', mr: 1 }} />,
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Category"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {CATEGORIES.map(c => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Operational Status"
          value={maintenanceFilter}
          onChange={e => setMaintenanceFilter(e.target.value)}
          sx={{ width: 190 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="NONE">Operational (Ready)</MenuItem>
          <MenuItem value="PARTIAL">Partial Issue</MenuItem>
          <MenuItem value="UNDER_MAINTENANCE">Blocked Maintenance</MenuItem>
        </TextField>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => fetchBungalows()} startIcon={<Iconify icon="solar:refresh-bold" />} sx={{ textTransform: 'none' }}>
            Refresh
          </Button>
        </Box>
      </Card>

      {/* Inventory Table */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Unit No.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Standard Base Rent</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Facilities Included</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                {canShowActions && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {bungalows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canShowActions ? 7 : 6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No bungalows found
                  </TableCell>
                </TableRow>
              ) : (
                bungalows.map((b: any) => {
                  const standardRupees = Math.round((b.standardRent || 0) / 100);

                  return (
                    <TableRow key={b._id} hover>
                      <TableCell sx={{ fontWeight: 800 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: '#e8f1fd',
                              color: '#1d68d8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            🏡
                          </Box> */}
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1d68d8' }}>
                            {b.number}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={b.category}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: 11,
                            bgcolor:
                              b.category === '4BHK'
                                ? '#fdf2f8'
                                : b.category === '3BHK'
                                  ? '#f5f3ff'
                                  : b.category === '2BHK'
                                    ? '#eff6ff'
                                    : '#f0fdf4',
                            color:
                              b.category === '4BHK'
                                ? '#9d174d'
                                : b.category === '3BHK'
                                  ? '#6d28d9'
                                  : b.category === '2BHK'
                                    ? '#1d4ed8'
                                    : '#047857',
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {b.capacity?.maxGuests || 4} Guests Max
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ({b.capacity?.adults || 2} Adults + {b.capacity?.children || 1} Child)
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                        ₹{standardRupees.toLocaleString('en-IN')}{' '}
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          / night
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 220 }}>
                          {b.facilities?.slice(0, 3).map((f: string) => (
                            <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                          ))}
                          {b.facilities?.length > 3 && (
                            <Tooltip title={b.facilities.slice(3).join(', ')}>
                              <Chip label={`+${b.facilities.length - 3}`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, bgcolor: '#f1f5f9' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        {b.maintenanceStatus === 'UNDER_MAINTENANCE' ? (
                          <Chip
                            icon={<StatusIcon type="maintenance" size={16} />}
                            label="Under Maintenance"
                            size="small"
                            sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700 }}
                          />
                        ) : b.maintenanceStatus === 'PARTIAL' ? (
                          <Chip
                            icon={<StatusIcon type="maintenance" size={16} />}
                            label="Partial Issue"
                            size="small"
                            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            icon={<StatusIcon type="unbooked" size={16} />}
                            label="Operational"
                            size="small"
                            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }}
                          />
                        )}
                      </TableCell>

                      {canShowActions && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {canUpdate && (
                              <Tooltip title="Edit Bungalow Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEdit(b)}
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
                              <Tooltip title="Delete Bungalow Unit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDelete(b)}
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
        )}

        <TablePagination
          component="div"
          page={page}
          count={totalBungalows}
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

      {/* Dialog: Create Bungalow */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Register New Bungalow Unit</DialogTitle>
        <Box component="form" onSubmit={createFormik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  name="number"
                  label="Bungalow Unit Number *"
                  placeholder="e.g. B-501"
                  value={createFormik.values.number}
                  onChange={e => createFormik.setFieldValue('number', e.target.value.toUpperCase())}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.number && Boolean(createFormik.errors.number)}
                  helperText={
                    createFormik.touched.number && createFormik.errors.number
                      ? createFormik.errors.number
                      : 'Unique room/bungalow identifier'
                  }
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  name="category"
                  label="Category *"
                  value={createFormik.values.category}
                  onChange={e => handleCreateCategoryChange(e.target.value)}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.category && Boolean(createFormik.errors.category)}
                  helperText={createFormik.touched.category && createFormik.errors.category ? createFormik.errors.category : ''}
                  required
                >
                  {CATEGORIES.map(c => (
                    <MenuItem key={c} value={c}>
                      {c} Villa
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  name="branchId"
                  label="Resort Branch Location *"
                  value={createFormik.values.branchId}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.branchId && Boolean(createFormik.errors.branchId)}
                  helperText={
                    createFormik.touched.branchId && createFormik.errors.branchId
                      ? createFormik.errors.branchId
                      : 'All physical bungalows reside at Dhari Resort property'
                  }
                  required
                >
                  {branches.map(b => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name} ({b.code}) - {b.type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="standardRentRupees"
                  label="Standard Base Rent (₹ / night) *"
                  value={createFormik.values.standardRentRupees}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.standardRentRupees && Boolean(createFormik.errors.standardRentRupees)}
                  helperText={
                    createFormik.touched.standardRentRupees && createFormik.errors.standardRentRupees
                      ? String(createFormik.errors.standardRentRupees)
                      : 'Excluding food and festival surge pricing'
                  }
                  required
                />
              </Grid>

              {/* Guest Capacity */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="adults"
                  label="Adults Capacity"
                  value={createFormik.values.adults}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.adults && Boolean(createFormik.errors.adults)}
                  helperText={createFormik.touched.adults && createFormik.errors.adults ? String(createFormik.errors.adults) : ''}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="children"
                  label="Children Capacity"
                  value={createFormik.values.children}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.children && Boolean(createFormik.errors.children)}
                  helperText={createFormik.touched.children && createFormik.errors.children ? String(createFormik.errors.children) : ''}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="maxGuests"
                  label="Max Total Guests"
                  value={createFormik.values.maxGuests}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.maxGuests && Boolean(createFormik.errors.maxGuests)}
                  helperText={createFormik.touched.maxGuests && createFormik.errors.maxGuests ? String(createFormik.errors.maxGuests) : ''}
                  required
                />
              </Grid>

              {/* Operational Status */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  name="maintenanceStatus"
                  label="Initial Maintenance Status"
                  value={createFormik.values.maintenanceStatus}
                  onChange={createFormik.handleChange}
                >
                  <MenuItem value="NONE">Operational (Ready to Book)</MenuItem>
                  <MenuItem value="PARTIAL">Partial Issue (Cosmetic)</MenuItem>
                  <MenuItem value="UNDER_MAINTENANCE">Under Maintenance (Blocked)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createFormik.values.isActive}
                        onChange={e => createFormik.setFieldValue('isActive', e.target.checked)}
                        color="success"
                      />
                    }
                    label="Active Unit (Visible for Booking)"
                  />
                </Box>
              </Grid>

              {/* Facilities Checklist */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Included Amenities & Facilities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ALL_FACILITIES.map(fac => {
                    const selected = createFormik.values.facilities.includes(fac);
                    return (
                      <Chip
                        key={fac}
                        label={fac}
                        clickable
                        onClick={() => toggleCreateFacility(fac)}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selected ? 700 : 500,
                          bgcolor: selected ? '#1d68d8' : 'transparent',
                          color: selected ? '#fff' : 'text.primary',
                          '&:hover': {
                            bgcolor: selected ? '#1552b0' : '#f1f5f9',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="description"
                  label="Description / Special Features"
                  placeholder="e.g. Pool view villa with private garden near the Gir eco-trail"
                  value={createFormik.values.description}
                  onChange={createFormik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Register Bungalow'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Edit Bungalow */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Bungalow {editFormik.values.number}</DialogTitle>
        <Box component="form" onSubmit={editFormik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  name="number"
                  label="Bungalow Unit Number *"
                  value={editFormik.values.number}
                  onChange={e => editFormik.setFieldValue('number', e.target.value.toUpperCase())}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.number && Boolean(editFormik.errors.number)}
                  helperText={editFormik.touched.number && editFormik.errors.number ? editFormik.errors.number : ''}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  name="category"
                  label="Category *"
                  value={editFormik.values.category}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.category && Boolean(editFormik.errors.category)}
                  helperText={editFormik.touched.category && editFormik.errors.category ? editFormik.errors.category : ''}
                  required
                >
                  {CATEGORIES.map(c => (
                    <MenuItem key={c} value={c}>
                      {c} Villa
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="standardRentRupees"
                  label="Standard Base Rent (₹ / night) *"
                  value={editFormik.values.standardRentRupees}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.standardRentRupees && Boolean(editFormik.errors.standardRentRupees)}
                  helperText={
                    editFormik.touched.standardRentRupees && editFormik.errors.standardRentRupees
                      ? String(editFormik.errors.standardRentRupees)
                      : ''
                  }
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  name="maintenanceStatus"
                  label="Maintenance Status"
                  value={editFormik.values.maintenanceStatus}
                  onChange={editFormik.handleChange}
                >
                  <MenuItem value="NONE">Operational (Ready to Book)</MenuItem>
                  <MenuItem value="PARTIAL">Partial Issue (Cosmetic)</MenuItem>
                  <MenuItem value="UNDER_MAINTENANCE">Under Maintenance (Blocked)</MenuItem>
                </TextField>
              </Grid>

              {/* Guest Capacity */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="adults"
                  label="Adults Capacity"
                  value={editFormik.values.adults}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.adults && Boolean(editFormik.errors.adults)}
                  helperText={editFormik.touched.adults && editFormik.errors.adults ? String(editFormik.errors.adults) : ''}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="children"
                  label="Children Capacity"
                  value={editFormik.values.children}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.children && Boolean(editFormik.errors.children)}
                  helperText={editFormik.touched.children && editFormik.errors.children ? String(editFormik.errors.children) : ''}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="maxGuests"
                  label="Max Total Guests"
                  value={editFormik.values.maxGuests}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.maxGuests && Boolean(editFormik.errors.maxGuests)}
                  helperText={editFormik.touched.maxGuests && editFormik.errors.maxGuests ? String(editFormik.errors.maxGuests) : ''}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editFormik.values.isActive}
                        onChange={e => editFormik.setFieldValue('isActive', e.target.checked)}
                        color="success"
                      />
                    }
                    label="Active Unit (Available for Booking Searches)"
                  />
                </Box>
              </Grid>

              {/* Facilities Checklist */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Included Amenities & Facilities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ALL_FACILITIES.map(fac => {
                    const selected = editFormik.values.facilities.includes(fac);
                    return (
                      <Chip
                        key={fac}
                        label={fac}
                        clickable
                        onClick={() => toggleEditFacility(fac)}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selected ? 700 : 500,
                          bgcolor: selected ? '#1d68d8' : 'transparent',
                          color: selected ? '#fff' : 'text.primary',
                          '&:hover': {
                            bgcolor: selected ? '#1552b0' : '#f1f5f9',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="description"
                  label="Description / Special Features"
                  value={editFormik.values.description}
                  onChange={editFormik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Delete Bungalow Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" width={24} />
          Delete Bungalow Unit
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Are you sure you want to permanently delete this bungalow unit?
          </Typography>
          {bungalowToDelete && (
            <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecaca', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#991b1b' }}>
                Bungalow {bungalowToDelete.number}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b91c1c' }}>
                Category: {bungalowToDelete.category} Villa
              </Typography>
              <Typography variant="caption" sx={{ color: '#7f1d1d', fontWeight: 600, display: 'block' }}>
                Location: {bungalowToDelete.branch?.name || 'Dhari Resort'}
              </Typography>
            </Box>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            ⚠️ This will permanently remove the unit from resort inventory and booking calendars.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
