import { useState, useEffect, useCallback } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useAuth } from './useAuth';
import { useSession } from '@clerk/nextjs';

export interface Permission {
  code: string;
  name: string;
  category: string;
}

// Permission codes for type safety
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',

  // Company
  COMPANY_VIEW: 'company.view',
  COMPANY_UPDATE: 'company.update',
  COMPANY_SETTINGS: 'company.settings',

  // Job Profiles
  JOB_PROFILES_VIEW: 'job_profiles.view',
  JOB_PROFILES_CREATE: 'job_profiles.create',
  JOB_PROFILES_UPDATE: 'job_profiles.update',
  JOB_PROFILES_DELETE: 'job_profiles.delete',

  // Pay Bands
  PAY_BANDS_VIEW: 'pay_bands.view',
  PAY_BANDS_CREATE: 'pay_bands.create',
  PAY_BANDS_UPDATE: 'pay_bands.update',
  PAY_BANDS_DELETE: 'pay_bands.delete',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',
  EMPLOYEES_VIEW_OWN: 'employees.view_own',

  // Salaries
  SALARIES_VIEW: 'salaries.view',
  SALARIES_CREATE: 'salaries.create',
  SALARIES_UPDATE: 'salaries.update',
  SALARIES_VIEW_AGGREGATED: 'salaries.view_aggregated',

  // Audit
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',

  // Requests
  REQUESTS_CREATE: 'requests.create',
  REQUESTS_VIEW_OWN: 'requests.view_own',
  REQUESTS_VIEW_ALL: 'requests.view_all',
  REQUESTS_PROCESS: 'requests.process',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCodes, setPermissionCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { session } = useSession();

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setPermissionCodes(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create authenticated client
    let token = null;
    try {
      token = await session?.getToken({ template: 'supabase' });
    } catch (e) {
      console.error('Clerk Supabase Token Error:', e);
    }
    const supabase = createClientWithToken(token || null);

    // Call the database function to get user's permissions
    const { data, error } = await supabase.rpc('get_user_permissions');

    if (error) {
      console.error('Error fetching permissions:', JSON.stringify(error, null, 2), error);
      // It seems the error object is empty or not serializing well.
      // Often this happens with Supabase errors if the network request fails completely or RLS blocks it silently.
      setPermissions([]);
      setPermissionCodes(new Set());
    } else {
      // Map the database response to our Permission interface
      const perms: Permission[] = (data || []).map((row: { permission_code: string; permission_name: string; category: string }) => ({
        code: row.permission_code,
        name: row.permission_name,
        category: row.category,
      }));
      setPermissions(perms);
      setPermissionCodes(new Set(perms.map(p => p.code)));
    }

    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Check if user has a specific permission
   * This is a client-side check for UI purposes only!
   * Server-side RLS enforces the actual security
   */
  const hasPermission = useCallback((code: PermissionCode | string): boolean => {
    return permissionCodes.has(code);
  }, [permissionCodes]);

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = useCallback((codes: (PermissionCode | string)[]): boolean => {
    return codes.some(code => permissionCodes.has(code));
  }, [permissionCodes]);

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = useCallback((codes: (PermissionCode | string)[]): boolean => {
    return codes.every(code => permissionCodes.has(code));
  }, [permissionCodes]);

  /**
   * Get permissions by category
   */
  const getPermissionsByCategory = useCallback((category: string): Permission[] => {
    return permissions.filter(p => p.category === category);
  }, [permissions]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByCategory,
    refetch: fetchPermissions,
  };
}

/**
 * Role labels for display
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr_manager: 'HR-Manager',
  legal: 'Legal / Compliance',
  employee: 'Mitarbeiter',
  auditor: 'Auditor',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Vollzugriff auf alle Funktionen und Einstellungen',
  hr_manager: 'Verwaltung von Mitarbeitern, Gehältern und Job-Profilen',
  legal: 'Einsicht in Audit-Logs und Compliance-Berichte',
  employee: 'Einsicht in eigene Daten und Auskunftsanfragen',
  auditor: 'Zeitlich begrenzter Lesezugriff für externe Prüfer',
};

/**
 * Role colors for UI
 */
export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-status-action/10 text-status-action',
  hr_manager: 'bg-status-warning/10 text-status-warning',
  legal: 'bg-primary/10 text-primary',
  employee: 'bg-status-ok/10 text-status-ok',
  auditor: 'bg-muted text-muted-foreground',
};
