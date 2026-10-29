export const QUERY_KEYS = {
  // Users & Roles
  users: (branchId?: string) => ['users', { branchId }] as const,
  roles: ['roles'] as const,
  permissions: ['permissions'] as const,

  // Bungalows & Inventory
  bungalows: (branchId?: string, category?: string) => ['bungalows', { branchId, category }] as const,

  // Bookings & Availability
  bookings: (params?: Record<string, any>) => ['bookings', params] as const,
  availability: (params?: Record<string, any>) => ['availability', params] as const,

  // Branches
  branches: ['branches'] as const,

  // Maintenance
  maintenance: (params?: Record<string, any>) => ['maintenance', params] as const,

  // Pricing
  pricing: (branchId?: string) => ['pricing', { branchId }] as const,

  // Negotiations
  negotiations: (params?: Record<string, any>) => ['negotiations', params] as const,

  // Payments
  payments: (params?: Record<string, any>) => ['payments', params] as const,

  // Dashboard & Analytics
  dashboard: (branchId?: string) => ['dashboard', { branchId }] as const,
  reports: (params?: Record<string, any>) => ['reports', params] as const,
  auditLogs: (params?: Record<string, any>) => ['auditLogs', params] as const,
};
