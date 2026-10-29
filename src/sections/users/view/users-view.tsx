import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { api } from 'src/api/api-client';
import { useUsers, useRoles } from 'src/query';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { usePermissions } from 'src/auth/use-permissions';

// ----------------------------------------------------------------------

export function UsersView() {
  const queryClient = useQueryClient();
  const { selectedBranchId, branches } = useBranch();
  const { can } = usePermissions();

  const canCreate = can('users:create');
  const canUpdate = can('users:update');
  const canDelete = can('users:delete');
  const canShowActions = canUpdate || canDelete;

  // React Query cached server state
  const { data: users = [], isLoading: loading, error: queryError } = useUsers(selectedBranchId);
  const { data: roles = [] } = useRoles();

  // Add User dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    branchId: '',
  });
  const [creating, setCreating] = useState(false);

  // Edit User dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    roleId: '',
    branchId: '',
    isActive: true,
  });
  const [editing, setEditing] = useState(false);

  // Delete User dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (roles.length > 0) {
      setCreateForm(prev => {
        if (!prev.roleId) {
          const salesRole = roles.find((r: any) => r.code === 'SALES') || roles[0];
          return { ...prev, roleId: salesRole._id };
        }
        return prev;
      });
    }
  }, [roles]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.roleId) return;

    try {
      setCreating(true);
      await api.post('/users', {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        phone: createForm.phone,
        role: createForm.roleId,
        branch: createForm.branchId || undefined,
      });

      setCreateDialogOpen(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        roleId: roles[0]?._id || '',
        branchId: '',
      });
      toast.success('Staff member registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff member');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit User Dialog
  const handleOpenEdit = (user: any) => {
    setEditForm({
      id: user._id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      roleId: user.role?._id || user.role || '',
      branchId: user.branch?._id || user.branch || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setEditDialogOpen(true);
  };

  // Handle Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id || !editForm.name || !editForm.roleId) return;

    try {
      setEditing(true);
      await api.put(`/users/${editForm.id}`, {
        name: editForm.name,
        phone: editForm.phone,
        role: editForm.roleId,
        branch: editForm.branchId || null,
        isActive: editForm.isActive,
      });

      setEditDialogOpen(false);
      toast.success('Staff member updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user profile');
    } finally {
      setEditing(false);
    }
  };

  // Open Delete User Dialog
  const handleOpenDelete = (user: any) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Handle Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/users/${userToDelete._id}`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success(`User "${userToDelete.name}" deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
              <Iconify icon="solar:users-group-two-rounded-bold" width={24} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Staff & User Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage staff accounts across Dhari Resort and Ahmedabad Head Office with role-based access control.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:user-plus-bold" />}
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
            Add Staff Member
          </Button>
        )}
      </Box>

      {/* Users Table */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Staff Member</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned Location / Branch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact Phone</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Account Status</TableCell>
                {canShowActions && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canShowActions ? 6 : 5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No staff users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u: any) => {
                  const isSuperAdmin = u.role?.code === 'SUPER_ADMIN';

                  return (
                    <TableRow key={u._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              bgcolor: isSuperAdmin ? '#fffae6' : '#e8f1fd',
                              color: isSuperAdmin ? '#d97706' : '#1d68d8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {u.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {u.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={u.role?.name || u.role?.code || 'Staff'}
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            bgcolor:
                              u.role?.code === 'SUPER_ADMIN'
                                ? '#fffae6'
                                : u.role?.code === 'ADMIN'
                                ? '#eaf8f0'
                                : '#e8f1fd',
                            color:
                              u.role?.code === 'SUPER_ADMIN'
                                ? '#b45309'
                                : u.role?.code === 'ADMIN'
                                ? '#065f46'
                                : '#1e40af',
                          }}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {u.branch ? `${u.branch.name}` : 'Global Master (All Properties)'}
                        </Typography>
                        {u.branch?.code && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            Code: {u.branch.code}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>{u.phone || '—'}</TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={u.isActive ? 'Active' : 'Deactivated'}
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            bgcolor: u.isActive ? '#eaf8f0' : '#f1f5f9',
                            color: u.isActive ? '#059669' : '#64748b',
                          }}
                        />
                      </TableCell>

                      {canShowActions && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {canUpdate && (
                              <Tooltip title="Edit Staff Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEdit(u)}
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
                              <Tooltip title={isSuperAdmin ? 'Super Admin cannot be deleted' : 'Delete User'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={isSuperAdmin}
                                    onClick={() => handleOpenDelete(u)}
                                    sx={{
                                      color: '#dc2626',
                                      bgcolor: isSuperAdmin ? 'transparent' : '#fef2f2',
                                      '&:hover': { bgcolor: '#fee2e2' },
                                    }}
                                  >
                                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                  </IconButton>
                                </span>
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
      </Card>

      {/* Add Staff User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Register New Staff Member</DialogTitle>
        <Box component="form" onSubmit={handleCreateUser}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address *"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Initial Password *"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  helperText="Min 8 chars, 1 uppercase, 1 number"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={createForm.phone}
                  onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+919876543210"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="System Role *"
                  value={createForm.roleId}
                  onChange={e => setCreateForm({ ...createForm, roleId: e.target.value })}
                  required
                >
                  {roles.map(r => (
                    <MenuItem key={r._id} value={r._id}>
                      {r.name} ({r.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Branch Assignment"
                  value={createForm.branchId}
                  onChange={e => setCreateForm({ ...createForm, branchId: e.target.value })}
                  helperText="Required for Branch Admin & Sales"
                >
                  <MenuItem value="">Unassigned (Super Admin Only)</MenuItem>
                  {branches.map(b => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </TextField>
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
              disabled={creating}
              sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
            >
              {creating ? <CircularProgress size={24} /> : 'Create User Account'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit Staff User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Staff Member</DialogTitle>
        <Box component="form" onSubmit={handleSaveEdit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  disabled
                  label="Email Address"
                  value={editForm.email}
                  helperText="Email is fixed as unique login identifier"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+919876543210"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="System Role *"
                  value={editForm.roleId}
                  onChange={e => setEditForm({ ...editForm, roleId: e.target.value })}
                  required
                >
                  {roles.map(r => (
                    <MenuItem key={r._id} value={r._id}>
                      {r.name} ({r.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Assigned Location / Branch"
                  value={editForm.branchId}
                  onChange={e => setEditForm({ ...editForm, branchId: e.target.value })}
                  helperText="Assign to Dhari Resort, Ahmedabad HQ, or Unassigned for Super Admin"
                >
                  <MenuItem value="">Unassigned (Global Master Access)</MenuItem>
                  {branches.map(b => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name} ({b.code}){b.type ? ` - ${b.type}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editForm.isActive}
                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Account Active
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          If disabled, this staff member will be blocked from logging into the system.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
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
              disabled={editing}
              sx={{ bgcolor: '#1d68d8', textTransform: 'none', fontWeight: 700 }}
            >
              {editing ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:danger-triangle-bold" width={24} />
          Delete Staff Account
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Are you sure you want to permanently delete the staff account for:
          </Typography>
          {userToDelete && (
            <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecaca', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991b1b' }}>
                {userToDelete.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block' }}>
                {userToDelete.email}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7f1d1d', fontWeight: 700 }}>
                Role: {userToDelete.role?.name || userToDelete.role?.code}
              </Typography>
            </Box>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            ⚠️ This action will immediately revoke login access and remove this user from the system.
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
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
