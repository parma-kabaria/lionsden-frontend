import * as Yup from 'yup';
import { toast } from 'sonner';
import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useBranches } from 'src/query';
import { api } from 'src/api/api-client';

// ----------------------------------------------------------------------

interface AddBungalowDialogProps {
  open: boolean;
  onClose: () => void;
  branchId?: string;
}

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

export function AddBungalowDialog({ open, onClose, branchId }: AddBungalowDialogProps) {
  const queryClient = useQueryClient();
  const { data: branches = [] } = useBranches();
  const [submitting, setSubmitting] = useState(false);

  const createFormik = useFormik({
    initialValues: {
      number: '',
      category: '2BHK',
      branchId: branchId || '',
      standardRentRupees: 7500,
      adults: 4,
      children: 2,
      maxGuests: 6,
      facilities: ['Air Conditioning', 'Geyser', 'Smart TV', 'High-Speed Wi-Fi'],
      description: '',
      isActive: true,
      maintenanceStatus: 'NONE',
    },
    enableReinitialize: true,
    validationSchema: bungalowValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitting(true);
        const payload = {
          number: values.number.trim().toUpperCase(),
          category: values.category,
          branch: values.branchId,
          standardRent: Math.round(values.standardRentRupees * 100),
          capacity: {
            adults: Number(values.adults),
            children: Number(values.children),
            maxGuests: Number(values.maxGuests),
          },
          facilities: values.facilities,
          description: values.description,
          isActive: values.isActive,
          maintenanceStatus: values.maintenanceStatus,
        };

        await api.post('/bungalows', payload);
        toast.success(`Bungalow ${values.number} created successfully!`);
        resetForm();
        onClose();
        queryClient.invalidateQueries({ queryKey: ['bungalows'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err: any) {
        toast.error(err.message || 'Failed to create bungalow');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (branches.length > 0 && !createFormik.values.branchId) {
      const defaultBranch = branches.find((b: any) => b.type !== 'HEAD_OFFICE') || branches[0];
      if (defaultBranch) {
        createFormik.setFieldValue('branchId', defaultBranch._id);
      }
    }
  }, [branches, createFormik]);

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

  const toggleCreateFacility = (facility: string) => {
    const current = createFormik.values.facilities;
    const exists = current.includes(facility);
    createFormik.setFieldValue(
      'facilities',
      exists ? current.filter(f => f !== facility) : [...current, facility]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
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
  );
}
