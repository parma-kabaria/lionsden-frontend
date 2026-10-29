import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { usePermissions } from 'src/auth/use-permissions';

// ----------------------------------------------------------------------

type PermissionItem = {
  code: string;
  label: string;
  description: string;
};

type PermissionCategory = {
  category: string;
  icon: string;
  permissions: PermissionItem[];
};

export function RolesView() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canManageRoles = can('roles:manage');

  const [roles, setRoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [allPermissionsList, setAllPermissionsList] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog for new role creation
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    code: '',
    name: '',
    description: '',
    cloneFrom: 'SALES',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions', undefined, { silent: true }).catch(() => ({ data: null })),
      ]);

      const fetchedRoles = rolesRes?.data || [];
      setRoles(fetchedRoles);

      let fetchedCategories: PermissionCategory[] = [];
      let allPerms: string[] = [];

      if (permsRes?.data?.categories) {
        fetchedCategories = permsRes.data.categories;
        allPerms = permsRes.data.allPermissions || [];
      } else {
        // Fallback default structure if offline
        fetchedCategories = [
          {
            category: 'Users & Roles',
            icon: 'solar:user-bold',
            permissions: [
              { code: 'users:read', label: 'View Staff & Users', description: 'Can view staff directory' },
              { code: 'users:create', label: 'Create Staff', description: 'Can register new staff logins' },
              { code: 'users:update', label: 'Edit Staff', description: 'Can edit profiles and roles' },
              { code: 'users:delete', label: 'Deactivate Staff', description: 'Can deactivate staff accounts' },
              { code: 'roles:manage', label: 'Manage Roles', description: 'Full access to RBAC permissions' },
            ],
          },
          {
            category: 'Bungalows & Inventory',
            icon: 'solar:home-smile-angle-bold',
            permissions: [
              { code: 'bungalows:read', label: 'View Bungalows', description: 'View 80 bungalows at Dhari resort' },
              { code: 'bungalows:create', label: 'Add Bungalow', description: 'Register new bungalow unit' },
              { code: 'bungalows:update', label: 'Update Bungalow', description: 'Modify bungalow amenities and rent' },
              { code: 'bungalows:delete', label: 'Remove Bungalow', description: 'Decommission bungalow unit' },
            ],
          },
          {
            category: 'Bookings & Reservations',
            icon: 'solar:calendar-date-bold',
            permissions: [
              { code: 'availability:search', label: 'Check Availability', description: 'Search real-time bungalow status' },
              { code: 'bookings:read', label: 'View Bookings', description: 'Inspect reservations from Dhari & Ahmedabad' },
              { code: 'bookings:create', label: 'Create Booking', description: 'Make reservations and reserve bungalows' },
              { code: 'bookings:update', label: 'Update Booking', description: 'Change guest dates or options' },
              { code: 'bookings:cancel', label: 'Cancel Booking', description: 'Process guest cancellations' },
            ],
          },
          {
            category: 'Payments & Collections',
            icon: 'solar:card-bold',
            permissions: [
              { code: 'payments:read', label: 'View Payments', description: 'View financial transaction logs' },
              { code: 'payments:record', label: 'Record Payment', description: 'Accept advance deposits and receipts' },
              { code: 'payments:reverse', label: 'Reverse Payment', description: 'Process payment refunds/reversals' },
            ],
          },
        ];
        allPerms = fetchedCategories.flatMap(c => c.permissions.map(p => p.code));
      }

      setCategories(fetchedCategories);
      setAllPermissionsList(allPerms);

      // Select first role by default (prefer ADMIN or SALES if SUPER_ADMIN is read-only)
      if (fetchedRoles.length > 0) {
        const initial = fetchedRoles.find((r: any) => r.code === 'ADMIN') || fetchedRoles[0];
        setSelectedRole(initial);
        setSelectedPermissions(initial.permissions || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch roles and permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectRole = (role: any) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
    setHasChanges(false);
  };

  const handleTogglePermission = (permCode: string) => {
    if (!selectedRole || selectedRole.code === 'SUPER_ADMIN') return;

    setSelectedPermissions(prev => {
      const exists = prev.includes(permCode);
      const next = exists ? prev.filter(c => c !== permCode) : [...prev, permCode];
      setHasChanges(true);
      return next;
    });
  };

  const handleToggleCategory = (cat: PermissionCategory) => {
    if (!selectedRole || selectedRole.code === 'SUPER_ADMIN') return;

    const catPermCodes = cat.permissions.map(p => p.code);
    const allSelected = catPermCodes.every(code => selectedPermissions.includes(code));

    setSelectedPermissions(prev => {
      let next: string[];
      if (allSelected) {
        next = prev.filter(code => !catPermCodes.includes(code));
      } else {
        next = Array.from(new Set([...prev, ...catPermCodes]));
      }
      setHasChanges(true);
      return next;
    });
  };

  const handleSelectAllPermissions = () => {
    if (!selectedRole || selectedRole.code === 'SUPER_ADMIN') return;
    const all = categories.flatMap(c => c.permissions.map(p => p.code));
    setSelectedPermissions(all);
    setHasChanges(true);
  };

  const handleClearAllPermissions = () => {
    if (!selectedRole || selectedRole.code === 'SUPER_ADMIN') return;
    setSelectedPermissions([]);
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      const res = await api.put(`/roles/${selectedRole._id}`, {
        permissions: selectedPermissions,
      });

      const updated = res?.data || { ...selectedRole, permissions: selectedPermissions };
      setSelectedRole(updated);
      setRoles(prev => prev.map(r => (r._id === updated._id ? updated : r)));
      setHasChanges(false);
      toast.success(`Permissions for ${selectedRole.name} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.code || !newRoleForm.name) return;

    try {
      setCreating(true);

      let initialPerms: string[] = [];
      if (newRoleForm.cloneFrom) {
        const sourceRole = roles.find(r => r.code === newRoleForm.cloneFrom);
        if (sourceRole?.permissions) {
          initialPerms = [...sourceRole.permissions];
        }
      }

      const res = await api.post('/roles', {
        code: newRoleForm.code.toUpperCase().trim(),
        name: newRoleForm.name.trim(),
        description: newRoleForm.description.trim(),
        permissions: initialPerms,
      });

      const created = res?.data;
      if (created) {
        setRoles(prev => [...prev, created]);
        setSelectedRole(created);
        setSelectedPermissions(created.permissions || []);
      }

      setCreateDialogOpen(false);
      setNewRoleForm({ code: '', name: '', description: '', cloneFrom: 'SALES' });
      toast.success(`New Role "${newRoleForm.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create role');
    } finally {
      setCreating(false);
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
              <Iconify icon="solar:shield-keyhole-bold-duotone" width={24} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Roles & Permissions
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Configure Role-Based Access Control (RBAC), assign module privileges, and enforce operational security across Dhari Resort & Ahmedabad HQ.
          </Typography>
        </Box>

        {canManageRoles && (
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
            Add Custom Role
          </Button>
        )}
      </Box>

      {/* Top Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Roles
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {roles.length}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#e8f1fd', color: '#1d68d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="solar:users-group-two-rounded-bold" width={24} />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  System Protected
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {roles.filter(r => r.isSystem).length}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#fef3e6', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="solar:shield-check-bold" width={24} />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Permissions Catalog
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {allPermissionsList.length || 32}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#eaf8f0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="solar:key-minimalistic-square-3-bold" width={24} />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Security Engine
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.8, color: '#1d68d8' }}>
                  Active RBAC Guard
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#f3e8ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="solar:lock-keyhole-bold" width={24} />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Grid: Left Side Roles List, Right Side Permission Matrix */}
      <Grid container spacing={3}>
        {/* Roles List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Resort System Roles
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Select a role to inspect or adjust permissions
                </Typography>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ p: 2 }}>
                {roles.map(role => {
                  const isSelected = selectedRole?._id === role._id;
                  const permCount = role.code === 'SUPER_ADMIN' ? (allPermissionsList.length || 32) : (role.permissions?.length || 0);
                  const totalCount = allPermissionsList.length || 32;
                  const percent = Math.min(100, Math.round((permCount / totalCount) * 100));

                  return (
                    <Box
                      key={role._id}
                      onClick={() => handleSelectRole(role)}
                      sx={{
                        p: 2,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: isSelected ? '#1d68d8' : 'divider',
                        bgcolor: isSelected ? '#f0f6ff' : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1d68d8',
                          bgcolor: isSelected ? '#f0f6ff' : '#f8fafd',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1,
                              bgcolor: role.code === 'SUPER_ADMIN' ? '#fffae6' : role.code === 'ADMIN' ? '#eaf8f0' : '#e8f1fd',
                              color: role.code === 'SUPER_ADMIN' ? '#d97706' : role.code === 'ADMIN' ? '#059669' : '#1d68d8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify
                              icon={
                                role.code === 'SUPER_ADMIN'
                                  ? 'solar:crown-star-bold'
                                  : role.code === 'ADMIN'
                                  ? 'solar:shield-check-bold'
                                  : 'solar:user-hand-up-bold'
                              }
                              width={20}
                            />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {role.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600 }}>
                              {role.code}
                            </Typography>
                          </Box>
                        </Box>

                        {role.isSystem ? (
                          <Chip label="System" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#fef3e6', color: '#b45309' }} />
                        ) : (
                          <Chip label="Custom" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#e8f1fd', color: '#1d68d8' }} />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12.5, mb: 1.5, minHeight: 32 }}>
                        {role.description || 'Custom defined role for resort operations.'}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Privileges
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d68d8' }}>
                          {permCount} / {totalCount} ({percent}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: role.code === 'SUPER_ADMIN' ? '#f59e0b' : '#1d68d8',
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Grid>

        {/* Permission Matrix for Selected Role */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedRole ? (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              {/* Matrix Header */}
              <Box
                sx={{
                  p: 2.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {selectedRole.name} Permissions
                    </Typography>
                    <Chip
                      label={selectedRole.code}
                      size="small"
                      sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#f1f5f9' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {selectedRole.code === 'SUPER_ADMIN'
                      ? 'Super Admin has permanent full master access across all resort modules & features.'
                      : 'Toggle permissions granted to users assigned this role.'}
                  </Typography>
                </Box>

                {selectedRole.code !== 'SUPER_ADMIN' && canManageRoles && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={handleSelectAllPermissions} sx={{ textTransform: 'none', fontSize: 12 }}>
                      Grant All
                    </Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={handleClearAllPermissions} sx={{ textTransform: 'none', fontSize: 12 }}>
                      Revoke All
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!hasChanges || saving}
                      onClick={handleSavePermissions}
                      startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:diskette-bold" />}
                      sx={{
                        bgcolor: '#1d68d8',
                        '&:hover': { bgcolor: '#1552b0' },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Stack>
                )}
              </Box>

              {/* Notice for Super Admin */}
              {selectedRole.code === 'SUPER_ADMIN' && (
                <Box sx={{ p: 2, bgcolor: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon="solar:shield-warning-bold" width={22} sx={{ color: '#d97706' }} />
                    <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600 }}>
                      System Master Role: All permissions are intrinsically unlocked to guarantee system recovery and root administration.
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Category-wise Accordions / Cards */}
              <Box sx={{ p: 2.5, maxHeight: '680px', overflowY: 'auto' }}>
                <Stack spacing={2.5}>
                  {categories.map(cat => {
                    const isSuper = selectedRole.code === 'SUPER_ADMIN';
                    const catPermCodes = cat.permissions.map(p => p.code);
                    const grantedCount = isSuper
                      ? catPermCodes.length
                      : catPermCodes.filter(c => selectedPermissions.includes(c)).length;
                    const allCatGranted = isSuper || (catPermCodes.length > 0 && grantedCount === catPermCodes.length);

                    return (
                      <Card
                        key={cat.category}
                        variant="outlined"
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: '#ffffff',
                          border: '1px solid',
                          borderColor: allCatGranted ? '#bfdbfe' : 'divider',
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            bgcolor: allCatGranted ? '#f4f8fe' : '#f8fafc',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Iconify icon={cat.icon} width={20} sx={{ color: '#1d68d8' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {cat.category}
                            </Typography>
                            <Chip
                              label={`${grantedCount} / ${catPermCodes.length}`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: allCatGranted ? '#dbeafe' : '#e2e8f0',
                                color: allCatGranted ? '#1e40af' : 'text.secondary',
                              }}
                            />
                          </Box>

                          {!isSuper && (
                            <Button
                              size="small"
                              onClick={() => handleToggleCategory(cat)}
                              sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700, color: '#1d68d8', p: 0.5 }}
                            >
                              {allCatGranted ? 'Deselect Category' : 'Select All'}
                            </Button>
                          )}
                        </Box>

                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Grid container spacing={1.5}>
                            {cat.permissions.map(perm => {
                              const isGranted = isSuper || selectedPermissions.includes(perm.code);

                              return (
                                <Grid size={{ xs: 12, sm: 6 }} key={perm.code}>
                                  <Box
                                    sx={{
                                      p: 1.2,
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: isGranted ? '#bfdbfe' : 'divider',
                                      bgcolor: isGranted ? '#f8fafd' : '#fff',
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 1,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <Switch
                                      size="small"
                                      checked={isGranted}
                                      disabled={isSuper}
                                      onChange={() => handleTogglePermission(perm.code)}
                                      sx={{ mt: -0.2 }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>
                                        {perm.label}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11.5 }}>
                                        {perm.description}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>
                                        {perm.code}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>

              {/* Bottom Sticky Action Bar if changes exist */}
              {hasChanges && selectedRole.code !== 'SUPER_ADMIN' && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#eff6ff',
                    borderTop: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                    You have unsaved permission changes for {selectedRole.name}.
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => {
                        setSelectedPermissions(selectedRole.permissions || []);
                        setHasChanges(false);
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={saving}
                      onClick={handleSavePermissions}
                      sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
                    >
                      {saving ? 'Saving...' : 'Apply Changes'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Card>
          ) : (
            <Card sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Select a role to configure permissions.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dialog: Create Custom Role */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New System Role</DialogTitle>
        <form onSubmit={handleCreateRole}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Role Code"
                placeholder="e.g. FRONT_DESK, ACCOUNTANT"
                value={newRoleForm.code}
                onChange={e => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase() })}
                fullWidth
                required
                helperText="Unique uppercase identifier for backend authorization (e.g. FRONT_DESK)"
              />

              <TextField
                label="Display Name"
                placeholder="e.g. Front Desk Executive"
                value={newRoleForm.name}
                onChange={e => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Description"
                placeholder="Describe role responsibilities and operational duties"
                value={newRoleForm.description}
                onChange={e => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                select
                label="Initial Permissions Template"
                value={newRoleForm.cloneFrom}
                onChange={e => setNewRoleForm({ ...newRoleForm, cloneFrom: e.target.value })}
                fullWidth
                helperText="Copy starting permissions from an existing role"
              >
                <MenuItem value="">Start with No Permissions (Blank)</MenuItem>
                {roles.map(r => (
                  <MenuItem key={r.code} value={r.code}>
                    Clone from {r.name} ({r.permissions?.length || 0} permissions)
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating || !newRoleForm.code || !newRoleForm.name}
              sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
            >
              {creating ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardContent>
  );
}
