import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from 'src/api/api-client';

import { QUERY_KEYS } from './query-keys';

// ----------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------

export function useUsers(branchId?: string) {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.users(branchId),
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (branchId) params.branchId = branchId;
      const res = await api.get('/users', params);
      return (res?.data || []) as any[];
    },
  });
}

export function useRoles() {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.roles,
    queryFn: async () => {
      const res = await api.get('/roles');
      return (res?.data || []) as any[];
    },
    staleTime: 1000 * 60 * 10, // Roles change rarely, cache for 10 minutes
  });
}

// ----------------------------------------------------------------------
// Bungalows
// ----------------------------------------------------------------------

export function useBungalows(branchId?: string, category?: string) {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.bungalows(branchId, category),
    queryFn: async () => {
      const params: Record<string, any> = { limit: 100 };
      if (branchId) params.branch = branchId;
      if (category) params.category = category;
      const res = await api.get('/bungalows', params);
      return (res?.data || []) as any[];
    },
  });
}

export function useDeleteBungalowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bungalowId: string) => api.delete(`/bungalows/${bungalowId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bungalows'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ----------------------------------------------------------------------
// Bookings
// ----------------------------------------------------------------------

export function useBookings(params?: Record<string, any>) {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.bookings(params),
    queryFn: async () => {
      const res = await api.get('/bookings', params);
      return (res?.data || []) as any[];
    },
  });
}

// ----------------------------------------------------------------------
// Branches
// ----------------------------------------------------------------------

export function useBranches() {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.branches,
    queryFn: async () => {
      const res = await api.get('/branches');
      return (res?.data || []) as any[];
    },
    staleTime: 1000 * 60 * 15,
  });
}

// ----------------------------------------------------------------------
// Maintenance
// ----------------------------------------------------------------------

export function useMaintenanceTickets(params?: Record<string, any>) {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.maintenance(params),
    queryFn: async () => {
      const res = await api.get('/maintenance', params);
      return (res?.data || []) as any[];
    },
  });
}

// ----------------------------------------------------------------------
// Pricing Rules
// ----------------------------------------------------------------------

export function usePricingRules(branchId?: string) {
  return useQuery<any[]>({
    queryKey: QUERY_KEYS.pricing(branchId),
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (branchId) params.branchId = branchId;
      const res = await api.get('/pricing', params);
      return (res?.data || []) as any[];
    },
  });
}

export function usePaginatedPricingRules(params: {
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean | string;
}) {
  return useQuery<{ rules: any[]; total: number; pagination: any }>({
    queryKey: ['pricing', params],
    queryFn: async () => {
      const cleanParams: Record<string, any> = {
        page: (params.page ?? 0) + 1,
        limit: params.limit ?? 10,
      };
      if (params.branchId) cleanParams.branchId = params.branchId;
      if (params.search) cleanParams.search = params.search;
      if (params.isActive !== undefined && params.isActive !== '') cleanParams.isActive = params.isActive;

      const res = await api.get('/pricing', cleanParams);
      return {
        rules: (res?.data || []) as any[],
        total: res?.meta?.pagination?.total ?? (res?.data?.length || 0),
        pagination: res?.meta?.pagination,
      };
    },
  });
}

