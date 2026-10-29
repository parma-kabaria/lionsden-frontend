import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { api } from 'src/api/api-client';
import { usePricingRules } from 'src/query';
import { useBranch } from 'src/context/branch-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { StatusIcon } from 'src/components/status-icon';

import { useAuth } from 'src/auth/auth-context';

import {
  NewBookingDialog,
  AddBungalowDialog,
  PaymentEntryDialog,
  MaintenanceRequestDialog,
} from '../quick-actions';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedBranchId, selectedBranch } = useBranch();

  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [addBungalowOpen, setAddBungalowOpen] = useState(false);
  const [paymentEntryOpen, setPaymentEntryOpen] = useState(false);
  const [maintenanceRequestOpen, setMaintenanceRequestOpen] = useState(false);

  // TanStack Query for pricing rules (Peak time / Festival) from API
  const { data: pricingRules = [], isLoading: pricingLoading } = usePricingRules(selectedBranchId);

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = dayjs();
      setCurrentTime(now.format('DD MMM YYYY, hh:mm A') + ' (IST)');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', { branchId: selectedBranchId }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      const res = await api.get('/dashboard', params);
      return res?.data || null;
    },
    refetchInterval: 30000,
  });

  const inventory = dashboardData?.inventory || {
    totalBungalows: 80,
    currentlyBooked: 42,
    available: 33,
    underMaintenance: 5,
    occupancyPercentage: 52,
  };

  // Dual-line chart options for Booking Overview
  const bookingOverviewOptions = useChart({
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#1d68d8', '#00a76f'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.25,
        opacityTo: 0.02,
        stops: [0, 90, 100],
      },
    },
    stroke: { curve: 'smooth', width: 2.5 },
    markers: { size: 4, strokeColors: '#fff', strokeWidth: 2 },
    grid: { strokeDashArray: 3, borderColor: '#f0f4f8' },
    xaxis: {
      categories: ['17 Apr', '18 Apr', '19 Apr', '20 Apr', '21 Apr', '22 Apr', '23 Apr'],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: 50,
      tickAmount: 5,
    },
    legend: { show: false },
    tooltip: { shared: true, intersect: false },
  });

  const bookingOverviewSeries = [
    {
      name: 'Booked',
      data: [20, 25, 28, 38, 30, 42, 45],
    },
    {
      name: 'Available',
      data: [30, 25, 22, 12, 20, 8, 5],
    },
  ];

  // Category Donut chart options
  const categoryChartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    labels: ['1 BHK', '2 BHK', '3 BHK', '4 BHK'],
    colors: ['#1d68d8', '#00a76f', '#f59e0b', '#8b5cf6'],
    stroke: { width: 0 },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 600,
              color: '#637381',
              formatter: () => '80',
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: '#1a202c',
              offsetY: 2,
            },
          },
        },
      },
    },
  });

  const categorySeries = [20, 25, 20, 15];

  // Helper for Status badge formatting and styling
  const getStatusMeta = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') {
      return { label: 'Confirmed', bg: '#e8f7f0', color: '#00a76f' };
    }
    if (s === 'CHECKED_IN' || s === 'CHECKED IN') {
      return { label: 'Checked In', bg: '#eff6ff', color: '#1d4ed8' };
    }
    if (s === 'CHECKED_OUT' || s === 'CHECKED OUT') {
      return { label: 'Checked Out', bg: '#f1f5f9', color: '#475569' };
    }
    if (s === 'PENDING') {
      return { label: 'Pending', bg: '#fef6e7', color: '#f59e0b' };
    }
    if (s === 'CANCELLED' || s === 'CANCELED') {
      return { label: 'Cancelled', bg: '#fef2f2', color: '#ef4444' };
    }
    return { label: status || 'Unknown', bg: '#f1f5f9', color: '#64748b' };
  };

  const recentBookings: any[] = dashboardData?.recentBookings || [];
  const branchCollections: any[] = dashboardData?.branchCollections || [];

  const adminName = user?.name || 'Super Admin';

  return (
    <DashboardContent maxWidth="xl" sx={{ bgcolor: '#f8fafc', pb: 4 }}>
      {/* 1. TOP GREETING & DATE BAR */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#1a202c',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span style={{ fontSize: 24 }}>☀️</span> Good Morning, {adminName}!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Here&apos;s what&apos;s happening with your resort today.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            borderRadius: 2.5,
            bgcolor: '#fff',
            border: '1px solid #e2ecf6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <Iconify icon="solar:calendar-date-bold" width={22} sx={{ color: '#1d68d8' }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, display: 'block', lineHeight: 1 }}>
              Today
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 12.5, color: '#1a202c' }}>
              {currentTime || '23 Apr 2025, 11:45 AM (IST)'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. TWO HERO BANNERS */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Banner 1: Green Valley / Lions Den Welcome Back */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              borderRadius: 3.5,
              position: 'relative',
              overflow: 'hidden',
              p: { xs: 3, md: 4 },
              minHeight: 215,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg, #0e4e41 0%, #083026 100%)',
              boxShadow: '0 10px 25px rgba(14, 78, 65, 0.2)',
            }}
          >
            {/* Background Decorative Resort Icon */}
            <Box
              sx={{
                position: 'absolute',
                right: -25,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.1,
                color: '#fff',
                pointerEvents: 'none',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Iconify icon="solar:trees-bold" width={220} height={220} />
            </Box>

            <Box sx={{ maxWidth: 480 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 20,
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#4ade80',
                  fontSize: 12,
                  fontWeight: 700,
                  mb: 1.5,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {selectedBranch ? selectedBranch.name : 'Lions Den Resort - Dhari (Gir Forest)'}
              </Box>

              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Welcome Back, {adminName}!
              </Typography>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2.5, fontSize: 13.5 }}>
                Manage your bungalows, bookings, users and more — all in one place.
              </Typography>

              <Button
                variant="contained"
                onClick={() => router.push('/bookings')}
                sx={{
                  bgcolor: '#00a76f',
                  color: '#fff',
                  borderRadius: 20,
                  px: 2.5,
                  py: 0.85,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: 13.5,
                  boxShadow: '0 4px 14px rgba(0, 167, 111, 0.4)',
                  '&:hover': { bgcolor: '#008e5e' },
                }}
              >
                View All Bookings →
              </Button>
            </Box>

            {/* Slider Dots */}
            <Box sx={{ position: 'absolute', bottom: 16, right: 20, display: 'flex', gap: 0.75 }}>
              <Box sx={{ width: 18, height: 6, borderRadius: 3, bgcolor: '#4ade80' }} />
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
            </Box>
          </Card>
        </Grid>

        {/* Banner 2: Premium Bungalows */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: 3.5,
              position: 'relative',
              overflow: 'hidden',
              p: { xs: 3, md: 3.5 },
              minHeight: 215,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)',
            }}
          >
            {/* Background Decorative Bungalow Icon */}
            <Box
              sx={{
                position: 'absolute',
                right: -25,
                bottom: -25,
                opacity: 0.08,
                color: '#fff',
                pointerEvents: 'none',
              }}
            >
              <Iconify icon="solar:home-smile-bold" width={180} height={180} />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Iconify icon="solar:home-2-bold" width={20} sx={{ color: '#fff' }} />
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 20,
                  bgcolor: '#00a76f',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  mb: 1.5,
                }}
              >
                NEW
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Premium Bungalows
              </Typography>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2.5, fontSize: 13 }}>
                Experience luxury &amp; comfort with our premium 4 BHK villas.
              </Typography>

              <Button
                variant="contained"
                onClick={() => router.push('/bungalows')}
                sx={{
                  bgcolor: '#fff',
                  color: '#1a202c',
                  borderRadius: 20,
                  px: 2.25,
                  py: 0.8,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: 13,
                  '&:hover': { bgcolor: '#f4f6f8' },
                }}
              >
                Explore Now →
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 3. ROW OF 4 KPI STAT CARDS */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Total Bungalows */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: '#fff',
              border: '1px solid #edf2f7',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: '#eaf2fd',
                  color: '#1d68d8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:home-2-bold" width={24} />
              </Box>

              {/* Sparkline wave */}
              <svg width="70" height="32" viewBox="0 0 70 32" fill="none">
                <path d="M2 24 C 18 12, 35 28, 52 14 C 60 8, 65 16, 68 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 13 }}>
              Total Bungalows
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a202c', my: 0.5 }}>
              {inventory.totalBungalows}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 500 }}>
              1 BHK&bull; 2 BHK&bull; 3 BHK&bull; 4 BHK
            </Typography>
          </Card>
        </Grid>

        {/* Card 2: Booked Bungalows */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: '#fff',
              border: '1px solid #edf2f7',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.5,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
                }}
              >
                <StatusIcon type="booked" size={32} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
                  <path d="M2 20 C 15 10, 30 24, 45 12 C 52 7, 56 12, 58 6" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <Iconify icon="solar:arrow-right-up-linear" width={16} sx={{ color: 'text.secondary' }} />
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 13 }}>
              Booked Bungalows
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#ef4444', my: 0.5 }}>
              {inventory.currentlyBooked}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 500 }}>
              {inventory.occupancyPercentage}% of total
            </Typography>
          </Card>
        </Grid>

        {/* Card 3: Under Maintenance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: '#fff',
              border: '1px solid #edf2f7',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.5,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
                }}
              >
                <StatusIcon type="maintenance" size={32} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
                  <path d="M2 18 C 15 8, 30 22, 45 14 C 52 10, 56 14, 58 8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <Iconify icon="solar:arrow-right-up-linear" width={16} sx={{ color: 'text.secondary' }} />
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 13 }}>
              Under Maintenance
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#b45309', my: 0.5 }}>
              {inventory.underMaintenance}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 500 }}>
              {Math.round((inventory.underMaintenance / (inventory.totalBungalows || 80)) * 100)}% of total
            </Typography>
          </Card>
        </Grid>

        {/* Card 4: Available Bungalows */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: '#fff',
              border: '1px solid #edf2f7',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: '#eaf8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.5,
                  boxShadow: '0 2px 8px rgba(0, 167, 111, 0.15)',
                }}
              >
                <StatusIcon type="unbooked" size={32} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
                  <path d="M2 22 C 16 14, 30 26, 44 14 C 52 8, 56 14, 58 6" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <Iconify icon="solar:arrow-right-up-linear" width={16} sx={{ color: 'text.secondary' }} />
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 13 }}>
              Available (Unbooked)
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#15803d', my: 0.5 }}>
              {inventory.available}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 500 }}>
              {Math.round((inventory.available / (inventory.totalBungalows || 80)) * 100)}% of total
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Live Bungalow Inventory Status Bar */}
      {/* <Card
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: '#fff',
          border: '1px solid #edf2f7',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Gir Resort Live Units (80 Total):
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
         
          <Box
            onClick={() => router.push('/bookings')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.75,
              py: 0.85,
              borderRadius: 2,
              bgcolor: '#fee2e2',
              cursor: 'pointer',
              border: '1px solid #fca5a5',
              transition: 'all 0.15s',
              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)' },
            }}
          >
            <StatusIcon type="booked" size={24} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#991b1b', display: 'block', lineHeight: 1.1 }}>
                BOOKED ({inventory.currentlyBooked})
              </Typography>
              <Typography variant="caption" sx={{ color: '#b91c1c', fontSize: 10 }}>
                Occupied Units
              </Typography>
            </Box>
          </Box>

          <Box
            onClick={() => router.push('/availability')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.75,
              py: 0.85,
              borderRadius: 2,
              bgcolor: '#f1f5f9',
              cursor: 'pointer',
              border: '1px solid #cbd5e1',
              transition: 'all 0.15s',
              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)' },
            }}
          >
            <StatusIcon type="unbooked" size={24} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.1 }}>
                UNBOOKED ({inventory.available})
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: 10 }}>
                Available to Book
              </Typography>
            </Box>
          </Box>

          <Box
            onClick={() => router.push('/maintenance')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.75,
              py: 0.85,
              borderRadius: 2,
              bgcolor: '#fef3c7',
              cursor: 'pointer',
              border: '1px solid #fde68a',
              transition: 'all 0.15s',
              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)' },
            }}
          >
            <StatusIcon type="maintenance" size={24} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', display: 'block', lineHeight: 1.1 }}>
                MAINTENANCE ({inventory.underMaintenance})
              </Typography>
              <Typography variant="caption" sx={{ color: '#b45309', fontSize: 10 }}>
                Under Repair / Blocked
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card> */}

      {/* 4. MIDDLE ROW: Booking Overview, Category Wise Bungalows, Quick Actions */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Column 1: Booking Overview */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ p: 3, borderRadius: 3.5, bgcolor: '#fff', border: '1px solid #edf2f7', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a202c' }}>
                Booking Overview
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StatusIcon type="booked" size={16} />
                  <Typography variant="caption" sx={{ color: '#ef4444', fontSize: 11.5, fontWeight: 700 }}>
                    Booked ({inventory.currentlyBooked})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StatusIcon type="unbooked" size={16} />
                  <Typography variant="caption" sx={{ color: '#15803d', fontSize: 11.5, fontWeight: 700 }}>
                    Unbooked ({inventory.available})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StatusIcon type="maintenance" size={16} />
                  <Typography variant="caption" sx={{ color: '#b45309', fontSize: 11.5, fontWeight: 700 }}>
                    Maintenance ({inventory.underMaintenance})
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ height: 260 }}>
              <Chart type="area" series={bookingOverviewSeries} options={bookingOverviewOptions} sx={{ height: 1 }} />
            </Box>
          </Card>
        </Grid>

        {/* Column 2: Category Wise Bungalows */}
        <Grid size={{ xs: 12, sm: 6, lg: 3.5 }}>
          <Card sx={{ p: 3, borderRadius: 3.5, bgcolor: '#fff', border: '1px solid #edf2f7', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a202c', mb: 2 }}>
              Category Wise Bungalows
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, my: 1 }}>
              <Chart type="donut" series={categorySeries} options={categoryChartOptions} sx={{ width: 180, height: 180 }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              {[
                { label: '1 BHK', count: 20, pct: '25%', color: '#1d68d8' },
                { label: '2 BHK', count: 25, pct: '31%', color: '#00a76f' },
                { label: '3 BHK', count: 20, pct: '25%', color: '#f59e0b' },
                { label: '4 BHK', count: 15, pct: '19%', color: '#8b5cf6' },
              ].map(item => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12 }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a202c', fontSize: 12 }}>
                    {item.count} <span style={{ color: '#8c9ba8', fontWeight: 500 }}>({item.pct})</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Column 3: Quick Actions */}
        <Grid size={{ xs: 12, sm: 6, lg: 3.5 }}>
          <Card sx={{ p: 3, borderRadius: 3.5, bgcolor: '#fff', border: '1px solid #edf2f7', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Iconify icon="solar:bolt-bold" width={20} sx={{ color: '#1d68d8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a202c' }}>
                Quick Actions
              </Typography>
            </Box>

            <Grid container spacing={1.5}>
              {/* Action 1: New Booking */}
              <Grid size={{ xs: 6 }}>
                <ButtonBase
                  onClick={() => setNewBookingOpen(true)}
                  sx={{
                    p: 2,
                    width: '100%',
                    height: 110,
                    borderRadius: 3,
                    bgcolor: '#f0f7ff',
                    border: '1px solid #dbeafe',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#e0effe', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1d68d8',
                    }}
                  >
                    <Iconify icon="solar:calendar-add-bold" width={20} />
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a', fontSize: 13 }}>
                      New Booking
                    </Typography>
                    <Iconify icon="solar:arrow-right-linear" width={16} sx={{ color: '#1d68d8' }} />
                  </Box>
                </ButtonBase>
              </Grid>

              {/* Action 2: Add Bungalow */}
              <Grid size={{ xs: 6 }}>
                <ButtonBase
                  onClick={() => setAddBungalowOpen(true)}
                  sx={{
                    p: 2,
                    width: '100%',
                    height: 110,
                    borderRadius: 3,
                    bgcolor: '#f0fbf5',
                    border: '1px solid #d1fae5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#dcfce7', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00a76f',
                    }}
                  >
                    <Iconify icon="solar:home-add-bold" width={20} />
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#065f46', fontSize: 13 }}>
                      Add Bungalow
                    </Typography>
                    <Iconify icon="solar:arrow-right-linear" width={16} sx={{ color: '#00a76f' }} />
                  </Box>
                </ButtonBase>
              </Grid>

              {/* Action 3: Payment Entry */}
              <Grid size={{ xs: 6 }}>
                <ButtonBase
                  onClick={() => setPaymentEntryOpen(true)}
                  sx={{
                    p: 2,
                    width: '100%',
                    height: 110,
                    borderRadius: 3,
                    bgcolor: '#faf5ff',
                    border: '1px solid #ede9fe',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#f3e8ff', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8b5cf6',
                    }}
                  >
                    <Iconify icon="solar:card-bold" width={20} />
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#5b21b6', fontSize: 13 }}>
                      Payment Entry
                    </Typography>
                    <Iconify icon="solar:arrow-right-linear" width={16} sx={{ color: '#8b5cf6' }} />
                  </Box>
                </ButtonBase>
              </Grid>

              {/* Action 4: Maintenance Request */}
              <Grid size={{ xs: 6 }}>
                <ButtonBase
                  onClick={() => setMaintenanceRequestOpen(true)}
                  sx={{
                    p: 2,
                    width: '100%',
                    height: 110,
                    borderRadius: 3,
                    bgcolor: '#fffaf0',
                    border: '1px solid #fef3c7',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#fef08a', transform: 'translateY(-2px)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d97706',
                    }}
                  >
                    <Iconify icon="solar:wrench-bold" width={20} />
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>
                      Maintenance Request
                    </Typography>
                    <Iconify icon="solar:arrow-right-linear" width={16} sx={{ color: '#f59e0b' }} />
                  </Box>
                </ButtonBase>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* 5. BOTTOM ROW: Recent Bookings & Right Sidebar (Peak pricing + Branch Collection) */}
      <Grid container spacing={2.5}>
        {/* Left Column: Recent Bookings */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3.5, bgcolor: '#fff', border: '1px solid #edf2f7', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a202c' }}>
                Recent Bookings
              </Typography>
              <Button
                size="small"
                onClick={() => router.push('/bookings')}
                sx={{ textTransform: 'none', fontWeight: 700, color: '#1d68d8', fontSize: 13 }}
              >
                View All →
              </Button>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 880 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Booking ID</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Customer Name</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Mobile</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Bungalow No.</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Category</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Check In</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Check Out</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Food</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Status</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={26} />
                      </TableCell>
                    </TableRow>
                  ) : recentBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No recent bookings found for the selected branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentBookings.map(row => {
                      const statusMeta = getStatusMeta(row.status);
                      const checkInDate = dayjs(row.checkIn).isValid() ? dayjs(row.checkIn).format('DD MMM YYYY') : row.checkIn;
                      const checkInTime = dayjs(row.checkIn).isValid() ? dayjs(row.checkIn).format('hh:mm A') : '';
                      const checkOutDate = dayjs(row.checkOut).isValid() ? dayjs(row.checkOut).format('DD MMM YYYY') : row.checkOut;
                      const checkOutTime = dayjs(row.checkOut).isValid() ? dayjs(row.checkOut).format('hh:mm A') : '';

                      return (
                        <TableRow key={row._id || row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12.5, color: '#1a202c', whiteSpace: 'nowrap' }}>
                            {row.id}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                            {row.customer}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {row.mobile}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12.5, color: '#1d68d8', whiteSpace: 'nowrap' }}>
                            {row.bungalow}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                            {row.category}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                              {checkInDate}
                            </Typography>
                            {checkInTime && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, display: 'block' }}>
                                {checkInTime}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                              {checkOutDate}
                            </Typography>
                            {checkOutTime && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, display: 'block' }}>
                                {checkOutTime}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Chip
                              size="small"
                              label={row.food}
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: row.food === 'With Food' ? '#e8f7f0' : '#f1f5f9',
                                color: row.food === 'With Food' ? '#00a76f' : '#64748b',
                                border: 'none',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Chip
                              size="small"
                              label={statusMeta.label}
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: statusMeta.bg,
                                color: statusMeta.color,
                                border: 'none',
                                px: 0.5,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton size="small" onClick={() => router.push('/bookings')}>
                              <Iconify icon="solar:eye-bold" width={18} sx={{ color: '#1d68d8' }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Peak Time / Festival & Branch Wise Collection */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Peak Time / Festival Card */}
            <Card sx={{ p: 2.5, borderRadius: 3.5, bgcolor: '#fff', border: '1px solid #edf2f7' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:calendar-mark-bold" width={18} sx={{ color: '#f59e0b' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a202c', fontSize: 14 }}>
                    Peak Time / Festival
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => router.push('/pricing')}
                  sx={{ textTransform: 'none', fontWeight: 700, color: '#1d68d8', fontSize: 12 }}
                >
                  View All →
                </Button>
              </Box>

              {pricingLoading ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} sx={{ color: '#f59e0b' }} />
                </Box>
              ) : pricingRules.length === 0 ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    No active peak time or festival rules found.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => router.push('/pricing')}
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                    sx={{ textTransform: 'none', fontSize: 11, borderRadius: 1.5 }}
                  >
                    Add Pricing Rule
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pricingRules.slice(0, 3).map((rule: any) => {
                    const isDiscount = rule.adjustmentType === 'PERCENTAGE_DISCOUNT';
                    const isFixed = rule.adjustmentType === 'FIXED_RENT';
                    const badgeText = isDiscount
                      ? `Discount: -${rule.adjustmentValue}%`
                      : isFixed
                        ? `Fixed: ₹${Math.round((rule.adjustmentValue || 0) / 100).toLocaleString('en-IN')}`
                        : `Rent: +${rule.adjustmentValue}%`;

                    const dateLabel = `${dayjs(rule.startDate).format('DD MMM YYYY')} - ${dayjs(rule.endDate).format('DD MMM YYYY')}`;

                    return (
                      <ButtonBase
                        key={rule._id}
                        onClick={() => router.push('/pricing')}
                        sx={{
                          width: '100%',
                          p: 1.5,
                          borderRadius: 2.5,
                          bgcolor: '#f8fafc',
                          border: '1px solid #edf2f7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: '#f1f5f9', transform: 'translateX(2px)' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: isDiscount ? '#e8f7f0' : '#fef3c7',
                            color: isDiscount ? '#00a76f' : '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify
                            icon={isDiscount ? 'solar:tag-price-bold' : 'solar:sun-2-bold'}
                            width={24}
                          />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{ fontWeight: 700, color: '#1a202c', fontSize: 13 }}
                          >
                            {rule.name || rule.festivalName || 'Special Pricing Rule'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontSize: 11, display: 'block' }}
                          >
                            {dateLabel}
                          </Typography>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              mt: 0.5,
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                              bgcolor: isDiscount ? '#e8f7f0' : '#fef2f2',
                              color: isDiscount ? '#00a76f' : '#ef4444',
                              fontSize: 10.5,
                              fontWeight: 700,
                            }}
                          >
                            {badgeText}
                          </Box>
                        </Box>
                        <Iconify icon="solar:arrow-right-linear" width={16} sx={{ color: 'text.secondary' }} />
                      </ButtonBase>
                    );
                  })}
                </Box>
              )}
            </Card>

            {/* Branch Wise Collection Card */}
            <Card sx={{ p: 2.5, borderRadius: 3.5, bgcolor: '#fff', border: '1px solid #edf2f7' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:chart-2-bold" width={18} sx={{ color: '#1d68d8' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a202c', fontSize: 14 }}>
                    Branch Wise Collection
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => router.push('/reports')}
                  sx={{ textTransform: 'none', fontWeight: 700, color: '#1d68d8', fontSize: 12 }}
                >
                  View All →
                </Button>
              </Box>

              {dashboardLoading ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} sx={{ color: '#1d68d8' }} />
                </Box>
              ) : branchCollections.length === 0 ? (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No branch collections recorded yet.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {branchCollections.map((branch: any, index: number) => {
                    const barColor = index === 0 ? '#1d68d8' : index === 1 ? '#00a76f' : '#f59e0b';
                    return (
                      <Box key={branch.branchId}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                          <Typography variant="subtitle2" sx={{ fontSize: 12.5, fontWeight: 600, color: '#1a202c' }}>
                            {branch.branchName}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>
                            ₹ {branch.totalCollected.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={branch.percentage}
                          sx={{
                            height: 7,
                            borderRadius: 4,
                            bgcolor: '#edf2f7',
                            '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 4 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* 6. FOOTER BAR */}
      <Box
        sx={{
          mt: 5,
          pt: 2.5,
          borderTop: '1px solid #edf2f7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
          Lions Den Resort, Dhari (Gir Forest) | Corporate Sales Office: Ahmedabad
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
          Dhari (Resort) &bull; Ahmedabad (HQ)
        </Typography>
      </Box>

      {/* Quick Action Modals */}
      <NewBookingDialog
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        branchId={selectedBranchId}
      />

      <AddBungalowDialog
        open={addBungalowOpen}
        onClose={() => setAddBungalowOpen(false)}
        branchId={selectedBranchId}
      />

      <PaymentEntryDialog
        open={paymentEntryOpen}
        onClose={() => setPaymentEntryOpen(false)}
        branchId={selectedBranchId}
      />

      <MaintenanceRequestDialog
        open={maintenanceRequestOpen}
        onClose={() => setMaintenanceRequestOpen(false)}
        branchId={selectedBranchId}
      />
    </DashboardContent>
  );
}
