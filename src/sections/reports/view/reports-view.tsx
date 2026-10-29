import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { api } from 'src/api/api-client';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

export function ReportsView() {
  const { selectedBranchId } = useBranch();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [collectionsData, setCollectionsData] = useState<any>(null);
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [balancesData, setBalancesData] = useState<any[]>([]);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/reports/collections', params);
      setCollectionsData(res?.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collections report');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  const fetchOccupancy = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/reports/occupancy', params);
      setOccupancyData(res?.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch occupancy report');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  const fetchBalances = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 50 };
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/reports/balances', params);
      setBalancesData(res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balances report');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (activeTab === 0) fetchCollections();
    else if (activeTab === 1) fetchOccupancy();
    else if (activeTab === 2) fetchBalances();
  }, [activeTab, fetchCollections, fetchOccupancy, fetchBalances]);

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'fontWeightBold' }}>
          Resort Reports & Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Real-time financial collections, bungalow occupancy trends, and outstanding guest balances
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Financial Collections" />
          <Tab label="Category Occupancy" />
          <Tab label="Outstanding Balances" />
        </Tabs>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
        /* Tab 0: Collections */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.dark' }}>
                  Gross Collections
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.darker', fontWeight: 'bold', mt: 1 }}>
                  ₹{(collectionsData?.summary?.grossCollectionsRupees || 0).toLocaleString('en-IN')}
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.lighter' }}>
                <Typography variant="subtitle2" sx={{ color: 'error.dark' }}>
                  Authorized Reversals
                </Typography>
                <Typography variant="h4" sx={{ color: 'error.darker', fontWeight: 'bold', mt: 1 }}>
                  -₹{(collectionsData?.summary?.reversalsRupees || 0).toLocaleString('en-IN')}
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
                <Typography variant="subtitle2" sx={{ color: 'success.dark' }}>
                  Net Realized Collections
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.darker', fontWeight: 'bold', mt: 1 }}>
                  ₹{(collectionsData?.summary?.netCollectionsRupees || 0).toLocaleString('en-IN')}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* By Payment Mode */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Breakdown by Payment Mode
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mode</TableCell>
                      <TableCell align="center">Transactions</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collectionsData?.byPaymentMode?.map((item: any) => (
                      <TableRow key={item.paymentMode}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{item.paymentMode}</TableCell>
                        <TableCell align="center">{item.transactionCount}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          ₹{(item.amountRupees || 0).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Breakdown by Branch
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Branch</TableCell>
                      <TableCell align="center">Transactions</TableCell>
                      <TableCell align="right">Total Realized</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collectionsData?.byBranch?.map((item: any) => (
                      <TableRow key={item.branchId}>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {item.branchName} ({item.branchCode})
                        </TableCell>
                        <TableCell align="center">{item.transactionCount}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          ₹{(item.amountRupees || 0).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : activeTab === 1 ? (
        /* Tab 1: Occupancy */
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Occupancy & Revenue by Bungalow Category
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="center">Total Bookings</TableCell>
                <TableCell align="center">Nights Booked</TableCell>
                <TableCell align="right">Gross Revenue</TableCell>
                <TableCell align="right">Amount Collected</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {occupancyData?.categories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No booking data available yet
                  </TableCell>
                </TableRow>
              ) : (
                occupancyData?.categories?.map((c: any) => (
                  <TableRow key={c.category} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <Chip label={c.category} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">{c.totalBookings}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                      {c.totalNightsBooked} Nights
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ₹{(c.totalRevenueRupees || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      ₹{(c.totalPaidRupees || 0).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Tab 2: Balances */
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Outstanding Balances Awaiting Settlement
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Bungalow</TableCell>
                <TableCell align="right">Total Rent</TableCell>
                <TableCell align="right">Advance Paid</TableCell>
                <TableCell align="right">Balance Due</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {balancesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    All guest accounts are settled!
                  </TableCell>
                </TableRow>
              ) : (
                balancesData.map((b: any) => (
                  <TableRow key={b._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{b.bookingId}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{b.customer?.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {b.customer?.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={b.bungalow?.number} size="small" />
                    </TableCell>
                    <TableCell align="right">₹{(b.totalAmountRupees || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">₹{(b.advancePaymentRupees || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      ₹{(b.outstandingBalanceRupees || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={b.status} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </DashboardContent>
  );
}
