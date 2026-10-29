import { useMemo, useCallback } from 'react';

import { useAuth } from './auth-context';

export function usePermissions() {
  const { user } = useAuth();

  const userRoleCode = typeof user?.role === 'string' ? user.role : user?.role?.code;
  const isSuperAdmin = userRoleCode === 'SUPER_ADMIN';

  const userPermissions = useMemo(() => {
    if (typeof user?.role === 'object' && Array.isArray(user?.role?.permissions)) {
      return new Set(user.role.permissions);
    }
    return new Set<string>();
  }, [user]);

  /**
   * Checks whether the current user has permission.
   * - Super Admin always passes.
   * - Wildcards ('*', '*:*') pass.
   * - Exact permission string match passes.
   * - '<module>:manage' passes for any action '<module>:<action>'.
   */
  const can = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      if (userPermissions.has('*') || userPermissions.has('*:*')) return true;
      if (userPermissions.has(permission)) return true;

      const [module] = permission.split(':');
      if (module && userPermissions.has(`${module}:manage`)) {
        return true;
      }

      return false;
    },
    [user, isSuperAdmin, userPermissions]
  );

  const canAny = useCallback(
    (...permissions: string[]): boolean => {
      if (permissions.length === 0) return true;
      return permissions.some(p => can(p));
    },
    [can]
  );

  const canAll = useCallback(
    (...permissions: string[]): boolean => {
      if (permissions.length === 0) return true;
      return permissions.every(p => can(p));
    },
    [can]
  );

  return {
    can,
    canAny,
    canAll,
    isSuperAdmin,
    permissions: userPermissions,
  };
}
