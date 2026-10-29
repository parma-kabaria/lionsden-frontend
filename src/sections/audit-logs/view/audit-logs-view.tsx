import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

export function AuditLogsView() {
  const { selectedBranchId } = useBranch();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: Record<string, any> = { limit: 50 };
      if (selectedBranchId) params.branchId = selectedBranchId;

      const res = await api.get('/audit-logs', params);
      setLogs(res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) return 'success';
    if (action.includes('CANCELLED') || action.includes('REJECTED') || action.includes('REVERSED')) return 'error';
    if (action.includes('UPDATED')) return 'info';
    return 'default';
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
            System Audit Trail
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Immutable logging of booking changes, pricing rules, payment collections, and security actions
          </Typography>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchAuditLogs} startIcon={<Iconify icon="solar:refresh-bold" />}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Audit Log Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Change Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No audit records logged yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log._id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">{dayjs(log.createdAt).format('DD MMM YYYY')}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {dayjs(log.createdAt).format('hh:mm:ss A')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2">{log.actor?.name || 'System'}</Typography>
                      <Chip label={log.actor?.role || 'SYSTEM'} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                    </TableCell>

                    <TableCell>
                      <Chip label={log.action} color={getActionColor(log.action)} size="small" />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {log.entity}
                      </Typography>
                      {log.entityId && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          ID: {log.entityId.substring(0, 10)}...
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>{log.branch?.code || 'HQ'}</TableCell>

                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          m: 0,
                          overflow: 'auto',
                          maxHeight: 80,
                          fontFamily: 'monospace',
                        }}
                      >
                        {JSON.stringify(log.changes, null, 2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </DashboardContent>
  );
}
